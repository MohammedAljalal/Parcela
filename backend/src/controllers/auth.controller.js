// Authentication: phone+OTP login, Google OAuth, profile read/update, logout, token refresh.
'use strict';

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, OtpLog } = require('../models');
const { generateToken } = require('../config/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { sendOtpSms } = require('../lib/smsProvider');
const generateOtp = require('../utils/generateOtp');
const { OTP } = require('../config/constants');
const env = require('../config/env');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Generates a new access+refresh token pair and sets the refresh token hash on the user.
// Returns { accessToken, rawRefreshToken } — caller must save the user after this.
const issueTokenPair = (user) => {
  const accessToken = generateToken({ id: user._id, role: user.role });
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  user.refreshToken = refreshTokenHash;
  return { accessToken, rawRefreshToken };
};

const createSendToken = (res, user, statusCode, message) => {
  const { accessToken, rawRefreshToken } = issueTokenPair(user);
  // refreshToken is returned once here; client should store it securely (e.g. httpOnly cookie or secure storage).
  return sendSuccess(res, { token: accessToken, refreshToken: rawRefreshToken, user }, message, statusCode);
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

    // issueTokenPair sets user.refreshToken hash; save before sending response.
    const { accessToken, rawRefreshToken } = issueTokenPair(user);
    await user.save();

    return sendSuccess(
      res,
      { token: accessToken, refreshToken: rawRefreshToken, user },
      isNewUser ? 'Account created and logged in' : 'Logged in successfully'
    );
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
    // issueTokenPair sets user.refreshToken hash; save before sending response.
    const { accessToken, rawRefreshToken } = issueTokenPair(user);
    await user.save();

    return sendSuccess(
      res,
      { token: accessToken, refreshToken: rawRefreshToken, user },
      'Logged in successfully'
    );
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

// PATCH /api/auth/me
// Updates the editable profile fields visible in Image 9: name, language,
// notificationsEnabled, avatar. Phone is changed via a separate OTP flow
// (not implemented here), and role is never user-editable.
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferredLanguage, notificationsEnabled, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    // Only update fields that were actually sent.
    if (name !== undefined) user.name = name;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
// Rotates a refresh token: verifies the stored hash, issues new access + refresh tokens.
// The refreshToken field already exists on the User schema but was previously unused.
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Hash the incoming token before comparing with the stored hash.
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const user = await User.findOne({ refreshToken: tokenHash }).select('+refreshToken');

    if (!user || !user.isActive) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    // Rotate: generate a new refresh token and store its hash.
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');

    user.refreshToken = newTokenHash;
    await user.save();

    const accessToken = generateToken({ id: user._id, role: user.role });

    return sendSuccess(
      res,
      { token: accessToken, refreshToken: newRawRefreshToken },
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    // Invalidate refresh token on logout so it cannot be reused.
    req.user.fcmToken = null;
    req.user.refreshToken = null;
    await req.user.save();
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendOtp, verifyOtp, googleAuth, getMe, updateProfile, refreshAccessToken, logout };
