const mongoose = require('mongoose');

// An invoice is exactly one of these 3 types at a time:
//   sale_based      - credit sale invoice, nothing paid yet (payment due per terms)
//   partially_paid  - some payment received, balance still outstanding
//   fully_paid      - paid in full
// "Overdue" is not a stored state - it's computed from dueDate vs. today for
// any invoice that isn't fully paid or cancelled. Cancellation is tracked
// separately via isCancelled so it doesn't collide with the payment type.
const INVOICE_STATUSES = ['sale_based', 'partially_paid', 'fully_paid'];

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'sale_based' },
    isCancelled: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

invoiceSchema.virtual('isOverdue').get(function isOverdue() {
  return !this.isCancelled && this.status !== 'fully_paid' && this.dueDate < new Date();
});

invoiceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
module.exports.INVOICE_STATUSES = INVOICE_STATUSES;
