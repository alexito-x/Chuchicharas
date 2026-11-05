import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email: email.trim(), password });
    return data.data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data.data.user;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    return data.data.user;
  },

  async changePassword(payload) {
    const { data } = await api.put('/auth/change-password', payload);
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
  }
};

export default authService;