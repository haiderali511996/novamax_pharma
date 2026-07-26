const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['individual', 'pharmacy', 'hospital', 'clinic', 'distributor'], default: 'individual' },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    taxId: { type: String, trim: true },
    creditLimit: { type: Number, min: 0, default: 0 },
    // Standard discount this pharmacy/customer gets off Trade Price. When a
    // referring doctor's product-discount is also in play, this is applied
    // AFTER the doctor's discount (cascaded, not combined) - see utils/pricing.js.
    pharmacyDiscountPercent: { type: Number, min: 0, max: 100, default: 15 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
