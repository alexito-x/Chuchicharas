import { Router } from 'express';
import {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createCategoryValidation,
  updateCategoryValidation,
  categoryQueryValidation,
  categoryIdValidation
} from '../validators/categories.js';

const router = Router();

router.get('/', categoryQueryValidation, validate, getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', categoryIdValidation, validate, getCategoryById);

router.post('/', authenticateToken, requireRole('admin'), createCategoryValidation, validate, createCategory);
router.put('/:id', authenticateToken, requireRole('admin'), updateCategoryValidation, validate, updateCategory);
router.delete('/:id', authenticateToken, requireRole('admin'), categoryIdValidation, validate, deleteCategory);

export default router;