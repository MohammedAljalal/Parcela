// Application entry point: Express app, middleware, routes, error handling.
'use strict';

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./src/config/database');

// Loads all models once, in the correct dependency order.
require('./src/models');

const env = require('./src/config/env');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { sendSuccess } = require('./src/utils/response');

const authRoutes = require('./src/routes/auth.routes');
const addressRoutes = require('./src/routes/address.routes');
const islandRoutes = require('./src/routes/island.routes');
const categoryRoutes = require('./src/routes/category.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const reviewRoutes = require('./src/routes/review.routes');
const wishlistRoutes = require('./src/routes/wishlist.routes');
const bannerRoutes = require('./src/routes/banner.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const paymentRoutes = require('./src/routes/payment.routes');

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

module.exports = app;
