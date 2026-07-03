// Auth routes: email/password login+register, OTP login, Google login, profile, token refresh, logout.
'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

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
const upload = require('../middleware/upload.middleware.js');
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
router.post('/login', loginLimiter, validate(loginEmailSchema), loginWithEmail);

// ── OTP Auth ─────────────────────────────────────────────────────────────────
router.post('/otp/send',   otpRateLimiter, validate(sendOtpSchema),    sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);

// ── Google Auth ───────────────────────────────────────────────────────────────
router.post('/google', validate(googleAuthSchema), googleAuth);

// ── Token Rotation ────────────────────────────────────────────────────────────
router.post('/refresh', validate(refreshTokenSchema), refreshAccessToken);

// ── Protected Profile Routes ──────────────────────────────────────────────────
router.get('/me',      protect, getMe);
router.patch('/me',    protect, upload.single('avatar'), validate(updateProfileSchema), updateProfile);
router.post('/logout', protect, logout);

module.exports = router;
