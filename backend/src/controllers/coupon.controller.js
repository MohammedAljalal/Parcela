// Manages coupons (admin CRUD) and coupon preview for customers.
'use strict';

const { Coupon, Cart } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { validateAndCalculateDiscount } = require('../services/coupon.service');

// GET /api/coupons
const getCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Coupon.countDocuments(),
    ]);

    return sendPaginated(res, coupons, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons
const createCoupon = async (req, res, next) => {
  try {
    const existingCoupon = await Coupon.findOne({ code: req.body.code });
    if (existingCoupon) return sendError(res, 'A coupon with this code already exists', 409);

    const coupon = await Coupon.create(req.body);
    return sendSuccess(res, { coupon }, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/coupons/:id
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    Object.assign(coupon, req.body);
    await coupon.save();

    return sendSuccess(res, { coupon }, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    // Used coupons are referenced by past orders, disable instead of deleting.
    if (coupon.usedCount > 0) {
      return sendError(res, 'Cannot delete a used coupon, disable it instead', 409);
    }

    await coupon.deleteOne();

    return sendSuccess(res, {}, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons/preview
const previewCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'category');
    if (!cart || cart.items.length === 0) return sendError(res, 'Cart is empty, cannot preview coupon', 400);

    const productIds = cart.items.map((item) => item.product._id.toString());
    const categoryIds = cart.items.map((item) => item.product.category.toString());

    const result = await validateAndCalculateDiscount({
      code,
      userId: req.user._id,
      subtotal: cart.subtotal,
      productIds,
      categoryIds,
    });

    if (!result.valid) return sendError(res, result.message, 422);

    return sendSuccess(
      res,
      {
        discountAmount: result.discountAmount,
        freeDelivery: result.freeDelivery,
        newTotal: cart.subtotal - result.discountAmount,
      },
      'Coupon is valid'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, previewCoupon };
