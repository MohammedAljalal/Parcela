import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAddresses as getAddressesApi,
  createAddress as createAddressApi,
  updateAddress as updateAddressApi,
  deleteAddress as deleteAddressApi,
  setDefaultAddress as setDefaultAddressApi,
} from '../../api/addresses';

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchAddresses = createAsyncThunk(
  'addresses/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAddressesApi();
      return res.data?.data?.addresses ?? res.data?.addresses ?? res.data ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addAddress = createAsyncThunk(
  'addresses/addAddress',
  async (body, { rejectWithValue }) => {
    try {
      const res = await createAddressApi(body);
      return res.data?.data?.address ?? res.data?.address ?? res.data;
    } catch (err) {
      const msg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null)
        || err.message
        || 'Failed to add address';
      return rejectWithValue(msg);
    }
  }
);

export const editAddress = createAsyncThunk(
  'addresses/editAddress',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const res = await updateAddressApi(id, body);
      return res.data?.data?.address ?? res.data?.address ?? res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeAddress = createAsyncThunk(
  'addresses/removeAddress',
  async (id, { rejectWithValue }) => {
    try {
      await deleteAddressApi(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const makeDefaultAddress = createAsyncThunk(
  'addresses/makeDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      const res = await setDefaultAddressApi(id);
      return res.data?.data?.address ?? res.data?.address ?? { _id: id };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const addressSlice = createSlice({
  name: 'addresses',
  initialState: {
    list: [],
    defaultAddress: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAddressError: (state) => { state.error = null; },
    // Reset on logout so next user starts with an empty address list
    resetAddresses: () => ({
      list: [],
      defaultAddress: null,
      loading: false,
      saving: false,
      error: null,
    }),
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchAddresses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.defaultAddress = action.payload.find((a) => a.isDefault) ?? action.payload[0] ?? null;
      })
      .addCase(fetchAddresses.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    // Add
    builder
      .addCase(addAddress.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.list.push(action.payload);
          if (action.payload.isDefault) state.defaultAddress = action.payload;
        }
      })
      .addCase(addAddress.rejected, (state, action) => { state.saving = false; state.error = action.payload; });

    // Edit
    builder.addCase(editAddress.fulfilled, (state, action) => {
      const idx = state.list.findIndex((a) => a._id === action.payload._id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (action.payload.isDefault) state.defaultAddress = action.payload;
    });

    // Remove
    builder.addCase(removeAddress.fulfilled, (state, action) => {
      state.list = state.list.filter((a) => a._id !== action.payload);
      if (state.defaultAddress?._id === action.payload) {
        state.defaultAddress = state.list[0] ?? null;
      }
    });

    // Set default
    builder.addCase(makeDefaultAddress.fulfilled, (state, action) => {
      state.list = state.list.map((a) => ({ ...a, isDefault: a._id === action.payload._id }));
      state.defaultAddress = state.list.find((a) => a.isDefault) ?? null;
    });
  },
});

export const { clearAddressError, resetAddresses } = addressSlice.actions;
export default addressSlice.reducer;
