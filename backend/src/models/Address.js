// Saved delivery addresses per user.

import { Schema, model } from 'mongoose';

const addressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    label: { type: String, trim: true, default: 'Casa' },
    recipient: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    island: { type: Schema.Types.ObjectId, ref: 'Island' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

addressSchema.index({ user: 1, isDefault: -1 });

// Only one default address per user.
addressSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default model('Address', addressSchema);
