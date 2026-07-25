const asyncHandler = require('express-async-handler');
const License = require('../models/License');

// @desc  Get licenses expiring within N days (default 60) or already expired
// @route GET /api/licenses/renewal-alerts?days=60
const getRenewalAlerts = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 60;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const licenses = await License.find({ expiryDate: { $lte: cutoff } }).sort({ expiryDate: 1 });
  res.json({ success: true, count: licenses.length, data: licenses });
});

module.exports = { getRenewalAlerts };
