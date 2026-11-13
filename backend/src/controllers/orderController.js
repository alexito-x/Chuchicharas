import { query, queryOne, transaction } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';


export const getAllowedOrderTransitions = (order) => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: []
  };
  const allowed = [...(transitions[order.status] || [])];
  if (order.status === 'cancelled' && order.payment_status === 'paid') allowed.push('refunded');
  if (order.payment_status !== 'paid') return allowed.filter((status) => status !== 'refunded');
  return allowed;
};

const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CH${year}${month}${day}${random}`;
};

const txQuery = async (conn, sql, params = []) => {
  const [rows] = await conn.execute(sql, params);
  return rows;
};

const txQueryOne = async (conn, sql, params = []) => {
  const rows = await txQuery(conn, sql, params);
  return rows[0] || null;
};

const parsePagination = (page, limit, maxLimit = 50) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 10));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
};

const parseAddress = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, notes } = req.body;
    
    if (!items || items.length === 0) {
      throw new AppError('El carrito está vacío', 400, 'EMPTY_CART');
    }
    
    // Consolidate repeated product IDs before locking/checking stock so a crafted
    // request cannot bypass stock validation with duplicate line items.
    const quantitiesByProduct = new Map();
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isSafeInteger(quantity) || quantity < 1) {
        throw new AppError('Los productos o cantidades del pedido no son válidos', 400, 'INVALID_ORDER_ITEMS');
      }
      const totalQuantity = (quantitiesByProduct.get(productId) || 0) + quantity;
      if (totalQuantity > 99) {
        throw new AppError('No puedes solicitar más de 99 unidades del mismo producto', 400, 'INVALID_ORDER_QUANTITY');
      }
      quantitiesByProduct.set(productId, totalQuantity);
    }
    const consolidatedItems = [...quantitiesByProduct.entries()].map(([productId, quantity]) => ({ productId, quantity }));

    const orderData = await transaction(async (conn) => {
      let subtotal = 0;
      let shippingCost = 0;
      
      const orderItems = [];
      
      for (const item of consolidatedItems) {
        const product = await txQueryOne(
          conn,
          'SELECT id, name, price, original_price, stock_quantity, sku, shipping_free, shipping_cost FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
          [item.productId]
        );
        
        if (!product) {
          throw new NotFoundError(`Producto con ID ${item.productId}`);
        }
        
        if (product.stock_quantity < item.quantity) {
          throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`, 400, 'INSUFFICIENT_STOCK');
        }
        
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        
        if (!product.shipping_free) {
          shippingCost += parseFloat(product.shipping_cost || 0);
        }
        
        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice,
          quantity: item.quantity,
          totalPrice
        });
      }
      
      let discountAmount = 0;
      if (couponCode) {
        const coupon = await txQueryOne(
          conn,
          `SELECT * FROM coupons 
           WHERE code = ? AND is_active = TRUE 
           AND (start_date IS NULL OR start_date <= NOW()) 
           AND (end_date IS NULL OR end_date >= NOW())
           AND (usage_limit = 0 OR usage_count < usage_limit)
           FOR UPDATE`,
          [couponCode]
        );
        
        if (coupon) {
          const userUsage = await txQueryOne(
            conn,
            'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
            [coupon.id, userId]
          );
          
          if (userUsage.count < coupon.user_limit) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = subtotal * (coupon.discount_value / 100);
              if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
              }
              discountAmount = Math.min(discountAmount, subtotal);
            } else {
              discountAmount = Math.min(coupon.discount_value, subtotal);
            }
            
            if (subtotal >= coupon.min_purchase_amount) {
              await conn.execute(
                'INSERT INTO coupon_usage (coupon_id, user_id) VALUES (?, ?)',
                [coupon.id, userId]
              );
              await conn.execute(
                'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
                [coupon.id]
              );
            } else {
              discountAmount = 0;
            }
          }
        }
      }
      
      const taxAmount = 0;
      const totalAmount = subtotal + shippingCost - discountAmount + taxAmount;
      const orderNumber = generateOrderNumber();
      
      const [orderResult] = await conn.execute(
        `INSERT INTO orders (
          user_id, order_number, status, subtotal, shipping_cost, 
          discount_amount, tax_amount, total_amount, payment_method,
          payment_status, shipping_address, billing_address, notes
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [
          userId, orderNumber, subtotal, shippingCost,
          discountAmount, taxAmount, totalAmount, paymentMethod,
          JSON.stringify(shippingAddress),
          billingAddress ? JSON.stringify(billingAddress) : null,
          notes || null
        ]
      );
      
      const orderId = orderResult.insertId;
      
      for (const item of orderItems) {
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.productName, item.productSku, item.unitPrice, item.quantity, item.totalPrice]
        );
      }
      
      await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
      
      return { orderId, orderNumber, totalAmount };
    });
    
    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      data: {
        order: {
          id: orderData.orderId,
          orderNumber: orderData.orderNumber,
          totalAmount: orderData.totalAmount,
          status: 'pending',
          paymentStatus: 'pending'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const { page, limit: limitNum, offset } = parsePagination(req.query.page, req.query.limit, 50);
    
    let whereConditions = ['o.user_id = ?'];
    const params = [userId];
    
    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT o.*, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const orders = await query(dataSql, params);
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shipping_cost),
      discountAmount: parseFloat(order.discount_amount),
      taxAmount: parseFloat(order.tax_amount),
      totalAmount: parseFloat(order.total_amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      itemsCount: order.items_count
    }));
    
    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
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

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    const order = await queryOne(
      `SELECT o.*, u.email as user_email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? ${!isAdmin ? 'AND o.user_id = ?' : ''}`,
      isAdmin ? [id] : [id, userId]
    );
    
    if (!order) {
      throw new NotFoundError('Pedido');
    }
    
    const items = await query(
      `SELECT oi.*, p.slug, p.brand, pi.image_url as primary_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
       WHERE oi.order_id = ?`,
      [id]
    );
    
    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shipping_cost),
      discountAmount: parseFloat(order.discount_amount),
      taxAmount: parseFloat(order.tax_amount),
      totalAmount: parseFloat(order.total_amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      paymentReference: order.payment_reference,
      shippingAddress: parseAddress(order.shipping_address),
      billingAddress: parseAddress(order.billing_address),
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      user: {
        email: order.user_email,
        firstName: order.first_name,
        lastName: order.last_name
      },
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSku: item.product_sku,
        unitPrice: parseFloat(item.unit_price),
        quantity: item.quantity,
        totalPrice: parseFloat(item.total_price),
        slug: item.slug,
        brand: item.brand,
        primaryImage: item.primary_image
      }))
    };
    
    res.json({
      success: true,
      data: { order: formattedOrder }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    await transaction(async (conn) => {
      const order = await txQueryOne(
        conn,
        `SELECT * FROM orders WHERE id = ? ${!isAdmin ? 'AND user_id = ?' : ''} FOR UPDATE`,
        isAdmin ? [id] : [id, userId]
      );

      if (!order) {
        throw new NotFoundError('Pedido');
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new AppError('No se puede cancelar un pedido en este estado', 400, 'INVALID_STATUS');
      }

      // Cancel the order without claiming a refund was processed. An admin can
      // mark it as refunded after confirming the actual payment reversal.
      await conn.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', id]
      );

      const items = await txQuery(
        conn,
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        await conn.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ?, sold_count = GREATEST(sold_count - ?, 0) WHERE id = ?',
          [item.quantity, item.quantity, item.product_id]
        );
      }
    });

    res.json({
      success: true,
      message: 'Pedido cancelado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

export const simulatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const paymentReference = await transaction(async (conn) => {
      const order = await txQueryOne(
        conn,
        `SELECT * FROM orders WHERE id = ? ${!isAdmin ? 'AND user_id = ?' : ''} FOR UPDATE`,
        isAdmin ? [id] : [id, userId]
      );

      if (!order) {
        throw new NotFoundError('Pedido');
      }

      if (order.payment_status === 'paid') {
        throw new AppError('El pedido ya está pagado', 400, 'ALREADY_PAID');
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new AppError('No se puede pagar un pedido en este estado', 400, 'INVALID_STATUS');
      }

      const reference = `PAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      await conn.execute(
        `UPDATE orders 
         SET payment_status = 'paid', payment_reference = ?, status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reference, id]
      );

      return reference;
    });

    res.json({
      success: true,
      message: 'Pago simulado correctamente',
      data: {
        paymentReference,
        status: 'confirmed'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    const { page, limit: limitNum, offset } = parsePagination(req.query.page, req.query.limit, 100);
    
    let whereConditions = ['1=1'];
    const params = [];
    
    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }
    
    if (startDate) {
      whereConditions.push('o.created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('o.created_at <= ?');
      params.push(endDate);
    }
    
    if (search) {
      whereConditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${whereClause}
    `;
    
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT o.*, u.email as user_email, CONCAT(u.first_name, ' ', u.last_name) as user_name,
             COUNT(oi.id) as items_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const orders = await query(dataSql, params);
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shipping_cost),
      discountAmount: parseFloat(order.discount_amount),
      taxAmount: parseFloat(order.tax_amount),
      totalAmount: parseFloat(order.total_amount),
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      user: {
        email: order.user_email,
        name: order.user_name
      },
      itemsCount: order.items_count
    }));
    
    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
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

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, notes } = req.body;

    await transaction(async (conn) => {
      const order = await txQueryOne(conn, 'SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
      if (!order) {
        throw new NotFoundError('Pedido');
      }

      const allowedTransitions = getAllowedOrderTransitions(order);
      if (!allowedTransitions.includes(status)) {
        throw new AppError(`No se puede cambiar de ${order.status} a ${status}`, 400, 'INVALID_TRANSITION');
      }
      if (status === 'refunded' && order.payment_status !== 'paid') {
        throw new AppError('Solo se puede registrar un reembolso cuando el pedido está pagado', 400, 'PAYMENT_NOT_PAID');
      }

      if (status === 'cancelled') {
        const items = await txQuery(
          conn,
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [id]
        );

        for (const item of items) {
          await conn.execute(
            'UPDATE products SET stock_quantity = stock_quantity + ?, sold_count = GREATEST(sold_count - ?, 0) WHERE id = ?',
            [item.quantity, item.quantity, item.product_id]
          );
        }
      }

      const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [status];

      if (status === 'refunded') {
        // This transition is an explicit admin confirmation that the refund
        // was processed outside this app (no live payment gateway is configured).
        updateFields.push('payment_status = ?');
        updateValues.push('refunded');
      }

      if (trackingNumber) {
        updateFields.push('tracking_number = ?');
        updateValues.push(trackingNumber);
      }

      if (notes) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      updateValues.push(id);

      await conn.execute(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    });

    res.json({
      success: true,
      message: 'Estado del pedido actualizado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN payment_status = 'paid' AND status NOT IN ('cancelled', 'refunded') THEN total_amount ELSE 0 END) as totalRevenue,
        AVG(CASE WHEN payment_status = 'paid' AND status NOT IN ('cancelled', 'refunded') THEN total_amount ELSE NULL END) as avgOrderValue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalOrders: parseInt(stats.totalOrders) || 0,
          pending: parseInt(stats.pending) || 0,
          confirmed: parseInt(stats.confirmed) || 0,
          processing: parseInt(stats.processing) || 0,
          shipped: parseInt(stats.shipped) || 0,
          delivered: parseInt(stats.delivered) || 0,
          cancelled: parseInt(stats.cancelled) || 0,
          totalRevenue: parseFloat(stats.totalRevenue) || 0,
          avgOrderValue: parseFloat(stats.avgOrderValue) || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};