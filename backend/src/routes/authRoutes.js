import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const emailRule = body('email').trim().isEmail().normalizeEmail();
const passwordRule = body('password').isString().isLength({ min: 8, max: 128 });

router.post('/register', authLimiter, emailRule, passwordRule, register);
router.post('/login', authLimiter, emailRule, passwordRule, login);
router.post('/logout', logout);

export default router;
