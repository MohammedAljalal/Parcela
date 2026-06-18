// Payment session creation and Vinti4 webhook handling.
'use strict';

const { Order } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { createPaymentSession, verifyWebhookSignature } = require('../lib/vinti4Gateway');
const { createNotification } = require('../services/notification.service');
const { ORDER_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPE } = require('../config/constants');
const env = require('../config/env');

// POST /api/payments/initiate
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return sendError(res, 'Order not found', 404);

    if (order.status !== ORDER_STATUS.PENDING || order.paymentStatus === PAYMENT_STATUS.PAID) {
      return sendError(res, 'This order does not need payment right now', 409);
    }

    const returnUrl = `${env.CLIENT_URL}/orders/${order._id}/payment-result`;

    const { paymentUrl } = createPaymentSession({
      orderNumber: order.orderNumber,
      amount: order.total,
      returnUrl,
    });

    return sendSuccess(res, { paymentUrl }, 'Payment session created successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/webhook
// No protect middleware: called directly by the payment gateway,
// authenticity is verified via HMAC signature instead of JWT.
const handleWebhook = async (req, res, next) => {
  try {
    const { orderNumber, amount, status, signature } = req.body;

    const isValidSignature = verifyWebhookSignature({ orderNumber, amount }, signature);

    if (!isValidSignature) {
      console.warn(`Invalid webhook signature for order ${orderNumber}`);
      return res.status(200).json({ received: true });
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      console.warn(`Webhook received for unknown order: ${orderNumber}`);
      return res.status(200).json({ received: true });
    }

    if (Number(amount) !== order.total) {
      console.error(`Amount mismatch for order ${orderNumber}: expected ${order.total}, got ${amount}`);
      return res.status(200).json({ received: true });
    }

    // Avoid double-processing a duplicated webhook delivery.
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    if (status === 'success') {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.status = ORDER_STATUS.PAID;
      order.statusHistory.push({ status: ORDER_STATUS.PAID, note: 'Payment confirmed via Vinti4' });

      await order.save();

      try {
        await createNotification({
          userId: order.user,
          type: NOTIFICATION_TYPE.ORDER_STATUS_UPDATE,
          data: { orderNumber: order.orderNumber, statusLabel: 'Pago' },
          relatedOrder: order._id,
        });
      } catch (notificationError) {
        console.error('Payment confirmation notification failed:', notificationError.message);
      }
    } else {
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Payment webhook processing error:', error.message);
    return res.status(200).json({ received: true });
  }
};

// GET /api/payments/status/:orderId
const getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id }).select(
      'orderNumber paymentStatus status total'
    );

    if (!order) return sendError(res, 'Order not found', 404);

    return sendSuccess(res, { order }, 'Payment status fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { initiatePayment, handleWebhook, getPaymentStatus };
