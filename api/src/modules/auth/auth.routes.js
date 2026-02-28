import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
} from './auth.schema.js';
import {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    me,
    updateMe,
    changePass,
    googleCallback,
} from './auth.controller.js';

const router = Router();

// ── Public Routes ──
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/google/callback', googleCallback);

// ── Protected Routes ──
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate(updateProfileSchema), updateMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePass);

export default router;
