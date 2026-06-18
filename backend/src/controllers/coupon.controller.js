// Manages discount coupons and exposes a preview endpoint to test a code
// against the user's current cart before checkout.

import { Coupon, Cart } from '../models/index.js';
import { validateAndCalculateDiscount } from '../services/coupon.service.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';

// GET /api/coupons (Admin only)
const getCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate('applicableCategories', 'name slug')
        .populate('applicableProducts', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Coupon.countDocuments(filter),
    ]);

    return sendPaginated(res, coupons, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons (Admin only)
const createCoupon = async (req, res, next) => {
  try {
    const exists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (exists) return sendError(res, 'A coupon with this code already exists', 409);

    const coupon = await Coupon.create(req.body);
    return sendSuccess(res, { coupon }, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/coupons/:id (Admin only)
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    if (req.body.code) {
      delete req.body.code; // Code cannot be changed once created
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    return sendSuccess(res, { coupon }, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id (Admin only)
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    if (coupon.usedCount > 0) {
      // Soft delete if already used
      coupon.isActive = false;
      await coupon.save();
      return sendSuccess(res, {}, 'Coupon disabled (cannot delete because it was already used)');
    }

    await Coupon.findByIdAndDelete(coupon._id);
    return sendSuccess(res, {}, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons/preview
// Simulates applying a coupon to the current user's cart without creating an order.
const previewCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return sendError(res, 'Cart is empty', 400);
    }

    const productIds = cart.items.map((i) => i.product._id.toString());
    const categoryIds = cart.items.map((i) => i.product.category.toString());

    const result = await validateAndCalculateDiscount({
      code,
      userId: req.user._id,
      subtotal: cart.subtotal,
      productIds,
      categoryIds,
    });

    if (!result.valid) {
      return sendError(res, result.message, 400);
    }

    const preview = {
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      discountAmount: result.discountAmount,
      freeDelivery: result.freeDelivery,
      subtotalBeforeDiscount: cart.subtotal,
      subtotalAfterDiscount: Math.max(cart.subtotal - result.discountAmount, 0),
    };

    return sendSuccess(res, { preview }, 'Coupon can be applied');
  } catch (error) {
    next(error);
  }
};

export { getCoupons, createCoupon, updateCoupon, deleteCoupon, previewCoupon };
