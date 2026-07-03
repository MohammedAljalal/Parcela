// Product routes: public read with filters, admin/vendor write with image upload.
'use strict';

const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProductsAdmin,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
} = require('../controllers/product.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload.middleware');
const parseMultipartJson = require('../middleware/parseMultipartJson.middleware');
const { createProductSchema, updateProductSchema, listProductsQuerySchema } = require('../validators/product.validator');

// Product creation/update accepts multipart/form-data (for image files), so the
// client must send these nested fields as JSON strings — this middleware parses
// them back into real objects/arrays before validation.
const PRODUCT_JSON_FIELDS = ['name', 'description', 'specifications', 'deliveryInfo', 'tags', 'availableIslands', 'vendorInfo'];

router.get('/', validate(listProductsQuerySchema, 'query'), getProducts);

// Must come before /:slug so "admin" is not parsed as a product slug.
router.get('/admin/all', protect, restrictTo('admin', 'vendor'), getProductsAdmin);

// optionalAuth: public shoppers get isActive-only results; admins/vendors
// (if logged in) can also open inactive products to edit them.
router.get('/:slug', optionalAuth, getProductBySlug);

router.post(
  '/',
  protect,
  restrictTo('admin', 'vendor'),
  upload.array('images', 8),
  parseMultipartJson(PRODUCT_JSON_FIELDS),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  protect,
  restrictTo('admin', 'vendor'),
  upload.array('images', 8),
  parseMultipartJson(PRODUCT_JSON_FIELDS),
  validate(updateProductSchema),
  updateProduct
);

router.delete('/:id/images/:imageId', protect, restrictTo('admin', 'vendor'), deleteProductImage);
router.delete('/:id', protect, restrictTo('admin', 'vendor'), deleteProduct);

module.exports = router;
