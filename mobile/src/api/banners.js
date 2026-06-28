import client from './client';

// GET /banners - active banners (public)
export const getBanners = () => client.get('/banners');
