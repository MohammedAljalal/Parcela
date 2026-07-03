// Manages order creation (checkout), listing, status transitions.
'use strict';

const { Order, Address, Island, Cart, Product, User } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createOrderFromCart } = require('../services/order.service');
const { validateAndCalculateDiscount } = require('../services/coupon.service');
const { createNotification } = require('../services/notification.service');
const { ORDER_STATUS, ORDER_STATUS_LABELS, NOTIFICATION_TYPE } = require('../config/constants');

// Allowed status transitions, prevents illogical jumps (e.g. delivered -> pending).
const ALLOWED_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { addressId, islandId, paymentMethod, couponCode } = req.body;

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) return sendError(res, 'Selected address not found', 404);

    const deliveryIsland = await Island.findOne({ _id: islandId, isActive: true });
    if (!deliveryIsland) return sendError(res, 'Selected island not found or unavailable', 404);

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'category');
    if (!cart || cart.items.length === 0) return sendError(res, 'Cart is empty, cannot checkout', 400);

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const productIds = cart.items.map((item) => item.product._id.toString());
      const categoryIds = cart.items.map((item) => item.product.category.toString());

      const result = await validateAndCalculateDiscount({
        code: couponCode,
        userId: req.user._id,
        subtotal: cart.subtotal,
        productIds,
        categoryIds,
      });

      if (!result.valid) return sendError(res, result.message, 422);

      discountAmount = result.discountAmount;
      appliedCoupon = result.coupon;
    }

    const order = await createOrderFromCart({
      userId: req.user._id,
      address,
      deliveryIsland,
      paymentMethod,
      discountAmount,
      coupon: appliedCoupon,
      couponCode: couponCode || '',
    });

    return sendSuccess(res, { order }, 'Order created successfully', 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode, error.details || []);
    }
    next(error);
  }
};

// GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    const [inTransitCount, completedCount] = await Promise.all([
      Order.countDocuments({
        user: req.user._id,
        status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
      }),
      Order.countDocuments({ user: req.user._id, status: ORDER_STATUS.DELIVERED }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      stats: { inTransit: inTransitCount, completed: completedCount },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.user = req.user._id;

    const order = await Order.findOne(filter).populate('deliveryIsland', 'name code');
    if (!order) return sendError(res, 'Order not found', 404);

    return sendSuccess(res, { order }, 'Order fetched successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return sendError(res, 'Order not found', 404);

    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.PAID];
    if (!cancellableStatuses.includes(order.status)) {
      return sendError(res, 'This order cannot be cancelled at this stage', 409);
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: 'Cancelled by customer',
      updatedBy: req.user._id,
    });

    await order.save();

    await Promise.all(
      order.items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }))
    );

    return sendSuccess(res, { order }, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingCode } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);

    const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return sendError(res, `Cannot change order status from "${order.status}" to "${status}" directly`, 400);
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '', updatedBy: req.user._id });

    if (trackingCode) order.trackingCode = trackingCode;
    if (status === ORDER_STATUS.DELIVERED) order.deliveredAt = new Date();

    await order.save();

    try {
      const notificationType =
        status === ORDER_STATUS.DELIVERED ? NOTIFICATION_TYPE.ORDER_DELIVERED : NOTIFICATION_TYPE.ORDER_STATUS_UPDATE;

      await createNotification({
        userId: order.user,
        type: notificationType,
        data: { orderNumber: order.orderNumber, statusLabel: ORDER_STATUS_LABELS[status]?.pt || status },
        relatedOrder: order._id,
      });
    } catch (notificationError) {
      console.error('Order status notification failed:', notificationError.message);
    }

    return sendSuccess(res, { order }, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/admin/all
const getAllOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    if (search) {
      const matchingUsers = await User.find({
        $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }],
      }).select('_id');

      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { user: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name phone').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return sendPaginated(res, orders, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder, updateOrderStatus, getAllOrders };
