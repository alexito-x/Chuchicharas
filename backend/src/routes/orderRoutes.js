import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  simulatePayment,
  getAdminOrders,
  updateOrderStatus,
  getOrderStats
} from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createOrderValidation,
  orderIdValidation,
  orderQueryValidation,
  updateOrderStatusValidation
} from '../validators/orders.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createOrderValidation, validate, createOrder);
router.get('/', orderQueryValidation, validate, getOrders);
router.get('/admin/all', requireRole('admin'), orderQueryValidation, validate, getAdminOrders);
router.get('/admin/stats', requireRole('admin'), getOrderStats);
router.get('/:id', orderIdValidation, validate, getOrderById);
router.post('/:id/cancel', orderIdValidation, validate, cancelOrder);
router.post('/:id/pay', orderIdValidation, validate, simulatePayment);
router.put('/:id/status', requireRole('admin'), updateOrderStatusValidation, validate, updateOrderStatus);

export default router;