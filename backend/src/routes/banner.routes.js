// Banner routes: public read, admin-only write with image upload.
'use strict';

const express = require('express');
const router = express.Router();

const { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/banner.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload.middleware');
const { createBannerSchema, updateBannerSchema } = require('../validators/banner.validator');

router.get('/', getActiveBanners);
router.get('/admin/all', protect, restrictTo('admin'), getAllBanners);

router.post('/', protect, restrictTo('admin'), upload.single('image'), validate(createBannerSchema), createBanner);
router.put('/:id', protect, restrictTo('admin'), upload.single('image'), validate(updateBannerSchema), updateBanner);
router.delete('/:id', protect, restrictTo('admin'), deleteBanner);

module.exports = router;
