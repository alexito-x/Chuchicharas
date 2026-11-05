import { Router } from 'express';
import { param } from 'express-validator';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const productIdValidation = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido')
];

const router = Router();

router.use(authenticateToken);

router.get('/', getFavorites);
router.post('/:productId', productIdValidation, validate, addFavorite);
router.delete('/:productId', productIdValidation, validate, removeFavorite);

export default router;
