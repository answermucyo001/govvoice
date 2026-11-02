import api from '../api/client';

export const publicService = {
  async stats() {
    const response = await api.get('/public/stats');
    return response.data.data.stats;
  },

  async meta() {
    const response = await api.get('/public/meta');
    return response.data.data;
  },

  async list(params) {
    const response = await api.get('/public/submissions', { params });
    return response.data.data;
  },

  async detail(trackingNumber) {
    const response = await api.get(
      `/public/submissions/${encodeURIComponent(trackingNumber)}`
    );
    return response.data.data.submission;
  }
};

export default publicService;
