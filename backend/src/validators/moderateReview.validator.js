// Validation rule for admin review moderation (show/hide).
'use strict';

const Joi = require('joi');

const moderateReviewSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = { moderateReviewSchema };
