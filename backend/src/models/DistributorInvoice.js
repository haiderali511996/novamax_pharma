const mongoose = require('mongoose');

// Same 3-type payment model as Invoice: sale_based (nothing paid),
// partially_paid, fully_paid. Overdue is computed, not stored.
const INVOICE_STATUSES = ['sale_based', 'partially_paid', 'fully_paid'];

const distributorInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    invoiceDate: { type: Date, default: Date.now },
    distributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor', required: true },
    // The pharmacy/customer this distributor issued the sale invoice to.
    // Each distributor prints on its own invoice template (see e.g. Hadi
    // Health Care's format), but this is the shared underlying data.
    pharmacyName: { type: String, trim: true },
    pharmacyLicenseNumber: { type: String, trim: true },
    pharmacyAddress: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'sale_based' },
    isCancelled: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

distributorInvoiceSchema.virtual('isOverdue').get(function isOverdue() {
  return !this.isCancelled && this.status !== 'fully_paid' && this.dueDate < new Date();
});

distributorInvoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DistributorInvoice', distributorInvoiceSchema);
module.exports.INVOICE_STATUSES = INVOICE_STATUSES;
