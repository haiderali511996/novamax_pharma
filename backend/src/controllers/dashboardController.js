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
const Distributor = require('../models/Distributor');
const Notification = require('../models/Notification');
const LedgerEntry = require('../models/LedgerEntry');
const Doctor = require('../models/Doctor');

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
    distributorCount,
    unreadNotifications,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Batch.countDocuments({ quantity: { $gt: 0, $lte: 20 } }),
    Batch.countDocuments({ expiryDate: { $lte: in90Days }, quantity: { $gt: 0 } }),
    Customer.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    SalesOrder.countDocuments(),
    PurchaseOrder.countDocuments(),
    Employee.countDocuments({ status: 'active' }),
    Invoice.countDocuments({ status: { $in: ['sale_based', 'partially_paid'] }, isCancelled: false }),
    Expense.aggregate([
      { $match: { date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    License.countDocuments({ expiryDate: { $lte: in60Days } }),
    Distributor.countDocuments({ isActive: true }),
    Notification.countDocuments({ isRead: false }),
  ]);

  // Commission % can vary by area (Doctor.areaRates), so it's resolved per
  // territory in JS rather than as a flat $multiply in the pipeline.
  const [companyTotalResult, salesByDoctorTerritory, commissionPaidResult] = await Promise.all([
    SalesOrder.aggregate([{ $match: { stockApplied: true } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    SalesOrder.aggregate([
      { $match: { stockApplied: true, referringDoctor: { $ne: null } } },
      { $group: { _id: { doctor: '$referringDoctor', territory: '$territory' }, totalSales: { $sum: '$grandTotal' } } },
    ]),
    LedgerEntry.aggregate([{ $match: { partyType: 'doctor', type: 'credit' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const salesById = new Map();
  for (const r of salesByDoctorTerritory) {
    const key = String(r._id.doctor);
    if (!salesById.has(key)) salesById.set(key, { totalSales: 0, byTerritory: [] });
    const agg = salesById.get(key);
    agg.totalSales += r.totalSales;
    agg.byTerritory.push({ territoryId: r._id.territory, totalSales: r.totalSales });
  }

  const doctors = await Doctor.find({ _id: { $in: [...salesById.keys()] } });
  const doctorSales = doctors
    .map((doctor) => {
      const agg = salesById.get(String(doctor._id));
      const commissionEarned =
        doctor.incentiveType === 'cash_commission'
          ? agg.byTerritory.reduce((sum, t) => sum + (t.totalSales * doctor.getRateForTerritory(t.territoryId).commissionPercent) / 100, 0)
          : 0;
      return { doctorName: doctor.name, totalSales: agg.totalSales, commissionEarned };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const totalCompanySales = companyTotalResult[0]?.total || 0;
  const totalDoctorReferredSales = doctorSales.reduce((sum, d) => sum + d.totalSales, 0);
  const doctorCommissionExpense = Math.round(doctorSales.reduce((sum, d) => sum + d.commissionEarned, 0) * 100) / 100;

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
      distributors: distributorCount,
      unreadNotifications,
      doctorReferredSalesPercent:
        totalCompanySales > 0 ? Math.round((totalDoctorReferredSales / totalCompanySales) * 10000) / 100 : 0,
      doctorCommissionExpense,
      doctorCommissionPaid: commissionPaidResult[0]?.total || 0,
      topDoctor: doctorSales[0] ? { name: doctorSales[0].doctorName, totalSales: doctorSales[0].totalSales } : null,
    },
  });
});

module.exports = { getSummary };
