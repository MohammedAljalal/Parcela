// Validation rules for product management and listing queries.
const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid identifier',
});

const bilingualText = (required = false) => {
  const schema = Joi.object({
    pt: required ? Joi.string().trim().min(2).required() : Joi.string().trim().optional().allow(''),
    en: Joi.string().trim().optional().allow(''),
  });
  return required ? schema.required() : schema.optional();
};

const specSchema = Joi.object({
  label: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
});

const vendorInfoSchema = Joi.object({
  storeName: Joi.string().trim().min(2).max(100).required(),
  logo: Joi.string().trim().optional().allow(''),
});

const createProductSchema = Joi.object({
  name: bilingualText(true),
  description: bilingualText(false),
  category: objectId.required(),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().integer().min(0).optional(),
  sku: Joi.string().trim().optional().allow(''),
  specifications: Joi.array().items(specSchema).optional(),
  deliveryInfo: bilingualText(false),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isFeatured: Joi.boolean().optional(),
  isPromoted: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  availableIslands: Joi.array().items(objectId).optional(),
  vendor: objectId.optional().allow(null),
  vendorInfo: vendorInfoSchema.required(),
});

const updateProductSchema = Joi.object({
  name: bilingualText(false),
  description: bilingualText(false),
  category: objectId.optional(),
  price: Joi.number().min(0).optional(),
  compareAtPrice: Joi.number().min(0).optional().allow(null),
  stock: Joi.number().integer().min(0).optional(),
  sku: Joi.string().trim().optional().allow(''),
  specifications: Joi.array().items(specSchema).optional(),
  deliveryInfo: bilingualText(false),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  isFeatured: Joi.boolean().optional(),
  isPromoted: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  availableIslands: Joi.array().items(objectId).optional(),
  vendor: objectId.optional().allow(null),
  vendorInfo: vendorInfoSchema.optional(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

const listProductsQuerySchema = Joi.object({
  category: objectId.optional(),
  island: objectId.optional(),
  search: Joi.string().trim().max(100).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  isFeatured: Joi.boolean().optional(),
  isPromoted: Joi.boolean().optional(),
  sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'rating', 'popular').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

module.exports = { createProductSchema, updateProductSchema, listProductsQuerySchema };

