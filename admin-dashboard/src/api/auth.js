// Auth endpoints — admin dashboard only uses the email/password flow.
import api from './client';

export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data);

export const getMe = () => api.get('/auth/me').then((r) => r.data.data.user);

export const updateMyProfile = (payload) => api.patch('/auth/me', payload).then((r) => r.data.data.user);

export const logout = () => api.post('/auth/logout').catch(() => {});
