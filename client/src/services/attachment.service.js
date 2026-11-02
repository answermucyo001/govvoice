import api from '../api/client';

export const attachmentService = {
  async upload(file, onProgress) {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      }
    });
    return response.data.data.attachment;
  },

  async remove(id) {
    await api.delete(`/attachments/${id}`);
  },

  async download(id, filename = 'attachment') {
    const response = await api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
      timeout: 60000
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
};

export default attachmentService;
