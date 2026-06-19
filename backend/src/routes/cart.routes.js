// Cart routes, all protected (personal data).
'use strict';

const express = require('express');
const router = express.Router();

const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  setDeliveryIsland,
  clearCart,
} = require('../controllers/cart.controller');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { addToCartSchema, updateQuantitySchema, setIslandSchema } = require('../validators/cart.validator');

router.use(protect);

router.get('/', getCart);
router.post('/items', validate(addToCartSchema), addItem);
router.put('/items/:productId', validate(updateQuantitySchema), updateItemQuantity);
router.delete('/items/:productId', removeItem);
router.put('/island', validate(setIslandSchema), setDeliveryIsland);
router.delete('/', clearCart);

module.exports = router;
