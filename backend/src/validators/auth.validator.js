// Validation rules for phone+OTP and Google authentication.
import Joi from 'joi';

const phoneSchema = Joi.string()
  .pattern(/^\+238\d{7}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone must start with +238 followed by 7 digits',
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
  // Only required for new users, enforced in the controller.
  name: Joi.string().min(2).max(50).optional(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({ 'any.required': 'Google token is required' }),
});

export { sendOtpSchema, verifyOtpSchema, googleAuthSchema };

