// JWT sign/verify helpers.
'use strict';

const jwt = require('jsonwebtoken');
const env = require('./env');

const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

// No try/catch here - let caller decide how to handle invalid/expired tokens.
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
