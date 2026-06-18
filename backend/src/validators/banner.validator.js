// Validation rules for promotional banners.
'use strict';

const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const bilingualText = (required = false) => {
  const schema = Joi.object({
    pt: required ? Joi.string().trim().min(2).required() : Joi.string().trim().optional().allow(''),
    en: Joi.string().trim().optional().allow(''),
  });
  return required ? schema.required() : schema.optional();
};

const createBannerSchema = Joi.object({
  title: bilingualText(true),
  subtitle: bilingualText(false),
  image: Joi.string().trim().required(),
  ctaLabel: bilingualText(false),
  ctaLink: Joi.string().trim().optional().allow(''),
  island: objectId.optional().allow(null),
  sortOrder: Joi.number().integer().optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  isActive: Joi.boolean().optional(),
});

const updateBannerSchema = Joi.object({
  title: bilingualText(false),
  subtitle: bilingualText(false),
  image: Joi.string().trim().optional(),
  ctaLabel: bilingualText(false),
  ctaLink: Joi.string().trim().optional().allow(''),
  island: objectId.optional().allow(null),
  sortOrder: Joi.number().integer().optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

module.exports = { createBannerSchema, updateBannerSchema };
