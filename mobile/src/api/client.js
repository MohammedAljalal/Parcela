import axios from 'axios';

// ─── Axios Instance ───────────────────────────────────────────────────────────
// baseURL comes from EXPO_PUBLIC_API_URL (mobile/.env). 127.0.0.1 only works
// when the app runs inside a simulator/emulator on the SAME machine as the
// backend — a physical phone on Expo Go needs your computer's LAN IP instead
// (e.g. http://192.168.1.42:5000/api). See deployment guide for how to find it.
const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Store Reference (avoids circular imports) ────────────────────────────────
// Call injectStore(store) once in _layout.tsx after the store is created.
let _store = null;
export const injectStore = (store) => {
  _store = store;
};

// ─── Public endpoints that should NEVER trigger an auto-logout on 401 ─────────
// These are routes where 401 just means "wrong credentials", not "session expired"
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/otp/send',
  '/auth/otp/verify',
  '/auth/refresh',
];

const isPublicEndpoint = (url) => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

// ─── Request Interceptor: attach JWT token ────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = _store?.getState?.()?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `[API] → ${config.method?.toUpperCase()} ${config.url}`,
      token ? '(authenticated)' : '(public)'
    );
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor: auto-logout on 401 (protected routes only) ─────────
client.interceptors.response.use(
  (response) => {
    console.log(`[API] ← ${response.status} ${response.config?.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(
      `[API] ← ${status ?? 'ERR'} ${url}:`,
      error.response?.data?.message ?? error.message
    );

    // Only auto-logout on 401 for PROTECTED endpoints (not login/register/etc.)
    if (status === 401 && _store && !isPublicEndpoint(url)) {
      console.warn('[API] 401 on protected route — clearing session');
      _store.dispatch({ type: 'auth/logoutSuccess' });
    }

    return Promise.reject(error);
  }
);

export default client;
