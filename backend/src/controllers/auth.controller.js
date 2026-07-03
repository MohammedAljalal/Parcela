// Authentication: phone+OTP login, email+password login/register, Google OAuth, profile, logout, token refresh.
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
const { uploadImage, deleteImage } = require('../lib/cloudinary');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Helpers

const issueTokenPair = (user) => {
  const accessToken = generateToken({ id: user._id, role: user.role });
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  user.refreshToken = refreshTokenHash;
  return { accessToken, rawRefreshToken };
};

// OTP

// POST /api/auth/otp/send
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    let otpLog = await OtpLog.findOneAndUpdate(
      { identifier: phone },
      { $setOnInsert: { identifier: phone } },
      { upsert: true, new: true }
    );

    if (otpLog.isBlocked()) return sendError(res, 'This number is temporarily blocked, try again later', 429);
    if (otpLog.mustWait()) return sendError(res, `Please wait ${OTP.RESEND_WAIT_SEC} seconds before requesting a new code`, 429);

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP.EXPIRES_IN_MIN * 60 * 1000);

    let user = await User.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone } },
      { upsert: true, new: true }
    );

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

    if (!user) return sendError(res, 'No verification request found for this number', 404);
    if (user.otp.attempts >= OTP.MAX_ATTEMPTS) return sendError(res, 'Too many attempts, request a new code', 429);

    const isValid = user.isOtpValid(code);
    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();
      return sendError(res, 'Invalid or expired code', 401);
    }

    const isNewUser = !user.name;
    if (isNewUser) {
      if (!name) return sendError(res, 'Name is required to complete account creation', 422, ['Send name with verify request']);
      user.name = name;
    }

    user.otp = { code: null, expiresAt: null, attempts: 0 };
    user.isVerified = true;
    user.lastLoginAt = new Date();

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

// Email / Password Auth

// POST /api/auth/register
const registerWithEmail = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'An account with this email already exists', 400);

    const user = await User.create({
      name,
      email,
      password,
      isVerified: true,
      emailVerified: true,
      lastLoginAt: new Date(),
    });

    const { accessToken, rawRefreshToken } = issueTokenPair(user);
    await user.save();

    return sendSuccess(
      res,
      { token: accessToken, refreshToken: rawRefreshToken, user },
      'Account created and logged in',
      201
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const loginWithEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return sendError(res, 'Invalid email or password', 401);
    if (!user.isActive) return sendError(res, 'Your account has been deactivated', 403);

    const isValid = await user.comparePassword(password);
    if (!isValid) return sendError(res, 'Invalid email or password', 401);

    user.lastLoginAt = new Date();
    const { accessToken, rawRefreshToken } = issueTokenPair(user);
    await user.save();

    return sendSuccess(
      res,
      { token: accessToken, refreshToken: rawRefreshToken, user },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Google OAuth

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    let payload;

    // Support both Google ID Tokens (JWTs) and Google Access Tokens (ya29...)
    if (idToken.startsWith('ya29.')) {
      // It's an Access Token, fetch profile from Google UserInfo endpoint
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
      if (!response.ok) {
        throw new Error('Invalid Google access token');
      }
      payload = await response.json();
    } else {
      // It's an ID Token (JWT), verify it
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
      } else {
        user = await User.create({ googleId, email, name, avatar: picture || '', isVerified: true, emailVerified: true });
      }
    }

    user.lastLoginAt = new Date();
    const { accessToken, rawRefreshToken } = issueTokenPair(user);
    await user.save();

    return sendSuccess(res, { token: accessToken, refreshToken: rawRefreshToken, user }, 'Logged in successfully');
  } catch (error) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token') || error.message?.includes('Invalid Google access token')) {
      return sendError(res, 'Google token is invalid or expired', 401);
    }
    next(error);
  }
};

// Profile

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
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferredLanguage, notificationsEnabled, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    if (name !== undefined) user.name = name;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (notificationsEnabled !== undefined) {
      user.notificationsEnabled = notificationsEnabled === 'true' || notificationsEnabled === true;
    }
    
    // If a file is uploaded, handle it via Cloudinary
    if (req.file) {
      if (user.avatar && user.avatar.includes('cloudinary')) {
        const publicId = user.avatar.split('/').pop().split('.')[0];
        try {
          await deleteImage(`parcela/avatars/${publicId}`);
        } catch (err) {
          console.warn('Failed to delete old avatar:', err);
        }
      }
      const result = await uploadImage(req.file.buffer, 'avatars');
      user.avatar = result.secure_url;
    } else if (avatar !== undefined) {
      // Allow clearing or setting URL directly if no file
      user.avatar = avatar;
    }

    await user.save();
    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// Token & Logout

// POST /api/auth/refresh
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const user = await User.findOne({ refreshToken: tokenHash }).select('+refreshToken +previousRefreshTokens');

    if (!user) {
      // REUSE DETECTION: Check if token was previously used
      const compromisedUser = await User.findOne({ previousRefreshTokens: tokenHash });
      if (compromisedUser) {
        // Token was stolen/reused! Revoke everything immediately.
        compromisedUser.refreshToken = null;
        compromisedUser.previousRefreshTokens = [];
        await compromisedUser.save();
        return sendError(res, 'Security alert: Token reuse detected. All sessions terminated. Please log in again.', 401);
      }
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    if (!user.isActive) return sendError(res, 'Your account has been deactivated', 403);

    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    
    // Push the current token to used list and rotate
    user.previousRefreshTokens.push(tokenHash);
    if (user.previousRefreshTokens.length > 50) {
      user.previousRefreshTokens.shift(); // Keep array size manageable
    }
    user.refreshToken = newTokenHash;
    await user.save();

    const accessToken = generateToken({ id: user._id, role: user.role });
    return sendSuccess(res, { token: accessToken, refreshToken: newRawRefreshToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    req.user.fcmToken = null;
    req.user.refreshToken = null;
    req.user.previousRefreshTokens = [];
    await req.user.save();
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  googleAuth,
  getMe,
  updateProfile,
  refreshAccessToken,
  logout,
  registerWithEmail,
  loginWithEmail,
};
