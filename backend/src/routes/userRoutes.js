import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats
} from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { userIdValidation, userQueryValidation, updateUserValidation } from '../validators/users.js';

const router = Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/', userQueryValidation, validate, getUsers);
router.get('/:id', userIdValidation, validate, getUserById);
router.put('/:id', updateUserValidation, validate, updateUser);
router.delete('/:id', userIdValidation, validate, deleteUser);

export default router;