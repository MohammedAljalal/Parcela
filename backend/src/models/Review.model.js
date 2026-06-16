// src/models/Review.js
// Product reviews from verified purchasers.


'use strict';

import { Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    // Mandatory field to ensure reviews are linked to verified purchases
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Review must be linked to a verified order'],
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment must be under 1000 characters'],
      default: '',
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: true, // Always true since order is mandatory
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, isActive: 1 });

// Post-save: update Product aggregate rating
// Using this.constructor instead of model('Review') to avoid timing issues
reviewSchema.post('save', async function () {
  await updateProductRating(this.constructor, this.product);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updateProductRating(doc.constructor, doc.product);
});

// Pass ReviewModel as parameter to avoid circular dependency with Product.js
async function updateProductRating(ReviewModel, productId) {
  const Product = require('mongoose').model('Product');

  const stats = await ReviewModel.aggregate([
    { $match: { product: productId, isActive: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = stats[0]?.average ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(average * 10) / 10,
    reviewCount: count,
  });
}

const Review = model('Review', reviewSchema);
export default Review;