import env from '../config/env.js';
import { sendError } from '../utils/response.js';

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  // Pass the error to the errorHandler instead of sending response directly
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let message = err.message || 'Server Error';
  let statusCode = err.statusCode || 500;
  let errors = [];

  // Mongoose Schema validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Duplicate value error for unique fields like email
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Data already exists';
    const field = Object.keys(err.keyValue)[0];
    errors = [`"${field}" is already in use`];
  }

  // Invalid MongoDB ID error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID';
    errors = [`Value "${err.value}" is invalid for field "${err.path}"`];
  }

  // Forged or corrupted token error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, please log in again';
  }

  // Expired token error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  // Print error details in development only
  if (env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  return sendError(res, message, statusCode, errors);
};

export { notFound, errorHandler };