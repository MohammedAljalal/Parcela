// Auth routes: OTP login, Google login, profile read/update, token refresh, logout.
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
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const otpRateLimiter = require('../middleware/otpRateLimiter');
const {
  sendOtpSchema,
  verifyOtpSchema,
  googleAuthSchema,
  updateProfileSchema,
  refreshTokenSchema,
} = require('../validators/auth.validator');

router.post('/otp/send', otpRateLimiter, validate(sendOtpSchema), sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);
router.post('/google', validate(googleAuthSchema), googleAuth);

// Refresh token rotation — public (the token itself is the credential).
router.post('/refresh', validate(refreshTokenSchema), refreshAccessToken);

router.get('/me', protect, getMe);

// PATCH /api/auth/me — updates name, language, notificationsEnabled, avatar.
// Matches the editable fields visible in the Profile screen (Image 9).
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);

router.post('/logout', protect, logout);

module.exports = router;
