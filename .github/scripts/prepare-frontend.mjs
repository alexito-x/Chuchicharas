import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('work/Chuchicharas');
const frontend = path.join(root, 'frontend');
const catalogPath = path.join(root, 'backend/scripts/data/catalogo-141.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(catalog.products) || catalog.products.length !== 141) throw new Error('Catálogo local inválido: se esperaban 141 productos.');

const dataDir = path.join(frontend, 'src/data');
fs.mkdirSync(dataDir, { recursive: true });
fs.copyFileSync(catalogPath, path.join(dataDir, 'catalog-fallback.json'));

fs.writeFileSync(path.join(frontend, 'src/services/localCatalog.js'), String.raw`import catalog from '../data/catalog-fallback.json';

const slugify = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const categories = catalog.categories.map((item, index) => ({ id: index + 1, ...item, image_url: '/images/placeholder-general.svg', is_active: true }));
const categoryBySlug = new Map(categories.map((item) => [item.slug, item]));
const products = catalog.products.map((item, index) => {
  const category = categoryBySlug.get(item.categorySlug);
  return { id: index + 1, sku: item.sku, name: item.name, slug: slugify(item.name) + '-' + slugify(item.sku), price: Number(item.price), originalPrice: null, primaryImage: '/images/product-placeholder.svg', brand: null, stockQuantity: 10, isFeatured: Boolean(item.featured), ratingAverage: 0, ratingCount: 0, shippingFree: false, conditionType: 'new', categoryId: category ? category.id : null, category: category ? { id: category.id, name: category.name, slug: category.slug } : null, isActive: true, onSale: false };
});
const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const localCatalog = {
  categories, products,
  getProducts(params = {}) {
    let list = [...products];
    const q = String(params.search || params.q || '').trim().toLocaleLowerCase('es');
    if (q) list = list.filter((p) => p.name.toLocaleLowerCase('es').includes(q) || p.sku.toLowerCase().includes(q));
    if (params.category) list = list.filter((p) => String(p.categoryId) === String(params.category));
    if (params.brand) list = list.filter((p) => p.brand === params.brand);
    if (params.condition) list = list.filter((p) => p.conditionType === params.condition);
    if (params.minPrice !== undefined && params.minPrice !== '') list = list.filter((p) => p.price >= num(params.minPrice, 0));
    if (params.maxPrice !== undefined && params.maxPrice !== '') list = list.filter((p) => p.price <= num(params.maxPrice, Infinity));
    if (params.onSale === true || params.onSale === 'true') list = list.filter((p) => p.onSale);
    if (params.sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (params.sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (params.sortBy === 'best_selling') list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    else list.sort((a, b) => a.id - b.id);
    const page = Math.max(1, num(params.page, 1));
    const limit = Math.max(1, Math.min(100, num(params.limit, 16)));
    return { products: list.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) } };
  },
  getProductById(id) { return products.find((p) => String(p.id) === String(id) || p.sku === String(id)) || null; },
  getProductBySlug(slug) { return products.find((p) => p.slug === slug) || null; },
  getFeatured(limit = 8) { return products.filter((p) => p.isFeatured).slice(0, limit); },
  getRelated(id, limit = 4) { const current = this.getProductById(id); return current ? products.filter((p) => p.id !== current.id && p.categoryId === current.categoryId).slice(0, limit) : []; },
  getSuggestions(q) { const value = String(q || '').trim().toLocaleLowerCase('es'); return value.length < 2 ? [] : products.filter((p) => p.name.toLocaleLowerCase('es').includes(value)).slice(0, 6).map((p) => ({ type: 'product', text: p.name, slug: p.slug })); },
  getBrands() { return [...new Set(products.map((p) => p.brand).filter(Boolean))]; }
};
export default localCatalog;
`);

fs.writeFileSync(path.join(frontend, 'src/services/productService.js'), `import api from './api';
import localCatalog from './localCatalog';
const remote = Boolean(import.meta.env.VITE_API_URL);
export const productService = {
  async getProducts(params = {}) { if (!remote) return localCatalog.getProducts(params); try { const { data } = await api.get('/products', { params }); return data.data; } catch { return localCatalog.getProducts(params); } },
  async getProductById(id) { if (!remote) { const p = localCatalog.getProductById(id); if (p) return p; throw new Error('Producto no encontrado.'); } try { const { data } = await api.get('/products/' + id); return data.data.product; } catch { const p = localCatalog.getProductById(id); if (p) return p; throw new Error('Producto no encontrado.'); } },
  async getProductBySlug(slug) { if (!remote) { const p = localCatalog.getProductBySlug(slug); if (p) return p; throw new Error('Producto no encontrado.'); } try { const { data } = await api.get('/products/slug/' + slug); return data.data.product; } catch { const p = localCatalog.getProductBySlug(slug); if (p) return p; throw new Error('Producto no encontrado.'); } },
  async getFeatured(limit = 8) { if (!remote) return localCatalog.getFeatured(limit); try { const { data } = await api.get('/products/featured', { params: { limit } }); return data.data.products; } catch { return localCatalog.getFeatured(limit); } },
  async getCategoryShowcase() { if (!remote) return []; try { const { data } = await api.get('/products/category-showcase'); return data.data.products; } catch { return []; } },
  async getRelated(id, limit = 4) { if (!remote) return localCatalog.getRelated(id, limit); try { const { data } = await api.get('/products/' + id + '/related', { params: { limit } }); return data.data.products; } catch { return localCatalog.getRelated(id, limit); } },
  async getSuggestions(q) { if (!remote) return localCatalog.getSuggestions(q); try { const { data } = await api.get('/products/search/suggestions', { params: { q } }); return data.data.suggestions; } catch { return localCatalog.getSuggestions(q); } },
  async getBrands() { if (!remote) return localCatalog.getBrands(); try { const { data } = await api.get('/products/brands'); return data.data.brands; } catch { return localCatalog.getBrands(); } },
  async getAdminProducts(params = {}) { const { data } = await api.get('/products/admin/all', { params }); return data.data; },
  async create(payload) { const { data } = await api.post('/products', payload); return data.data.product; },
  async update(id, payload) { const { data } = await api.put('/products/' + id, payload); return data.data.product; },
  async remove(id) { const { data } = await api.delete('/products/' + id); return data; }
};
export default productService;
`);

fs.writeFileSync(path.join(frontend, 'src/services/categoryService.js'), `import api from './api';
import localCatalog from './localCatalog';
const remote = Boolean(import.meta.env.VITE_API_URL);
const tree = () => localCatalog.categories.filter((c) => !c.parentSlug).map((c) => ({ ...c, children: localCatalog.categories.filter((child) => child.parentSlug === c.slug) }));
export const categoryService = {
  async getAll(params = {}) { if (!remote) return params.parentId === 0 || params.parentId === '0' ? localCatalog.categories.filter((c) => !c.parentSlug) : localCatalog.categories; try { const { data } = await api.get('/categories', { params }); return data.data.categories; } catch { return localCatalog.categories; } },
  async getTree() { if (!remote) return tree(); try { const { data } = await api.get('/categories/tree'); return data.data.categories; } catch { return tree(); } },
  async getById(id) { if (!remote) return localCatalog.categories.find((c) => String(c.id) === String(id)) || null; try { const { data } = await api.get('/categories/' + id); return data.data.category; } catch { return localCatalog.categories.find((c) => String(c.id) === String(id)) || null; } },
  async getBySlug(slug) { if (!remote) return localCatalog.categories.find((c) => c.slug === slug) || null; try { const { data } = await api.get('/categories/slug/' + slug); return data.data.category; } catch { return localCatalog.categories.find((c) => c.slug === slug) || null; } },
  async create(payload) { const { data } = await api.post('/categories', payload); return data.data.category; },
  async update(id, payload) { const { data } = await api.put('/categories/' + id, payload); return data.data.category; },
  async remove(id) { const { data } = await api.delete('/categories/' + id); return data; }
};
export default categoryService;
`);

const cssPath = path.join(frontend, 'src/styles/main.css');
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('Ajustes responsivos integrales')) css += `

/* Ajustes responsivos integrales para teléfonos y pantallas compactas */
html, body, #root { width: 100%; min-width: 320px; max-width: 100%; overflow-x: clip; }
.container { width: 100%; max-width: 1240px; padding-left: clamp(11px, 3vw, 20px); padding-right: clamp(11px, 3vw, 20px); }
.product-card, .section, .toolbar, .catalog-layout, .product-body { min-width: 0; }
.products-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); }
@media (max-width: 720px) {
  .header-top { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 9px 0 10px; }
  .menu-toggle { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; }
  .logo { min-width: 0; justify-self: start; }
  .logo img { width: auto; height: 42px; max-width: min(42vw, 150px); object-fit: contain; }
  .header-actions { display: flex; gap: 2px; margin-left: 0; justify-self: end; min-width: 0; }
  .header-actions .header-link { width: 38px; height: 38px; min-width: 38px; padding: 8px; justify-content: center; }
  .header-actions .header-link span:not(.cart-badge) { display: none; }
  .header-actions .header-link.hide-mobile { display: none; }
  .header-search { grid-column: 1 / -1; order: initial; width: 100%; max-width: none; min-width: 0; }
  .header-search form { width: 100%; min-height: 44px; }
  .header-search input { min-width: 0; width: 100%; padding: 10px 12px; font-size: 14px; }
  .search-btn { flex: 0 0 46px; padding: 0; }
  .header-categories { display: none; }
  .postal-code-bar-inner { flex-wrap: wrap; justify-content: center; padding: 6px 0; gap: 6px 10px; }
  .mobile-menu { left: 10px; right: 10px; width: auto; max-width: none; max-height: min(70vh, 520px); overflow-y: auto; }
  .section { margin-top: 22px; }
  .section-header { align-items: flex-start; gap: 10px; flex-wrap: wrap; }
  .section-title { min-width: 0; font-size: clamp(17px, 4.5vw, 21px); }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .product-card, .product-body { min-width: 0; }
  .product-body { padding: 10px; }
  .product-name { overflow-wrap: anywhere; }
  .product-price-row { flex-wrap: wrap; gap: 4px 7px; }
  .categories-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; }
  .toolbar-info, .toolbar-actions { width: 100%; min-width: 0; }
  .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .toolbar-actions select { min-width: 0; max-width: 100%; flex: 1 1 150px; }
  .breadcrumb { min-width: 0; flex-wrap: wrap; overflow-wrap: anywhere; }
  .hero { min-width: 0; padding: 24px 18px; }
  .hero h1 { font-size: clamp(23px, 6vw, 29px); overflow-wrap: anywhere; }
  .benefits { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .benefit, .footer-col { min-width: 0; }
  .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 420px) {
  .header-top { grid-template-columns: 36px minmax(0, 1fr) auto; gap: 6px; }
  .menu-toggle { width: 36px; height: 38px; }
  .logo img { height: 36px; max-width: 38vw; }
  .header-actions .header-link { width: 34px; height: 36px; min-width: 34px; padding: 6px; }
  .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .product-body { padding: 9px 8px 11px; }
  .product-name { font-size: 12.5px; line-height: 1.35; }
  .product-price { font-size: 16px; }
  .benefits, .footer-main { grid-template-columns: 1fr; }
  .footer-brand { grid-column: auto; }
  .btn, .btn-lg { white-space: normal; max-width: 100%; }
}
@media (min-width: 721px) and (max-width: 1024px) {
  .header-top { gap: 12px; }
  .logo img { height: 50px; }
  .header-link { padding: 8px; }
  .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
`;
fs.writeFileSync(cssPath, css);

console.log('Preparación completada: catálogo local de 141 productos y diseño responsivo aplicado.');
