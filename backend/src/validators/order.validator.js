// Validation rules for order creation and status updates.
const Joi = require('joi');
const { ORDER_STATUS, PAYMENT_METHOD } = require('../config/constants');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const createOrderSchema = Joi.object({
  addressId: objectId.required(),
  islandId: objectId.required(),
  paymentMethod: Joi.string().valid(...Object.values(PAYMENT_METHOD)).required(),
  couponCode: Joi.string().trim().uppercase().optional().allow(''),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
  note: Joi.string().trim().max(300).optional().allow(''),
  trackingCode: Joi.string().trim().optional().allow(''),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };

