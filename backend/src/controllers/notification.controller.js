// Manages the current user's notifications.
'use strict';

const { Notification, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { createBulkNotification } = require('../services/notification.service');
const { NOTIFICATION_TYPE } = require('../config/constants');

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

// POST /api/admin/notifications/broadcast — admin-only: send a notification to many users at once.
const broadcastNotification = async (req, res, next) => {
  try {
    const { target, userIds, title, body } = req.body;

    let recipientIds = [];

    if (target === 'specific') {
      recipientIds = userIds;
    } else {
      const filter = { isActive: true };
      if (target === 'customers') filter.role = 'customer';
      if (target === 'vendors') filter.role = 'vendor';

      const users = await User.find(filter).select('_id');
      recipientIds = users.map((u) => u._id);
    }

    if (recipientIds.length === 0) {
      return sendError(res, 'No recipients found for this target', 400);
    }

    await createBulkNotification({
      userIds: recipientIds,
      type: NOTIFICATION_TYPE.PROMO,
      data: { title, body },
    });

    return sendSuccess(res, { recipientCount: recipientIds.length }, 'Notification broadcast sent successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, broadcastNotification };
