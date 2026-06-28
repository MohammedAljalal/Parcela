import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  setDeliveryIsland,
  clearCart as clearCartApi,
} from '../../api/cart';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  deliveryIsland: null, // { _id, name, code, deliveryFee }
  deliveryFee: 0,
  total: 0,
  loading: false,
  // Granular loading flags for optimistic UI (keyed by productId)
  updatingItems: {},  // { [productId]: true }
  error: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractCartData = (payload) => ({
  items: payload?.cart?.items ?? [],
  itemCount: payload?.cart?.itemCount ?? 0,
  subtotal: payload?.cart?.subtotal ?? 0,
  deliveryIsland: payload?.cart?.deliveryIsland ?? null,
  deliveryFee: payload?.cart?.deliveryFee ?? 0,
  total: payload?.cart?.total ?? 0,
});

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCart();
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao carregar carrinho'
      );
    }
  }
);

export const addItem = createAsyncThunk(
  'cart/addItem',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await addToCart(productId, quantity);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao adicionar ao carrinho'
      );
    }
  }
);

export const updateItem = createAsyncThunk(
  'cart/updateItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const res = await updateCartItem(productId, quantity);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao atualizar item'
      );
    }
  }
);

export const removeItem = createAsyncThunk(
  'cart/removeItem',
  async ({ productId }, { rejectWithValue }) => {
    try {
      const res = await removeCartItem(productId);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao remover item'
      );
    }
  }
);

export const setIsland = createAsyncThunk(
  'cart/setIsland',
  async ({ islandId }, { rejectWithValue }) => {
    try {
      const res = await setDeliveryIsland(islandId);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao definir ilha'
      );
    }
  }
);

export const emptyCart = createAsyncThunk(
  'cart/emptyCart',
  async (_, { rejectWithValue }) => {
    try {
      await clearCartApi();
      return null;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao limpar carrinho'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    // Reset the entire cart (e.g. after logout)
    resetCart: () => initialState,
  },
  extraReducers: (builder) => {
    // ── fetchCart ──
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, extractCartData(action.payload));
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── addItem ──
    builder
      .addCase(addItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, extractCartData(action.payload));
      })
      .addCase(addItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── updateItem ──
    builder
      .addCase(updateItem.pending, (state, action) => {
        state.updatingItems[action.meta.arg.productId] = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        delete state.updatingItems[action.meta.arg.productId];
        Object.assign(state, extractCartData(action.payload));
      })
      .addCase(updateItem.rejected, (state, action) => {
        delete state.updatingItems[action.meta.arg.productId];
        state.error = action.payload;
      });

    // ── removeItem ──
    builder
      .addCase(removeItem.pending, (state, action) => {
        state.updatingItems[action.meta.arg.productId] = true;
        state.error = null;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        delete state.updatingItems[action.meta.arg.productId];
        Object.assign(state, extractCartData(action.payload));
      })
      .addCase(removeItem.rejected, (state, action) => {
        delete state.updatingItems[action.meta.arg.productId];
        state.error = action.payload;
      });

    // ── setIsland ──
    builder
      .addCase(setIsland.pending, (state) => {
        state.error = null;
      })
      .addCase(setIsland.fulfilled, (state, action) => {
        Object.assign(state, extractCartData(action.payload));
      })
      .addCase(setIsland.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ── emptyCart ──
    builder
      .addCase(emptyCart.fulfilled, () => initialState)
      .addCase(emptyCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCartError, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
