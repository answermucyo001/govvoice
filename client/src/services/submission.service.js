import api from '../api/client';

export const submissionService = {
  async create(payload) {
    const response = await api.post('/submissions', payload);
    return response.data.data.submission;
  },

  async listMine(params) {
    const response = await api.get('/submissions', { params });
    return response.data.data;
  },

  async myStats() {
    const response = await api.get('/submissions/stats/mine');
    return response.data.data.stats;
  },

  async getMine(id) {
    const response = await api.get(`/submissions/${id}`);
    return response.data.data.submission;
  },

  async track(trackingNumber) {
    const response = await api.get(`/submissions/track/${encodeURIComponent(trackingNumber)}`);
    return response.data.data.submission;
  },

  async confirm(id, payload) {
    const response = await api.post(`/submissions/${id}/confirm`, payload);
    return response.data.data.submission;
  },

  async reopen(id, payload) {
    const response = await api.post(`/submissions/${id}/reopen`, payload);
    return response.data.data.submission;
  },

  async reply(id, payload) {
    const response = await api.post(`/submissions/${id}/reply`, payload);
    return response.data.data.submission;
  }
};

export default submissionService;
