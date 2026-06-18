// Coupon routes: admin-only management, preview available to any logged-in user.

import { Router } from 'express';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, previewCoupon } from '../controllers/coupon.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createCouponSchema, updateCouponSchema, previewCouponSchema } from '../validators/coupon.validator.js';

const router = Router();

router.use(protect);

router.post('/preview', validate(previewCouponSchema), previewCoupon);

router.get('/', restrictTo('admin'), getCoupons);
router.post('/', restrictTo('admin'), validate(createCouponSchema), createCoupon);
router.put('/:id', restrictTo('admin'), validate(updateCouponSchema), updateCoupon);
router.delete('/:id', restrictTo('admin'), deleteCoupon);

export default router;
