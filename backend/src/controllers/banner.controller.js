// Manages promotional banners. Public read, admin-only write.

import { Banner, Island } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';

// GET /api/banners
// Returns active banners. Optionally filters by island.
const getActiveBanners = async (req, res, next) => {
  try {
    const { islandId } = req.query;

    const filter = { isActive: true };
    const now = new Date();

    filter.$and = [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ];

    if (islandId) {
      filter.$or = [{ island: null }, { island: islandId }];
    }

    const banners = await Banner.find(filter)
      .populate('island', 'name code')
      .sort({ sortOrder: 1, createdAt: -1 });

    return sendSuccess(res, { banners }, 'Banners fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/banners/admin/all
// Admin only: returns all banners, active or not.
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
    if (!req.file) return sendError(res, 'Banner image is required', 400);

    if (req.body.island) {
      const islandExists = await Island.exists({ _id: req.body.island, isActive: true });
      if (!islandExists) return sendError(res, 'Selected island not found or inactive', 404);
    }

    const uploadResult = await uploadImage(req.file.buffer, 'banners');

    const banner = await Banner.create({
      ...req.body,
      image: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    });

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
      const islandExists = await Island.exists({ _id: req.body.island, isActive: true });
      if (!islandExists) return sendError(res, 'Selected island not found or inactive', 404);
    }

    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, 'banners');

      if (banner.imagePublicId) {
        await deleteImage(banner.imagePublicId);
      }

      req.body.image = uploadResult.secure_url;
      req.body.imagePublicId = uploadResult.public_id;
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

    if (banner.imagePublicId) {
      await deleteImage(banner.imagePublicId);
    }

    return sendSuccess(res, {}, 'Banner deleted successfully');
  } catch (error) {
    next(error);
  }
};

export { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
