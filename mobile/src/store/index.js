import { configureStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import catalogReducer from './slices/catalogSlice';
import wishlistReducer from './slices/wishlistSlice';
import addressReducer from './slices/addressSlice';

const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: ordersReducer,
    catalog: catalogReducer,
    wishlist: wishlistReducer,
    addresses: addressReducer,
  },
});

export default store;
