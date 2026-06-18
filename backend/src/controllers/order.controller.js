// Order lifecycle: creation (via cart), cancellation, status updates.

import { Order, Address, Island } from '../models/index.js';
import { createOrderFromCart } from '../services/order.service.js';
import { validateAndCalculateDiscount } from '../services/coupon.service.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { ORDER_STATUS } from '../config/constants.js';
import { createNotification } from '../services/notification.service.js';
import { NOTIFICATION_TYPE } from '../config/constants.js';

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { addressId, islandId, paymentMethod, couponCode } = req.body;

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) return sendError(res, 'Delivery address not found', 404);

    const island = await Island.findOne({ _id: islandId, isActive: true });
    if (!island) return sendError(res, 'Delivery island is not available', 404);

    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      // Lazy import to avoid circular dependency via Cart model.
      const { Cart } = await import('../models/index.js');
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return sendError(res, 'Cart is empty', 400);
      }

      const productIds = cart.items.map((i) => i.product._id.toString());
      const categoryIds = cart.items.map((i) => i.product.category.toString());

      const couponResult = await validateAndCalculateDiscount({
        code: couponCode,
        userId: req.user._id,
        subtotal: cart.subtotal,
        productIds,
        categoryIds,
      });

      if (!couponResult.valid) {
        return sendError(res, couponResult.message, 400);
      }

      discountAmount = couponResult.discountAmount;
      validCoupon = couponResult.coupon;
    }

    const order = await createOrderFromCart({
      userId: req.user._id,
      address,
      deliveryIsland: island,
      paymentMethod,
      discountAmount,
      coupon: validCoupon,
      couponCode: validCoupon ? validCoupon.code : '',
    });

    return sendSuccess(res, { order }, 'Order created successfully', 201);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.message, error.statusCode, error.details);
    next(error);
  }
};

// GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('deliveryIsland', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return sendPaginated(res, orders, { total, page: Number(page), limit: Number(limit) });
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

    if (order.status !== ORDER_STATUS.PENDING) {
      return sendError(res, 'You can only cancel pending orders', 400);
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: 'Cancelled by user',
      updatedBy: req.user._id,
    });

    await order.save();

    // Restock items
    const { Product } = await import('../models/index.js');
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    return sendSuccess(res, { order }, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/status (Admin only)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingCode } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || '',
      updatedBy: req.user._id,
    });

    if (trackingCode) order.trackingCode = trackingCode;

    await order.save();

    let notificationType = null;
    let data = { orderNumber: order.orderNumber };

    if (status === ORDER_STATUS.DELIVERED) notificationType = NOTIFICATION_TYPE.ORDER_DELIVERED;
    else notificationType = NOTIFICATION_TYPE.ORDER_STATUS_UPDATE;

    const { ORDER_STATUS_LABELS } = await import('../config/constants.js');
    data.statusLabel = ORDER_STATUS_LABELS[status]?.pt || status;

    await createNotification({ userId: order.user, type: notificationType, data, relatedOrder: order._id });

    return sendSuccess(res, { order }, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/admin/all
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      // Check if search matches order number (e.g. PC-12345)
      if (search.toUpperCase().startsWith('PC-')) {
        filter.orderNumber = search.toUpperCase();
      } else {
        // Find users matching search term to filter their orders
        const { User } = await import('../models/index.js');
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).select('_id');
        const userIds = users.map((u) => u._id);
        if (userIds.length > 0) filter.user = { $in: userIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name phone email')
        .populate('deliveryIsland', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return sendPaginated(res, orders, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

export { createOrder, getMyOrders, getOrderById, cancelOrder, updateOrderStatus, getAllOrders };
