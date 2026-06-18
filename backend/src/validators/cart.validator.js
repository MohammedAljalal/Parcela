// Validation rules for cart operations.
import Joi from 'joi';

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const addToCartSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const setIslandSchema = Joi.object({
  islandId: objectId.required(),
});

export { addToCartSchema, updateQuantitySchema, setIslandSchema };

