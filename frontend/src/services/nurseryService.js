import api from './api.js';

export const nurseryService = {
  async getAll(params = {}) {
    const res = await api.get('/nurseries', { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/nurseries/${id}`);
    return res.data?.nursery;
  },
};

export default nurseryService;
