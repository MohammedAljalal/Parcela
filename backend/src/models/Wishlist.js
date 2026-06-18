// Per-user wishlist. One wishlist per user.

import { Schema, model } from 'mongoose';

const wishlistItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [wishlistItemSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

wishlistSchema.index({ user: 1, 'products.product': 1 });

export default model('Wishlist', wishlistSchema);
