// Validation rules for admin user management.
'use strict';

const Joi = require('joi');
const { ROLES, LANGUAGES } = require('../config/constants');

const phonePattern = /^\+\d{7,15}$/;

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().trim().lowercase().optional().allow(''),
  phone: Joi.string().pattern(phonePattern).optional().allow('').messages({
    'string.pattern.base': 'Phone must be a valid international number starting with +',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  isActive: Joi.boolean().optional(),
  preferredLanguage: Joi.string().valid(...Object.values(LANGUAGES)).optional(),
})
  .or('email', 'phone')
  .messages({ 'object.missing': 'Either email or phone is required' });

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().email().trim().lowercase().optional().allow(''),
  phone: Joi.string().pattern(phonePattern).optional().allow(''),
  preferredLanguage: Joi.string().valid(...Object.values(LANGUAGES)).optional(),
  notificationsEnabled: Joi.boolean().optional(),
  avatar: Joi.string().uri().optional().allow(''),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)).required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
  }),
});

const listUsersQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).optional().allow(''),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('newest', 'oldest', 'name_asc', 'name_desc').optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  updateRoleSchema,
  resetPasswordSchema,
  listUsersQuerySchema,
};
