// Manages product categories. Public read, admin-only write.
'use strict';

const { Category } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, parent: null }).sort({
      sortOrder: 1,
      'name.pt': 1,
    });

    return sendSuccess(res, { categories }, 'Categories fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:slug
const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate(
      'subcategories',
      'name slug image productsCount'
    );

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
      const parentExists = await Category.findById(req.body.parent);
      if (!parentExists) return sendError(res, 'Parent category not found', 404);
    }

    const existingCategory = await Category.findOne({ 'name.pt': req.body.name.pt });
    if (existingCategory) return sendError(res, 'A category with this name already exists', 409);

    const category = await Category.create(req.body);
    return sendSuccess(res, { category }, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 'Category not found', 404);

    if (req.body.parent && req.body.parent === req.params.id) {
      return sendError(res, 'A category cannot be its own parent', 422);
    }

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

    if (category.productsCount > 0) {
      return sendError(
        res,
        `Cannot delete this category, it has ${category.productsCount} product(s), move them first`,
        409
      );
    }

    const hasSubcategories = await Category.exists({ parent: category._id });
    if (hasSubcategories) return sendError(res, 'Cannot delete this category, it has subcategories', 409);

    await category.deleteOne();

    return sendSuccess(res, {}, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
