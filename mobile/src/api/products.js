import client from './client';

export const getProducts = (params = {}) => client.get('/products', { params });

/** GET /products/:slug — get a single product by slug */
export const getProductBySlug = (slug) => client.get(`/products/${slug}`);

