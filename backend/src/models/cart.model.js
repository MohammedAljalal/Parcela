// src/models/Cart.js
// Per-user shopping cart. One cart per user (upserted).


'use strict';

import { Schema, model } from 'mongoose';

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    // Snapshot of price at time of adding (not live — recalculated on checkout)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // enforce one cart per user
    },
    items: [cartItemSchema],
    deliveryIsland: {
      type: Schema.Types.ObjectId,
      ref: 'Island',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const Cart = model('Cart', cartSchema);
export default Cart;