// Auth routes: OTP login, Google login, profile, logout.
'use strict';

const express = require('express');
const router = express.Router();

const { sendOtp, verifyOtp, googleAuth, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const otpRateLimiter = require('../middleware/otpRateLimiter');
const { sendOtpSchema, verifyOtpSchema, googleAuthSchema } = require('../validators/auth.validator');

router.post('/otp/send', otpRateLimiter, validate(sendOtpSchema), sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);
router.post('/google', validate(googleAuthSchema), googleAuth);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
