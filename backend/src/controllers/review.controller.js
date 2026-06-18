// Manages product reviews, restricted to verified (delivered order) purchases.

import { Review, Order } from '../models/index.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { ORDER_STATUS } from '../config/constants.js';

// GET /api/reviews/product/:productId
const getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { product: req.params.productId, isActive: true };

    const [reviews, total] = await Promise.all([
      Review.find(filter).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    return sendPaginated(res, reviews, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { product, order: orderId, rating, comment, images } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return sendError(res, 'Order not found or does not belong to you', 404);

    if (order.status !== ORDER_STATUS.DELIVERED) {
      return sendError(res, 'You can only review a product after the order is delivered', 403);
    }

    const productInOrder = order.items.some((item) => item.product.toString() === product);
    if (!productInOrder) return sendError(res, 'This product is not part of the specified order', 422);

    const review = await Review.create({ user: req.user._id, product, order: orderId, rating, comment, images });

    return sendSuccess(res, { review }, 'Review added successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/reviews/:id
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return sendError(res, 'Review not found or does not belong to you', 404);

    Object.assign(review, req.body);
    await review.save();

    return sendSuccess(res, { review }, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') filter.user = req.user._id;

    const review = await Review.findOneAndDelete(filter);
    if (!review) return sendError(res, 'Review not found or cannot be deleted', 404);

    return sendSuccess(res, {}, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/me
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { reviews }, 'Reviews fetched successfully');
  } catch (error) {
    next(error);
  }
};

export { getProductReviews, createReview, updateReview, deleteReview, getMyReviews };
