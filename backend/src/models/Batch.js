const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    batchNumber: { type: String, required: true, trim: true },
    manufactureDate: { type: Date },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    costPrice: { type: Number, min: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  },
  { timestamps: true }
);

batchSchema.index({ product: 1, warehouse: 1, batchNumber: 1 }, { unique: true });

batchSchema.virtual('isExpired').get(function isExpired() {
  return this.expiryDate < new Date();
});

batchSchema.virtual('isNearExpiry').get(function isNearExpiry() {
  const days = (this.expiryDate - new Date()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 90;
});

batchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
