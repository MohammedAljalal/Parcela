import client from './client';

export const loginWithPhone = async (phone) => {
  const response = await client.post('/auth/login', { phone });
  return response.data;
};

export const loginWithEmail = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const registerWithPhone = async (name, phone) => {
  // Mock endpoint, update when backend is ready
  const response = await client.post('/auth/register', { name, phone });
  return response.data;
};

export const registerWithEmail = async (name, email, password) => {
  // Mock endpoint, update when backend is ready
  const response = await client.post('/auth/register', { name, email, password });
  return response.data;
};

export { loginWithGoogleApi } from './googleAuth';
