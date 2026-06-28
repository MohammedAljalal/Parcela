import client from './client';

// GET /wishlist
export const getWishlist = () => client.get('/wishlist');

// GET /wishlist/check/:productId
export const checkInWishlist = (productId) => client.get(`/wishlist/check/${productId}`);

// POST /wishlist/:productId
export const addToWishlist = (productId) => client.post(`/wishlist/${productId}`);

// DELETE /wishlist/:productId
export const removeFromWishlist = (productId) => client.delete(`/wishlist/${productId}`);
