import api from './api';

export const orderService = {
  async create(payload) {
    const { data } = await api.post('/orders', payload);
    return data.data.order;
  },

  async getAll(params = {}) {
    const { data } = await api.get('/orders', { params });
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/orders/${id}`);
    return data.data.order;
  },

  async cancel(id) {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data;
  },

  async pay(id) {
    const { data } = await api.post(`/orders/${id}/pay`);
    return data.data;
  },

  async getAdminOrders(params = {}) {
    const { data } = await api.get('/orders/admin/all', { params });
    return data.data;
  },

  async getStats() {
    const { data } = await api.get('/orders/admin/stats');
    return data.data.stats;
  },

  async updateStatus(id, payload) {
    const { data } = await api.put(`/orders/${id}/status`, payload);
    return data;
  }
};

export default orderService;