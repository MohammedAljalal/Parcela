import api from './client';

export const listUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);

export const getUser = (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data);

export const createUser = (payload) => api.post('/admin/users', payload).then((r) => r.data.data.user);

export const updateUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then((r) => r.data.data.user);

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data.data.user);

export const updateUserRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data.data.user);

export const resetUserPassword = (id, password) =>
  api.put(`/admin/users/${id}/password`, { password }).then((r) => r.data);

export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

export const getUserOrders = (id) => api.get(`/admin/users/${id}/orders`).then((r) => r.data.data.orders);

export const getUserAddresses = (id) => api.get(`/admin/users/${id}/addresses`).then((r) => r.data.data.addresses);
