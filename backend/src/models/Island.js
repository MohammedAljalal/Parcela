// Cape Verde islands available for delivery.
'use strict';

const { Schema, model } = require('mongoose');

const islandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z]{2,3}$/, 'Code must be 2-3 uppercase letters'],
    },
    region: { type: String, trim: true },
    capital: { type: String, trim: true, default: '' },
    deliveryFee: { type: Number, default: 0, min: 0 },
    estimatedDeliveryDays: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 2 },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

islandSchema.index({ isActive: 1, sortOrder: 1 });

islandSchema.virtual('estimatedDeliveryLabel').get(function () {
  const { min, max } = this.estimatedDeliveryDays;
  return min === max ? `${min * 24}h` : `${min * 24}/${max * 24}h`;
});

module.exports = model('Island', islandSchema);
