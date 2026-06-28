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
  if (env.TWILIO_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    try {
      const twilioClient = require('twilio')(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        body: `Seu código de verificação Parcela é: ${code}`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      return { success: true, simulated: false };
    } catch (err) {
      console.error('[SMS ERROR] Twilio failed:', err.message);
      throw new Error('Falha ao enviar SMS. Tente novamente.');
    }
  }

  throw new Error('SMS provider is not configured for production. Please add TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
};

module.exports = { sendOtpSms };
