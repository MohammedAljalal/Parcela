import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginWithEmail,
  loginWithPhone,
  registerWithEmail,
  registerWithPhone,
  loginWithGoogleApi,
} from '../../api/auth';

// Initial State
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  isInitialized: false,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      // Backend returns "token" field — normalise to "accessToken"
      state.accessToken = action.payload.accessToken ?? action.payload.token ?? null;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logoutSuccess,
  setInitialized,
  clearError,
} = authSlice.actions;

// Helper: persist auth data to AsyncStorage
const persistAuthData = async (data) => {
  const authData = {
    user: data.user,
    // Normalise: backend sends "token", we store as "accessToken"
    accessToken: data.accessToken ?? data.token ?? null,
    refreshToken: data.refreshToken ?? null,
  };
  await AsyncStorage.setItem('authData', JSON.stringify(authData));
  return authData;
};

// Thunk: Load from AsyncStorage on app boot
export const loadUserFromStorage = () => async (dispatch) => {
  try {
    const raw = await AsyncStorage.getItem('authData');
    if (raw) {
      const authData = JSON.parse(raw);
      if (authData?.accessToken) {
        dispatch(loginSuccess(authData));
      }
    }
  } catch (err) {
    console.error('[Auth] Failed to load from storage:', err);
  } finally {
    dispatch(setInitialized());
  }
};

// Thunk: Register
export const registerUser = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    let data;
    if (credentials.type === 'phone') {
      data = await registerWithPhone(credentials.name, credentials.phone);
    } else {
      data = await registerWithEmail(credentials.name, credentials.email, credentials.password);
    }

    // data is the full API response — handle both { data: {...} } and { user, token, ... }
    const payload = data?.data ?? data;

    const normalized = await persistAuthData(payload);
    dispatch(loginSuccess(normalized));
    return { success: true };
  } catch (err) {
    const message =
      err.response?.data?.message ||
      (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
      err.message ||
      'Registration failed';
    dispatch(loginFailure(message));
    return { success: false, message };
  }
};

// Thunk: Login
export const loginUser = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    let data;
    if (credentials.type === 'phone') {
      data = await loginWithPhone(credentials.phone);
    } else {
      data = await loginWithEmail(credentials.email, credentials.password);
    }

    // data is the full API response — handle both { data: {...} } and { user, token, ... }
    const payload = data?.data ?? data;

    const normalized = await persistAuthData(payload);
    dispatch(loginSuccess(normalized));
    return { success: true };
  } catch (err) {
    console.error('[loginUser] Full error:', err);
    if (err.response) {
      console.error('[loginUser] Error Response Data:', err.response.data);
    }
    
    const message =
      err.response?.data?.message ||
      (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
      err.message ||
      'Login failed';
    dispatch(loginFailure(message));
    return { success: false, message };
  }
};

// Thunk: Login with Google
export const loginWithGoogle = (idToken) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const data = await loginWithGoogleApi(idToken);
    
    const payload = data?.data ?? data;

    const normalized = await persistAuthData(payload);
    dispatch(loginSuccess(normalized));
    return { success: true };
  } catch (err) {
    console.error('[loginWithGoogle] Full error:', err);
    
    const message =
      err.response?.data?.message ||
      (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
      err.message ||
      'Google Login failed';
    dispatch(loginFailure(message));
    return { success: false, message };
  }
};


// Thunk: Logout
export const logout = () => async (dispatch) => {
  try {
    await AsyncStorage.removeItem('authData');
  } catch (err) {
    console.error('[Auth] Failed to clear storage:', err);
  }
  dispatch(logoutSuccess());
};

export default authSlice.reducer;
