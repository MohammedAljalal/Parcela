// Tracks OTP send attempts per phone for rate limiting / abuse detection.

import { Schema, model } from 'mongoose';
import { OTP } from '../config/constants.js';

const otpLogSchema = new Schema(
  {
    identifier: { type: String, required: true, unique: true, trim: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    blockedUntil: { type: Date, default: null },
    requestIp: { type: String, default: null },
    ipHistory: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Auto-delete 24h after last update.
otpLogSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });
otpLogSchema.index({ requestIp: 1 });

otpLogSchema.methods.isBlocked = function () {
  return this.blockedUntil && this.blockedUntil > new Date();
};

otpLogSchema.methods.mustWait = function () {
  if (!this.lastSentAt) return false;
  const waitMs = OTP.RESEND_WAIT_SEC * 1000;
  return Date.now() - this.lastSentAt.getTime() < waitMs;
};

export default model('OtpLog', otpLogSchema);
