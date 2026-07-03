// Vinti4/Multibanco payment gateway (SISP — Sociedade Interbancária e Sistemas
// de Pagamentos, Cabo Verde), built on the official @chuva.io/sisp SDK.
//
// IMPORTANT: SISP's real Fingerprint algorithm (how POS_ID + POS_AUT_CODE +
// timestamp + amount are combined and hashed) is not public — it is only
// documented in the integration guide SISP hands out after a merchant signs
// up at https://comerciante.vinti4.cv. There is no safe way to reimplement it
// from scratch. Using their SDK (@chuva.io/sisp, MIT licensed, actively
// maintained) is the only trustworthy way to talk to the real gateway —
// hand-rolled HMAC/signature code here would silently fail against SISP's
// actual servers no matter how correct it looks.
//
// Run `npm install` in backend/ to pull this dependency before starting the
// server — it is declared in package.json but not vendored in this bundle.
'use strict';

const Sisp = require('@chuva.io/sisp');
const env = require('../config/env');

const sisp = new Sisp({
  posID: env.SISP_POS_ID,
  posAutCode: env.SISP_POS_AUT_CODE,
  url: env.SISP_URL,
});

// Builds the auto-submitting HTML form SISP expects the shopper to land on.
// referenceId must be unique per payment attempt and is echoed back in the
// webhook payload, so we use the order number (unique per order already).
// webhookUrl is where SISP POSTs the payment result — must be a publicly
// reachable HTTPS URL in production (SISP cannot reach localhost).
const buildPaymentForm = ({ referenceId, amount, webhookUrl }) => {
  return sisp.generatePaymentRequestForm(referenceId, amount, webhookUrl);
};

// Verifies a webhook payload SISP posted back. Must be called on this same
// `sisp` instance (validatePayment is not a static/module-level function).
const validatePayment = (responseBody) => sisp.validatePayment(responseBody);

module.exports = { buildPaymentForm, validatePayment };
