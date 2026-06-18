// Notification routes, all protected (personal data).

import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { listNotificationsQuerySchema } from '../validators/notification.validator.js';

const router = Router();

router.use(protect);

router.get('/', validate(listNotificationsQuerySchema, 'query'), getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
