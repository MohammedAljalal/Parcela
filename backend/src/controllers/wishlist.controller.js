// Manages the current user's wishlist.
'use strict';

const { Wishlist, Product } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products.product',
      select: 'name slug images price compareAtPrice stock isActive averageRating',
    });

    if (!wishlist) {
      return sendSuccess(res, { wishlist: { products: [] } }, 'Wishlist is currently empty');
    }

    return sendSuccess(res, { wishlist }, 'Wishlist fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist/:productId
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return sendError(res, 'Product not found', 404);

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    const alreadyExists = wishlist.products.some((p) => p.product.toString() === productId);
    if (alreadyExists) return sendError(res, 'Product is already in the wishlist', 409);

    wishlist.products.push({ product: productId });
    await wishlist.save();

    return sendSuccess(res, { wishlist }, 'Added to wishlist successfully', 201);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return sendError(res, 'Wishlist is empty', 404);

    const exists = wishlist.products.some((p) => p.product.toString() === req.params.productId);
    if (!exists) return sendError(res, 'Product not found in wishlist', 404);

    wishlist.products = wishlist.products.filter((p) => p.product.toString() !== req.params.productId);
    await wishlist.save();

    return sendSuccess(res, { wishlist }, 'Removed from wishlist successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/wishlist/check/:productId
const checkInWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    const isInWishlist = wishlist
      ? wishlist.products.some((p) => p.product.toString() === req.params.productId)
      : false;

    return sendSuccess(res, { isInWishlist }, 'Check completed');
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkInWishlist };
