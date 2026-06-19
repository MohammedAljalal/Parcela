// Discount coupon / promo code.
'use strict';

const { Schema, model } = require('mongoose');
const { COUPON_TYPE } = require('../config/constants');

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 alphanumeric characters'],
    },
    description: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    type: { type: String, enum: Object.values(COUPON_TYPE), required: true },
    // PERCENTAGE: 0-100. FIXED: amount in CVE. FREE_DELIVERY: unused.
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },

    minOrderAmount: { type: Number, default: 0 },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usagePerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

couponSchema.index({ isActive: 1, expiresAt: 1 });

couponSchema.virtual('isExpired').get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

couponSchema.virtual('isExhausted').get(function () {
  return this.usageLimit > 0 && this.usedCount >= this.usageLimit;
});

module.exports = model('Coupon', couponSchema);
