import api from './client';

export const listCouponsAdmin = (params) => api.get('/coupons', { params }).then((r) => r.data);

export const createCoupon = (payload) => api.post('/coupons', payload).then((r) => r.data.data.coupon);

export const updateCoupon = (id, payload) => api.put(`/coupons/${id}`, payload).then((r) => r.data.data.coupon);

export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then((r) => r.data);
