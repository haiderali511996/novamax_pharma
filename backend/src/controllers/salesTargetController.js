const asyncHandler = require('express-async-handler');
const SalesTarget = require('../models/SalesTarget');
const SalesOrder = require('../models/SalesOrder');

// @desc  Target vs. achieved for one sales target, computed live from
//        confirmed sales orders attributed to the employee that month.
// @route GET /api/sales-targets/:id/progress
const getProgress = asyncHandler(async (req, res) => {
  const target = await SalesTarget.findById(req.params.id).populate('employee', 'name employeeId');
  if (!target) {
    res.status(404);
    throw new Error('Sales target not found');
  }

  const start = new Date(target.year, target.month - 1, 1);
  const end = new Date(target.year, target.month, 1);

  const result = await SalesOrder.aggregate([
    {
      $match: {
        salesRep: target.employee._id,
        stockApplied: true,
        orderDate: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, achieved: { $sum: '$grandTotal' }, orderCount: { $sum: 1 } } },
  ]);

  const achieved = result[0]?.achieved || 0;
  const orderCount = result[0]?.orderCount || 0;

  res.json({
    success: true,
    data: {
      target,
      achieved,
      orderCount,
      percentage: target.targetAmount > 0 ? Math.round((achieved / target.targetAmount) * 100) : 0,
    },
  });
});

module.exports = { getProgress };
