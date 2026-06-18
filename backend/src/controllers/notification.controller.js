// Manages the current user's notifications.
'use strict';

const { Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return sendError(res, 'Notification not found', 404);

    notification.isRead = true;
    await notification.save();

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

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
