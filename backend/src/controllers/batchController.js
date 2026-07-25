const asyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');

// @desc  Get batches expiring within N days (default 90) or already expired
// @route GET /api/batches/expiry-alerts?days=90
const getExpiryAlerts = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const batches = await Batch.find({ expiryDate: { $lte: cutoff }, quantity: { $gt: 0 } })
    .populate('product', 'name sku')
    .populate('warehouse', 'name code')
    .sort({ expiryDate: 1 });

  res.json({ success: true, count: batches.length, data: batches });
});

module.exports = { getExpiryAlerts };
