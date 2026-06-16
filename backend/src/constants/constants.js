// src/config/constants.js
// Central source of truth for all enums used across models.

'use strict';

const ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
};

const LANGUAGES = {
  PT: 'pt',
  EN: 'en',
};

const OTP = {
  LENGTH: 6,
  EXPIRES_IN_MIN: 5,
  MAX_ATTEMPTS: 5,
  RESEND_WAIT_SEC: 60,
  // Number of requests allowed per phone number before temporary block
  MAX_SEND_PER_WINDOW: 5,
  BLOCK_DURATION_MIN: 30,
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_METHOD = {
  VINTI4: 'vinti4_multibanco',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery',
};

const COUPON_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  FREE_DELIVERY: 'free_delivery',
};

const NOTIFICATION_TYPE = {
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_STATUS_UPDATE: 'order_status_update',
  ORDER_DELIVERED: 'order_delivered',
  PROMO: 'promo',
  LOW_STOCK_WISHLIST: 'low_stock_wishlist',
  PAYMENT_REMINDER: 'payment_reminder',
  SYSTEM: 'system',
};

export {
  ROLES,
  LANGUAGES,
  OTP,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  COUPON_TYPE,
  NOTIFICATION_TYPE,
};