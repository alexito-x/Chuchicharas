import api from './api';

export const productService = {
  async getProducts(params = {}) {
    const { data } = await api.get('/products', { params });
    return data.data;
  },

  async getProductById(id) {
    const { data } = await api.get(`/products/${id}`);
    return data.data.product;
  },

  async getProductBySlug(slug) {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data.data.product;
  },

  async getFeatured(limit = 8) {
    const { data } = await api.get('/products/featured', { params: { limit } });
    return data.data.products;
  },

  async getCategoryShowcase() {
    const { data } = await api.get('/products/category-showcase');
    return data.data.products;
  },

  async getRelated(id, limit = 4) {
    const { data } = await api.get(`/products/${id}/related`, { params: { limit } });
    return data.data.products;
  },

  async getSuggestions(q) {
    const { data } = await api.get('/products/search/suggestions', { params: { q } });
    return data.data.suggestions;
  },

  async getBrands() {
    const { data } = await api.get('/products/brands');
    return data.data.brands;
  },

  async getAdminProducts(params = {}) {
    const { data } = await api.get('/products/admin/all', { params });
    return data.data;
  },

  async create(payload) {
    const { data } = await api.post('/products', payload);
    return data.data.product;
  },

  async update(id, payload) {
    const { data } = await api.put(`/products/${id}`, payload);
    return data.data.product;
  },

  async remove(id) {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  }
};

export default productService;