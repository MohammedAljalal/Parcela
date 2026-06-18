// Manages category tree: creating, updating, and public listing.

import { Category } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const filter =
      req.query.includeInactive === 'true' && req.user?.role === 'admin' ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .populate('subcategories', 'name slug icon image productsCount isActive sortOrder')
      .sort({ sortOrder: 1, 'name.pt': 1 });

    // Build the tree (top-level only).
    const topLevelCategories = categories.filter((c) => !c.parent);

    return sendSuccess(res, { categories: topLevelCategories }, 'Categories fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:slug
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('subcategories', 'name slug icon image productsCount isActive sortOrder');

    if (!category) return sendError(res, 'Category not found', 404);

    return sendSuccess(res, { category }, 'Category fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    if (req.body.parent) {
      const parent = await Category.findById(req.body.parent);
      if (!parent) return sendError(res, 'Parent category not found', 404);
      if (parent.parent) return sendError(res, 'Maximum nesting level is 2 (Parent -> Child)', 400);
    }

    const category = await Category.create(req.body);
    return sendSuccess(res, { category }, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    if (req.body.parent) {
      if (req.body.parent === req.params.id) {
        return sendError(res, 'A category cannot be its own parent', 400);
      }
      const parent = await Category.findById(req.body.parent);
      if (!parent) return sendError(res, 'Parent category not found', 404);
      if (parent.parent) return sendError(res, 'Maximum nesting level is 2 (Parent -> Child)', 400);
    }

    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 'Category not found', 404);

    Object.assign(category, req.body);
    await category.save();

    return sendSuccess(res, { category }, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 'Category not found', 404);

    const hasSubcategories = await Category.exists({ parent: category._id });
    if (hasSubcategories) {
      return sendError(res, 'Cannot delete a category that has subcategories', 409);
    }

    if (category.productsCount > 0) {
      return sendError(res, 'Cannot delete a category that has products', 409);
    }

    await Category.findByIdAndDelete(category._id);

    return sendSuccess(res, {}, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

export { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
