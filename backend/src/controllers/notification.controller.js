// Managing notifications for the current user.

import { Notification } from '../models/index.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';

// GET /api/notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;

    const filter = { user: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return sendPaginated(
      res,
      { notifications, unreadCount },
      { total, page: Number(page), limit: Number(limit) }
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return sendError(res, 'Notification not found', 404);

    return sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) return sendError(res, 'Notification not found', 404);

    return sendSuccess(res, {}, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

export { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
