// Auth routes: email/password login+register, OTP login, Google login, profile, token refresh, logout.
'use strict';

const express = require('express');
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  googleAuth,
  getMe,
  updateProfile,
  refreshAccessToken,
  logout,
  registerWithEmail,
  loginWithEmail,
} = require('../controllers/auth.controller.js');
const { protect } = require('../middleware/auth.middleware.js');
const validate = require('../middleware/validate.js');
const otpRateLimiter = require('../middleware/otpRateLimiter.js');
const {
  sendOtpSchema,
  verifyOtpSchema,
  googleAuthSchema,
  updateProfileSchema,
  refreshTokenSchema,
  registerEmailSchema,
  loginEmailSchema,
} = require('../validators/auth.validator.js');

// ── Email / Password Auth ────────────────────────────────────────────────────
router.post('/register', validate(registerEmailSchema), registerWithEmail);
router.post('/login',    validate(loginEmailSchema),    loginWithEmail);

// ── OTP Auth ─────────────────────────────────────────────────────────────────
router.post('/otp/send',   otpRateLimiter, validate(sendOtpSchema),    sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);

// ── Google Auth ───────────────────────────────────────────────────────────────
router.post('/google', validate(googleAuthSchema), googleAuth);

// ── Token Rotation ────────────────────────────────────────────────────────────
router.post('/refresh', validate(refreshTokenSchema), refreshAccessToken);

// ── Protected Profile Routes ──────────────────────────────────────────────────
router.get('/me',      protect, getMe);
router.patch('/me',    protect, validate(updateProfileSchema), updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
