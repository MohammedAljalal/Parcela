// Review routes: public read per product, protected write, admin moderation.
'use strict';

const express = require('express');
const router = express.Router();

const {
  getProductReviews,
  getAllReviewsAdmin,
  moderateReview,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
} = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createReviewSchema, updateReviewSchema } = require('../validators/review.validator');
const { moderateReviewSchema } = require('../validators/moderateReview.validator');

// Public: anyone can see reviews before buying.
router.get('/product/:productId', getProductReviews);

router.use(protect);

// Admin moderation — must come before /:id routes registered later in this file.
router.get('/admin/all', restrictTo('admin'), getAllReviewsAdmin);
router.patch('/:id/moderate', restrictTo('admin'), validate(moderateReviewSchema), moderateReview);

router.get('/me', getMyReviews);
router.post('/', validate(createReviewSchema), createReview);
router.put('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
