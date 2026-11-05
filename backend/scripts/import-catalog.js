import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import slugify from 'slugify';
import { query, transaction, default as pool } from '../src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, 'data', 'catalogo-141.json');
const stockQuantity = Number(process.env.CATALOG_STOCK || 10);
const minStockAlert = Number(process.env.CATALOG_MIN_STOCK || 3);

const brandRules = [
  ['Yuliana', /^YULIANA\b/],
  ['Bissu', /^BISSU\b/],
  ['Nutrapel', /^NUTRAPEL\b/],
  ['Skala', /^SKALA\b/],
  ['Ouro', /^OURO\b/],
  ['Barbiux', /^BARBIUX\b/],
  ['Pink Up', /^PINK UP\b/],
  ['Kuul', /^KUUL\b/],
  ['Kehel', /^KEHEL\b/],
  ['Pris', /^PRIS\b/],
  ['By Apple', /^BY APPLE\b/],
  ['Alfaparf', /^ALFAPAEF\b/],
  ['Schwarzkopf', /^SCHWARZKOPF\b|^TOALLA NEGRA SCHWARZKOPF\b|^HIDRA CUBRIDOR LARGO NEGRO SCHWARZKOPF\b/],
  ['Nitram', /^NITRAM\b/],
  ['Lomarey', /^LOMAREY\b/],
  ['Scott', /^TOALLAS SCOTT\b/],
  ['Oster', /^LICUADORA OSTER\b/],
  ['Daewo', /^VENTILADOR DAEWO\b/],
  ['Anchor', /^JUEGO DE JARRA ANCHOR\b/],
  ['Hot Wheels', /^CARRITO HOT WHEELS\b/],
  ['Play-Doh', /^PLASTILINA PLAY-DOH\b/],
  ['Cott-Line', /^TIN COTT-LINE\b/],
  ['MC', /^MC\b/],
  ['Altiva', /^ALTIVA\b/],
  ['Estrella', /^ESTRELLA (BLOCK|LIBRETA|CUADERNO|HOJAS|LAPIZ|COLORES)\b/],
];

const getBrand = (name) => {
  const rule = brandRules.find(([, pattern]) => pattern.test(name));
  return rule ? rule[0] : null;
};

const makeSlug = (name, sku, usedSlugs) => {
  const base = slugify(name, { lower: true, strict: true, locale: 'es' }).slice(0, 220) || `producto-${sku}`;
  if (!usedSlugs.has(base)) {
    usedSlugs.add(base);
    return base;
  }

  const skuSuffix = slugify(sku, { lower: true, strict: true }) || 'sku';
  const candidate = `${base}-${skuSuffix}`;
  if (!usedSlugs.has(candidate)) {
    usedSlugs.add(candidate);
    return candidate;
  }

  let counter = 2;
  let unique = `${candidate}-${counter}`;
  while (usedSlugs.has(unique)) {
    counter += 1;
    unique = `${candidate}-${counter}`;
  }
  usedSlugs.add(unique);
  return unique;
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
  fail('CATALOG_STOCK debe ser un entero mayor o igual a 0');
}

if (!Number.isInteger(minStockAlert) || minStockAlert < 0) {
  fail('CATALOG_MIN_STOCK debe ser un entero mayor o igual a 0');
}

