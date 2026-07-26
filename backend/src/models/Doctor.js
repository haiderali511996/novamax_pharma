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
    commissionPercent: { type: Number, min: 0, max: 100, default: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
