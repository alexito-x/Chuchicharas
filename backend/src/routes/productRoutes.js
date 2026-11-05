import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getCategoryShowcase,
  searchSuggestions,
  getBrands,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createProductValidation,
  updateProductValidation,
  productQueryValidation,
  adminProductQueryValidation,
  productIdValidation
} from '../validators/products.js';

const router = Router();

router.get('/', productQueryValidation, validate, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category-showcase', getCategoryShowcase);
router.get('/brands', getBrands);
router.get('/search/suggestions', searchSuggestions);
router.get('/admin/all', authenticateToken, requireRole('admin'), adminProductQueryValidation, validate, getAdminProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', productIdValidation, validate, getProductById);
router.get('/:id/related', productIdValidation, validate, getRelatedProducts);
router.post('/', authenticateToken, requireRole('admin'), createProductValidation, validate, createProduct);
router.put('/:id', authenticateToken, requireRole('admin'), updateProductValidation, validate, updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin'), productIdValidation, validate, deleteProduct);

export default router;