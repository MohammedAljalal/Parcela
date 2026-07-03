// Validation rules for OTP security log queries.
'use strict';

const Joi = require('joi');

const listOtpLogsQuerySchema = Joi.object({
  blocked: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = { listOtpLogsQuerySchema };
