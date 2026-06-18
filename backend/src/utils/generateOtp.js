// Generates a secure random numeric OTP code.
'use strict';

const crypto = require('crypto');
const { OTP } = require('../config/constants');

const generateOtp = () => {
  const max = 10 ** OTP.LENGTH;
  const randomNumber = crypto.randomInt(0, max);
  return randomNumber.toString().padStart(OTP.LENGTH, '0');
};

module.exports = generateOtp;
