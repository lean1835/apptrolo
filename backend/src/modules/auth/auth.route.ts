import { Router } from 'express';
import { validate } from '@common/middlewares/validate.middleware';
import { authenticationMiddleware } from '@common/middlewares/authen.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';
import {
  register,
  authenticate,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from './auth.controller';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/authenticate', validate(loginSchema), authenticate);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected routes (require authenticationMiddleware)
router.get('/me', authenticationMiddleware, getMe);
router.post('/update', authenticationMiddleware, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticationMiddleware, validate(changePasswordSchema), changePassword);

export default router;
