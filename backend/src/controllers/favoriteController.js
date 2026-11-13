import { query, queryOne } from '../config/database.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const formatFavorite = (product) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  shortDescription: product.short_description,
  price: parseFloat(product.price),
  originalPrice: product.original_price ? parseFloat(product.original_price) : null,
  stockQuantity: product.stock_quantity,
  brand: product.brand,
  ratingAverage: parseFloat(product.rating_average),
  ratingCount: product.rating_count,
  soldCount: product.sold_count,
  shippingFree: !!product.shipping_free,
  isFeatured: !!product.is_featured,
  conditionType: product.condition_type,
  category: {
    name: product.category_name,
    slug: product.category_slug
  },
  primaryImage: product.primary_image,
  favoritedAt: product.favorited_at
});

const getFavoriteRows = (userId) =>
  query(
    `SELECT v.*, w.created_at AS favorited_at
     FROM wishlist w
     INNER JOIN view_products_with_details v ON v.id = w.product_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );

const getFavoritesPayload = async (userId) => {
  const rows = await getFavoriteRows(userId);
  return rows.map(formatFavorite);
};

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await getFavoritesPayload(req.user.id);
    res.json({
      success: true,
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const product = await queryOne(
      'SELECT id FROM view_products_with_details WHERE id = ?',
      [productId]
    );

    if (!product) {
      throw new NotFoundError('Producto');
    }

    await query(
      `INSERT INTO wishlist (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [req.user.id, productId]
    );

    const favorites = await getFavoritesPayload(req.user.id);
    res.json({
      success: true,
      message: 'Producto agregado a favoritos',
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    await query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    const favorites = await getFavoritesPayload(req.user.id);
    res.json({
      success: true,
      message: 'Producto eliminado de favoritos',
      data: { favorites }
    });
  } catch (error) {
    next(error);
  }
};
