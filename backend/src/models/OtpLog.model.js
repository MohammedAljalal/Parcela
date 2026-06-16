// src/models/OtpLog.js
// Tracks OTP send attempts per phone for rate limiting.


'use strict';

import { Schema, model } from 'mongoose';
import { OTP } from '../constants/constants';

const otpLogSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
    },
    blockedUntil: {
      // Set when attempts >= OTP.MAX_ATTEMPTS
      type: Date,
      default: null,
    },

    // IP address that requested the last OTP, helps detect distributed attacks
    requestIp: {
      type: String,
      default: null,
    },

    // History of IP addresses used for this phone number to detect abuse
    ipHistory: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────
// Automatically delete documents 24 hours after they were last updated
otpLogSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });
otpLogSchema.index({ requestIp: 1 });

/**
 * Checks whether this phone is currently blocked.
 */
otpLogSchema.methods.isBlocked = function () {
  return this.blockedUntil && this.blockedUntil > new Date();
};

/**
 * Checks whether the phone must wait before requesting another OTP.
 */
otpLogSchema.methods.mustWait = function () {
  if (!this.lastSentAt) return false;
  const waitMs = OTP.RESEND_WAIT_SEC * 1000;
  return Date.now() - this.lastSentAt.getTime() < waitMs;
};

const OtpLog = model('OtpLog', otpLogSchema);
export default OtpLog;