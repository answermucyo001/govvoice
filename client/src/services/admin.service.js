import api from '../api/client';

export const adminService = {
  async stats() {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  async list(params) {
    const response = await api.get('/admin/submissions', { params });
    return response.data.data;
  },

  async detail(id) {
    const response = await api.get(`/admin/submissions/${id}`);
    return response.data.data.submission;
  },

  async updateStatus(id, payload) {
    const response = await api.patch(`/admin/submissions/${id}/status`, payload);
    return response.data.data.submission;
  }
};

export default adminService;
