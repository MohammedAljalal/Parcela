// Validation rules for island management (admin only).
'use strict';

const Joi = require('joi');

const daysRange = Joi.object({
  min: Joi.number().integer().min(1).required(),
  max: Joi.number().integer().min(Joi.ref('min')).required(),
});

const createIslandSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  code: Joi.string().trim().uppercase().pattern(/^[A-Z]{2,3}$/).required(),
  region: Joi.string().trim().max(50).optional(),
  capital: Joi.string().trim().max(50).optional(),
  deliveryFee: Joi.number().min(0).optional(),
  estimatedDeliveryDays: daysRange.optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});

const updateIslandSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  code: Joi.string().trim().uppercase().pattern(/^[A-Z]{2,3}$/).optional(),
  region: Joi.string().trim().max(50).optional(),
  capital: Joi.string().trim().max(50).optional(),
  deliveryFee: Joi.number().min(0).optional(),
  estimatedDeliveryDays: daysRange.optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

module.exports = { createIslandSchema, updateIslandSchema };
