// Manages delivery islands. Public read, admin-only write.

import { Island } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /api/islands
const getIslands = async (req, res, next) => {
  try {
    const filter =
      req.query.includeInactive === 'true' && req.user?.role === 'admin' ? {} : { isActive: true };

    const islands = await Island.find(filter).sort({ sortOrder: 1, name: 1 });

    return sendSuccess(res, { islands }, 'Islands fetched successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/islands/:id
const getIslandById = async (req, res, next) => {
  try {
    const island = await Island.findById(req.params.id);
    if (!island) return sendError(res, 'Island not found', 404);
    return sendSuccess(res, { island }, 'Island fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/islands
const createIsland = async (req, res, next) => {
  try {
    const existingIsland = await Island.findOne({ code: req.body.code?.toUpperCase() });
    if (existingIsland) return sendError(res, 'An island with this code already exists', 409);

    const island = await Island.create(req.body);
    return sendSuccess(res, { island }, 'Island created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/islands/:id
const updateIsland = async (req, res, next) => {
  try {
    const island = await Island.findById(req.params.id);
    if (!island) return sendError(res, 'Island not found', 404);

    if (req.body.code && req.body.code.toUpperCase() !== island.code) {
      const codeExists = await Island.findOne({ code: req.body.code.toUpperCase(), _id: { $ne: island._id } });
      if (codeExists) return sendError(res, 'Another island already uses this code', 409);
    }

    Object.assign(island, req.body);
    await island.save();

    return sendSuccess(res, { island }, 'Island updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/islands/:id
// Soft delete: islands are referenced by Address/Cart/Order/Banner.
const deleteIsland = async (req, res, next) => {
  try {
    const island = await Island.findById(req.params.id);
    if (!island) return sendError(res, 'Island not found', 404);

    island.isActive = false;
    await island.save();

    return sendSuccess(res, {}, 'Island disabled successfully');
  } catch (error) {
    next(error);
  }
};

export { getIslands, getIslandById, createIsland, updateIsland, deleteIsland };
