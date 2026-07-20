import api from './api';

export const uploadService = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.image);
  },
  getUserImages: () => api.get('/uploads').then(r => r.data.images),
  deleteImage: (id: string) => api.delete(`/uploads/${id}`).then(r => r.data),
  reanalyzeImage: (id: string, prompt?: string) => api.post(`/uploads/${id}/analyze`, { prompt }).then(r => r.data.analysis),
};
