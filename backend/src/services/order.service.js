// Converts a cart into a real order, using a transaction to keep
// stock deduction, coupon usage and cart clearing atomic.
'use strict';

const mongoose = require('mongoose');
const { Cart, Product, Order } = require('../models');
const { validateStockAvailability } = require('./cart.service');
const { createNotification } = require('./notification.service');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { ORDER_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPE } = require('../config/constants');

const generateUniqueOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  throw new Error('Failed to generate a unique order number');
};

const createOrderFromCart = async ({
  userId,
  address,
  deliveryIsland,
  paymentMethod,
  discountAmount = 0,
  coupon = null,
  couponCode = '',
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);

    if (!cart || cart.items.length === 0) {
      throw Object.assign(new Error('Cart is empty, cannot checkout'), { statusCode: 400 });
    }

    const stockIssues = await validateStockAvailability(cart);
    if (stockIssues.length > 0) {
      throw Object.assign(new Error('Some items in your cart are no longer available in the requested quantity'), {
        statusCode: 409,
        details: stockIssues,
      });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name?.pt || '',
      image: item.product.images?.[0]?.url || '',
      price: item.price,
      quantity: item.quantity,
      vendorStoreName: item.product.vendorInfo?.storeName || '',
    }));

    const subtotal = cart.subtotal;
    const rawDeliveryFee = deliveryIsland.deliveryFee || 0;

    const isFreeDeliveryCoupon = coupon?.type === 'free_delivery';
    const deliveryFee = isFreeDeliveryCoupon ? 0 : rawDeliveryFee;

    const total = Math.max(subtotal - discountAmount + deliveryFee, 0);

    const orderNumber = await generateUniqueOrderNumber();

    // For cash-on-delivery, no payment gateway is needed — move straight to processing.
    const isCashOnDelivery = paymentMethod === 'cash_on_delivery';
    const initialStatus = isCashOnDelivery ? ORDER_STATUS.PROCESSING : ORDER_STATUS.PENDING;
    const initialPaymentStatus = isCashOnDelivery ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING;
    const statusHistory = isCashOnDelivery
      ? [
          { status: ORDER_STATUS.PENDING, note: 'Order created' },
          { status: ORDER_STATUS.PROCESSING, note: 'Cash on delivery — confirmed automatically' },
        ]
      : [{ status: ORDER_STATUS.PENDING, note: 'Order created' }];

    const order = await Order.create(
      [
        {
          orderNumber,
          user: userId,
          items: orderItems,
          deliveryIsland: deliveryIsland._id,
          deliveryAddress: {
            recipient: address.recipient,
            phone: address.phone,
            address: address.address,
            city: address.city,
          },
          subtotal,
          deliveryFee,
          discount: discountAmount,
          total,
          coupon: coupon?._id || null,
          couponCode,
          paymentMethod,
          paymentStatus: initialPaymentStatus,
          status: initialStatus,
          statusHistory,
        },
      ],
      { session }
    );

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } }, { session });
    }

    if (coupon) {
      coupon.usedCount += 1;
      coupon.usedBy.push(userId);
      await coupon.save({ session });
    }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    // Notification is outside the transaction: a failure here must not roll back a successful order.
    try {
      await createNotification({
        userId,
        type: NOTIFICATION_TYPE.ORDER_CONFIRMED,
        data: { orderNumber: order[0].orderNumber },
        relatedOrder: order[0]._id,
      });
    } catch (notificationError) {
      console.error('Order confirmation notification failed:', notificationError.message);
    }

    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { createOrderFromCart };
