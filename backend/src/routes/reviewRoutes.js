import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAdminReviews,
  moderateReview
} from '../controllers/reviewController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { reviewValidation, productIdValidation } from '../validators/products.js';
import { adminReviewQueryValidation, productReviewQueryValidation, updateReviewValidation, reviewIdValidation, moderateReviewValidation } from '../validators/reviews.js';

const router = Router();

router.get('/product/:id', productIdValidation, productReviewQueryValidation, validate, getProductReviews);
router.post('/product/:id', authenticateToken, productIdValidation, reviewValidation, validate, createReview);
router.put('/:reviewId', authenticateToken, updateReviewValidation, validate, updateReview);
router.delete('/:reviewId', authenticateToken, reviewIdValidation, validate, deleteReview);

router.get('/admin/all', authenticateToken, requireRole('admin'), adminReviewQueryValidation, validate, getAdminReviews);
router.put('/admin/:reviewId/moderate', authenticateToken, requireRole('admin'), moderateReviewValidation, validate, moderateReview);

export default router;