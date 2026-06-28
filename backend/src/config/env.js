// Loads .env once and exposes typed config object.
// No other file should access process.env directly.
'use strict';

require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  VINTI4_MERCHANT_ID: process.env.VINTI4_MERCHANT_ID,
  VINTI4_POS_ID: process.env.VINTI4_POS_ID || '12345',
  VINTI4_POS_AUTH_CODE: process.env.VINTI4_POS_AUTH_CODE || '12345',
  VINTI4_WEBHOOK_SECRET: process.env.VINTI4_WEBHOOK_SECRET || 'secret',
  VINTI4_GATEWAY_URL: process.env.VINTI4_GATEWAY_URL || 'http://localhost:5000/mock-vinti4',

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_123',

  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};
