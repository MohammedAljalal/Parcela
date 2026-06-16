import express from 'express';
const router = express.Router();

import { register, login, getMe } from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import {protect} from '../middleware/auth.middleware.js';

// validate validates data before proceeding to controller
router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

// protect verifies token before proceeding to getMe
router.get('/me', protect, getMe);

export default router;