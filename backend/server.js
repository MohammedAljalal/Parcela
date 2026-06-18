// Application entry point: Express app, middleware, routes, error handling.

import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import connectDB from './src/config/database.js';

// Loads all models once, in the correct dependency order.
import './src/models/index.js';

import env from './src/config/env.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import { sendSuccess } from './src/utils/response.js';

import authRoutes from './src/routes/auth.routes.js';
import addressRoutes from './src/routes/address.routes.js';
import islandRoutes from './src/routes/island.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import productRoutes from './src/routes/product.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import reviewRoutes from './src/routes/review.routes.js';
import wishlistRoutes from './src/routes/wishlist.routes.js';
import bannerRoutes from './src/routes/banner.routes.js';
import couponRoutes from './src/routes/coupon.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';

const app = express();

connectDB();

// Security headers.
app.use(helmet());

// Restrict cross-origin access to the configured client.
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check.
app.get('/health', (req, res) => {
  sendSuccess(res, { environment: env.NODE_ENV, timestamp: new Date().toISOString() }, 'Server is healthy');
});

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/islands', islandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);

// Must be after all routes.
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${env.PORT}/health`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});

export default app;
