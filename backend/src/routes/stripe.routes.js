'use strict';

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createCheckoutSession, stripeWebhook } = require('../controllers/stripe.controller');

const router = express.Router();

// NOTE: this whole router is mounted BEFORE the app-wide express.json() in
// server.js (intentionally, so /webhook can access the raw body Stripe's
// signature check requires). That means /checkout does NOT inherit JSON
// parsing from the global middleware and needs its own express.json() here,
// or req.body would be undefined and createCheckoutSession would crash on
// `const { orderId } = req.body`.
router.post('/checkout', express.json(), protect, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
