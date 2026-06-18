// Validation rules for order creation and status updates.
import Joi from 'joi';
import { ORDER_STATUS, PAYMENT_METHOD } from '../config/constants.js';

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

export { createOrderSchema, updateOrderStatusSchema };

