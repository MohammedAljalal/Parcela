// Category routes: public read, admin-only write.
'use strict';

const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

router.post('/', protect, restrictTo('admin'), validate(createCategorySchema), createCategory);
router.put('/:id', protect, restrictTo('admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;
