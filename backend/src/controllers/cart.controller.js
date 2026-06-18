// Cart logic: add, update quantity, remove, and island selection.

import { Cart, Product, Island } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { buildCartResponse } from '../services/cart.service.js';

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Cart fetched successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/items
const addItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return sendError(res, 'Product not found or unavailable', 404);

    if (product.stock < quantity) {
      return sendError(res, `Only ${product.stock} items left in stock`, 409);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    const newPrice = product.isOnSale ? product.price : product.price; // or compareAtPrice if logic differs

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return sendError(res, `Cannot add more. Only ${product.stock} items left in stock`, 409);
      }
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].price = newPrice;
    } else {
      cart.items.push({ product: productId, quantity, price: newPrice });
    }

    await cart.save();

    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Item added to cart', 201);
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

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) return sendError(res, 'Item not found in cart', 404);

    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return sendError(res, `Cannot update. Only ${product.stock} items left in stock`, 409);
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Cart updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:productId
const removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return sendError(res, 'Cart not found', 404);

    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();

    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/island
const setDeliveryIsland = async (req, res, next) => {
  try {
    const { islandId } = req.body;

    const island = await Island.findOne({ _id: islandId, isActive: true });
    if (!island) return sendError(res, 'Selected island is not available', 404);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    cart.deliveryIsland = islandId;
    await cart.save();

    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Delivery island updated');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], deliveryIsland: null });
    const cartResponse = await buildCartResponse(req.user._id);
    return sendSuccess(res, { cart: cartResponse }, 'Cart cleared successfully');
  } catch (error) {
    next(error);
  }
};

export { getCart, addItem, updateItemQuantity, removeItem, setDeliveryIsland, clearCart };
