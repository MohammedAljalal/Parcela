// Island routes: public read, admin-only write.

import { Router } from 'express';
import { getIslands, getIslandById, createIsland, updateIsland, deleteIsland } from '../controllers/island.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import validate from '../middleware/validate.js';
import { createIslandSchema, updateIslandSchema } from '../validators/island.validator.js';

const router = Router();

router.get('/', optionalAuth, getIslands);
router.get('/:id', getIslandById);

router.post('/', protect, restrictTo('admin'), validate(createIslandSchema), createIsland);
router.put('/:id', protect, restrictTo('admin'), validate(updateIslandSchema), updateIsland);
router.delete('/:id', protect, restrictTo('admin'), deleteIsland);

export default router;
