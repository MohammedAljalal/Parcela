// Auth routes: OTP login, Google login, profile, logout.

import { Router } from 'express';
import { sendOtp, verifyOtp, googleAuth, getMe, logout } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import otpRateLimiter from '../middleware/otpRateLimiter.js';
import { sendOtpSchema, verifyOtpSchema, googleAuthSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/otp/send', otpRateLimiter, validate(sendOtpSchema), sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);
router.post('/google', validate(googleAuthSchema), googleAuth);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
