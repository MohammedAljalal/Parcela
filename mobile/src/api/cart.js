import client from './client';

// ─── Cart API ─────────────────────────────────────────────────────────────────

/** GET /cart — fetch the current user's cart with computed totals */
export const getCart = () => client.get('/cart');

/** POST /cart/items — add a product to the cart */
export const addToCart = (productId, quantity = 1) =>
  client.post('/cart/items', { productId, quantity });

/** PUT /cart/items/:productId — update the quantity of a cart item */
export const updateCartItem = (productId, quantity) =>
  client.put(`/cart/items/${productId}`, { quantity });

/** DELETE /cart/items/:productId — remove a single item from the cart */
export const removeCartItem = (productId) =>
  client.delete(`/cart/items/${productId}`);

/** PUT /cart/island — set the delivery island for the cart */
export const setDeliveryIsland = (islandId) =>
  client.put('/cart/island', { islandId });

/** DELETE /cart — clear the entire cart */
export const clearCart = () => client.delete('/cart');
