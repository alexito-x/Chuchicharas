import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { addToCartValidation, updateCartValidation, cartIdValidation } from '../validators/cart.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/', addToCartValidation, validate, addToCart);
router.put('/:productId', updateCartValidation, validate, updateCartItem);
router.delete('/:productId', cartIdValidation, validate, removeFromCart);
router.delete('/', clearCart);

export default router;