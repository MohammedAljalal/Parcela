import client from './client';

// GET /categories - public
export const getCategories = () => client.get('/categories');

// GET /categories/:slug
export const getCategoryBySlug = (slug) => client.get(`/categories/${slug}`);
