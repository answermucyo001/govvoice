import api from '../api/client';

export const superAdminService = {
  async overview() {
    const response = await api.get('/super-admin/overview');
    return response.data.data;
  },

  async listHeads() {
    const response = await api.get('/super-admin/district-heads');
    return response.data.data.districtHeads;
  },

  async listDistricts() {
    const response = await api.get('/super-admin/districts');
    return response.data.data.districts;
  },

  async createHead(payload) {
    const response = await api.post('/super-admin/district-heads', payload);
    return response.data.data;
  },

  async updateHead(id, payload) {
    const response = await api.patch(`/super-admin/district-heads/${id}`, payload);
    return response.data.data.districtHead;
  },

  async toggleHead(id, isActive) {
    const response = await api.patch(`/super-admin/district-heads/${id}/status`, {
      isActive
    });
    return response.data.data.districtHead;
  },

  async resetPassword(id) {
    const response = await api.post(`/super-admin/district-heads/${id}/reset-password`);
    return response.data.data;
  },

  async auditLogs(limit = 50) {
    const response = await api.get('/super-admin/audit-logs', { params: { limit } });
    return response.data.data.auditLogs;
  },

  async notifications() {
    const response = await api.get('/super-admin/notifications');
    return response.data.data.notifications;
  },

  async statuses() {
    const response = await api.get('/super-admin/statuses');
    return response.data.data.statuses;
  }
};

export default superAdminService;
