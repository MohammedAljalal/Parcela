
'use strict';

import { Schema, model } from 'mongoose';
import slugify from 'slugify';

const categorySchema = new Schema(
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
    icon: {
      // Cloudinary URL or emoji/icon identifier
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    parent: {
      // null = top-level category; ObjectId = subcategory
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // Pre-calculated count of products in this category, updated via Product hooks
    productsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional badge text displayed above the category
    badge: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
categorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });

// ─── Auto-generate slug from PT name ─────────────────────────
categorySchema.pre('save', function (next) {
  if (this.isModified('name.pt') || !this.slug) {
    this.slug = slugify(this.name.pt, { lower: true, strict: true });
  }
  next();
});

// ─── Virtual: subcategories (populated separately if needed) ─
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Static: Recalculates the number of active products in a category
categorySchema.statics.recalculateProductsCount = async function (categoryId) {
  const Product = model('Product');
  const count = await Product.countDocuments({ category: categoryId, isActive: true });
  await this.findByIdAndUpdate(categoryId, { productsCount: count });
};

const Category = model('Category', categorySchema);

export default Category;