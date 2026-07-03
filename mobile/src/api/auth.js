import client from './client';

/** POST /api/auth/otp/send — sends a verification code via SMS */
export const sendOtpApi = async (phone) => {
  const response = await client.post('/auth/otp/send', { phone });
  return response.data;
};

/** POST /api/auth/otp/verify — verifies the code and logs in (or creates account) */
export const verifyOtpApi = async (phone, code, name) => {
  const body = name ? { phone, code, name } : { phone, code };
  const response = await client.post('/auth/otp/verify', body);
  return response.data;
};

export const loginWithPhone = async (phone) => {
  const response = await client.post('/auth/login', { phone });
  return response.data;
};

export const loginWithEmail = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const registerWithPhone = async (name, phone) => {
  const response = await client.post('/auth/register', { name, phone });
  return response.data;
};

export const registerWithEmail = async (name, email, password) => {
  const response = await client.post('/auth/register', { name, email, password });
  return response.data;
};

/**
 * Fetch the current user's profile.
 * @param {string} [tokenOverride] - Optional: pass a token directly (used during bootstrap
 *   before the token is loaded into Redux state and the interceptor can pick it up).
 */
export const getMe = async (tokenOverride) => {
  const config = tokenOverride
    ? { headers: { Authorization: `Bearer ${tokenOverride}` } }
    : {};
  const response = await client.get('/auth/me', config);
  return response.data;
};

export const refreshTokens = async (refreshToken) => {
  const response = await client.post('/auth/refresh', { refreshToken });
  return response.data;
};

/**
 * Calls POST /api/auth/logout to invalidate the refresh token in the database.
 * Should be called before clearing local tokens.
 */
export const logoutApi = async () => {
  const response = await client.post('/auth/logout');
  return response.data;
};

/**
 * Updates the user's profile information.
 * @param {Object} data - Profile data to update (e.g., name, avatar, preferredLanguage)
 */
export const updateProfileApi = async (data) => {
  const response = await client.patch('/auth/me', data);
  return response.data;
};

export { loginWithGoogleApi } from './googleAuth';
