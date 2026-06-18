// Address routes, all protected (personal data).

import { Router } from 'express';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator.js';

const router = Router();

router.use(protect);

router.get('/', getAddresses);
router.get('/:id', getAddressById);
router.post('/', validate(createAddressSchema), createAddress);
router.put('/:id', validate(updateAddressSchema), updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

export default router;
