import api from '../api/client';

export const sectorHeadService = {
  async list() {
    const response = await api.get('/admin/sector-heads');
    return response.data.data.sectorHeads;
  },
  async create(payload) {
    const response = await api.post('/admin/sector-heads', payload);
    return response.data.data;
  },
  async toggle(id, isActive) {
    const response = await api.patch(`/admin/sector-heads/${id}/status`, { isActive });
    return response.data.data.sectorHead;
  },
  async resetPassword(id) {
    const response = await api.post(`/admin/sector-heads/${id}/reset-password`);
    return response.data.data;
  }
};

export default sectorHeadService;
