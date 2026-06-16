import User from '../models/user.model.js';
import { generateToken } from '../config/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Internal function used in registration and login to avoid code duplication
const createSendToken = (res, user, statusCode, message) => {
  const token = generateToken({ id: user._id, role: user.role });

  return sendSuccess(
    res,
    { token, user },
    message,
    statusCode
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email exists before creation to send a clear message
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email is already registered', 409);
    }

    // Password is automatically hashed in pre-save hook inside the model
    const user = await User.create({ name, email, password });

    createSendToken(res, user, 201, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly fetch the password because it is hidden with select: false in the model
    const user = await User.findOne({ email }).select('+password');

    // Send the same message for both cases so attackers cannot guess registered emails
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is disabled, contact support', 403);
    }

    // Save the last login time without re-validating other fields
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(res, user, 200, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // Fetch the user from the database to ensure latest data
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user }, 'Data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export  { register, login, getMe };