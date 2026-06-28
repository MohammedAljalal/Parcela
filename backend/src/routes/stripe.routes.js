'use strict';

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createCheckoutSession, stripeWebhook } = require('../controllers/stripe.controller');

const router = express.Router();

router.post('/checkout', protect, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
