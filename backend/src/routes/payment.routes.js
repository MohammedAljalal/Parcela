// Payment routes. Webhook is intentionally public (HMAC-verified instead of JWT).

import { Router } from 'express';
import { initiatePayment, handleWebhook, getPaymentStatus } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { initiatePaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.post('/webhook', handleWebhook);

router.post('/initiate', protect, validate(initiatePaymentSchema), initiatePayment);
router.get('/status/:orderId', protect, getPaymentStatus);

export default router;
