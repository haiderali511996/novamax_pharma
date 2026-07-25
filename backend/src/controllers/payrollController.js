const asyncHandler = require('express-async-handler');
const Payroll = require('../models/Payroll');
const LedgerEntry = require('../models/LedgerEntry');

// Posts a credit to the employee's ledger the first time a payroll record
// is saved with status 'paid' (covers both creating it as already-paid and
// updating a pending run to paid). Guarded by source+reference lookup so
// re-saving an already-paid record never double-posts.
async function postSalaryCreditIfNewlyPaid(payroll, userId) {
  if (payroll.status !== 'paid') return;

  const reference = `Payroll-${payroll._id}`;
  const existing = await LedgerEntry.findOne({ partyType: 'employee', party: payroll.employee, reference });
  if (existing) return;

  await LedgerEntry.create({
    partyType: 'employee',
    party: payroll.employee,
    date: payroll.paidOn || new Date(),
    type: 'credit',
    amount: payroll.netPay,
    description: `Salary paid for ${payroll.month}/${payroll.year}`,
    reference,
    source: 'payroll',
    createdBy: userId,
  });
}

const createPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.create(req.body);
  await postSalaryCreditIfNewlyPaid(payroll, req.user._id);
  res.status(201).json({ success: true, data: payroll });
});

const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!payroll) {
    res.status(404);
    throw new Error('Payroll record not found');
  }
  await postSalaryCreditIfNewlyPaid(payroll, req.user._id);
  res.json({ success: true, data: payroll });
});

module.exports = { createPayroll, updatePayroll };
