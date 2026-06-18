// In-app notifications for order updates, promotions, system messages.
'use strict';

const { Schema, model } = require('mongoose');
const { NOTIFICATION_TYPE } = require('../config/constants');

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      pt: { type: String, required: true },
      en: { type: String, default: '' },
    },
    body: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), default: NOTIFICATION_TYPE.SYSTEM },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
// Auto-delete after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = model('Notification', notificationSchema);
