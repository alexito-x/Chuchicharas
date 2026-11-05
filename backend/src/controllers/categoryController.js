import slugify from 'slugify';
import { query, queryOne } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

const generateSlug = (name) => {
  return slugify(name, { lower: true, strict: true, locale: 'es' });
};

export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, parentId, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let whereConditions = ['1=1'];
    const params = [];
    
    if (parentId !== undefined) {
      whereConditions.push(parentId === '0' || parentId === 0 ? 'parent_id IS NULL' : 'parent_id = ?');
      if (parentId !== '0' && parentId !== 0) params.push(parentId);
    }
    
    if (isActive !== undefined) {
      const activeBool = isActive === true || isActive === 'true' || isActive === '1';
      whereConditions.push('is_active = ?');
      params.push(activeBool);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM categories WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT * FROM categories 
      WHERE ${whereClause}
      ORDER BY sort_order ASC, name ASC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const categories = await query(dataSql, params);
    
    res.json({
      success: true,
      data: {
        categories,
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

export const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await query(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC'
    );
    
    const categoryMap = {};
    const roots = [];
    
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });
    
    categories.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      } else {
        roots.push(categoryMap[cat.id]);
      }
    });
    
    res.json({
      success: true,
      data: { categories: roots }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await queryOne(
      'SELECT c.*, p.name as parent_name FROM categories c LEFT JOIN categories p ON c.parent_id = p.id WHERE c.id = ?',
      [id]
    );
    
    if (!category) {
      throw new NotFoundError('Categoría');
    }
    
    const children = await query(
      'SELECT * FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order, name',
      [id]
    );
    
    const productCount = await queryOne(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = TRUE',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        category: {
          ...category,
          children,
          productCount: productCount.count
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const category = await queryOne(
      'SELECT * FROM categories WHERE slug = ? AND is_active = TRUE',
      [slug]
    );
    
    if (!category) {
      throw new NotFoundError('Categoría');
    }
    
    req.params.id = category.id;
    return getCategoryById(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl, parentId, sortOrder } = req.body;
    
    const slug = generateSlug(name);
    
    const existingSlug = await queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existingSlug) {
      throw new AppError('Ya existe una categoría con nombre similar', 409, 'SLUG_EXISTS');
    }
    
    if (parentId) {
      const parent = await queryOne('SELECT id FROM categories WHERE id = ?', [parentId]);
      if (!parent) {
        throw new NotFoundError('Categoría padre');
      }
    }
    
    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, imageUrl || null, parentId || null, sortOrder || 0]
    );
    
    const newCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
      data: { category: newCategory }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError('Categoría');
    }
    
    const allowedFields = ['name', 'description', 'image_url', 'parent_id', 'sort_order', 'is_active'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        if (dbKey === 'parent_id' && value) {
          if (value == id) {
            throw new AppError('Una categoría no puede ser su propio padre', 400, 'INVALID_PARENT');
          }
          const parent = await queryOne('SELECT id FROM categories WHERE id = ?', [value]);
          if (!parent) {
            throw new NotFoundError('Categoría padre');
          }
        }
        updateFields.push(`${dbKey} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updates.name && updates.name !== category.name) {
      const newSlug = generateSlug(updates.name);
      const existingSlug = await queryOne('SELECT id FROM categories WHERE slug = ? AND id != ?', [newSlug, id]);
      if (existingSlug) {
        throw new AppError('Ya existe una categoría con nombre similar', 409, 'SLUG_EXISTS');
      }
      updateFields.push('slug = ?');
      updateValues.push(newSlug);
    }
    
    if (updateFields.length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400, 'NO_VALID_FIELDS');
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE categories SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    const updatedCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: { category: updatedCategory }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await queryOne('SELECT id FROM categories WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError('Categoría');
    }
    
    const children = await queryOne('SELECT id FROM categories WHERE parent_id = ?', [id]);
    if (children) {
      throw new AppError('No se puede eliminar una categoría que tiene subcategorías', 400, 'HAS_CHILDREN');
    }
    
    const products = await queryOne('SELECT id FROM products WHERE category_id = ?', [id]);
    if (products) {
      throw new AppError('No se puede eliminar una categoría que tiene productos', 400, 'HAS_PRODUCTS');
    }
    
    await query('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};