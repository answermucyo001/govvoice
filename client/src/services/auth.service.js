import api from '../api/client';

export const authService = {
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    return response.data.data;
  },

  async register(payload) {
    const response = await api.post('/auth/register', payload);
    return response.data.data;
  },

  async refresh() {
    const response = await api.post('/auth/refresh');
    return response.data.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async me() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  async updateProfile(payload) {
    const response = await api.patch('/auth/profile', payload);
    return response.data.data.user;
  },

  async changePassword(payload) {
    const response = await api.post('/auth/change-password', payload);
    return response.data.data;
  }
};

export default authService;
