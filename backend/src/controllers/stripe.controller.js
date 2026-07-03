'use strict';

const stripe = require('stripe')(require('../config/env').STRIPE_SECRET_KEY);
const { Order } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');
const env = require('../config/env');

// CVE (Cape Verdean Escudo) is pegged to EUR at a fixed rate since 1998:
// 1 EUR = 110.265 CVE. Stripe's presentment-currency support for CVE is not
// guaranteed to work reliably in live mode across all card networks, so we
// convert to EUR (a currency Stripe fully and unambiguously supports) for the
// actual charge, while the app continues to display prices in CVE to users.
// If Stripe later confirms full native CVE support for this account, this
// conversion step can be removed.
const CVE_PER_EUR = 110.265;
const cveToEurCents = (amountInCve) => Math.round((amountInCve / CVE_PER_EUR) * 100);

// POST /api/stripe/checkout
const createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return sendError(res, 'Order not found', 404);

    if (order.status !== ORDER_STATUS.PENDING || order.paymentStatus === PAYMENT_STATUS.PAID) {
      return sendError(res, 'This order does not need payment right now', 409);
    }

    const amountEurCents = cveToEurCents(order.total);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Order #${order.orderNumber}`,
              description: `${order.total} CVE (converted to EUR at checkout)`,
            },
            unit_amount: amountEurCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.CLIENT_URL}/orders?success=true`,
      cancel_url: `${env.CLIENT_URL}/checkout?cancelled=true`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        originalAmountCve: order.total.toString(),
      },
    });

    return sendSuccess(res, { url: session.url }, 'Checkout session created');
  } catch (error) {
    next(error);
  }
};

// POST /api/stripe/webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // express.raw({ type: 'application/json' }) on this route (see
    // stripe.routes.js) puts the raw request Buffer directly on req.body —
    // NOT on some separate req.rawBody. Passing a parsed object here would
    // make Stripe's signature check fail on every webhook call.
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = PAYMENT_STATUS.PAID;
        order.status = ORDER_STATUS.PROCESSING;
        await order.save();
        console.log(`Order ${orderId} marked as paid via Stripe webhook`);
      }
    }
  }

  res.json({ received: true });
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};
