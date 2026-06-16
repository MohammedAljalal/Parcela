import jwt from 'jsonwebtoken';
import env from './env.js';

const generateToken = (payload) => {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  // No try-catch here so the error reaches errorHandler with its original type
  return jwt.verify(token, env.JWT_SECRET);
};

export { generateToken, verifyToken };