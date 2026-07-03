// Validation rules for address book entries.
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const createAddressSchema = Joi.object({
  label: Joi.string().trim().max(30).optional(),
  recipient: Joi.string().trim().min(2).max(80).required(),
  phone: Joi.string().pattern(/^\+238\d{7}$/).required().messages({
    'string.pattern.base': 'Phone must start with +238 followed by 7 digits',
  }),
  address: Joi.string().trim().min(3).max(200).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  island: objectId.required(),
  isDefault: Joi.boolean().optional(),
});

const updateAddressSchema = Joi.object({
  label: Joi.string().trim().max(30).optional(),
  recipient: Joi.string().trim().min(2).max(80).optional(),
  phone: Joi.string().pattern(/^\+238\d{7}$/).optional(),
  address: Joi.string().trim().min(3).max(200).optional(),
  city: Joi.string().trim().min(2).max(80).optional(),
  island: objectId.optional(),
  isDefault: Joi.boolean().optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

module.exports = { createAddressSchema, updateAddressSchema };

