import { body, param, query } from 'express-validator';

export const reviewIdValidation = [
  param('reviewId').isInt({ min: 1 }).withMessage('ID de reseña inválido')
];

export const productReviewQueryValidation = [
  ...[query('page').optional().isInt({ min: 1 }).withMessage('Página inválida')],
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Calificación inválida')
];

export const adminReviewQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('isApproved').optional().isIn(['true', 'false']).withMessage('Estado de aprobación inválido'),
  query('productId').optional().isInt({ min: 1 }).withMessage('ID de producto inválido')
];

export const updateReviewValidation = [
  ...reviewIdValidation,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),
  body('title').optional({ values: 'null' }).isString().trim().isLength({ max: 255 }).withMessage('Título inválido'),
  body('comment').optional({ values: 'null' }).isString().trim().isLength({ max: 2000 }).withMessage('Comentario inválido')
];

export const moderateReviewValidation = [
  ...reviewIdValidation,
  body('isApproved').isBoolean().withMessage('El estado de aprobación debe ser booleano')
];
