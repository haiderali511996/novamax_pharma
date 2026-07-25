const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Employee = require('../models/Employee');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const License = require('../models/License');

// @desc  Aggregate key stats across all modules for the dashboard home page
// @route GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const in90Days = new Date();
  in90Days.setDate(in90Days.getDate() + 90);
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);

  const [
    productCount,
    lowStockBatches,
    nearExpiryBatches,
    customerCount,
    supplierCount,
    salesOrderCount,
    purchaseOrderCount,
    employeeCount,
    unpaidInvoices,
    monthlyExpenses,
    licenseAlerts,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Batch.countDocuments({ quantity: { $gt: 0, $lte: 20 } }),
    Batch.countDocuments({ expiryDate: { $lte: in90Days }, quantity: { $gt: 0 } }),
    Customer.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    SalesOrder.countDocuments(),
    PurchaseOrder.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Invoice.countDocuments({ status: { $in: ['unpaid', 'partially_paid', 'overdue'] } }),
    Expense.aggregate([
      { $match: { date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    License.countDocuments({ expiryDate: { $lte: in60Days } }),
  ]);

  res.json({
    success: true,
    data: {
      products: productCount,
      lowStockBatches,
      nearExpiryBatches,
      customers: customerCount,
      suppliers: supplierCount,
      salesOrders: salesOrderCount,
      purchaseOrders: purchaseOrderCount,
      employees: employeeCount,
      unpaidInvoices,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      licenseAlerts,
    },
  });
});

module.exports = { getSummary };
