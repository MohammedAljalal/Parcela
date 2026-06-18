// Generates a unique order number, e.g. PC-98234.

import crypto from 'crypto';

const generateOrderNumber = () => {
  const randomDigits = crypto.randomInt(10000, 99999);
  return `PC-${randomDigits}`;
};

export default generateOrderNumber;
