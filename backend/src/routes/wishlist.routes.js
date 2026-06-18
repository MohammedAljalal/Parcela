// Wishlist routes, all protected (personal data).

import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, checkInWishlist } from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.get('/check/:productId', checkInWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
