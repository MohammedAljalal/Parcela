// Review routes: public read per product, protected write.
'use strict';

const express = require('express');
const router = express.Router();

const { getProductReviews, createReview, updateReview, deleteReview, getMyReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createReviewSchema, updateReviewSchema } = require('../validators/review.validator');

// Public: anyone can see reviews before buying.
router.get('/product/:productId', getProductReviews);

router.use(protect);

router.get('/me', getMyReviews);
router.post('/', validate(createReviewSchema), createReview);
router.put('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
