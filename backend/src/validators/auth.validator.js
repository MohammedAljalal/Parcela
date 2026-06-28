// Validation rules for phone+OTP, Google, and email/password authentication.
'use strict';

const Joi = require('joi');

const phoneSchema = Joi.string()
  .pattern(/^\+\d{7,15}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone must be a valid international number starting with +',
    'any.required': 'Phone number is required',
  });

const sendOtpSchema = Joi.object({
  phone: phoneSchema,
});

const verifyOtpSchema = Joi.object({
  phone: phoneSchema,
  code: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': 'Code must be 6 digits',
      'string.pattern.base': 'Code must contain digits only',
      'any.required': 'Code is required',
    }),
  name: Joi.string().min(2).max(50).optional(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({ 'any.required': 'Google token is required' }),
});

const registerEmailSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Must be a valid email address',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
});

const loginEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Must be a valid email address',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  preferredLanguage: Joi.string().valid('pt', 'en').optional(),
  notificationsEnabled: Joi.boolean().optional(),
  avatar: Joi.string().uri().optional().allow(''),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  googleAuthSchema,
  registerEmailSchema,
  loginEmailSchema,
  updateProfileSchema,
  refreshTokenSchema,
};
