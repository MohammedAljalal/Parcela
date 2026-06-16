// this middleware is used to validate incoming request data against a Joi schema
// we use it in the auth.routes.js to validate the registration and login data
import { sendError } from '../utils/response.js';

const validate = (schema) => {
  // Ensure the schema is properly passed before accepting any request
  if (!schema || typeof schema.validate !== 'function') {
    throw new Error('validate requires a valid Joi schema');
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      // Collect all errors instead of stopping at the first one
      abortEarly: false,
      // Remove any fields not present in the schema
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendError(res, 'Invalid data', 422, errors);
    }

    // Replace req.body with the cleaned values after stripUnknown
    req.body = value;

    next();
  };
};

export default validate;