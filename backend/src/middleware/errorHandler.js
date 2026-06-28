// Central error handling: 404 + global error handler.
'use strict';

const { sendError } = require('../utils/response');
const env = require('../config/env');

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let message = err.message || 'Server error';
  let statusCode = err.statusCode || 500;
  let errors = [];

  // Mongoose schema validation error.
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Duplicate unique field.
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const friendlyField = field === 'email' ? 'endereço de email' : field === 'phone' ? 'número de telefone' : field;
    message = `Este ${friendlyField} já está registado.`;
    errors = [message];
  }

  // Invalid ObjectId.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
    errors = [`Value "${err.value}" is invalid for field "${err.path}"`];
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, please log in again';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (env.NODE_ENV === 'development') {
    console.error('Error:', { message: err.message, stack: err.stack, statusCode });
  }

  return sendError(res, message, statusCode, errors);
};

module.exports = { notFound, errorHandler };
