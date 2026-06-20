// Application entry point: Express app, middleware, routes, error handling.

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./src/config/database.js');

// Loads all models once, in the correct dependency order.
require('./src/models/index.js');

const env = require('./src/config/env.js');
const { notFound, errorHandler } = require('./src/middleware/errorHandler.js');
const { sendSuccess } = require('./src/utils/response.js');

const authRoutes = require('./src/routes/auth.routes.js');
const addressRoutes = require('./src/routes/address.routes.js');
const islandRoutes = require('./src/routes/island.routes.js');
const categoryRoutes = require('./src/routes/category.routes.js');
const productRoutes = require('./src/routes/product.routes.js');
const cartRoutes = require('./src/routes/cart.routes.js');
const orderRoutes = require('./src/routes/order.routes.js');
const notificationRoutes = require('./src/routes/notification.routes.js');
const reviewRoutes = require('./src/routes/review.routes.js');
const wishlistRoutes = require('./src/routes/wishlist.routes.js');
const bannerRoutes = require('./src/routes/banner.routes.js');
const couponRoutes = require('./src/routes/coupon.routes.js');
const paymentRoutes = require('./src/routes/payment.routes.js');

const app = express();

connectDB();

// Security headers.
app.use(helmet());

// Allow all origins in development (mobile apps don't have a predictable origin).
// In production, restrict to CLIENT_URL.
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: env.NODE_ENV === 'production',
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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

server.listen(env.PORT, '0.0.0.0', () => {
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
