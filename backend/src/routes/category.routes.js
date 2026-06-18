// Category routes: public read, admin-only write.

import { Router } from 'express';
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

router.post('/', protect, restrictTo('admin'), validate(createCategorySchema), createCategory);
router.put('/:id', protect, restrictTo('admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

export default router;
