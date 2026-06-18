// Manages products: listing with search/filter/sort, creation with multiple images.

import { Product, Category } from '../models/index.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      island,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isPromoted,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (island) filter.availableIslands = island;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (isPromoted === 'true') filter.isPromoted = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1, reviewCount: -1 };
    if (sort === 'popular') sortOption = { reviewCount: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-vendorInfo.logo')
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return sendPaginated(res, products, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('availableIslands', 'name code deliveryFee')
      .populate('vendor', 'name email phone avatar');

    if (!product) return sendError(res, 'Product not found', 404);

    return sendSuccess(res, { product }, 'Product fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const categoryExists = await Category.exists({ _id: req.body.category, isActive: true });
    if (!categoryExists) return sendError(res, 'Selected category not found or inactive', 404);

    if (req.body.specifications && typeof req.body.specifications === 'string') {
      req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.availableIslands && typeof req.body.availableIslands === 'string') {
      req.body.availableIslands = JSON.parse(req.body.availableIslands);
    }
    if (req.body.vendorInfo && typeof req.body.vendorInfo === 'string') {
      req.body.vendorInfo = JSON.parse(req.body.vendorInfo);
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadImage(file.buffer, 'products'));
      const uploadResults = await Promise.all(uploadPromises);

      uploadResults.forEach((result, index) => {
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary: index === 0,
        });
      });
    }

    const productData = {
      ...req.body,
      images,
    };

    if (req.user.role === 'vendor') {
      productData.vendor = req.user._id;
    }

    const product = await Product.create(productData);

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

    if (req.body.specifications && typeof req.body.specifications === 'string') {
      req.body.specifications = JSON.parse(req.body.specifications);
    }
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (req.body.availableIslands && typeof req.body.availableIslands === 'string') {
      req.body.availableIslands = JSON.parse(req.body.availableIslands);
    }
    if (req.body.vendorInfo && typeof req.body.vendorInfo === 'string') {
      req.body.vendorInfo = JSON.parse(req.body.vendorInfo);
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadImage(file.buffer, 'products'));
      const uploadResults = await Promise.all(uploadPromises);

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

export {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
};
