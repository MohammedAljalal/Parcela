// Banner routes: public read, admin-only write with image upload.
'use strict';

const express = require('express');
const router = express.Router();

const { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/banner.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload.middleware');
const parseMultipartJson = require('../middleware/parseMultipartJson.middleware');
const { createBannerSchema, updateBannerSchema } = require('../validators/banner.validator');

// Banner create/update accepts multipart/form-data (for the image file), so
// title/subtitle/ctaLabel must arrive as JSON strings and get parsed back here.
const BANNER_JSON_FIELDS = ['title', 'subtitle', 'ctaLabel'];

router.get('/', getActiveBanners);
router.get('/admin/all', protect, restrictTo('admin'), getAllBanners);

router.post(
  '/',
  protect,
  restrictTo('admin'),
  upload.single('image'),
  parseMultipartJson(BANNER_JSON_FIELDS),
  validate(createBannerSchema),
  createBanner
);
router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  upload.single('image'),
  parseMultipartJson(BANNER_JSON_FIELDS),
  validate(updateBannerSchema),
  updateBanner
);
router.delete('/:id', protect, restrictTo('admin'), deleteBanner);

module.exports = router;
