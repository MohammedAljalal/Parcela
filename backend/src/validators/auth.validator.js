import Joi from 'joi';

// Registration validation rules
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
});

// Login validation rules
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export { registerSchema, loginSchema };