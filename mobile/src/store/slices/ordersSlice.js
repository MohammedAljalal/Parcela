import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getOrders,
  getOrder,
  createOrder as createOrderApi,
  cancelOrder as cancelOrderApi,
} from '../../api/orders';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  orders: [],
  stats: { inTransit: 0, completed: 0 },
  selectedOrder: null,
  pagination: null,
  loading: false,
  loadingOrder: false,   // loading a single order
  submitting: false,     // submitting a new order (checkout)
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated orders list with optional status filter
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await getOrders(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao carregar encomendas'
      );
    }
  }
);

/** Fetch a single order by ID */
export const fetchOrder = createAsyncThunk(
  'orders/fetchOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await getOrder(orderId);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao carregar encomenda'
      );
    }
  }
);

/**
 * Create a new order from cart (checkout)
 * @param {{ addressId: string, islandId: string, paymentMethod: string, couponCode?: string }} body
 */
export const submitOrder = createAsyncThunk(
  'orders/submitOrder',
  async (body, { rejectWithValue }) => {
    try {
      const res = await createOrderApi(body);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao criar encomenda'
      );
    }
  }
);

/** Cancel an order */
export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await cancelOrderApi(orderId);
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? 'Falha ao cancelar encomenda'
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    resetOrders: () => initialState,
  },
  extraReducers: (builder) => {
    // ── fetchOrders ──
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.data ?? [];
        state.stats = action.payload?.stats ?? { inTransit: 0, completed: 0 };
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchOrder ──
    builder
      .addCase(fetchOrder.pending, (state) => {
        state.loadingOrder = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loadingOrder = false;
        state.selectedOrder = action.payload?.order ?? null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loadingOrder = false;
        state.error = action.payload;
      });

    // ── submitOrder (checkout) ──
    builder
      .addCase(submitOrder.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.submitting = false;
        // Prepend the new order to the list
        const newOrder = action.payload?.order;
        if (newOrder) {
          state.orders = [newOrder, ...state.orders];
        }
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });

    // ── cancelOrder ──
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updated = action.payload?.order;
        if (updated) {
          state.orders = state.orders.map((o) =>
            o._id === updated._id ? updated : o
          );
          if (state.selectedOrder?._id === updated._id) {
            state.selectedOrder = updated;
          }
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearOrdersError, clearSelectedOrder, resetOrders } =
  ordersSlice.actions;
export default ordersSlice.reducer;
