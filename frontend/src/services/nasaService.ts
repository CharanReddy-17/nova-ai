import api from './api';

export const nasaService = {
  getAPOD: (date?: string) => api.get('/nasa/apod', { params: { date } }).then(r => r.data),
  searchImages: (q: string, count = 6) => api.get<{images: NASAImage[]}>('/nasa/images', { params: { q, count } }).then(r => r.data.images),
  getMarsPhotos: (rover = 'curiosity', count = 6) => api.get('/nasa/mars', { params: { rover, count } }).then(r => r.data.photos),
  getNEOs: () => api.get('/nasa/neo').then(r => r.data),
  getExoplanetCount: () => api.get('/nasa/exoplanets').then(r => r.data.count),
};

export interface NASAImage { url: string; title: string; description: string; date: string; nasaId: string; }
