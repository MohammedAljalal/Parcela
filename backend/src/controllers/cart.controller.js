// Manages the current user's shopping cart.
'use strict';

const { Cart, Product, Island } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { buildCartResponse } = require('../services/cart.service');

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cartData = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartData }, 'Cart fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/items
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return sendError(res, 'Product not found or unavailable', 404);

    if (product.stock < quantity) {
      return sendError(res, `Requested quantity exceeds available stock (${product.stock})`, 409);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return sendError(
          res,
          `Total requested quantity (${newQuantity}) exceeds available stock (${product.stock})`,
          409
        );
      }

      existingItem.quantity = newQuantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({ product: product._id, quantity, price: product.price });
    }

    await cart.save();

    const cartData = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartData }, 'Item added to cart');
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/items/:productId
const updateItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return sendError(res, 'Product not found in cart', 404);

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return sendError(res, 'Product is no longer available', 404);

    if (product.stock < quantity) {
      return sendError(res, `Requested quantity exceeds available stock (${product.stock})`, 409);
    }

    item.quantity = quantity;
    await cart.save();

    const cartData = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartData }, 'Quantity updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:productId
const removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    const itemExists = cart.items.some((i) => i.product.toString() === req.params.productId);
    if (!itemExists) return sendError(res, 'Product not found in cart', 404);

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();

    const cartData = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartData }, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/island
const setDeliveryIsland = async (req, res, next) => {
  try {
    const { islandId } = req.body;

    const island = await Island.findOne({ _id: islandId, isActive: true });
    if (!island) return sendError(res, 'Selected island not found or unavailable', 404);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    cart.deliveryIsland = island._id;
    await cart.save();

    const cartData = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartData }, 'Delivery island set successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return sendSuccess(res, {}, 'Cart cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addItem, updateItemQuantity, removeItem, setDeliveryIsland, clearCart };
