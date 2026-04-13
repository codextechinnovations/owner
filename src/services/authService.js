import api from './api';

export const authService = {
  login: async (phone, password) => {
    const response = await api.post('/pg-owner/login', { phone, password });
    return response;
  },

  signup: async (data) => {
    const response = await api.post('/pg-owner/register', data);
    return response;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('owner');
    localStorage.removeItem('pgs');
    localStorage.removeItem('pg_id');
  },

  getCurrentUser: () => {
    const owner = localStorage.getItem('owner');
    return owner ? JSON.parse(owner) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

export default authService;
