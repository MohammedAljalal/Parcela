// Order routes, all protected, some admin-only.

import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/order.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';

const router = Router();

router.use(protect);

// Must come before /:id so "admin" is not parsed as an order id.
router.get('/admin/all', restrictTo('admin'), getAllOrders);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', restrictTo('admin'), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
