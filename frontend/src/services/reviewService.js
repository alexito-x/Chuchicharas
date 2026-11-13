import api from './api';

export const reviewService = {
  async getProductReviews(productId, params = {}) {
    const { data } = await api.get(`/reviews/product/${productId}`, { params });
    return data.data;
  },

  async create(productId, payload) {
    const { data } = await api.post(`/reviews/product/${productId}`, payload);
    return data.data.review;
  },

  async remove(reviewId) {
    const { data } = await api.delete(`/reviews/${reviewId}`);
    return data;
  },

  async getAdminReviews(params = {}) {
    const { data } = await api.get('/reviews/admin/all', { params });
    return data.data;
  },

  async moderate(reviewId, isApproved) {
    const { data } = await api.put(`/reviews/admin/${reviewId}/moderate`, { isApproved });
    return data;
  }
};

export default reviewService;