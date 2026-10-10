import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agripickup_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If sending FormData, delete Content-Type so browser sets boundary multipart/form-data
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
