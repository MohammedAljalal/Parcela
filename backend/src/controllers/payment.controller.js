// Handles payment initiation and Vinti4 (Multibanco) webhook callbacks.

import { Order } from '../models/index.js';
import { createPaymentSession, verifyWebhookSignature } from '../lib/vinti4Gateway.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from '../config/constants.js';
import env from '../config/env.js';

// POST /api/payments/initiate
// Generates the redirect URL for the client to complete the payment.
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return sendError(res, 'Order not found', 404);

    if (order.paymentMethod !== PAYMENT_METHOD.VINTI4) {
      return sendError(res, 'This order does not use Vinti4 Multibanco', 400);
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return sendError(res, 'This order is already paid', 400);
    }

    const returnUrl = `${env.CLIENT_URL}/checkout/status?order=${order.orderNumber}`;

    const { paymentUrl } = createPaymentSession({
      orderNumber: order.orderNumber,
      amount: order.total,
      returnUrl,
    });

    return sendSuccess(res, { paymentUrl, orderNumber: order.orderNumber }, 'Payment session created');
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/webhook
// Called server-to-server by the Vinti4 gateway when a payment succeeds/fails.
// Uses HMAC signature validation instead of JWT authentication.
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-vinti4-signature'];

    if (!verifyWebhookSignature(req.body, signature)) {
      console.warn('Webhook signature mismatch', req.body);
      return res.status(401).send('Invalid signature');
    }

    const { orderNumber, status, gatewayReference } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      console.error(`Webhook received for unknown order: ${orderNumber}`);
      return res.status(200).send('Order not found but acknowledged'); // Don't retry
    }

    if (status === 'SUCCESS' && order.paymentStatus !== PAYMENT_STATUS.PAID) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.status = ORDER_STATUS.PAID;
      order.statusHistory.push({
        status: ORDER_STATUS.PAID,
        note: `Payment confirmed via Vinti4 (${gatewayReference})`,
      });

      await order.save();

      // Lazy import notification to avoid circular deps during webhook processing
      const { createNotification } = await import('../services/notification.service.js');
      const { NOTIFICATION_TYPE } = await import('../config/constants.js');

      await createNotification({
        userId: order.user,
        type: NOTIFICATION_TYPE.ORDER_STATUS_UPDATE,
        data: { orderNumber: order.orderNumber, statusLabel: 'Pago' },
        relatedOrder: order._id,
      }).catch((err) => console.error('Webhook notification failed:', err.message));
    } else if (status === 'FAILED') {
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 500 so the gateway retries later
    return res.status(500).send('Internal Server Error');
  }
};

// GET /api/payments/status/:orderId
const getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id }).select(
      'orderNumber paymentStatus status total'
    );

    if (!order) return sendError(res, 'Order not found', 404);

    return sendSuccess(res, { order }, 'Status fetched successfully');
  } catch (error) {
    next(error);
  }
};

export { initiatePayment, handleWebhook, getPaymentStatus };
