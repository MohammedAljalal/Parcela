
'use strict';

import { Schema, model } from 'mongoose';
import { COUPON_TYPE } from '../constants/constants';

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 alphanumeric characters'],
    },

    description: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    // ── Discount Logic ─────────────────────────────────────
    type: {
      type: String,
      enum: Object.values(COUPON_TYPE),
      required: true,
    },
    // For PERCENTAGE: value 0-100. For FIXED: amount in CVE.
    value: {
      type: Number,
      required: true,
      min: [0, 'Value cannot be negative'],
    },
    // Max discount cap for PERCENTAGE coupons (CVE)
    maxDiscount: {
      type: Number,
      default: null,
    },

    // ── Conditions ─────────────────────────────────────────
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Restrict to specific products or categories (empty = all)
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    // ── Usage limits ───────────────────────────────────────
    usageLimit: {
      // 0 = unlimited
      type: Number,
      default: 0,
    },
    usagePerUser: {
      type: Number,
      default: 1, // 1 use per user by default
    },
    usedCount: {
      type: Number,
      default: 0,
    },

    // ── Validity ───────────────────────────────────────────
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },

    // Track which users have used this coupon
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
couponSchema.index({ isActive: 1, expiresAt: 1 });

// ─── Virtuals ─────────────────────────────────────────────────
couponSchema.virtual('isExpired').get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

couponSchema.virtual('isExhausted').get(function () {
  return this.usageLimit > 0 && this.usedCount >= this.usageLimit;
});

const Coupon = model('Coupon', couponSchema);
export default Coupon;