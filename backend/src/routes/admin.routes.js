// Central admin router: user management, dashboard analytics, broadcast
// notifications, and security monitoring. Every route here requires an
// authenticated admin — enforced once at the top instead of per-route.
'use strict';

const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getUserOrders,
  getUserAddresses,
} = require('../controllers/adminUser.controller');

const { getStats, getCharts, getRecentActivity } = require('../controllers/dashboard.controller');
const { broadcastNotification } = require('../controllers/notification.controller');
const { listOtpLogs, unblockOtpLog } = require('../controllers/security.controller');

const {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  updateRoleSchema,
  resetPasswordSchema,
  listUsersQuerySchema,
} = require('../validators/adminUser.validator');
const { broadcastNotificationSchema } = require('../validators/broadcast.validator');
const { listOtpLogsQuerySchema } = require('../validators/security.validator');

// Every admin route requires an authenticated admin.
router.use(protect, restrictTo('admin'));

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', getStats);
router.get('/dashboard/charts', getCharts);
router.get('/dashboard/recent', getRecentActivity);

// ── User management ──────────────────────────────────────────────────────────
router.get('/users', validate(listUsersQuerySchema, 'query'), listUsers);
router.post('/users', validate(createUserSchema), createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', validate(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

router.patch('/users/:id/status', validate(updateStatusSchema), updateUserStatus);
router.patch('/users/:id/role', validate(updateRoleSchema), updateUserRole);
router.put('/users/:id/password', validate(resetPasswordSchema), resetUserPassword);

router.get('/users/:id/orders', getUserOrders);
router.get('/users/:id/addresses', getUserAddresses);

// ── Notifications ────────────────────────────────────────────────────────────
router.post('/notifications/broadcast', validate(broadcastNotificationSchema), broadcastNotification);

// ── Security ─────────────────────────────────────────────────────────────────
router.get('/security/otp-logs', validate(listOtpLogsQuerySchema, 'query'), listOtpLogs);
router.patch('/security/otp-logs/:id/unblock', unblockOtpLog);

module.exports = router;
