const asyncHandler = require('express-async-handler');
const Return = require('../models/Return');
const Batch = require('../models/Batch');
const StockMovement = require('../models/StockMovement');
const LedgerEntry = require('../models/LedgerEntry');
const { logAudit } = require('../utils/auditLogger');

const createReturn = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const ret = await Return.create(req.body);
  res.status(201).json({ success: true, data: ret });
});

// @desc  Approve a return: restocks each batch, logs a stock-in movement,
//        and posts a credit to the party's ledger (reduces what they owe).
// @route POST /api/returns/:id/approve
const approveReturn = asyncHandler(async (req, res) => {
  const ret = await Return.findById(req.params.id);
  if (!ret) {
    res.status(404);
    throw new Error('Return not found');
  }
  if (ret.status !== 'pending') {
    res.status(400);
    throw new Error(`This return has already been ${ret.status}`);
  }

  for (const item of ret.items) {
    const batch = await Batch.findById(item.batch);
    if (!batch) {
      res.status(400);
      throw new Error('One of the returned items references a batch that no longer exists');
    }
    batch.quantity += item.quantity;
    await batch.save();

    await StockMovement.create({
      product: item.product,
      batch: batch._id,
      warehouse: batch.warehouse,
      type: 'in',
      quantity: item.quantity,
      reason: 'Customer/distributor return',
      reference: ret.returnNumber,
      createdBy: req.user._id,
    });
  }

  await LedgerEntry.create({
    partyType: ret.partyType,
    party: ret.party,
    type: 'credit',
    amount: ret.totalAmount,
    description: `Return ${ret.returnNumber}`,
    reference: ret.returnNumber,
    source: 'return',
    createdBy: req.user._id,
  });

  ret.status = 'approved';
  ret.stockApplied = true;
  await ret.save();

  await logAudit({ user: req.user, action: 'action', actionLabel: 'approve', resource: 'Return', resourceId: ret._id, after: ret });

  res.json({ success: true, data: ret });
});

// @desc  Reject a return (no stock or ledger changes)
// @route POST /api/returns/:id/reject
const rejectReturn = asyncHandler(async (req, res) => {
  const ret = await Return.findById(req.params.id);
  if (!ret) {
    res.status(404);
    throw new Error('Return not found');
  }
  if (ret.status !== 'pending') {
    res.status(400);
    throw new Error(`This return has already been ${ret.status}`);
  }
  ret.status = 'rejected';
  await ret.save();

  await logAudit({ user: req.user, action: 'action', actionLabel: 'reject', resource: 'Return', resourceId: ret._id, after: ret });

  res.json({ success: true, data: ret });
});

module.exports = { createReturn, approveReturn, rejectReturn };
