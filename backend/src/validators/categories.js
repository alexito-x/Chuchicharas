import { body, param, query } from 'express-validator';
import { isValidImageSource } from '../utils/imageSource.js';

export const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('imageUrl')
    .optional()
    .custom((value) => isValidImageSource(value))
    .withMessage('URL de imagen inválida o Base64 incompleto'),
  body('parentId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Categoría padre inválida'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Orden debe ser un número entero mayor o igual a 0')
];

export const updateCategoryValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de categoría inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('imageUrl')
    .optional()
    .custom((value) => isValidImageSource(value))
    .withMessage('URL de imagen inválida o Base64 incompleto'),
  body('parentId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Categoría padre inválida'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Orden debe ser un número entero mayor o igual a 0'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser true o false')
];

export const categoryQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('parentId')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Categoría padre inválida'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser true o false')
];

export const categoryIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de categoría inválido')
];