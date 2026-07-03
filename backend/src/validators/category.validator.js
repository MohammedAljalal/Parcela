// Validation rules for category management.
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const bilingualName = Joi.object({
  pt: Joi.string().trim().min(2).max(50).required(),
  en: Joi.string().trim().max(50).optional().allow(''),
});

const bilingualBadge = Joi.object({
  pt: Joi.string().trim().max(30).optional().allow(''),
  en: Joi.string().trim().max(30).optional().allow(''),
});

const createCategorySchema = Joi.object({
  name: bilingualName.required(),
  icon: Joi.string().trim().optional().allow(''),
  image: Joi.string().trim().optional().allow(''),
  parent: objectId.optional().allow(null),
  badge: bilingualBadge.optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.object({
    pt: Joi.string().trim().min(2).max(50).optional(),
    en: Joi.string().trim().max(50).optional().allow(''),
  }).optional(),
  icon: Joi.string().trim().optional().allow(''),
  image: Joi.string().trim().optional().allow(''),
  parent: objectId.optional().allow(null),
  badge: bilingualBadge.optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

module.exports = { createCategorySchema, updateCategorySchema };

