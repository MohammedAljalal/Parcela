// Address routes, all protected (personal data).
'use strict';

const express = require('express');
const router = express.Router();

const {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createAddressSchema, updateAddressSchema } = require('../validators/address.validator');

router.use(protect);

router.get('/', getAddresses);
router.get('/:id', getAddressById);
router.post('/', validate(createAddressSchema), createAddress);

// Both PUT and PATCH are accepted for updates.
// PUT is kept for backward compatibility; PATCH matches the audit requirement.
router.put('/:id', validate(updateAddressSchema), updateAddress);
router.patch('/:id', validate(updateAddressSchema), updateAddress);

router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;
