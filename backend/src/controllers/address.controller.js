// Manages a user's saved delivery addresses.
'use strict';

const { Address, Island } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/addresses
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id })
      .populate('island', 'name code')
      .sort({ isDefault: -1, createdAt: -1 });

    return sendSuccess(res, { addresses }, 'Addresses fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/addresses/:id
const getAddressById = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id }).populate(
      'island',
      'name code'
    );

    if (!address) return sendError(res, 'Address not found', 404);

    return sendSuccess(res, { address }, 'Address fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/addresses
const createAddress = async (req, res, next) => {
  try {
    const island = await Island.findOne({ _id: req.body.island, isActive: true });
    if (!island) return sendError(res, 'Selected island not found or unavailable', 404);

    const existingCount = await Address.countDocuments({ user: req.user._id });
    const isFirstAddress = existingCount === 0;

    const address = await Address.create({
      ...req.body,
      user: req.user._id,
      isDefault: isFirstAddress ? true : req.body.isDefault || false,
    });

    return sendSuccess(res, { address }, 'Address added successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/addresses/:id
const updateAddress = async (req, res, next) => {
  try {
    if (req.body.island) {
      const island = await Island.findOne({ _id: req.body.island, isActive: true });
      if (!island) return sendError(res, 'Selected island not found or unavailable', 404);
    }

    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return sendError(res, 'Address not found', 404);

    // Object.assign + save (not findByIdAndUpdate) to trigger the isDefault pre-save hook.
    Object.assign(address, req.body);
    await address.save();

    return sendSuccess(res, { address }, 'Address updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/addresses/:id
const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return sendError(res, 'Address not found', 404);

    if (address.isDefault) {
      const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return sendSuccess(res, {}, 'Address deleted successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/addresses/:id/default
const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return sendError(res, 'Address not found', 404);

    address.isDefault = true;
    await address.save();

    return sendSuccess(res, { address }, 'Address set as default');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAddresses, getAddressById, createAddress, updateAddress, deleteAddress, setDefaultAddress };
