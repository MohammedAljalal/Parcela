// src/models/User.js


'use strict';

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, LANGUAGES, OTP } from '../constants/constants.js';

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // allows multiple null values (unique only among non-null)
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
      default: '',
      select: false,
    },

    // ── FCM Push Token ────────────────────────────────────
    fcmToken: {
      type: String,
      default: null,
      select: false, // never leak in API responses
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },

    // ── OAuth ─────────────────────────────────────────────
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // ── OTP (Phone login) ─────────────────────────────────
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },

    // ── JWT Refresh Token ─────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },

    // ── Preferences ───────────────────────────────────────
    preferredIsland: {
      type: Schema.Types.ObjectId,
      ref: 'Island',
    },
    preferredLanguage: {
      type: String,
      enum: Object.values(LANGUAGES),
      default: LANGUAGES.PT,
    },

    // Enable or disable user-level notifications
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // ── Email Verification ────────────────────────────────
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // ── Status ────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last login time, useful for analytics and detecting inactive accounts
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });

// ─── Virtual: initials ────────────────────────────────────────
userSchema.virtual('initials').get(function () {
  if (!this.name) return '?';
  return this.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// ─── Pre-save: hash password ──────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare password ───────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: OTP validity ───────────────────────────
userSchema.methods.isOtpValid = function (code) {
  return (
    this.otp?.code === code &&
    this.otp?.expiresAt > new Date() &&
    this.otp?.attempts < OTP.MAX_ATTEMPTS
  );
};

const User = model('User', userSchema);
export default User;