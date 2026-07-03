import api from './client';

export const listCategoriesAdmin = (params) => api.get('/categories/admin/all', { params }).then((r) => r.data);

export const createCategory = (payload) => api.post('/categories', payload).then((r) => r.data.data.category);

export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data.data.category);

export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);
