// Generates a secure random numeric OTP code.

import crypto from 'crypto';
import { OTP } from '../config/constants.js';

const generateOtp = () => {
  const max = 10 ** OTP.LENGTH;
  const randomNumber = crypto.randomInt(0, max);
  return randomNumber.toString().padStart(OTP.LENGTH, '0');
};

export default generateOtp;
