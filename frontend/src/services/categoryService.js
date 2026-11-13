import api from './api';

export const categoryService = {
  async getAll(params = {}) {
    const { data } = await api.get('/categories', { params });
    return data.data.categories;
  },

  async getTree() {
    const { data } = await api.get('/categories/tree');
    return data.data.categories;
  },

  async getById(id) {
    const { data } = await api.get(`/categories/${id}`);
    return data.data.category;
  },

  async getBySlug(slug) {
    const { data } = await api.get(`/categories/slug/${slug}`);
    return data.data.category;
  },

  async create(payload) {
    const { data } = await api.post('/categories', payload);
    return data.data.category;
  },

  async update(id, payload) {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data.data.category;
  },

  async remove(id) {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  }
};

export default categoryService;