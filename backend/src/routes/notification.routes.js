// Notification routes, all protected (personal data).
'use strict';

const express = require('express');
const router = express.Router();

const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { listNotificationsQuerySchema } = require('../validators/notification.validator');

router.use(protect);

router.get('/', validate(listNotificationsQuerySchema, 'query'), getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
