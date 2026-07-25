const mongoose = require('mongoose');

// A subsidiary ledger entry against one party (customer, manufacturer, or
// employee). This is a running account statement, not the double-entry
// general ledger (see Account/Transaction for that).
//
// Balance is always computed as running sum(debit) - sum(credit): debit
// always increases the balance, credit always decreases it. What the
// balance *means* depends on the party type:
//   customer     - debit = invoice raised (they owe us more), credit = payment received -> balance = amount owed BY customer
//   manufacturer - debit = bill/purchase received (we owe them more), credit = payment made -> balance = amount owed TO manufacturer
//   employee     - debit = advance/loan given (they owe us), credit = salary paid / repayment -> balance = net advance owed BY employee
//
// The UI labels debit/credit per party type so each statement reads naturally.
const PARTY_TYPES = ['customer', 'manufacturer', 'employee'];
const PARTY_MODELS = { customer: 'Customer', manufacturer: 'Manufacturer', employee: 'Employee' };

const ledgerEntrySchema = new mongoose.Schema(
  {
    partyType: { type: String, enum: PARTY_TYPES, required: true },
    party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
    partyModel: { type: String, required: true, enum: Object.values(PARTY_MODELS) },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },
    source: { type: String, enum: ['manual', 'invoice', 'payroll'], default: 'manual' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ partyType: 1, party: 1, date: 1 });

ledgerEntrySchema.pre('validate', function setPartyModel(next) {
  if (this.partyType) this.partyModel = PARTY_MODELS[this.partyType];
  next();
});

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
module.exports.PARTY_TYPES = PARTY_TYPES;
module.exports.PARTY_MODELS = PARTY_MODELS;
