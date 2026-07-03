// Validation rules for admin broadcast notifications.
'use strict';

const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const bilingualText = Joi.object({
  pt: Joi.string().trim().min(2).required(),
  en: Joi.string().trim().optional().allow(''),
});

const broadcastNotificationSchema = Joi.object({
  target: Joi.string().valid('all', 'customers', 'vendors', 'specific').required(),
  userIds: Joi.array()
    .items(objectId)
    .when('target', { is: 'specific', then: Joi.array().min(1).required(), otherwise: Joi.optional() }),
  title: bilingualText.required(),
  body: bilingualText.required(),
});

module.exports = { broadcastNotificationSchema };
