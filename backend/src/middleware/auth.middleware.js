// JWT-based route protection and role-based access control.

import { verifyToken } from '../config/jwt.js';
import { User } from '../models/index.js';
import { sendError } from '../utils/response.js';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'You must be logged in', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'This account is disabled', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    // Forward JWT errors to the central error handler.
    return next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

export { protect, restrictTo };
