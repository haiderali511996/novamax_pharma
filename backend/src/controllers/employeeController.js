const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');

// @desc  Return the full employee list flattened for building an org chart
//        (CEO down to office boy) via each employee's reportsTo pointer.
// @route GET /api/employees/org-chart
const getOrgChart = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ status: { $ne: 'terminated' } })
    .select('name employeeId designation designationLevel department reportsTo territory')
    .populate('territory', 'name region city')
    .lean();

  res.json({ success: true, data: employees });
});

module.exports = { getOrgChart };
