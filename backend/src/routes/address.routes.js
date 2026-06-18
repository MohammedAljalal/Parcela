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
router.put('/:id', validate(updateAddressSchema), updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefaultAddress);

module.exports = router;
