// Shared cart calculation logic, used by cart and order controllers.

import { Cart } from '../models/index.js';

// Builds the full cart response with computed totals.
const buildCartResponse = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate({ path: 'items.product', select: 'name slug images price stock isActive vendorInfo' })
    .populate('deliveryIsland', 'name code deliveryFee');

  if (!cart) {
    return { items: [], itemCount: 0, subtotal: 0, deliveryIsland: null, deliveryFee: 0, total: 0 };
  }

  const deliveryFee = cart.deliveryIsland?.deliveryFee || 0;
  const subtotal = cart.subtotal;

  return {
    _id: cart._id,
    items: cart.items,
    itemCount: cart.itemCount,
    subtotal,
    deliveryIsland: cart.deliveryIsland,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
};

// Returns a list of stock issues for cart items, empty array if all OK.
const validateStockAvailability = async (cart) => {
  const issues = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      issues.push({ productId: item.product?._id, reason: 'Product is no longer available' });
      continue;
    }

    if (product.stock < item.quantity) {
      issues.push({
        productId: product._id,
        productName: product.name?.pt,
        reason: `Requested quantity (${item.quantity}) exceeds available stock (${product.stock})`,
      });
    }
  }

  return issues;
};

export { buildCartResponse, validateStockAvailability };
