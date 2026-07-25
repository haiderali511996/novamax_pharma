const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['drug_license', 'gmp_certificate', 'fda_registration', 'business_license', 'tax_certificate', 'other'],
      default: 'other',
    },
    licenseNumber: { type: String, trim: true },
    issuingAuthority: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date, required: true },
    documentUrl: { type: String, trim: true },
    status: { type: String, enum: ['active', 'expired', 'renewal_pending'], default: 'active' },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

licenseSchema.virtual('isExpired').get(function isExpired() {
  return this.expiryDate < new Date();
});

licenseSchema.virtual('isNearExpiry').get(function isNearExpiry() {
  const days = (this.expiryDate - new Date()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 60;
});

licenseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('License', licenseSchema);
