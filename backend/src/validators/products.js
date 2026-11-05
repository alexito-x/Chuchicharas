import { body, query, param } from 'express-validator';
import { isValidImageSource } from '../utils/imageSource.js';

export const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres'),
  body('shortDescription')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción corta no puede exceder 500 caracteres'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser mayor a 0'),
  body('originalPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El precio original debe ser mayor o igual a 0'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('minStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La alerta de stock debe ser un número entero mayor o igual a 0'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Categoría inválida'),
  body('sku')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('SKU no puede exceder 100 caracteres'),
  body('brand')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Marca no puede exceder 100 caracteres'),
  body('conditionType')
    .optional()
    .isIn(['new', 'used', 'refurbished'])
    .withMessage('Tipo de condición inválido'),
  body('weight')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El peso debe ser mayor o igual a 0'),
  body('dimensions')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensiones no pueden exceder 100 caracteres'),
  body('warranty')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Garantía no puede exceder 255 caracteres'),
  body('shippingFree')
    .optional()
    .isBoolean()
    .withMessage('Envío gratis debe ser true o false'),
  body('shippingCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo de envío debe ser mayor o igual a 0'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Destacado debe ser true o false'),
  body('attributes')
    .optional()
    .isArray()
    .withMessage('Atributos debe ser un array'),
  body('attributes.*.attributeName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre de atributo inválido'),
  body('attributes.*.attributeValue')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Valor de atributo inválido'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Imágenes debe ser un array'),
  body('images.*.imageUrl')
    .optional()
    .custom((value) => isValidImageSource(value))
    .withMessage('URL de imagen inválida o Base64 incompleto'),
  body('images.*.altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texto alternativo no puede exceder 255 caracteres'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary debe ser true o false')
];

export const updateProductValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres'),
  body('shortDescription')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción corta no puede exceder 500 caracteres'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El precio debe ser mayor a 0'),
  body('originalPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El precio original debe ser mayor o igual a 0'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('minStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La alerta de stock debe ser un número entero mayor o igual a 0'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Categoría inválida'),
  body('sku')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('SKU no puede exceder 100 caracteres'),
  body('brand')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Marca no puede exceder 100 caracteres'),
  body('conditionType')
    .optional()
    .isIn(['new', 'used', 'refurbished'])
    .withMessage('Tipo de condición inválido'),
  body('weight')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El peso debe ser mayor o igual a 0'),
  body('dimensions')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dimensiones no pueden exceder 100 caracteres'),
  body('warranty')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Garantía no puede exceder 255 caracteres'),
  body('shippingFree')
    .optional()
    .isBoolean()
    .withMessage('Envío gratis debe ser true o false'),
  body('shippingCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo de envío debe ser mayor o igual a 0'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser true o false'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Destacado debe ser true o false'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Imágenes debe ser un array'),
  body('images.*.imageUrl')
    .optional()
    .custom((value) => isValidImageSource(value))
    .withMessage('URL de imagen inválida o Base64 incompleto'),
  body('images.*.altText')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Texto alternativo no puede exceder 255 caracteres'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary debe ser true o false')
];

export const productQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('category')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Categoría inválida'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio mínimo inválido'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio máximo inválido'),
  query('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Marca inválida'),
  query('condition')
    .optional()
    .isIn(['new', 'used', 'refurbished'])
    .withMessage('Condición inválida'),
  query('onSale')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Filtro de ofertas inválido'),
  query('sortBy')
    .optional()
    .isIn(['price_asc', 'price_desc', 'rating', 'newest', 'best_selling', 'relevance'])
    .withMessage('Ordenamiento inválido'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Término de búsqueda muy largo')
];

export const productIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido')
];

export const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser entre 1 y 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Título no puede exceder 255 caracteres'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comentario no puede exceder 2000 caracteres')
];

export const adminProductQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('Categoría inválida'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('Estado de producto inválido'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('La búsqueda no puede exceder 255 caracteres')
];
