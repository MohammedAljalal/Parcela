// Generates a unique order number, e.g. PC-98234.
'use strict';

const crypto = require('crypto');

const generateOrderNumber = () => {
  const randomDigits = crypto.randomInt(10000, 99999);
  return `PC-${randomDigits}`;
};

module.exports = generateOrderNumber;
