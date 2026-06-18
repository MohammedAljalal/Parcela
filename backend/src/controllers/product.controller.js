// Manages products: listing, search, filtering, images, CRUD.
'use strict';

const { Product, Category, Island } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { uploadImage, deleteImage } = require('../lib/cloudinary');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, island, search, minPrice, maxPrice, isFeatured, isPromoted, sort, page = 1, limit = 10 } =
      req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (island) filter.availableIslands = island;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (isPromoted !== undefined) filter.isPromoted = isPromoted;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (search) filter.$text = { $search: search };

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { averageRating: -1 },
      popular: { reviewCount: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return sendPaginated(res, products, { total, page, limit });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('availableIslands', 'name code');

    if (!product) return sendError(res, 'Product not found', 404);

    return sendSuccess(res, { product }, 'Product fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) return sendError(res, 'Category not found', 404);

    if (req.body.availableIslands?.length > 0) {
      const islandsCount = await Island.countDocuments({ _id: { $in: req.body.availableIslands } });
      if (islandsCount !== req.body.availableIslands.length) {
        return sendError(res, 'One of the selected islands does not exist', 404);
      }
    }

    let images = [];
    if (req.files?.length > 0) {
      const uploadResults = await Promise.all(req.files.map((file) => uploadImage(file.buffer, 'products')));
      images = uploadResults.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: index === 0,
      }));
    }

    const product = await Product.create({ ...req.body, images });

    return sendSuccess(res, { product }, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);

    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) return sendError(res, 'Category not found', 404);
    }

    if (req.files?.length > 0) {
      const uploadResults = await Promise.all(req.files.map((file) => uploadImage(file.buffer, 'products')));
      const newImages = uploadResults.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: false,
      }));

      product.images.push(...newImages);

      if (product.images.length > 8) {
        return sendError(res, 'Cannot add more images, maximum is 8 per product', 422);
      }
    }

    const categoryChanged = req.body.category && req.body.category !== product.category.toString();
    const oldCategoryId = product.category;

    Object.assign(product, req.body);
    await product.save();

    if (categoryChanged) {
      await Category.recalculateProductsCount(oldCategoryId);
    }

    return sendSuccess(res, { product }, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/images/:imageId
const deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 'Product not found', 404);

    const image = product.images.find((img) => img._id.toString() === req.params.imageId);
    if (!image) return sendError(res, 'Image not found', 404);

    await deleteImage(image.publicId);

    product.images = product.images.filter((img) => img._id.toString() !== req.params.imageId);
    await product.save();

    return sendSuccess(res, { product }, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id });
    if (!product) return sendError(res, 'Product not found', 404);

    await Promise.all(product.images.map((img) => deleteImage(img.publicId)));

    return sendSuccess(res, {}, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
};
