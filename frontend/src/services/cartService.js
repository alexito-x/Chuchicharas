import api from './api';

export const cartService = {
  async getCart() {
    const { data } = await api.get('/cart');
    return data.data;
  },

  async getCount() {
    const { data } = await api.get('/cart/count');
    return data.data;
  },

  async add(productId, quantity = 1) {
    const { data } = await api.post('/cart', { productId, quantity });
    return data.data;
  },

  async update(productId, quantity) {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    return data.data;
  },

  async remove(productId) {
    const { data } = await api.delete(`/cart/${productId}`);
    return data.data;
  },

  async clear() {
    const { data } = await api.delete('/cart');
    return data.data;
  }
};

export default cartService;