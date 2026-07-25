const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    reference: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
