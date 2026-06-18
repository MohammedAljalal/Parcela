// Rate limits OTP send requests per IP to prevent abuse.

import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per IP in the window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many OTP requests, please try again later', 429);
  },
});

export default otpRateLimiter;
