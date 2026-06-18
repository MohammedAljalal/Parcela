// Coupon validation and discount calculation logic.
'use strict';

const { Coupon } = require('../models');
const { COUPON_TYPE } = require('../config/constants');

const validateAndCalculateDiscount = async ({ code, userId, subtotal, productIds, categoryIds }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) return { valid: false, message: 'Invalid coupon code' };
  if (!coupon.isActive) return { valid: false, message: 'This coupon is not active' };
  if (coupon.isExpired) return { valid: false, message: 'This coupon has expired' };
  if (coupon.isExhausted) return { valid: false, message: 'This coupon has reached its usage limit' };
  if (coupon.startsAt > new Date()) return { valid: false, message: 'This coupon is not active yet' };

  if (subtotal < coupon.minOrderAmount) {
    return { valid: false, message: `Minimum order amount for this coupon is ${coupon.minOrderAmount} CVE` };
  }

  const userUsageCount = coupon.usedBy.filter((id) => id.toString() === userId.toString()).length;
  if (userUsageCount >= coupon.usagePerUser) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  const hasRestrictions = coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0;
  if (hasRestrictions) {
    const matchesProduct = coupon.applicableProducts.some((id) => productIds.includes(id.toString()));
    const matchesCategory = coupon.applicableCategories.some((id) => categoryIds.includes(id.toString()));

    if (!matchesProduct && !matchesCategory) {
      return { valid: false, message: 'This coupon does not apply to items in your cart' };
    }
  }

  let discountAmount = 0;
  let freeDelivery = false;

  if (coupon.type === COUPON_TYPE.PERCENTAGE) {
    discountAmount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.type === COUPON_TYPE.FIXED) {
    discountAmount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === COUPON_TYPE.FREE_DELIVERY) {
    freeDelivery = true;
  }

  return { valid: true, coupon, discountAmount, freeDelivery };
};

module.exports = { validateAndCalculateDiscount };
