import User from '../models/user.model.js';
import { verifyToken } from '../config/jwt.js';
import { sendError } from '../utils/response.js';


const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

   // here we check if the Authorization header is present and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'You must be logged in', 401);
    }

    // extract the token from the header (the part after "Bearer ")
    const token = authHeader.split(' ')[1];

    // verifyToken will throw an error if the token is invalid or expired, which will be caught by the catch block
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    // check if the user is active (not disabled)
    if (!user.isActive) {
      return sendError(res, 'This account is disabled', 403);
    }

    // attach the user object to the request so that it can be accessed in the next middleware or route handler
    req.user = user;

    next();
  } catch (error) {
    // 
    return next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Verify that the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

export { protect, restrictTo };