const mongoose = require('mongoose');

// Doctors who refer/prescribe our brands are compensated one of two ways,
// never both at once for the same doctor:
//   cash_commission  - paid a % of the sales value in cash (e.g. "20K PKR
//                      per 1 Lac sales" = commissionPercent: 20). This is
//                      tracked as a payable via LedgerEntry (partyType
//                      'doctor'), auto-debited when an invoice tied to
//                      this doctor is generated, credited when we pay them.
//   product_discount - instead of cash, the doctor's referred sales get an
//                      extra discount off Trade Price (commonly 20/25/50%),
//                      which is cascaded into the pharmacy's price at the
//                      point of sale (see utils/pricing.js). No ledger
//                      entry is posted for this type - the incentive is
//                      already baked into what the pharmacy paid.
//
// The rate is NOT fixed company-wide for a doctor - the same doctor can
// negotiate a different % in different areas/territories (e.g. 20% in one
// city, 15% in another). `commissionPercent`/`discountPercent` above are
// just the DEFAULT rate used when a sale's territory has no specific entry
// in `areaRates` below.
const areaRateSchema = new mongoose.Schema(
  {
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    commissionPercent: { type: Number, min: 0, max: 100 },
    discountPercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    hospitalClinic: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    // Medical rep who manages the relationship with this doctor.
    assignedRep: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    incentiveType: { type: String, enum: ['cash_commission', 'product_discount'], default: 'cash_commission' },
    // Default rate, used for any sale whose territory isn't listed in areaRates.
    commissionPercent: { type: Number, min: 0, max: 100, default: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    // Per-area overrides - e.g. this doctor earns 20% on sales referred in
    // Karachi South but only 15% in Karachi North.
    areaRates: { type: [areaRateSchema], default: [] },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Resolves the effective commission/discount % for this doctor in a given
// territory: an area-specific override if one exists, otherwise the default.
doctorSchema.methods.getRateForTerritory = function getRateForTerritory(territoryId) {
  if (territoryId) {
    const override = this.areaRates.find((r) => String(r.territory) === String(territoryId));
    if (override) {
      return {
        commissionPercent: override.commissionPercent ?? this.commissionPercent,
        discountPercent: override.discountPercent ?? this.discountPercent,
      };
    }
  }
  return { commissionPercent: this.commissionPercent, discountPercent: this.discountPercent };
};

module.exports = mongoose.model('Doctor', doctorSchema);
