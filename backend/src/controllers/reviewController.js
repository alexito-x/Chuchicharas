import { query, queryOne, transaction } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

export const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let whereConditions = ['r.product_id = ?', 'r.is_approved = TRUE'];
    const params = [id];
    
    if (rating) {
      whereConditions.push('r.rating = ?');
      params.push(rating);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const reviews = await query(dataSql, params);
    
    const ratingDistribution = await query(
      'SELECT rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND is_approved = TRUE GROUP BY rating',
      [id]
    );
    
    const formattedReviews = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: r.is_verified_purchase,
      helpfulCount: r.helpful_count,
      createdAt: r.created_at,
      user: {
        firstName: r.first_name,
        lastName: r.last_name.charAt(0) + '.'
      }
    }));
    
    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        ratingDistribution: ratingDistribution.reduce((acc, r) => {
          acc[r.rating] = r.count;
          return acc;
        }, {}),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    
    const product = await queryOne('SELECT id FROM products WHERE id = ? AND is_active = TRUE', [id]);
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    const existingReview = await queryOne(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingReview) {
      throw new AppError('Ya has reseñado este producto', 409, 'REVIEW_EXISTS');
    }
    
    const verifiedPurchase = await queryOne(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.payment_status = 'paid' AND o.status NOT IN ('cancelled', 'refunded')
       LIMIT 1`,
      [id, userId]
    );
    
    const result = await query(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified_purchase)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, null, rating, title || null, comment || null, !!verifiedPurchase]
    );
    
    const review = await queryOne(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Reseña creada correctamente',
      data: {
        review: {
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          isVerifiedPurchase: review.is_verified_purchase,
          createdAt: review.created_at,
          user: {
            firstName: review.first_name,
            lastName: review.last_name.charAt(0) + '.'
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    
    const review = await queryOne('SELECT * FROM reviews WHERE id = ? AND user_id = ?', [reviewId, userId]);
    if (!review) {
      throw new NotFoundError('Reseña');
    }
    
    await query(
      'UPDATE reviews SET rating = ?, title = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [rating, title || null, comment || null, reviewId]
    );
    
    const updatedReview = await queryOne(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reviewId]
    );
    
    res.json({
      success: true,
      message: 'Reseña actualizada correctamente',
      data: {
        review: {
          id: updatedReview.id,
          rating: updatedReview.rating,
          title: updatedReview.title,
          comment: updatedReview.comment,
          isVerifiedPurchase: updatedReview.is_verified_purchase,
          createdAt: updatedReview.created_at,
          user: {
            firstName: updatedReview.first_name,
            lastName: updatedReview.last_name.charAt(0) + '.'
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { reviewId } = req.params;
    
    const review = await queryOne(
      `SELECT * FROM reviews WHERE id = ? ${!isAdmin ? 'AND user_id = ?' : ''}`,
      isAdmin ? [reviewId] : [reviewId, userId]
    );
    
    if (!review) {
      throw new NotFoundError('Reseña');
    }
    
    await query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    
    res.json({
      success: true,
      message: 'Reseña eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isApproved, productId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let whereConditions = ['1=1'];
    const params = [];
    
    if (isApproved !== undefined) {
      whereConditions.push('r.is_approved = ?');
      params.push(isApproved === 'true');
    }
    
    if (productId) {
      whereConditions.push('r.product_id = ?');
      params.push(productId);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT r.*, p.name as product_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const reviews = await query(dataSql, params);
    
    res.json({
      success: true,
      data: {
        reviews: reviews.map(r => ({
          id: r.id,
          productId: r.product_id,
          productName: r.product_name,
          userId: r.user_id,
          userEmail: r.email,
          userName: r.user_name,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerifiedPurchase: r.is_verified_purchase,
          isApproved: r.is_approved,
          helpfulCount: r.helpful_count,
          createdAt: r.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;
    
    const review = await queryOne('SELECT id FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      throw new NotFoundError('Reseña');
    }
    
    await query(
      'UPDATE reviews SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isApproved, reviewId]
    );
    
    res.json({
      success: true,
      message: `Reseña ${isApproved ? 'aprobada' : 'rechazada'} correctamente`
    });
  } catch (error) {
    next(error);
  }
};