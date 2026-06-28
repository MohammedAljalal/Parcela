import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginWithEmail,
  loginWithPhone,
  registerWithEmail,
  registerWithPhone,
  loginWithGoogleApi,
  getMe,
  refreshTokens,
  logoutApi,
  sendOtpApi,
  verifyOtpApi,
  updateProfileApi,
} from '../../api/auth';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from '../../services/authStorage';

// ─── Helper: persist auth data to SecureStore ─────────────────────────────────
const persistAuthData = async (payload) => {
  const accessToken = payload.accessToken ?? payload.token ?? null;
  const refreshToken = payload.refreshToken ?? null;

  if (!accessToken) {
    console.warn('[Auth] persistAuthData: no accessToken found in payload', payload);
  }

  await saveTokens(accessToken, refreshToken);
  console.log('[Auth] Tokens saved. User:', payload.user?.email ?? payload.user?.phone ?? payload.user?._id);

  return {
    user: payload.user,
    accessToken,
    refreshToken,
  };
};

// ─── Thunk: Bootstrap Auth (Silent Login on app launch) ───────────────────────
export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrapAuth',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();

      console.log('[Auth] Bootstrap — accessToken found:', !!accessToken);

      if (!accessToken) {
        return null; // Not logged in
      }

      try {
        // Fetch user profile, passing the token directly because Redux state is
        // still empty at this point — the interceptor won't add it automatically.
        const meData = await getMe(accessToken);
        const user = meData?.data?.user ?? meData?.user ?? meData?.data;
        console.log('[Auth] Bootstrap — user fetched:', user?._id);
        return {
          user,
          accessToken,
          refreshToken,
        };
      } catch (err) {
        console.warn('[Auth] Bootstrap — getMe failed:', err.response?.status, err.message);

        // If 401 and we have a refreshToken, try to get a new accessToken
        if (err.response?.status === 401 && refreshToken) {
          try {
            console.log('[Auth] Bootstrap — attempting token refresh...');
            const refreshData = await refreshTokens(refreshToken);
            const payload = refreshData?.data ?? refreshData;
            const result = await persistAuthData(payload);
            console.log('[Auth] Bootstrap — token refreshed successfully');
            return result;
          } catch (refreshErr) {
            console.error('[Auth] Bootstrap — token refresh failed:', refreshErr.message);
            await clearTokens();
            return rejectWithValue('Session expired');
          }
        }

        // Any other error — clear tokens and treat as logged out
        await clearTokens();
        return rejectWithValue(err.message);
      }
    } catch (err) {
      console.error('[Auth] Bootstrap — unexpected error:', err.message);
      return rejectWithValue(err.message);
    }
  }
);

// ─── Thunk: Register ──────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (credentials, { rejectWithValue }) => {
    try {
      let data;
      if (credentials.type === 'phone') {
        data = await registerWithPhone(credentials.name, credentials.phone);
      } else {
        data = await registerWithEmail(credentials.name, credentials.email, credentials.password);
      }

      const payload = data?.data ?? data;
      console.log('[Auth] registerUser — API response user:', payload?.user?._id);

      return await persistAuthData(payload);
    } catch (err) {
      console.error('[Auth] registerUser — error:', err.response?.data ?? err.message);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// ─── Thunk: Login ─────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      let data;
      if (credentials.type === 'phone') {
        data = await loginWithPhone(credentials.phone);
      } else {
        data = await loginWithEmail(credentials.email, credentials.password);
      }

      const payload = data?.data ?? data;
      console.log('[Auth] loginUser — API response user:', payload?.user?._id);

      return await persistAuthData(payload);
    } catch (err) {
      console.error('[Auth] loginUser — error:', err.response?.data ?? err.message);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Login failed';
      return rejectWithValue(message);
    }
  }
);

// ─── Thunk: Send OTP ─────────────────────────────────────────────────────────
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phone, { rejectWithValue }) => {
    try {
      const data = await sendOtpApi(phone);
      // Return the phone so the OTP screen knows which number to verify
      return { phone, expiresIn: data?.data?.expiresIn ?? 300 };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Falha ao enviar código';
      return rejectWithValue(message);
    }
  }
);

