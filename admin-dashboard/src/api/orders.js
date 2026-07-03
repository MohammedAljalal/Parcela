import api from './client';

export const listOrdersAdmin = (params) => api.get('/orders/admin/all', { params }).then((r) => r.data);

export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data.data.order);

export const updateOrderStatus = (id, payload) =>
  api.put(`/orders/${id}/status`, payload).then((r) => r.data.data.order);
