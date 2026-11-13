import { query, queryOne } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role, isActive } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const searchTerm = String(search).slice(0, 255);
    
    let whereConditions = ['1=1'];
    const params = [];
    
    if (search) {
      whereConditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }
    
    if (isActive !== undefined) {
      whereConditions.push('is_active = ?');
      params.push(isActive === 'true');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const users = await query(dataSql, params);
    
    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          phone: u.phone,
          role: u.role,
          isActive: u.is_active,
          emailVerified: u.email_verified,
          createdAt: u.created_at
        })),
        pagination: {
          page: pageNum,
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

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await queryOne(
      'SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    const orderCount = await queryOne(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
      [id]
    );
    
    const totalSpent = await queryOne(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ? AND payment_status = "paid" AND status NOT IN ("cancelled", "refunded")',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        user: {
          ...user,
          orderCount: orderCount.count,
          totalSpent: parseFloat(totalSpent.total)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive } = req.body;
    
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new NotFoundError('Usuario');
    }
    
    const changingOwnRole = Number(req.user.id) === Number(id) && role !== undefined && role !== user.role;
    const deactivatingSelf = Number(req.user.id) === Number(id) && isActive === false;
    if (changingOwnRole || deactivatingSelf) {
      throw new AppError('No puedes cambiar tu propio rol ni desactivar tu propia cuenta', 400, 'CANNOT_CHANGE_OWN_ACCOUNT');
    }

    const removingAdminAccess = user.role === 'admin' && ((role !== undefined && role !== 'admin') || isActive === false);
    if (removingAdminAccess) {
      const activeAdmins = await queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = TRUE");
      if (Number(activeAdmins.count) <= 1) {
        throw new AppError('No puedes desactivar o degradar al último administrador activo', 409, 'LAST_ACTIVE_ADMIN');
      }
    }
    
    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }
    
    if (updateFields.length === 0) {
      throw new AppError('No hay campos para actualizar', 400, 'NO_FIELDS');
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    const updatedUser = await queryOne(
      'SELECT id, email, first_name, last_name, phone, role, is_active, email_verified FROM users WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user.id == id) {
      throw new AppError('No puedes eliminarte a ti mismo', 400, 'CANNOT_DELETE_SELF');
    }
    
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new NotFoundError('Usuario');
    }

    if (user.role === 'admin') {
      const activeAdmins = await queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = TRUE");
      if (Number(activeAdmins.count) <= 1) {
        throw new AppError('No puedes eliminar al último administrador activo', 409, 'LAST_ACTIVE_ADMIN');
      }
    }

    const orderCount = await queryOne('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [id]);
    if (Number(orderCount.count) > 0) {
      await query('UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: 'El usuario tiene pedidos asociados; su cuenta fue desactivada para conservar el historial.',
        data: { deactivated: true }
      });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
      data: { deactivated: false }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      topCategories
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users WHERE role = "user" AND is_active = TRUE'),
      queryOne('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE'),
      queryOne('SELECT COUNT(*) as count FROM orders'),
      queryOne('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid" AND status NOT IN ("cancelled", "refunded")'),
      query(`
        SELECT o.*, u.email, CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `),
      query(`
        SELECT id, name, stock_quantity, sku
        FROM products
        WHERE is_active = TRUE AND stock_quantity <= min_stock_alert AND stock_quantity > 0
        ORDER BY stock_quantity ASC
        LIMIT 10
      `),
      query(`
        SELECT c.name, c.slug, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
        WHERE c.is_active = TRUE
        GROUP BY c.id
        HAVING product_count > 0
        ORDER BY product_count DESC
        LIMIT 10
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers.count,
          totalProducts: totalProducts.count,
          totalOrders: totalOrders.count,
          totalRevenue: parseFloat(totalRevenue.total)
        },
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          totalAmount: parseFloat(o.total_amount),
          status: o.status,
          paymentStatus: o.payment_status,
          createdAt: o.created_at,
          user: {
            email: o.email,
            name: o.user_name
          }
        })),
        lowStockProducts,
        topCategories
      }
    });
  } catch (error) {
    next(error);
  }
};