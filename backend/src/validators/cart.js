import { body, param } from 'express-validator';

export const addToCartValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage('Cantidad debe ser entre 1 y 99')
];

export const updateCartValidation = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('quantity')
    .isInt({ min: 0, max: 99 })
    .withMessage('Cantidad debe ser entre 0 y 99')
];

export const cartIdValidation = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido')
];