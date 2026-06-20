import client from './client';

export const loginWithGoogleApi = async (idToken) => {
  const response = await client.post('/auth/google', { idToken });
  return response.data;
};
