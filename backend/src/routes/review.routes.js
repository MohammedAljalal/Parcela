// Review routes: public read per product, protected write.

import { Router } from 'express';
import { getProductReviews, createReview, updateReview, deleteReview, getMyReviews } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator.js';

const router = Router();

// Public: anyone can see reviews before buying.
router.get('/product/:productId', getProductReviews);

router.use(protect);

router.get('/me', getMyReviews);
router.post('/', validate(createReviewSchema), createReview);
router.put('/:id', validate(updateReviewSchema), updateReview);
router.delete('/:id', deleteReview);

export default router;
