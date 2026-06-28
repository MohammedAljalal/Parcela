import client from './client';

// ─── Orders API ───────────────────────────────────────────────────────────────

/**
 * GET /orders — list current user's orders
 * @param {Object} params — optional { status, page, limit }
 */
export const getOrders = (params = {}) => client.get('/orders', { params });

/** GET /orders/:id — get a single order by ID */
export const getOrder = (orderId) => client.get(`/orders/${orderId}`);

/**
 * POST /orders — create an order from the current cart (checkout)
 * @param {Object} body — { addressId, islandId, paymentMethod, couponCode? }
 */
export const createOrder = (body) => client.post('/orders', body);

/** PUT /orders/:id/cancel — cancel an order (only while pending/paid) */
export const cancelOrder = (orderId) =>
  client.put(`/orders/${orderId}/cancel`);
