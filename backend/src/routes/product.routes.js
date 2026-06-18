// Product routes: public read with filters, admin/vendor write with image upload.

import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.middleware.js';
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from '../validators/product.validator.js';

const router = Router();

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

export default router;
