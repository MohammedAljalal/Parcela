// Manages promotional banners. Public read, admin-only write.
'use strict';

const { Banner, Island } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { uploadImage, deleteImage } = require('../lib/cloudinary');

// GET /api/banners
const getActiveBanners = async (req, res, next) => {
  try {
    const { island } = req.query;
    const now = new Date();

    const filter = {
      isActive: true,
      $or: [{ island: null }, ...(island ? [{ island }] : [])],
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };

    const banners = await Banner.find(filter).populate('island', 'name code').sort({ sortOrder: 1 });

    return sendSuccess(res, { banners }, 'Banners fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/banners/admin/all
const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().populate('island', 'name code').sort({ sortOrder: 1, createdAt: -1 });
    return sendSuccess(res, { banners }, 'All banners fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/banners
const createBanner = async (req, res, next) => {
  try {
    if (req.body.island) {
      const island = await Island.findById(req.body.island);
      if (!island) return sendError(res, 'Selected island not found', 404);
    }

    let imageData = { image: req.body.image, imagePublicId: '' };

    if (req.file) {
      const result = await uploadImage(req.file.buffer, 'banners');
      imageData = { image: result.secure_url, imagePublicId: result.public_id };
    }

    const banner = await Banner.create({ ...req.body, ...imageData });

    return sendSuccess(res, { banner }, 'Banner created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/banners/:id
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return sendError(res, 'Banner not found', 404);

    if (req.body.island) {
      const island = await Island.findById(req.body.island);
      if (!island) return sendError(res, 'Selected island not found', 404);
    }

    if (req.file) {
      await deleteImage(banner.imagePublicId);
      const result = await uploadImage(req.file.buffer, 'banners');
      req.body.image = result.secure_url;
      req.body.imagePublicId = result.public_id;
    }

    Object.assign(banner, req.body);
    await banner.save();

    return sendSuccess(res, { banner }, 'Banner updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/banners/:id
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return sendError(res, 'Banner not found', 404);

    await deleteImage(banner.imagePublicId);

    return sendSuccess(res, {}, 'Banner deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
