// src/models/Notification.js
// In-app notifications for order updates, promotions, system.


'use strict';

import { Schema, model } from 'mongoose';
import { NOTIFICATION_TYPE } from '../constants/constants';

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      pt: { type: String, required: true },
      en: { type: String, default: '' },
    },
    body: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.SYSTEM,
    },
    // Flexible metadata — orderId, productId, etc.
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = model('Notification', notificationSchema);
export default Notification;