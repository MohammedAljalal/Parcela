// Island routes: public read, admin-only write.
'use strict';

const express = require('express');
const router = express.Router();

const { getIslands, getIslandById, createIsland, updateIsland, deleteIsland } = require('../controllers/island.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');
const validate = require('../middleware/validate');
const { createIslandSchema, updateIslandSchema } = require('../validators/island.validator');

router.get('/', optionalAuth, getIslands);
router.get('/:id', getIslandById);

router.post('/', protect, restrictTo('admin'), validate(createIslandSchema), createIsland);
router.put('/:id', protect, restrictTo('admin'), validate(updateIslandSchema), updateIsland);
router.delete('/:id', protect, restrictTo('admin'), deleteIsland);

module.exports = router;
