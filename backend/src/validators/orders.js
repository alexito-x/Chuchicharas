import { body, param, query } from 'express-validator';

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('El pedido debe tener al menos un producto'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Cantidad debe ser entre 1 y 99'),
  body('shippingAddress')
    .isObject()
    .withMessage('Dirección de envío requerida'),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener al menos 2 caracteres'),
  body('shippingAddress.phone')
    .optional({ values: 'falsy' })
    .matches(/^[+0-9()\-\s]{6,20}$/)
    .withMessage('Teléfono inválido (mínimo 6 dígitos)'),
  body('shippingAddress.addressLine1')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('La dirección debe tener al menos 5 caracteres'),
  body('shippingAddress.addressLine2')
    .optional()
    .trim()
    .isLength({ max: 255 }),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ciudad debe tener al menos 2 caracteres'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El estado debe tener al menos 2 caracteres'),
  body('shippingAddress.postalCode')
    .trim()
    .matches(/^[0-9]{5}$/)
    .withMessage('El código postal debe tener 5 dígitos'),
  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('País inválido'),
  body('billingAddress')
    .optional()
    .isObject()
    .withMessage('Dirección de facturación inválida'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'mercadopago', 'transfer', 'cash_on_delivery'])
    .withMessage('Método de pago inválido'),
  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Código de cupón inválido'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas no pueden exceder 1000 caracteres')
];

export const orderIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de pedido inválido')
];

export const orderQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite debe ser entre 1 y 50'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Estado inválido'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida')
];

export const updateOrderStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de pedido inválido'),
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Estado inválido'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Número de seguimiento inválido'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas no pueden exceder 1000 caracteres')
];