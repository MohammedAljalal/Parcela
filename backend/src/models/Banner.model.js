// src/models/Banner.js
// Promotional banners for the home screen.


'use strict';

import { Schema, model } from 'mongoose';

const bannerSchema = new Schema(
  {
    title: {
      pt: { type: String, required: [true, 'Portuguese title is required'], trim: true },
      en: { type: String, trim: true, default: '' },
    },
    subtitle: {
      pt: { type: String, trim: true, default: '' },
      en: { type: String, trim: true, default: '' },
    },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    ctaLabel: {
      pt: { type: String, default: 'Comprar Agora' },
      en: { type: String, default: 'Shop Now' },
    },
    ctaLink: {
      // Internal deep-link or external URL
      type: String,
      default: '',
    },

    // Scope to a specific island — null means show everywhere
    island: {
      type: Schema.Types.ObjectId,
      ref: 'Island',
      default: null,
    },

    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });
bannerSchema.index({ island: 1, isActive: 1 });

// ─── Virtual: isCurrentlyActive ───────────────────────────────
bannerSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  const afterStart = !this.startDate || this.startDate <= now;
  const beforeEnd = !this.endDate || this.endDate >= now;
  return this.isActive && afterStart && beforeEnd;
});

const Banner = model('Banner', bannerSchema);
export default Banner;