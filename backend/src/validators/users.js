import { body, param, query } from 'express-validator';

export const userIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de usuario inválido')
];

export const userQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('Estado inválido'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('La búsqueda no puede exceder 255 caracteres')
];

export const updateUserValidation = [
  ...userIdValidation,
  body('firstName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('lastName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
  body('phone').optional({ values: 'falsy' }).matches(/^[+0-9()\-\s]{6,20}$/).withMessage('Teléfono inválido'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido'),
  body('isActive').optional().isBoolean().withMessage('Estado debe ser true o false')
];
