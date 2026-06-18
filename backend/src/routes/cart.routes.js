// Cart routes, all protected (personal data).

import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  setDeliveryIsland,
  clearCart,
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { addToCartSchema, updateQuantitySchema, setIslandSchema } from '../validators/cart.validator.js';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/items', validate(addToCartSchema), addItem);
router.put('/items/:productId', validate(updateQuantitySchema), updateItemQuantity);
router.delete('/items/:productId', removeItem);
router.put('/island', validate(setIslandSchema), setDeliveryIsland);
router.delete('/', clearCart);

export default router;
