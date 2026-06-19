// Order routes, all protected, some admin-only.
'use strict';

const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/order.controller');

const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

router.use(protect);

// Must come before /:id so "admin" is not parsed as an order id.
router.get('/admin/all', restrictTo('admin'), getAllOrders);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

// Both PUT and PATCH accepted for cancel — PUT kept for backward compatibility.
router.put('/:id/cancel', cancelOrder);
router.patch('/:id/cancel', cancelOrder);

router.put('/:id/status', restrictTo('admin'), validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/status', restrictTo('admin'), validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
