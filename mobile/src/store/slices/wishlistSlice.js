import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getWishlist as getWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from '../../api/wishlist';

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getWishlistApi();
      return res.data?.data?.wishlist?.products ?? res.data?.wishlist?.products ?? [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { items } = getState().wishlist;
      const isInWishlist = items.some((item) => {
        const id = item.product?._id ?? item.product ?? item._id;
        return id === productId;
      });

      if (isInWishlist) {
        await removeFromWishlistApi(productId);
        return { action: 'removed', productId };
      } else {
        await addToWishlistApi(productId);
        return { action: 'added', productId };
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],          // array of wishlist items (each has product info)
    productIds: [],     // quick lookup set of product IDs in wishlist
    loading: false,
    error: null,
  },
  reducers: {
    // Reset on logout so next user starts with an empty wishlist
    resetWishlist: () => ({
      items: [],
      productIds: [],
      loading: false,
      error: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.productIds = action.payload.map((item) => item.product?._id ?? item.product ?? item._id);
      })
      .addCase(fetchWishlist.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder.addCase(toggleWishlist.fulfilled, (state, action) => {
      const { action: act, productId } = action.payload;
      if (act === 'removed') {
        state.items = state.items.filter((i) => {
          const id = i.product?._id ?? i.product ?? i._id;
          return id !== productId;
        });
        state.productIds = state.productIds.filter((id) => id !== productId);
      } else {
        if (!state.productIds.includes(productId)) {
          state.productIds.push(productId);
        }
        // Push a simple representation of the item so we can toggle it again without reloading
        state.items.push({ product: { _id: productId } });
      }
    });
  },
});

export const { resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
