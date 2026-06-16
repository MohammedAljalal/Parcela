// src/models/Order.js
// Full order lifecycle with embedded status history.


'use strict';

import { Schema, model } from 'mongoose';

const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../config/constants');

// ─── Sub-schemas ──────────────────────────────────────────────
const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    // Snapshots at order time — never mutate these
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },

    // Snapshot of the store name at the time of purchase
    vendorStoreName: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    recipient: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      // Set in controller via generateOrderNumber()
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    deliveryIsland: {
      type: Schema.Types.ObjectId,
      ref: 'Island',
      required: true,
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },

    // ── Financials ────────────────────────────────────────────
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    // Coupon applied to this order
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    couponCode: {
      type: String,
      default: '',
    },

    // ── Payment ────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    // Stripe PaymentIntent ID — only set for card payments
    stripePaymentIntentId: {
      type: String,
      default: null,
      select: false,
    },

    // ── Status ────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    statusHistory: [statusHistorySchema],

    // ── Tracking ─────────────────────────────────────────
    trackingCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Link to the downloadable receipt
    receiptUrl: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = model('Order', orderSchema);
export default Order;