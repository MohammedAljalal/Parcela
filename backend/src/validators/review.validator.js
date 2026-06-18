// Validation rules for product reviews.
import Joi from 'joi';

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const createReviewSchema = Joi.object({
  product: objectId.required(),
  order: objectId.required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).optional().allow(''),
  images: Joi.array()
    .items(Joi.object({ url: Joi.string().required(), publicId: Joi.string().optional().allow('') }))
    .max(5)
    .optional(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().trim().max(1000).optional().allow(''),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

export { createReviewSchema, updateReviewSchema };

