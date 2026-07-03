// Admin-only security monitoring: OTP abuse logs and manual unblock.
'use strict';

const { OtpLog } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// GET /api/admin/security/otp-logs
const listOtpLogs = async (req, res, next) => {
  try {
    const { blocked, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (blocked === true || blocked === 'true') {
      filter.blockedUntil = { $gt: new Date() };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      OtpLog.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      OtpLog.countDocuments(filter),
    ]);

    return sendPaginated(res, logs, { total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/security/otp-logs/:id/unblock
const unblockOtpLog = async (req, res, next) => {
  try {
    const log = await OtpLog.findById(req.params.id);
    if (!log) return sendError(res, 'Log not found', 404);

    log.blockedUntil = null;
    log.attempts = 0;
    await log.save();

    return sendSuccess(res, { log }, 'Number unblocked successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { listOtpLogs, unblockOtpLog };
