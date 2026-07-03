// Validation rules for coupon management.
const Joi = require('joi');
const { COUPON_TYPE } = require('../config/constants');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().pattern(/^[A-Z0-9_-]{3,20}$/).required(),
  description: Joi.object({
    pt: Joi.string().trim().optional().allow(''),
    en: Joi.string().trim().optional().allow(''),
  }).optional(),
  type: Joi.string().valid(...Object.values(COUPON_TYPE)).required(),
  value: Joi.number()
    .min(0)
    .when('type', { is: COUPON_TYPE.FREE_DELIVERY, then: Joi.optional().default(0), otherwise: Joi.required() }),
  maxDiscount: Joi.number().min(0).optional().allow(null),
  minOrderAmount: Joi.number().min(0).optional(),
  applicableCategories: Joi.array().items(objectId).optional(),
  applicableProducts: Joi.array().items(objectId).optional(),
  usageLimit: Joi.number().integer().min(0).optional(),
  usagePerUser: Joi.number().integer().min(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null).greater(Joi.ref('startsAt')),
  isActive: Joi.boolean().optional(),
});

const updateCouponSchema = Joi.object({
  description: Joi.object({
    pt: Joi.string().trim().optional().allow(''),
    en: Joi.string().trim().optional().allow(''),
  }).optional(),
  value: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).optional().allow(null),
  minOrderAmount: Joi.number().min(0).optional(),
  applicableCategories: Joi.array().items(objectId).optional(),
  applicableProducts: Joi.array().items(objectId).optional(),
  usageLimit: Joi.number().integer().min(0).optional(),
  usagePerUser: Joi.number().integer().min(1).optional(),
  startsAt: Joi.date().optional(),
  expiresAt: Joi.date().optional().allow(null),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

const previewCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
});

module.exports = { createCouponSchema, updateCouponSchema, previewCouponSchema };

