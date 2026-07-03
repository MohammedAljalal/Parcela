// Admin dashboard: aggregate KPIs, time-series charts, and recent activity feed.
'use strict';

const { User, Order, Product, Category, Review, Coupon } = require('../models');
const { sendSuccess } = require('../utils/response');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// GET /api/admin/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = daysAgo(30);

    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalOrders,
      completedOrders,
      pendingOrders,
      revenueAgg,
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalReviews,
      activeCoupons,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: ORDER_STATUS.DELIVERED }),
      Order.countDocuments({
        status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING] },
      }),
      Order.aggregate([
        { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0, $lte: 3 } }),
      Category.countDocuments(),
      Review.countDocuments(),
      Coupon.countDocuments({ isActive: true }),
    ]);

    return sendSuccess(
      res,
      {
        users: { total: totalUsers, new: newUsers, active: activeUsers },
        orders: { total: totalOrders, completed: completedOrders, pending: pendingOrders },
        revenue: { total: revenueAgg[0]?.total || 0 },
        products: { total: totalProducts, lowStock: lowStockProducts },
        categories: { total: totalCategories },
        reviews: { total: totalReviews },
        coupons: { active: activeCoupons },
      },
      'Dashboard stats fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard/charts
const getCharts = async (req, res, next) => {
  try {
    const thirtyDaysAgo = daysAgo(30);

    const [revenueByDay, ordersByStatus, userGrowth, topProducts] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: PAYMENT_STATUS.PAID } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return sendSuccess(
      res,
      {
        revenueByDay: revenueByDay.map((d) => ({ date: d._id, revenue: d.total })),
        ordersByStatus: ordersByStatus.map((d) => ({ status: d._id, count: d.count })),
        userGrowth: userGrowth.map((d) => ({ date: d._id, count: d.count })),
        topProducts: topProducts.map((d) => ({ productId: d._id, name: d.name, totalSold: d.totalSold })),
      },
      'Dashboard charts fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard/recent
const getRecentActivity = async (req, res, next) => {
  try {
    const [recentOrders, recentUsers] = await Promise.all([
      Order.find().populate('user', 'name phone email').sort({ createdAt: -1 }).limit(5),
      User.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return sendSuccess(res, { recentOrders, recentUsers }, 'Recent activity fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getCharts, getRecentActivity };
