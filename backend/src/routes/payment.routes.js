// Payment routes. Webhook is intentionally public (SISP-signature-verified,
// not JWT — SISP has no way to send a bearer token).
'use strict';

const express = require('express');
const router = express.Router();

const {
  initiatePayment,
  servePaymentForm,
  handleWebhook,
  getPaymentStatus,
} = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { initiatePaymentSchema } = require('../validators/payment.validator');

// Public: SISP POSTs here directly once the shopper finishes paying.
router.post('/webhook', handleWebhook);

// Public: the mobile client opens this URL in a browser/WebView — it's not
// an authenticated fetch, so it can't carry a Bearer token.
router.get('/form/:orderNumber', servePaymentForm);

router.post('/initiate', protect, validate(initiatePaymentSchema), initiatePayment);
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
