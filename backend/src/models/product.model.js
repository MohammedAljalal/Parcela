// src/models/Product.js
// Core product catalogue.


'use strict';

import { Schema, model } from 'mongoose';
import slugify from 'slugify';

// ─── Sub-schemas ──────────────────────────────────────────────
const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public_id for deletion
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

// Vendor business information displayed to the user
const vendorInfoSchema = new Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────
const productSchema = new Schema(
  {
    name: {
      pt: { type: String, required: [true, 'Portuguese name is required'], trim: true },
      en: { type: String, trim: true, default: '' },
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (v) => v.length <= 8,
        message: 'Maximum 8 images allowed',
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },

    // ── Pricing ──────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      // Original price shown struck-through (promo)
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

    // ── Inventory ────────────────────────────────────────
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    sku: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    // ── Specifications ────────────────────────────────────
    specifications: [specSchema],

    // Delivery information specific to this product
    deliveryInfo: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    // ── Tags & Flags ──────────────────────────────────────
    tags: [{ type: String, trim: true }],
    isFeatured: { type: Boolean, default: false },
    isPromoted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // ── Island availability ───────────────────────────────
    availableIslands: [{ type: Schema.Types.ObjectId, ref: 'Island' }],

    // ── Vendor ───────────────────────────────────────────
    // Actual vendor account in the system (optional - product can be managed by admin)
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Business name and logo displayed to the user, independent of vendor account
    vendorInfo: {
      type: vendorInfoSchema,
      required: [true, 'Vendor info is required'],
    },

    // ── Aggregated review stats (updated by Review hooks) ─
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isPromoted: 1, isActive: 1 });
productSchema.index({ name: 'text', tags: 'text' }); // full-text search
productSchema.index({ 'vendorInfo.storeName': 1 });

// ─── Virtuals ─────────────────────────────────────────────────
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

// ─── Auto-generate slug ───────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name.pt') || !this.slug) {
    this.slug = slugify(this.name.pt, { lower: true, strict: true });
  }
  next();
});

// Post-save: Update products count in category on creation, category change, or isActive change
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

const Product = model('Product', productSchema);
export default Product;