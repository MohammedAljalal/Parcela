import client from './client';

// ─── Islands API ──────────────────────────────────────────────────────────────

/**
 * GET /islands — list all active islands
 * Admins can pass includeInactive=true to see disabled islands.
 */
export const getIslands = (params = {}) => client.get('/islands', { params });

/** GET /islands/:id — get a single island by ID */
export const getIsland = (islandId) => client.get(`/islands/${islandId}`);
