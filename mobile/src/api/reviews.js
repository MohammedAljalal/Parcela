import client from './client';

// GET /reviews/product/:productId - public
export const getProductReviews = (productId) => client.get(`/reviews/product/${productId}`);

// POST /reviews - create a review (authenticated)
export const createReview = (body) => client.post('/reviews', body);

// PUT /reviews/:id - update your review
export const updateReview = (reviewId, body) => client.put(`/reviews/${reviewId}`, body);

// DELETE /reviews/:id - delete your review
export const deleteReview = (reviewId) => client.delete(`/reviews/${reviewId}`);

// GET /reviews/me - get my reviews
export const getMyReviews = () => client.get('/reviews/me');
