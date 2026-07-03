// Central axios instance: attaches the access token to every request and
// transparently refreshes it on a 401 before retrying the original request once.
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getAccessToken = () => localStorage.getItem('parcela_admin_access_token');
const getRefreshToken = () => localStorage.getItem('parcela_admin_refresh_token');

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('parcela_admin_access_token', accessToken);
  if (refreshToken) localStorage.setItem('parcela_admin_refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('parcela_admin_access_token');
  localStorage.removeItem('parcela_admin_refresh_token');
  localStorage.removeItem('parcela_admin_user');
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const resolveQueue = (token) => {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Never attempt to refresh for the auth endpoints themselves.
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another request already triggered a refresh — wait for it instead of firing a second one.
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.token;
        const newRefreshToken = data.data.refreshToken;

        setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        resolveQueue(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
