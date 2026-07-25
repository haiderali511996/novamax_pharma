const mongoose = require('mongoose');

// A reimbursement request from an employee (typically a field rep) for
// money they spent - travel, fuel, meals, etc. Distinct from Expense
// (the company's own direct spending record).
const expenseClaimSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['travel', 'fuel', 'meals', 'lodging', 'other'], default: 'other' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    description: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
