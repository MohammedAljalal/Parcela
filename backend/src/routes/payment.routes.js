// Payment routes. Webhook is intentionally public (HMAC-verified instead of JWT).
'use strict';

const express = require('express');
const router = express.Router();

const { initiatePayment, handleWebhook, getPaymentStatus } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { initiatePaymentSchema } = require('../validators/payment.validator');

router.post('/webhook', handleWebhook);

router.post('/initiate', protect, validate(initiatePaymentSchema), initiatePayment);
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
