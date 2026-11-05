import api from './api';

const parseFavorites = (response) => response.data.data.favorites;

export const favoriteService = {
  async getAll() {
    const response = await api.get('/favorites');
    return parseFavorites(response);
  },

  async add(productId) {
    const response = await api.post(`/favorites/${productId}`);
    return parseFavorites(response);
  },

  async remove(productId) {
    const response = await api.delete(`/favorites/${productId}`);
    return parseFavorites(response);
  }
};

export default favoriteService;
