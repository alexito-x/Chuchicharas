import api from './api';

export const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/users/dashboard/stats');
    return data.data;
  },

  async getUsers(params = {}) {
    const { data } = await api.get('/admin/users', { params });
    return data.data;
  },

  async getUser(id) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data.data.user;
  },

  async updateUser(id, payload) {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data.data.user;
  },

  async deleteUser(id) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  }
};

export default adminService;