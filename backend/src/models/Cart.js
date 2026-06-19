// Per-user shopping cart. One cart per user.
'use strict';

const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    // Price snapshot at the time the item was added.
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    deliveryIsland: { type: Schema.Types.ObjectId, ref: 'Island', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

module.exports = model('Cart', cartSchema);
