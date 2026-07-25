const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    genericName: { type: String, trim: true },
    category: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'device', 'other'],
      default: 'other',
    },
    manufacturer: { type: String, trim: true },
    unit: { type: String, default: 'pcs' },
    packSize: { type: String, trim: true },
    isControlledSubstance: { type: Boolean, default: false },
    requiresPrescription: { type: Boolean, default: false },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    reorderLevel: { type: Number, min: 0, default: 10 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.virtual('totalStock', {
  ref: 'Batch',
  localField: '_id',
  foreignField: 'product',
});

module.exports = mongoose.model('Product', productSchema);
