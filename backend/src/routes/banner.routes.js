// Banner routes: public read, admin-only write with image upload.

import { Router } from 'express';
import { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.middleware.js';
import { createBannerSchema, updateBannerSchema } from '../validators/banner.validator.js';

const router = Router();

router.get('/', getActiveBanners);
router.get('/admin/all', protect, restrictTo('admin'), getAllBanners);

router.post('/', protect, restrictTo('admin'), upload.single('image'), validate(createBannerSchema), createBanner);
router.put('/:id', protect, restrictTo('admin'), upload.single('image'), validate(updateBannerSchema), updateBanner);
router.delete('/:id', protect, restrictTo('admin'), deleteBanner);

export default router;
