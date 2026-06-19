// Wishlist routes, all protected (personal data).
'use strict';

const express = require('express');
const router = express.Router();

const { getWishlist, addToWishlist, removeFromWishlist, checkInWishlist } = require('../controllers/wishlist.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getWishlist);
router.get('/check/:productId', checkInWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
