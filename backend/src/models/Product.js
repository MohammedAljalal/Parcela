// Core product catalogue.

import { Schema, model } from 'mongoose';
import slugify from 'slugify';
import { NOTIFICATION_TYPE } from '../config/constants.js';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const specSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// Display name/logo of the seller, shown to the user (e.g. "Vendido por Nike Store CV").
const vendorInfoSchema = new Schema(
  {
    storeName: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: {
      pt: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: '' },
    },
    slug: { type: String, unique: true, lowercase: true },
    description: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    images: {
      type: [imageSchema],
      validate: { validator: (v) => v.length <= 8, message: 'Maximum 8 images allowed' },
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined) return true;
          return value > this.price;
        },
        message: 'compareAtPrice must be greater than price',
      },
    },

    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true, sparse: true, unique: true },

    specifications: [specSchema],
    deliveryInfo: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    tags: [{ type: String, trim: true }],
    isFeatured: { type: Boolean, default: false },
    isPromoted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    availableIslands: [{ type: Schema.Types.ObjectId, ref: 'Island' }],

    vendor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    vendorInfo: { type: vendorInfoSchema, required: true },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isPromoted: 1, isActive: 1 });
productSchema.index({ name: 'text', tags: 'text' });
productSchema.index({ 'vendorInfo.storeName': 1 });

productSchema.virtual('isOnSale').get(function () {
  return this.compareAtPrice != null && this.compareAtPrice > this.price;
});

productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

productSchema.virtual('primaryImage').get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary?.url ?? this.images[0]?.url ?? null;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name.pt') || !this.slug) {
    this.slug = slugify(this.name.pt, { lower: true, strict: true });
  }
  next();
});

// Keep Category.productsCount in sync.
productSchema.post('save', async function () {
  const Category = model('Category');
  await Category.recalculateProductsCount(this.category);
});

productSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Category = model('Category');
    await Category.recalculateProductsCount(doc.category);
  }
});

// Notify wishlist owners when stock gets low after a stock update (e.g. order placed).
// Uses mongoose.model() to avoid circular dependency with notification.service.js.
productSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  const LOW_STOCK_THRESHOLD = 3;
  if (doc.stock > 0 && doc.stock <= LOW_STOCK_THRESHOLD) {
    const Wishlist = model('Wishlist');

    const wishlists = await Wishlist.find({ 'products.product': doc._id }).select('user');

    // Lazy-import the service to avoid circular dependency at module load time.
    const { createNotification } = await import('../services/notification.service.js');

    await Promise.all(
      wishlists.map((wishlist) =>
        createNotification({
          userId: wishlist.user,
          type: NOTIFICATION_TYPE.LOW_STOCK_WISHLIST,
          data: { productName: doc.name?.pt || '' },
          relatedProduct: doc._id,
        }).catch((err) => console.error('Low stock notification failed:', err.message))
      )
    );
  }
});

export default model('Product', productSchema);
