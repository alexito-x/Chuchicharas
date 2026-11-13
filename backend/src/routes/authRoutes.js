import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation
} from '../validators/auth.js';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshTokenValidation, validate, refreshToken);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, validate, updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, validate, changePassword);

export default router;