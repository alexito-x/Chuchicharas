import { query, queryOne, transaction } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const cartItems = await query(
      `SELECT 
        ci.id, ci.quantity, ci.created_at,
        p.id as product_id, p.name, p.slug, p.price, p.original_price,
        p.stock_quantity, p.brand, p.shipping_free, p.shipping_cost,
        pi.image_url as primary_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      WHERE ci.user_id = ? AND p.is_active = TRUE
      ORDER BY ci.created_at DESC`,
      [userId]
    );
    
    let subtotal = 0;
    let shippingTotal = 0;
    
    const items = cartItems.map(item => {
      const price = parseFloat(item.price);
      const quantity = item.quantity;
      const itemTotal = price * quantity;
      subtotal += itemTotal;
      
      if (!item.shipping_free) {
        shippingTotal += parseFloat(item.shipping_cost || 0);
      }
      
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product_id,
          name: item.name,
          slug: item.slug,
          price,
          originalPrice: item.original_price ? parseFloat(item.original_price) : null,
          stockQuantity: item.stock_quantity,
          brand: item.brand,
          shippingFree: item.shipping_free,
          shippingCost: item.shipping_cost ? parseFloat(item.shipping_cost) : 0,
          primaryImage: item.primary_image
        },
        total: itemTotal
      };
    });
    
    const total = subtotal + shippingTotal;
    
    res.json({
      success: true,
      data: {
        items,
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          shipping: parseFloat(shippingTotal.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          itemCount: items.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    const product = await queryOne(
      'SELECT id, stock_quantity, name FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    if (product.stock_quantity < quantity) {
      throw new AppError(`Stock insuficiente. Disponible: ${product.stock_quantity}`, 400, 'INSUFFICIENT_STOCK');
    }
    
    const existingItem = await queryOne(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock_quantity) {
        throw new AppError(`Stock insuficiente. Disponible: ${product.stock_quantity}`, 400, 'INSUFFICIENT_STOCK');
      }
      
      await query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItem.id]
      );
    } else {
      await query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }
    
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 0) {
      throw new AppError('La cantidad no puede ser negativa', 400, 'INVALID_QUANTITY');
    }
    
    const product = await queryOne(
      'SELECT id, stock_quantity FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    if (quantity > product.stock_quantity) {
      throw new AppError(`Stock insuficiente. Disponible: ${product.stock_quantity}`, 400, 'INSUFFICIENT_STOCK');
    }
    
    if (quantity === 0) {
      await query(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
    } else {
      await query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
      );
    }
    
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    await query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    await query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'Carrito vaciado correctamente',
      data: { items: [], summary: { subtotal: 0, shipping: 0, total: 0, itemCount: 0 } }
    });
  } catch (error) {
    next(error);
  }
};

export const getCartCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await queryOne(
      'SELECT COUNT(*) as count, SUM(quantity) as totalItems FROM cart_items WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        count: parseInt(result.count) || 0,
        totalItems: parseInt(result.totalItems) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};