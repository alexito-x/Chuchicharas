import { query, queryOne, transaction, default as pool } from '../src/config/database.js';

const ARS_TO_MXN = 0.01205;
const LEGACY_PRODUCT_THRESHOLD = 100000;

const roundToTen = (value) => Math.round((Number(value) * ARS_TO_MXN) / 10) * 10;
const roundMoney = (value) => Math.round(Number(value) * ARS_TO_MXN * 100) / 100;

try {
  const legacy = await queryOne(
    'SELECT COUNT(*) AS total FROM products WHERE price >= ? OR original_price >= ?',
    [LEGACY_PRODUCT_THRESHOLD, LEGACY_PRODUCT_THRESHOLD]
  );

  if (!legacy.total) {
    console.log('Los precios ya están migrados a MXN.');
  } else {
    await transaction(async (conn) => {
      const [products] = await conn.execute(
        'SELECT id, price, original_price, shipping_cost FROM products WHERE price >= ? OR original_price >= ?',
        [LEGACY_PRODUCT_THRESHOLD, LEGACY_PRODUCT_THRESHOLD]
      );

      for (const product of products) {
        const price = roundToTen(product.price);
        const originalPrice = product.original_price ? roundToTen(product.original_price) : null;
        const shippingCost = product.shipping_cost
          ? Math.round(roundMoney(product.shipping_cost)) 
          : 0;

        await conn.execute(
          'UPDATE products SET price = ?, original_price = ?, shipping_cost = ? WHERE id = ?',
          [price, originalPrice, shippingCost, product.id]
        );
      }

      await conn.execute(
        `UPDATE coupons
         SET min_purchase_amount = ROUND(min_purchase_amount * ? / 10, 0) * 10,
             max_discount_amount = ROUND(max_discount_amount * ? / 100, 0) * 100,
             discount_value = CASE WHEN discount_type = 'fixed' THEN ROUND(discount_value * ?, 2) ELSE discount_value END`,
        [ARS_TO_MXN, ARS_TO_MXN, ARS_TO_MXN]
      );

      await conn.execute(
        `UPDATE coupons
         SET description = CASE code
           WHEN 'ENVIOGRATIS' THEN 'Envío gratis en compras mayores a $600 MXN'
           ELSE description
         END`
      );

      await conn.execute(
        `UPDATE orders
         SET subtotal = ROUND(subtotal * ?, 2),
             shipping_cost = ROUND(shipping_cost * ?, 2),
             discount_amount = ROUND(discount_amount * ?, 2),
             tax_amount = ROUND(tax_amount * ?, 2),
             total_amount = ROUND(total_amount * ?, 2)`,
        [ARS_TO_MXN, ARS_TO_MXN, ARS_TO_MXN, ARS_TO_MXN, ARS_TO_MXN]
      );

      await conn.execute(
        `UPDATE order_items
         SET unit_price = ROUND(unit_price * ?, 2),
             total_price = ROUND(total_price * ?, 2)`,
        [ARS_TO_MXN, ARS_TO_MXN]
      );
    });

    console.log(`Precios migrados a MXN con tipo de cambio ${ARS_TO_MXN} ARS por MXN.`);
  }
} catch (error) {
  console.error('No se pudieron migrar los precios:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
