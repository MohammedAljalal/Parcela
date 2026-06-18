// Promotional banners for the home screen.
'use strict';

const { Schema, model } = require('mongoose');

const bannerSchema = new Schema(
  {
    title: {
      pt: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: '' },
    },
    subtitle: {
      pt: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' },
    },
    image: { type: String, required: true },
    imagePublicId: { type: String, default: '' },
    ctaLabel: {
      pt: { type: String, default: 'Comprar Agora' },
      en: { type: String, default: 'Shop Now' },
    },
    ctaLink: { type: String, default: '' },

    island: { type: Schema.Types.ObjectId, ref: 'Island', default: null },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });
bannerSchema.index({ island: 1, isActive: 1 });

bannerSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  const afterStart = !this.startDate || this.startDate <= now;
  const beforeEnd = !this.endDate || this.endDate >= now;
  return this.isActive && afterStart && beforeEnd;
});

module.exports = model('Banner', bannerSchema);
