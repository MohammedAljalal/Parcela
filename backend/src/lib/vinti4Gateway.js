// Vinti4/Multibanco payment gateway integration (Cape Verde SISP system).
// Follows the standard redirect + webhook pattern used by local payment gateways.
'use strict';

const crypto = require('crypto');
const env = require('../config/env');

// HMAC signature ties orderNumber + amount + merchantId to the secret key,
// so a request cannot be tampered with in transit.
const generatePaymentSignature = (orderNumber, amount) => {
  const payload = `${orderNumber}|${amount}|${env.VINTI4_MERCHANT_ID}`;
  return crypto.createHmac('sha256', env.VINTI4_WEBHOOK_SECRET).update(payload).digest('hex');
};

// Builds the redirect URL the client opens to complete payment.
const createPaymentSession = ({ orderNumber, amount, returnUrl }) => {
  const signature = generatePaymentSignature(orderNumber, amount);

  const params = new URLSearchParams({
    merchantId: env.VINTI4_MERCHANT_ID,
    posId: env.VINTI4_POS_ID,
    posAuthCode: env.VINTI4_POS_AUTH_CODE,
    orderNumber,
    amount: amount.toFixed(2),
    currency: 'CVE',
    signature,
    returnUrl,
  });

  return { paymentUrl: `${env.VINTI4_GATEWAY_URL}?${params.toString()}`, signature };
};

// Verifies an incoming webhook signature using constant-time comparison
// to prevent timing attacks.
const verifyWebhookSignature = (payload, receivedSignature) => {
  const { orderNumber, amount } = payload;
  const expectedSignature = generatePaymentSignature(orderNumber, amount);

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(receivedSignature || '');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

module.exports = { createPaymentSession, verifyWebhookSignature };
