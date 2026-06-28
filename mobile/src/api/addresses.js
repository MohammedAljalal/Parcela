import client from './client';

// ─── Addresses API ────────────────────────────────────────────────────────────

/** GET /addresses — list the current user's saved addresses */
export const getAddresses = () => client.get('/addresses');

/** GET /addresses/:id — get a single address */
export const getAddress = (addressId) => client.get(`/addresses/${addressId}`);

/**
 * POST /addresses — create a new address
 * @param {Object} body — { recipient, phone, address, city, island, label?, isDefault? }
 */
export const createAddress = (body) => client.post('/addresses', body);

/**
 * PUT /addresses/:id — update an address
 * @param {string} addressId
 * @param {Object} body — partial fields to update
 */
export const updateAddress = (addressId, body) =>
  client.put(`/addresses/${addressId}`, body);

/** DELETE /addresses/:id — delete an address */
export const deleteAddress = (addressId) =>
  client.delete(`/addresses/${addressId}`);

/** PUT /addresses/:id/default — set an address as the default */
export const setDefaultAddress = (addressId) =>
  client.put(`/addresses/${addressId}/default`);
