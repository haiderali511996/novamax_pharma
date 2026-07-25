const mongoose = require('mongoose');

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
    status: { type: String, enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'], default: 'unpaid' },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DistributorInvoice', distributorInvoiceSchema);
