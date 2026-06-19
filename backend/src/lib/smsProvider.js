// SMS sending abstraction. Simulated in development, replace with a real
// provider (e.g. Twilio) in production without touching calling code.
'use strict';

const env = require('../config/env');

const sendOtpSms = async (phone, code) => {
  if (env.NODE_ENV === 'development') {
    console.log(`[SMS SIMULATED] To ${phone}: your code is ${code}`);
    return { success: true, simulated: true };
  }

  // Production: integrate a real SMS provider here.
  // const twilioClient = require('twilio')(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
  // await twilioClient.messages.create({ body: `Code: ${code}`, from: ..., to: phone });

  throw new Error('SMS provider is not configured for production');
};

module.exports = { sendOtpSms };
