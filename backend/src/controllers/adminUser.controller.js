// Admin-only user management: listing, CRUD, ban/unban, role changes, password reset.
'use strict';

const { User, Order, Address, Wishlist, Review } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { PAYMENT_STATUS } = require('../config/constants');

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 20, sort = 'newest' } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, users, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('preferredIsland', 'name code');
    if (!user) return sendError(res, 'User not found', 404);

    const [ordersCount, revenueAgg, addressesCount, reviewsCount] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.aggregate([
        { $match: { user: user._id, paymentStatus: PAYMENT_STATUS.PAID } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Address.countDocuments({ user: user._id }),
      Review.countDocuments({ user: user._id }),
    ]);

    return sendSuccess(
      res,
      {
        user,
        stats: {
          ordersCount,
          totalSpent: revenueAgg[0]?.total || 0,
          addressesCount,
          reviewsCount,
        },
      },
      'User fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users
const createUser = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (email) {
      const existing = await User.findOne({ email });
      if (existing) return sendError(res, 'An account with this email already exists', 409);
    }

    if (phone) {
      const existing = await User.findOne({ phone });
      if (existing) return sendError(res, 'An account with this phone already exists', 409);
    }

    const user = await User.create({
      ...req.body,
      isVerified: true,
      emailVerified: !!email,
    });

    return sendSuccess(res, { user }, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (req.body.email && req.body.email !== user.email) {
      const existing = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (existing) return sendError(res, 'Another account already uses this email', 409);
    }

    if (req.body.phone && req.body.phone !== user.phone) {
      const existing = await User.findOne({ phone: req.body.phone, _id: { $ne: user._id } });
      if (existing) return sendError(res, 'Another account already uses this phone', 409);
    }

    Object.assign(user, req.body);
    await user.save();

    return sendSuccess(res, { user }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/status — ban / unban
const updateUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot change your own account status', 403);
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.isActive = req.body.isActive;

    // Banning a user must immediately invalidate their active sessions.
    if (!user.isActive) {
      user.refreshToken = null;
      user.previousRefreshTokens = [];
    }

    await user.save();

    return sendSuccess(
      res,
      { user },
      user.isActive ? 'User unbanned successfully' : 'User banned successfully'
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot change your own role', 403);
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.role = req.body.role;
    await user.save();

    return sendSuccess(res, { user }, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/password — admin-initiated password reset
const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.password = req.body.password;
    // Force re-login on all devices after a password reset.
    user.refreshToken = null;
    user.previousRefreshTokens = [];
    await user.save();

    return sendSuccess(res, {}, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own account', 403);
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    // Users with order history are kept for accounting/audit purposes — deactivate instead.
    const ordersCount = await Order.countDocuments({ user: user._id });
    if (ordersCount > 0) {
      return sendError(
        res,
        `Cannot delete this user, they have ${ordersCount} order(s) on record. Deactivate the account instead.`,
        409
      );
    }

    await Promise.all([
      Address.deleteMany({ user: user._id }),
      Wishlist.deleteMany({ user: user._id }),
      user.deleteOne(),
    ]);

    return sendSuccess(res, {}, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id/orders
const getUserOrders = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

    return sendSuccess(res, { orders }, 'User orders fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id/addresses
const getUserAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    const addresses = await Address.find({ user: user._id })
      .populate('island', 'name code')
      .sort({ isDefault: -1, createdAt: -1 });

    return sendSuccess(res, { addresses }, 'User addresses fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  getUserOrders,
  getUserAddresses,
};
