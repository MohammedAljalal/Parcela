// Validates req.body (default) or req.query against a Joi schema.

import { sendError } from '../utils/response.js';

const validate = (schema, target = 'body') => {
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('validate() requires a valid Joi schema');
  }

  return (req, res, next) => {
    const dataToValidate = target === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendError(res, 'Invalid data', 422, errors);
    }

    if (target === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

export default validate;
