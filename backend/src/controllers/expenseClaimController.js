const asyncHandler = require('express-async-handler');
const ExpenseClaim = require('../models/ExpenseClaim');
const Expense = require('../models/Expense');
const LedgerEntry = require('../models/LedgerEntry');

const createExpenseClaim = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const claim = await ExpenseClaim.create(req.body);
  res.status(201).json({ success: true, data: claim });
});

// @desc  Approve a claim: records it as a company Running Expense (so it
//        shows up in the Expense Ledger) and credits the employee's ledger
//        for the reimbursement, i.e. the company paying them back.
// @route POST /api/expense-claims/:id/approve
const approveExpenseClaim = asyncHandler(async (req, res) => {
  const claim = await ExpenseClaim.findById(req.params.id);
  if (!claim) {
    res.status(404);
    throw new Error('Expense claim not found');
  }
  if (claim.status !== 'pending') {
    res.status(400);
    throw new Error(`This claim has already been ${claim.status}`);
  }

  await Expense.create({
    title: `${claim.title} (reimbursement)`,
    category: 'running_expense',
    amount: claim.amount,
    date: claim.date,
    notes: `Expense claim by employee ${claim.employee}`,
    createdBy: req.user._id,
  });

  await LedgerEntry.create({
    partyType: 'employee',
    party: claim.employee,
    type: 'credit',
    amount: claim.amount,
    description: `Expense claim reimbursed: ${claim.title}`,
    reference: `ExpenseClaim-${claim._id}`,
    source: 'manual',
    createdBy: req.user._id,
  });

  claim.status = 'approved';
  claim.reviewedBy = req.user._id;
  claim.reviewedAt = new Date();
  await claim.save();

  res.json({ success: true, data: claim });
});

const rejectExpenseClaim = asyncHandler(async (req, res) => {
  const claim = await ExpenseClaim.findById(req.params.id);
  if (!claim) {
    res.status(404);
    throw new Error('Expense claim not found');
  }
  if (claim.status !== 'pending') {
    res.status(400);
    throw new Error(`This claim has already been ${claim.status}`);
  }
  claim.status = 'rejected';
  claim.reviewedBy = req.user._id;
  claim.reviewedAt = new Date();
  await claim.save();
  res.json({ success: true, data: claim });
});

module.exports = { createExpenseClaim, approveExpenseClaim, rejectExpenseClaim };