// ─── Thunk: Verify OTP ────────────────────────────────────────────────────────
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, code, name }, { rejectWithValue }) => {
    try {
      const data = await verifyOtpApi(phone, code, name);
      const payload = data?.data ?? data;
      console.log('[Auth] verifyOtp — user:', payload?.user?._id);
      return await persistAuthData(payload);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Código inválido ou expirado';
      return rejectWithValue(message);
    }
  }
);

// ─── Thunk: Login with Google ─────────────────────────────────────────────────
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      console.log('[Auth] loginWithGoogle — sending idToken to backend...');
      const data = await loginWithGoogleApi(idToken);
      const payload = data?.data ?? data;
      console.log('[Auth] loginWithGoogle — API response user:', payload?.user?._id);

      return await persistAuthData(payload);
    } catch (err) {
      console.error('[Auth] loginWithGoogle — error:', err.response?.data ?? err.message);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Google Login failed';
      return rejectWithValue(message);
    }
  }
);

// ─── Thunk: Update Profile ──────────────────────────────────────────────────────
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      console.log('[Auth] updateProfile — sending data:', data);
      // Use top-level import instead of dynamic require()
      const response = await updateProfileApi(data);
      const payload = response?.data ?? response;
      console.log('[Auth] updateProfile — success:', payload?.user?._id);
      return payload.user;
    } catch (err) {
      console.error('[Auth] updateProfile — error:', err.response?.data ?? err.message);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
        err.message ||
        'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  loadingOtp: false,   // sending OTP code
  error: null,
  isInitialized: false,
  otpPhone: null,      // phone pending OTP verification
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Dispatched directly by client.js interceptor on 401 (protected routes)
    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearOtpPhone: (state) => {
      state.otpPhone = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── bootstrapAuth ──────────────────────────────────────────────────────
    builder.addCase(bootstrapAuth.pending, () => {
      // isInitialized stays false until done — _layout.tsx shows a spinner
    });
    builder.addCase(bootstrapAuth.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      }
      state.isInitialized = true;
    });
    builder.addCase(bootstrapAuth.rejected, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isInitialized = true;
    });

    // ── loginUser ──────────────────────────────────────────────────────────
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ── registerUser ───────────────────────────────────────────────────────
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ── loginWithGoogle ────────────────────────────────────────────────────
    builder.addCase(loginWithGoogle.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginWithGoogle.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    });
    builder.addCase(loginWithGoogle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ── updateProfile ────────────────────────────────────────────────────────
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload; // Update user object in state
      state.error = null;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ── sendOtp ────────────────────────────────────────────────────────────
    builder.addCase(sendOtp.pending, (state) => {
      state.loadingOtp = true;
      state.error = null;
    });
    builder.addCase(sendOtp.fulfilled, (state, action) => {
      state.loadingOtp = false;
      state.otpPhone = action.payload.phone;
      state.error = null;
    });
    builder.addCase(sendOtp.rejected, (state, action) => {
      state.loadingOtp = false;
      state.error = action.payload;
    });

    // ── verifyOtp ──────────────────────────────────────────────────────────
    builder.addCase(verifyOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.otpPhone = null;
      state.error = null;
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logoutSuccess, clearError, clearOtpPhone } = authSlice.actions;

// ─── Thunk: Logout (clears backend session + local storage + Redux state) ──────
export const logout = () => async (dispatch, getState) => {
  try {
    // Only call backend logout if we have a valid token
    const token = getState().auth.accessToken;
    if (token) {
      console.log('[Auth] Calling backend /auth/logout...');
      await logoutApi();
      console.log('[Auth] Backend session cleared.');
    }
  } catch (err) {
    // Non-critical: if backend logout fails, still clear local session
    console.warn('[Auth] Backend logout failed (continuing anyway):', err.message);
  } finally {
    await clearTokens();
    // Clear auth state
    dispatch(logoutSuccess());
    // Clear all user-specific state to prevent data leaks between sessions
    dispatch({ type: 'cart/resetCart' });
    dispatch({ type: 'wishlist/resetWishlist' });
    dispatch({ type: 'orders/resetOrders' });
    dispatch({ type: 'addresses/resetAddresses' });
    console.log('[Auth] Local session cleared.');
  }
};

export default authSlice.reducer;
