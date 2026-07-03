// Vinti4/Multibanco payment via SISP: hosts the auto-submit form SISP requires,
// and handles the webhook SISP posts back once the shopper finishes paying.
'use strict';

const { Order } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { buildPaymentForm, validatePayment } = require('../lib/sispGateway');
const { createNotification } = require('../services/notification.service');
const { ORDER_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPE } = require('../config/constants');
const env = require('../config/env');

// In-memory store of pending payment forms, keyed by orderNumber. SISP's SDK
// returns a ready-to-render HTML page (auto-submitting form) rather than a
// redirect URL, so instead of handing raw HTML back to the mobile client we
// host it at a short-lived link the client can open in a browser/WebView —
// mirroring how initiatePayment already returns a "paymentUrl" for Stripe.
// A real deployment should swap this for Redis (or similar) with a TTL so it
// survives server restarts and works across multiple server instances.
const pendingForms = new Map();

// POST /api/payments/initiate
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return sendError(res, 'Order not found', 404);

    if (order.status !== ORDER_STATUS.PENDING || order.paymentStatus === PAYMENT_STATUS.PAID) {
      return sendError(res, 'This order does not need payment right now', 409);
    }

    if (!env.SISP_POS_ID || !env.SISP_POS_AUT_CODE) {
      // Fails loudly instead of silently generating a broken payment link —
      // these credentials only exist after registering as a merchant with SISP.
      return sendError(
        res,
        'Vinti4 payment is not configured on this server (missing SISP credentials)',
        503
      );
    }

    const webhookUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/api/payments/webhook`;

    const htmlForm = buildPaymentForm({
      referenceId: order.orderNumber,
      amount: order.total,
      webhookUrl,
    });

    // Store the form for a short window so the client can fetch and render it.
    pendingForms.set(order.orderNumber, { html: htmlForm, createdAt: Date.now() });

    const paymentUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/api/payments/form/${order.orderNumber}`;

    return sendSuccess(res, { paymentUrl }, 'Payment session created successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/form/:orderNumber
// Serves the SISP auto-submit form. Public (no JWT) because the mobile client
// opens this in an external browser/WebView, not via an authenticated fetch —
// same reasoning as SISP's webhook endpoint below.
const servePaymentForm = async (req, res) => {
  const entry = pendingForms.get(req.params.orderNumber);

  if (!entry) {
    return res.status(404).send('Payment session expired or not found. Please retry checkout.');
  }

  // One-time use: once opened, the form shouldn't be re-servable.
  pendingForms.delete(req.params.orderNumber);

  res.set('Content-Type', 'text/html');
  return res.send(entry.html);
};

// POST /api/payments/webhook
// No protect middleware: called directly by SISP. Authenticity comes from
// validatePayment() (wraps the SDK's fingerprint check), not a JWT — SISP has
// no way to send a bearer token.
const handleWebhook = async (req, res, next) => {
  try {
    // validatePayment reads the SISP-specific fields off the raw form body
    // (fingerprint, messageType, transactionCode, etc.) and returns an error
    // object if anything doesn't check out, or undefined on success.
    const validationError = validatePayment(req.body);

    const orderNumber = req.body?.merchantRespMerchantRef || req.body?.merchantRef;

    if (validationError) {
      console.warn(`SISP webhook validation failed for order ${orderNumber}:`, validationError);
      return res.status(200).send('OK'); // Ack anyway — SISP retries on non-200.
    }

    if (!orderNumber) {
      console.warn('SISP webhook received without a recognizable order reference');
      return res.status(200).send('OK');
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      console.warn(`SISP webhook received for unknown order: ${orderNumber}`);
      return res.status(200).send('OK');
    }

    const paidAmount = Number(req.body?.merchantRespPurchaseAmount ?? req.body?.amount);
    if (Number.isFinite(paidAmount) && Math.round(paidAmount) !== Math.round(order.total)) {
      console.error(`Amount mismatch for order ${orderNumber}: expected ${order.total}, got ${paidAmount}`);
      return res.status(200).send('OK');
    }

    // Avoid double-processing a duplicated webhook delivery.
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(200).send('OK');
    }

    order.paymentStatus = PAYMENT_STATUS.PAID;
    order.status = ORDER_STATUS.PAID;
    order.statusHistory.push({ status: ORDER_STATUS.PAID, note: 'Payment confirmed via Vinti4/SISP' });

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

    return res.status(200).send('OK');
  } catch (error) {
    console.error('SISP webhook processing error:', error.message);
    return res.status(200).send('OK');
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

module.exports = { initiatePayment, servePaymentForm, handleWebhook, getPaymentStatus };
