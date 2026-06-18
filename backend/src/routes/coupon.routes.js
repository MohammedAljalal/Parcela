// Coupon routes: admin-only management, preview available to any logged-in user.
'use strict';

const express = require('express');
const router = express.Router();

const { getCoupons, createCoupon, updateCoupon, deleteCoupon, previewCoupon } = require('../controllers/coupon.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createCouponSchema, updateCouponSchema, previewCouponSchema } = require('../validators/coupon.validator');

router.use(protect);

router.post('/preview', validate(previewCouponSchema), previewCoupon);

router.get('/', restrictTo('admin'), getCoupons);
router.post('/', restrictTo('admin'), validate(createCouponSchema), createCoupon);
router.put('/:id', restrictTo('admin'), validate(updateCouponSchema), updateCoupon);
router.delete('/:id', restrictTo('admin'), deleteCoupon);

module.exports = router;
