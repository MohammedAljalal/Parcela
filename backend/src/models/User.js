// User account: phone+OTP login, Google OAuth, or email+password.
'use strict';

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, LANGUAGES, OTP } = require('../config/constants');

const userSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, trim: true, sparse: true, unique: true },
    password: { type: String, select: false },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '', select: false },

    fcmToken: { type: String, default: null, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER },

    googleId: { type: String, sparse: true, unique: true },

    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },

    refreshToken: {
      // Stores SHA-256 hash of the raw refresh token, never the token itself.
      // Rotated on every /api/auth/refresh call and cleared on logout.
      type: String,
      select: false,
    },

    preferredIsland: { type: Schema.Types.ObjectId, ref: 'Island' },
    preferredLanguage: { type: String, enum: Object.values(LANGUAGES), default: LANGUAGES.PT },
    notificationsEnabled: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
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

userSchema.index({ role: 1, isActive: 1 });

userSchema.virtual('initials').get(function () {
  if (!this.name) return '?';
  return this.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isOtpValid = function (code) {
  return (
    this.otp?.code === code &&
    this.otp?.expiresAt > new Date() &&
    this.otp?.attempts < OTP.MAX_ATTEMPTS
  );
};

module.exports = model('User', userSchema);
