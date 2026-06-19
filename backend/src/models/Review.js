// Product reviews from verified purchasers only.
'use strict';

const { Schema, model } = require('mongoose');

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    // Required: a review must be tied to an actual delivered order.
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    isVerifiedPurchase: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// One review per user per product per order.
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, isActive: 1 });

reviewSchema.post('save', async function () {
  await updateProductRating(this.constructor, this.product);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updateProductRating(doc.constructor, doc.product);
});

async function updateProductRating(ReviewModel, productId) {
  const Product = require('mongoose').model('Product');

  const stats = await ReviewModel.aggregate([
    { $match: { product: productId, isActive: true } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const average = stats[0]?.average ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(average * 10) / 10,
    reviewCount: count,
  });
}

module.exports = model('Review', reviewSchema);
