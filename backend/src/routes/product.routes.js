// Product routes: public read with filters, admin/vendor write with image upload.
'use strict';

const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
} = require('../controllers/product.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload.middleware');
const { createProductSchema, updateProductSchema, listProductsQuerySchema } = require('../validators/product.validator');

router.get('/', validate(listProductsQuerySchema, 'query'), getProducts);
router.get('/:slug', getProductBySlug);

router.post(
  '/',
  protect,
  restrictTo('admin', 'vendor'),
  upload.array('images', 8),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  protect,
  restrictTo('admin', 'vendor'),
  upload.array('images', 8),
  validate(updateProductSchema),
  updateProduct
);

router.delete('/:id/images/:imageId', protect, restrictTo('admin', 'vendor'), deleteProductImage);
router.delete('/:id', protect, restrictTo('admin', 'vendor'), deleteProduct);

module.exports = router;
