// src/models/Island.js
// Cape Verde islands / municipalities available for delivery.


'use strict';

import { Schema, model } from 'mongoose';

const islandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Island name is required'],
      trim: true,
      unique: true,
    },
    code: {
      // 2-3 uppercase letters, e.g. "ST" for Santiago
      type: String,
      required: [true, 'Island code is required'],
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z]{2,3}$/, 'Code must be 2-3 uppercase letters'],
    },
    region: {
      type: String,
      trim: true,
    },

    // Capital or main city of the island
    capital: {
      type: String,
      trim: true,
      default: '',
    },

    deliveryFee: {
      // Overrides the constant if set — allows admin to change fees without redeploy
      type: Number,
      default: null,
    },

    // Estimated delivery duration specific to this island
    estimatedDeliveryDays: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 2 },
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

islandSchema.index({ isActive: 1, sortOrder: 1 });

// Virtual: formatted label like "24/48h" based on min/max
islandSchema.virtual('estimatedDeliveryLabel').get(function () {
  const { min, max } = this.estimatedDeliveryDays;
  return min === max ? `${min * 24}h` : `${min * 24}/${max * 24}h`;
});

const Island = model('Island', islandSchema);

export default Island;