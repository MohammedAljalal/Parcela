// Optional authentication: attaches req.user if a valid token is present,
// but never rejects the request. Useful for public routes with slightly
// different behavior for logged-in users (e.g. admins).

import { verifyToken } from '../config/jwt.js';
import { User } from '../models/index.js';

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Invalid/expired token: continue without req.user.
    next();
  }
};

export default optionalAuth;
