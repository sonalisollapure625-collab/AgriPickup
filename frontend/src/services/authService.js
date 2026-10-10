import api from './api.js';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data?.token) {
      localStorage.setItem('agripickup_token', res.data.token);
    }
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.token) {
      localStorage.setItem('agripickup_token', res.data.token);
    }
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data?.user;
  },

  logout() {
    localStorage.removeItem('agripickup_token');
  },

  getToken() {
    return localStorage.getItem('agripickup_token');
  },
};

export default authService;