try {
  const raw = await readFile(catalogPath, 'utf8');
  const catalog = JSON.parse(raw);
  const { categories, products } = catalog;

  if (!Array.isArray(categories) || categories.length !== 42) {
    fail('El catálogo debe incluir 42 categorías');
  }

  if (!Array.isArray(products) || products.length !== 141) {
    fail('El catálogo debe incluir 141 productos');
  }

  const categorySlugs = new Set(categories.map((category) => category.slug));
  const productSkus = new Set(products.map((product) => product.sku));
  if (categorySlugs.size !== categories.length) {
    fail('Hay categorías duplicadas en el catálogo');
  }
  if (productSkus.size !== products.length) {
    fail('Hay SKUs duplicados en el catálogo');
  }

  for (const product of products) {
    if (!categorySlugs.has(product.categorySlug)) {
      fail(`La categoría ${product.categorySlug} no existe para ${product.sku}`);
    }
  }

  const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));
  const featuredCount = products.filter((product) => product.featured).length;
  if (featuredCount !== 8) {
    fail(`Se esperaban 8 productos destacados y hay ${featuredCount}`);
  }

  const result = await transaction(async (connection) => {
    const [[orderItems]] = await connection.execute('SELECT COUNT(*) AS total FROM order_items');
    if (Number(orderItems.total) > 0) {
      throw new Error('No se puede reemplazar el catálogo porque existen pedidos con productos asociados');
    }

    await connection.execute('UPDATE categories SET is_active = FALSE');
    const categoryIds = new Map();

    for (const category of categories) {
      const parentId = category.parentSlug ? categoryIds.get(category.parentSlug) : null;
      if (category.parentSlug && !parentId) {
        throw new Error(`No se encontró la categoría padre ${category.parentSlug}`);
      }

      await connection.execute(
        `INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           parent_id = VALUES(parent_id),
           sort_order = VALUES(sort_order),
           is_active = TRUE`,
        [category.name, category.slug, category.description || null, parentId, category.sortOrder]
      );

      const [[savedCategory]] = await connection.execute(
        'SELECT id FROM categories WHERE slug = ?',
        [category.slug]
      );
      categoryIds.set(category.slug, savedCategory.id);
    }

    await connection.execute('DELETE FROM cart_items');
    await connection.execute('DELETE FROM wishlist');
    await connection.execute('DELETE FROM reviews');
    await connection.execute('DELETE FROM product_attributes');
    await connection.execute('DELETE FROM product_images');
    await connection.execute('DELETE FROM products');

    const usedSlugs = new Set();
    for (const product of products) {
      const categoryId = categoryIds.get(product.categorySlug);
      const categoryName = categoryNames.get(product.categorySlug);
      const slug = makeSlug(product.name, product.sku, usedSlugs);
      const brand = getBrand(product.name);

      await connection.execute(
        `INSERT INTO products (
          name, slug, description, short_description, price, stock_quantity, min_stock_alert,
          sku, brand, condition_type, shipping_free, category_id, is_featured, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', FALSE, ?, ?, TRUE)`,
        [
          product.name,
          slug,
          `${product.name} disponible en Chuchicharas. Producto nuevo con precio en pesos mexicanos.`,
          `Producto nuevo de ${categoryName}`,
          product.price,
          stockQuantity,
          minStockAlert,
          product.sku,
          brand,
          categoryId,
          product.featured ? 1 : 0,
        ]
      );
    }

    const [[productTotal]] = await connection.execute('SELECT COUNT(*) AS total FROM products');
    const [[activeCategoryTotal]] = await connection.execute(
      'SELECT COUNT(*) AS total FROM categories WHERE is_active = TRUE'
    );
    const [[emptyCategoryTotal]] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM categories c
       WHERE c.is_active = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE
         )
         AND NOT EXISTS (
           SELECT 1 FROM categories child WHERE child.parent_id = c.id AND child.is_active = TRUE
         )`
    );

    return {
      products: Number(productTotal.total),
      categories: Number(activeCategoryTotal.total),
      emptyCategories: Number(emptyCategoryTotal.total),
    };
  });

  if (result.products !== 141) {
    throw new Error(`Se importaron ${result.products} productos en lugar de 141`);
  }
  if (result.emptyCategories !== 0) {
    throw new Error(`Quedaron ${result.emptyCategories} categorías activas sin productos`);
  }

  console.log(`Catálogo importado: ${result.products} productos en ${result.categories} categorías activas.`);
  console.log(`Stock inicial por producto: ${stockQuantity}; alerta mínima: ${minStockAlert}.`);
} catch (error) {
  console.error('No se pudo importar el catálogo:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
