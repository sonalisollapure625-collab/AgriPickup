import api from './api.js';

export const productService = {
  async getAll(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/products/${id}`);
    return res.data?.product;
  },
};

export default productService;
