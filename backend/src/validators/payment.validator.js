// Validation rules for initiating a payment session.
import Joi from 'joi';

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const initiatePaymentSchema = Joi.object({
  orderId: objectId.required(),
});

export { initiatePaymentSchema };

