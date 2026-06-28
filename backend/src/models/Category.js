// Product categories with i18n and computed product count.
'use strict';

const { Schema, model } = require('mongoose');
const slugify = require('slugify');

const categorySchema = new Schema(
  {
    name: {
      pt: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: '' },
    },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    // Denormalized counter, updated by Product hooks.
    productsCount: { type: Number, default: 0, min: 0 },
    badge: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    description: {
      pt: { type: String, default: '' },
      en: { type: String, default: '' },
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });

categorySchema.pre('save', function (next) {
  if (this.isModified('name.pt') || !this.slug) {
    this.slug = slugify(this.name.pt, { lower: true, strict: true });
  }
  next();
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Recalculates active product count for a category.
categorySchema.statics.recalculateProductsCount = async function (categoryId) {
  const Product = model('Product');
  const count = await Product.countDocuments({ category: categoryId, isActive: true });
  await this.findByIdAndUpdate(categoryId, { productsCount: count });
};

module.exports = model('Category', categorySchema);
