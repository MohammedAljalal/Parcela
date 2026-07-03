import api from './client';

export const listIslands = () =>
  api.get('/islands', { params: { includeInactive: true } }).then((r) => r.data.data.islands);

export const createIsland = (payload) => api.post('/islands', payload).then((r) => r.data.data.island);

export const updateIsland = (id, payload) => api.put(`/islands/${id}`, payload).then((r) => r.data.data.island);

export const deleteIsland = (id) => api.delete(`/islands/${id}`).then((r) => r.data);
