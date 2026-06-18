// Authentication: phone+OTP login, Google OAuth, profile, logout.

import { OAuth2Client } from 'google-auth-library';
import { User, OtpLog } from '../models/index.js';
import { generateToken } from '../config/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendOtpSms } from '../lib/smsProvider.js';
import generateOtp from '../utils/generateOtp.js';
import { OTP } from '../config/constants.js';
import env from '../config/env.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const createSendToken = (res, user, statusCode, message) => {
  const token = generateToken({ id: user._id, role: user.role });
  return sendSuccess(res, { token, user }, message, statusCode);
};

// POST /api/auth/otp/send
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    let otpLog = await OtpLog.findOne({ identifier: phone });
    if (!otpLog) otpLog = await OtpLog.create({ identifier: phone });

    if (otpLog.isBlocked()) {
      return sendError(res, 'This number is temporarily blocked, try again later', 429);
    }

    if (otpLog.mustWait()) {
      return sendError(res, `Please wait ${OTP.RESEND_WAIT_SEC} seconds before requesting a new code`, 429);
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP.EXPIRES_IN_MIN * 60 * 1000);

    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone });

    user.otp = { code, expiresAt, attempts: 0 };
    await user.save();

    await sendOtpSms(phone, code);

    otpLog.attempts += 1;
    otpLog.lastSentAt = new Date();
    otpLog.requestIp = req.ip;

    if (otpLog.attempts >= OTP.MAX_SEND_PER_WINDOW) {
      otpLog.blockedUntil = new Date(Date.now() + OTP.BLOCK_DURATION_MIN * 60 * 1000);
    }

    await otpLog.save();

    return sendSuccess(res, { expiresIn: OTP.EXPIRES_IN_MIN * 60 }, 'Code sent successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/otp/verify
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, code, name } = req.body;

    const user = await User.findOne({ phone }).select('+otp.code +otp.expiresAt +otp.attempts');

    if (!user) {
      return sendError(res, 'No verification request found for this number', 404);
    }

    if (user.otp.attempts >= OTP.MAX_ATTEMPTS) {
      return sendError(res, 'Too many attempts, request a new code', 429);
    }

    const isValid = user.isOtpValid(code);

    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();
      return sendError(res, 'Invalid or expired code', 401);
    }

    const isNewUser = !user.name;

    if (isNewUser) {
      if (!name) {
        return sendError(res, 'Name is required to complete account creation', 422, [
          'Send name with the verify request for a new user',
        ]);
      }
      user.name = name;
    }

    user.otp = { code: null, expiresAt: null, attempts: 0 };
    user.isVerified = true;
    user.lastLoginAt = new Date();

    await user.save();

    createSendToken(res, user, 200, isNewUser ? 'Account created and logged in' : 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        user.googleId = googleId;
      } else {
        user = await User.create({
          googleId,
          email,
          name,
          avatar: picture || '',
          isVerified: true,
          emailVerified: true,
        });
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    createSendToken(res, user, 200, 'Logged in successfully');
  } catch (error) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return sendError(res, 'Google token is invalid or expired', 401);
    }
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user }, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    req.user.fcmToken = null;
    await req.user.save();
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export { sendOtp, verifyOtp, googleAuth, getMe, logout };
