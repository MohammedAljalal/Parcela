import api from './client';

// Reviews
export const listReviewsAdmin = (params) => api.get('/reviews/admin/all', { params }).then((r) => r.data);

export const moderateReview = (id, isActive) =>
  api.patch(`/reviews/${id}/moderate`, { isActive }).then((r) => r.data.data.review);

// Banners
export const listBannersAdmin = () => api.get('/banners/admin/all').then((r) => r.data.data.banners);

const buildBannerFormData = (payload, imageFile) => {
  const formData = new FormData();
  formData.append('title', JSON.stringify(payload.title ?? { pt: '', en: '' }));
  formData.append('subtitle', JSON.stringify(payload.subtitle ?? { pt: '', en: '' }));
  formData.append('ctaLabel', JSON.stringify(payload.ctaLabel ?? { pt: '', en: '' }));
  if (payload.ctaLink) formData.append('ctaLink', payload.ctaLink);
  if (payload.island) formData.append('island', payload.island);
  if (payload.isActive !== undefined) formData.append('isActive', payload.isActive);
  if (payload.sortOrder !== undefined) formData.append('sortOrder', payload.sortOrder);
  if (payload.startDate) formData.append('startDate', payload.startDate);
  if (payload.endDate) formData.append('endDate', payload.endDate);
  if (imageFile) formData.append('image', imageFile);
  return formData;
};

export const createBanner = (payload, imageFile) =>
  api
    .post('/banners', buildBannerFormData(payload, imageFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data.banner);

export const updateBanner = (id, payload, imageFile) =>
  api
    .put(`/banners/${id}`, buildBannerFormData(payload, imageFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data.banner);

export const deleteBanner = (id) => api.delete(`/banners/${id}`).then((r) => r.data);

// Notifications
export const broadcastNotification = (payload) =>
  api.post('/admin/notifications/broadcast', payload).then((r) => r.data);

// Security
export const listOtpLogs = (params) => api.get('/admin/security/otp-logs', { params }).then((r) => r.data);

export const unblockOtpLog = (id) => api.patch(`/admin/security/otp-logs/${id}/unblock`).then((r) => r.data);

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats').then((r) => r.data.data);

export const getDashboardCharts = () => api.get('/admin/dashboard/charts').then((r) => r.data.data);

export const getRecentActivity = () => api.get('/admin/dashboard/recent').then((r) => r.data.data);
