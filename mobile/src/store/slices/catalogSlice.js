import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories as getCategoriesApi } from '../../api/categories';
import { getBanners as getBannersApi } from '../../api/banners';

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCategoriesApi();
      return res.data?.data?.categories ?? res.data?.categories ?? res.data ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBanners = createAsyncThunk(
  'catalog/fetchBanners',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getBannersApi();
      return res.data?.data?.banners ?? res.data?.banners ?? res.data ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: [],
    banners: [],
    loadingCategories: false,
    loadingBanners: false,
    errorCategories: null,
    errorBanners: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Categories
    builder
      .addCase(fetchCategories.pending, (state) => { state.loadingCategories = true; state.errorCategories = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loadingCategories = false; state.categories = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loadingCategories = false; state.errorCategories = action.payload; });

    // Banners
    builder
      .addCase(fetchBanners.pending, (state) => { state.loadingBanners = true; state.errorBanners = null; })
      .addCase(fetchBanners.fulfilled, (state, action) => { state.loadingBanners = false; state.banners = action.payload; })
      .addCase(fetchBanners.rejected, (state, action) => { state.loadingBanners = false; state.errorBanners = action.payload; });
  },
});

export default catalogSlice.reducer;
