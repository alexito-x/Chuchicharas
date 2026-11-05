import slugify from 'slugify';
import { query, queryOne, transaction } from '../config/database.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';

const generateSlug = (name) => {
  return slugify(name, { lower: true, strict: true, locale: 'es' });
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      brand,
      condition,
      onSale,
      sortBy = 'newest',
      search = ''
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let whereConditions = ['p.is_active = TRUE', 'c.is_active = TRUE'];
    const whereParams = [];
    
    if (search) {
      whereConditions.push('MATCH(p.name, p.description, p.short_description) AGAINST(? IN NATURAL LANGUAGE MODE)');
      whereParams.push(search);
    }
    
    if (category) {
      whereConditions.push('(p.category_id = ? OR c.parent_id = ?)');
      whereParams.push(category, category);
    }
    
    if (minPrice) {
      whereConditions.push('p.price >= ?');
      whereParams.push(minPrice);
    }
    
    if (maxPrice) {
      whereConditions.push('p.price <= ?');
      whereParams.push(maxPrice);
    }
    
    if (brand) {
      whereConditions.push('p.brand = ?');
      whereParams.push(brand);
    }
    
    if (condition) {
      whereConditions.push('p.condition_type = ?');
      whereParams.push(condition);
    }
    
    if (onSale === 'true') {
      whereConditions.push('p.original_price IS NOT NULL AND p.original_price > p.price');
    }
    
    let orderBy = 'p.created_at DESC';
    switch (sortBy) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'rating': orderBy = 'p.rating_average DESC'; break;
      case 'best_selling': orderBy = 'p.sold_count DESC'; break;
      case 'relevance': orderBy = search ? 'relevance DESC' : 'p.created_at DESC'; break;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `;
    
    const totalResult = await queryOne(countSql, whereParams);
    const total = totalResult.total;
    
    let selectFields = `
      p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
      p.stock_quantity, p.brand, p.rating_average, p.rating_count,
      p.sold_count, p.shipping_free, p.is_featured, p.condition_type,
      c.name as category_name, c.slug as category_slug,
      pi.image_url as primary_image
    `;
    
    const selectParams = [];
    if (search) {
      selectFields += `, MATCH(p.name, p.description, p.short_description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance`;
      selectParams.push(search);
    }
    
    const dataSql = `
      SELECT ${selectFields}
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    const products = await query(dataSql, [...selectParams, ...whereParams, limitNum, offset]);
    
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.short_description,
      price: parseFloat(p.price),
      originalPrice: p.original_price ? parseFloat(p.original_price) : null,
      stockQuantity: p.stock_quantity,
      brand: p.brand,
      ratingAverage: parseFloat(p.rating_average),
      ratingCount: p.rating_count,
      soldCount: p.sold_count,
      shippingFree: p.shipping_free,
      isFeatured: p.is_featured,
      conditionType: p.condition_type,
      category: {
        name: p.category_name,
        slug: p.category_slug
      },
      primaryImage: p.primary_image
    }));
    
    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: parseInt(page) < Math.ceil(total / limitNum),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await queryOne(
      `SELECT 
        p.*, c.name as category_name, c.slug as category_slug,
        pc.name as parent_category_name, pc.slug as parent_category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );
    
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    const images = await query(
      'SELECT id, image_url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [id]
    );
    
    const attributes = await query(
      'SELECT attribute_name, attribute_value FROM product_attributes WHERE product_id = ?',
      [id]
    );
    
    const formattedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : null,
      stockQuantity: product.stock_quantity,
      minStockAlert: product.min_stock_alert,
      sku: product.sku,
      weight: product.weight ? parseFloat(product.weight) : 0,
      dimensions: product.dimensions,
      brand: product.brand,
      conditionType: product.condition_type,
      warranty: product.warranty,
      shippingFree: product.shipping_free,
      shippingCost: product.shipping_cost ? parseFloat(product.shipping_cost) : 0,
      ratingAverage: parseFloat(product.rating_average),
      ratingCount: product.rating_count,
      soldCount: product.sold_count,
      viewCount: product.view_count,
      isActive: product.is_active,
      isFeatured: product.is_featured,
      category: {
        id: product.category_id,
        name: product.category_name,
        slug: product.category_slug,
        parent: product.parent_category_name
          ? { name: product.parent_category_name, slug: product.parent_category_slug }
          : null
      },
      images: images.map(img => ({
        id: img.id,
        url: img.image_url,
        altText: img.alt_text,
        sortOrder: img.sort_order,
        isPrimary: img.is_primary
      })),
      attributes: attributes.map(attr => ({
        name: attr.attribute_name,
        value: attr.attribute_value
      })),
      installments: calculateInstallments(parseFloat(product.price)),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
    
    await query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: { product: formattedProduct }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const product = await queryOne(
      `SELECT 
        p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = TRUE`,
      [slug]
    );
    
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    req.params.id = product.id;
    return getProductById(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await query(
      `SELECT 
        p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
        p.stock_quantity, p.brand, p.rating_average, p.rating_count,
        p.sold_count, p.shipping_free, p.is_featured,
        c.name as category_name, c.slug as category_slug,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      WHERE p.is_active = TRUE AND p.is_featured = TRUE AND c.is_active = TRUE
      ORDER BY p.created_at DESC
      LIMIT ?`,
      [parseInt(limit)]
    );
    
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.short_description,
      price: parseFloat(p.price),
      originalPrice: p.original_price ? parseFloat(p.original_price) : null,
      stockQuantity: p.stock_quantity,
      brand: p.brand,
      ratingAverage: parseFloat(p.rating_average),
      ratingCount: p.rating_count,
      soldCount: p.sold_count,
      shippingFree: p.shipping_free,
      isFeatured: p.is_featured,
      category: {
        name: p.category_name,
        slug: p.category_slug
      },
      primaryImage: p.primary_image
    }));
    
    res.json({
      success: true,
      data: { products: formattedProducts }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryShowcase = async (req, res, next) => {
  try {
    const products = await query(
      `SELECT
        id, name, slug, short_description, price, original_price,
        stock_quantity, brand, rating_average, rating_count, sold_count,
        shipping_free, is_featured, category_id, category_name, category_slug,
        parent_name, category_image, primary_image
      FROM (
        SELECT
          p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
          p.stock_quantity, p.brand, p.rating_average, p.rating_count, p.sold_count,
          p.shipping_free, p.is_featured, pi.image_url AS primary_image, c.id AS category_id,
          c.name AS category_name, c.slug AS category_slug, pc.name AS parent_name,
          COALESCE(c.image_url, pc.image_url) AS category_image,
          COALESCE(pc.sort_order, c.sort_order) AS group_sort,
          ROW_NUMBER() OVER (
            PARTITION BY p.category_id
            ORDER BY (p.stock_quantity > 0) DESC, (pi.image_url IS NOT NULL) DESC,
              p.is_featured DESC, p.sold_count DESC, p.rating_count DESC, p.id ASC
          ) AS category_position
        FROM products p
        JOIN categories c ON c.id = p.category_id AND c.is_active = TRUE
        LEFT JOIN categories pc ON pc.id = c.parent_id
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
        WHERE p.is_active = TRUE
      ) ranked
      WHERE category_position = 1
      ORDER BY group_sort, category_name`
    );

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.short_description,
      price: parseFloat(p.price),
      originalPrice: p.original_price ? parseFloat(p.original_price) : null,
      stockQuantity: p.stock_quantity,
      brand: p.brand,
      ratingAverage: parseFloat(p.rating_average),
      ratingCount: p.rating_count,
      soldCount: p.sold_count,
      shippingFree: p.shipping_free,
      isFeatured: p.is_featured,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug,
        parentName: p.parent_name
      },
      categoryImage: p.category_image,
      primaryImage: p.primary_image
    }));

    res.json({
      success: true,
      data: { products: formattedProducts }
    });
  } catch (error) {
    next(error);
  }
};

export const searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }
    
    const products = await query(
      `SELECT name, slug, brand FROM products 
       WHERE is_active = TRUE AND MATCH(name, description, short_description) AGAINST(? IN BOOLEAN MODE)
       LIMIT 10`,
      [`${q}*`]
    );
    
    const categories = await query(
      'SELECT name, slug FROM categories WHERE is_active = TRUE AND name LIKE ? LIMIT 5',
      [`%${q}%`]
    );
    
    const suggestions = [
      ...products.map(p => ({ type: 'product', text: p.name, slug: p.slug, brand: p.brand })),
      ...categories.map(c => ({ type: 'category', text: c.name, slug: c.slug }))
    ].slice(0, 10);
    
    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req, res, next) => {
  try {
    const brands = await query(
      'SELECT DISTINCT brand FROM products WHERE is_active = TRUE AND brand IS NOT NULL AND brand != "" ORDER BY brand'
    );
    
    res.json({
      success: true,
      data: { brands: brands.map(b => b.brand) }
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    const product = await queryOne('SELECT category_id FROM products WHERE id = ?', [id]);
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    const products = await query(
      `SELECT 
        p.id, p.name, p.slug, p.short_description, p.price, p.original_price,
        p.stock_quantity, p.brand, p.rating_average, p.rating_count,
        p.shipping_free, pi.image_url as primary_image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = TRUE
      ORDER BY p.rating_average DESC, p.sold_count DESC
      LIMIT ?`,
      [product.category_id, id, parseInt(limit)]
    );
    
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.short_description,
      price: parseFloat(p.price),
      originalPrice: p.original_price ? parseFloat(p.original_price) : null,
      stockQuantity: p.stock_quantity,
      brand: p.brand,
      ratingAverage: parseFloat(p.rating_average),
      ratingCount: p.rating_count,
      shippingFree: p.shipping_free,
      primaryImage: p.primary_image
    }));
    
    res.json({
      success: true,
      data: { products: formattedProducts }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name, description, shortDescription, price, originalPrice,
      stockQuantity, minStockAlert, categoryId, sku, brand, conditionType,
      weight, dimensions, warranty, shippingFree, shippingCost,
      isFeatured, attributes, images
    } = req.body;
    
    const slug = generateSlug(name);
    
    const existingSlug = await queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existingSlug) {
      throw new AppError('Ya existe un producto con nombre similar', 409, 'SLUG_EXISTS');
    }
    
    if (sku) {
      const existingSku = await queryOne('SELECT id FROM products WHERE sku = ?', [sku]);
      if (existingSku) {
        throw new AppError('El SKU ya existe', 409, 'SKU_EXISTS');
      }
    }
    
    const result = await transaction(async (conn) => {
      const [productResult] = await conn.execute(
        `INSERT INTO products (
          name, slug, description, short_description, price, original_price,
          stock_quantity, min_stock_alert, category_id, sku, brand, condition_type,
          weight, dimensions, warranty, shipping_free, shipping_cost, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, slug, description || null, shortDescription || null,
          price, originalPrice || null, stockQuantity, minStockAlert ?? 5, categoryId,
          sku || null, brand || null, conditionType || 'new',
          weight || 0, dimensions || null, warranty || null,
          shippingFree || false, shippingCost || 0, isFeatured || false
        ]
      );
      
      const productId = productResult.insertId;
      
      if (images && images.length > 0) {
        const primaryIndex = images.findIndex((img) => img.isPrimary === true);
        const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          await conn.execute(
            'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
            [productId, img.imageUrl, img.altText || name, i, i === resolvedPrimaryIndex]
          );
        }
      } else {
        await conn.execute(
          'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
          [productId, '/images/product-placeholder.svg', name, 0, true]
        );
      }
      
      if (attributes && attributes.length > 0) {
        for (const attr of attributes) {
          await conn.execute(
            'INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)',
            [productId, attr.attributeName, attr.attributeValue]
          );
        }
      }
      
      return productId;
    });
    
    const newProduct = await queryOne('SELECT * FROM products WHERE id = ?', [result]);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: { product: newProduct }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    const allowedFields = [
      'name', 'description', 'short_description', 'price', 'original_price',
      'stock_quantity', 'min_stock_alert', 'category_id', 'sku', 'brand',
      'condition_type', 'weight', 'dimensions', 'warranty', 'shipping_free',
      'shipping_cost', 'is_active', 'is_featured'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updateFields.push(`${dbKey} = ?`);
        updateValues.push(value);
      }
    }
    
    const hasImagesUpdate = Array.isArray(updates.images);
    const hasAttributesUpdate = Array.isArray(updates.attributes);
    
    if (updateFields.length === 0 && !hasImagesUpdate && !hasAttributesUpdate) {
      throw new AppError('No hay campos válidos para actualizar', 400, 'NO_VALID_FIELDS');
    }
    
    if (updates.name && updates.name !== product.name) {
      const newSlug = generateSlug(updates.name);
      const existingSlug = await queryOne('SELECT id FROM products WHERE slug = ? AND id != ?', [newSlug, id]);
      if (existingSlug) {
        throw new AppError('Ya existe un producto con nombre similar', 409, 'SLUG_EXISTS');
      }
      updateFields.push('slug = ?');
      updateValues.push(newSlug);
    }
    
    if (updates.sku && updates.sku !== product.sku) {
      const existingSku = await queryOne('SELECT id FROM products WHERE sku = ? AND id != ?', [updates.sku, id]);
      if (existingSku) {
        throw new AppError('El SKU ya existe', 409, 'SKU_EXISTS');
      }
    }
    
    if (updateFields.length > 0) {
      updateValues.push(id);
      await query(
        `UPDATE products SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );
    }
    
    await transaction(async (conn) => {
      if (Array.isArray(updates.images)) {
        await conn.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
        const primaryIndex = updates.images.findIndex((img) => img.isPrimary === true);
        const resolvedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;
        for (let i = 0; i < updates.images.length; i++) {
          const img = updates.images[i];
          await conn.execute(
            'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
            [id, img.imageUrl, img.altText || updates.name || product.name, i, i === resolvedPrimaryIndex]
          );
        }
      }
      
      if (Array.isArray(updates.attributes)) {
        await conn.execute('DELETE FROM product_attributes WHERE product_id = ?', [id]);
        for (const attr of updates.attributes) {
          await conn.execute(
            'INSERT INTO product_attributes (product_id, attribute_name, attribute_value) VALUES (?, ?, ?)',
            [id, attr.attributeName, attr.attributeValue]
          );
        }
      }
    });
    
    const updatedProduct = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: { product: updatedProduct }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await queryOne('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) {
      throw new NotFoundError('Producto');
    }
    
    const orderItems = await queryOne('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?', [id]);
    if (orderItems.count > 0) {
      await query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: 'El producto tiene pedidos asociados, por lo que se desactivó para conservar el historial',
        data: { deactivated: true }
      });
    }
    
    await query('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', categoryId, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    let whereConditions = ['1=1'];
    const params = [];
    
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    
    if (isActive !== undefined) {
      whereConditions.push('p.is_active = ?');
      params.push(isActive === 'true');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult.total;
    
    const dataSql = `
      SELECT p.*, c.name as category_name, pi.image_url as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    const products = await query(dataSql, params);

    if (products.length > 0) {
      const ids = products.map((product) => product.id);
      const placeholders = ids.map(() => '?').join(', ');
      const images = await query(
        `SELECT id, product_id, image_url, alt_text, sort_order, is_primary
         FROM product_images
         WHERE product_id IN (${placeholders})
         ORDER BY product_id, sort_order, id`,
        ids
      );
      const imagesByProduct = new Map();
      images.forEach((image) => {
        const list = imagesByProduct.get(image.product_id) || [];
        list.push(image);
        imagesByProduct.set(image.product_id, list);
      });
      const attributes = await query(
        `SELECT product_id, attribute_name, attribute_value
         FROM product_attributes
         WHERE product_id IN (${placeholders})
         ORDER BY product_id, id`,
        ids
      );
      const attributesByProduct = new Map();
      attributes.forEach((attribute) => {
        const list = attributesByProduct.get(attribute.product_id) || [];
        list.push(attribute);
        attributesByProduct.set(attribute.product_id, list);
      });
      products.forEach((product) => {
        product.images = imagesByProduct.get(product.id) || [];
        product.attributes = attributesByProduct.get(product.id) || [];
      });
    }
    
    res.json({
      success: true,
      data: {
        products,
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

function calculateInstallments(price) {
  const installments = [3, 6, 9, 12];
  return installments.map(n => ({
    count: n,
    amount: parseFloat((price / n).toFixed(2)),
    total: price,
    interestFree: n <= 6
  }));
}