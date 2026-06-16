// ============================================================
// src/models/Address.js
// Saved delivery addresses per user (address book).
// ============================================================

'use strict';

import { Schema, model } from 'mongoose';

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      // e.g. "Casa", "Trabalho"
      type: String,
      trim: true,
      default: 'Casa',
    },
    recipient: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    island: {
      type: Schema.Types.ObjectId,
      ref: 'Island',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
addressSchema.index({ user: 1, isDefault: -1 });

// ─── Pre-save: ensure only one default address per user ───────
addressSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const Address = model('Address', addressSchema);
export default Address;