const mongoose = require('mongoose');

// Target only - achievement is always computed live from confirmed sales
// orders attributed to this employee for the same month/year (see
// GET /api/sales-targets/:id/progress), so it can never drift out of sync.
const salesTargetSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salesTargetSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
