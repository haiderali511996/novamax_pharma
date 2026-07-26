const asyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');
const Invoice = require('../models/Invoice');
const DistributorInvoice = require('../models/DistributorInvoice');
const LedgerEntry = require('../models/LedgerEntry');
const SalesOrder = require('../models/SalesOrder');
const Expense = require('../models/Expense');
const StockMovement = require('../models/StockMovement');
const Doctor = require('../models/Doctor');
const Territory = require('../models/Territory');

// @desc  Current stock valuation (quantity * cost price) per product/warehouse
// @route GET /api/reports/stock-valuation
const getStockValuation = asyncHandler(async (req, res) => {
  const rows = await Batch.aggregate([
    { $match: { quantity: { $gt: 0 } } },
    {
      $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' },
    },
    { $unwind: '$product' },
    {
      $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' },
    },
    { $unwind: '$warehouse' },
    {
      $lookup: { from: 'manufacturers', localField: 'manufacturer', foreignField: '_id', as: 'manufacturer' },
    },
    { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        product: '$product.name',
        sku: '$product.sku',
        warehouse: '$warehouse.name',
        manufacturer: { $ifNull: ['$manufacturer.name', 'Unspecified'] },
        batchNumber: 1,
        quantity: 1,
        costPrice: { $ifNull: ['$costPrice', '$product.costPrice'] },
        expiryDate: 1,
      },
    },
    { $addFields: { value: { $multiply: ['$quantity', '$costPrice'] } } },
    { $sort: { value: -1 } },
  ]);

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  res.json({ success: true, data: { rows, totalValue } });
});

function agingBuckets(rows, cutoffField = 'dueDate') {
  const now = new Date();
  const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const detailed = rows.map((r) => {
    const balance = r.amount - r.amountPaid;
    const daysOverdue = Math.floor((now - new Date(r[cutoffField])) / (1000 * 60 * 60 * 24));
    let bucket = 'current';
    if (daysOverdue > 90) bucket = '90+';
    else if (daysOverdue > 60) bucket = '61-90';
    else if (daysOverdue > 30) bucket = '31-60';
    else if (daysOverdue > 0) bucket = '1-30';
    buckets[bucket] += balance;
    return { ...r.toObject ? r.toObject() : r, balance, daysOverdue, bucket };
  });
  return { detailed, buckets };
}

// @desc  Aged receivables: outstanding customer + distributor invoices
//        bucketed by days overdue
// @route GET /api/reports/aged-receivables
const getAgedReceivables = asyncHandler(async (req, res) => {
  const openStatuses = ['sale_based', 'partially_paid'];
  const [customerInvoices, distributorInvoices] = await Promise.all([
    Invoice.find({ status: { $in: openStatuses }, isCancelled: false }).populate('customer', 'name phone'),
    DistributorInvoice.find({ status: { $in: openStatuses }, isCancelled: false }).populate('distributor', 'name phone'),
  ]);

  const customerRows = agingBuckets(customerInvoices);
  const distributorRows = agingBuckets(distributorInvoices);

  const combinedBuckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  Object.keys(combinedBuckets).forEach((k) => {
    combinedBuckets[k] = customerRows.buckets[k] + distributorRows.buckets[k];
  });

  const rows = [
    ...customerRows.detailed.map((r) => ({ partyType: 'customer', party: r.customer?.name, ...r })),
    ...distributorRows.detailed.map((r) => ({ partyType: 'distributor', party: r.distributor?.name, ...r })),
  ];

  res.json({ success: true, data: { rows, buckets: combinedBuckets } });
});

// @desc  Aged payables: outstanding manufacturer ledger debit balances
//        (bills received but not yet fully paid), bucketed by entry age
// @route GET /api/reports/aged-payables
const getAgedPayables = asyncHandler(async (req, res) => {
  const Manufacturer = require('../models/Manufacturer');
  const manufacturers = await Manufacturer.find({ isActive: true });

  const rows = [];
  for (const m of manufacturers) {
    const entries = await LedgerEntry.find({ partyType: 'manufacturer', party: m._id }).sort({ date: 1 });
    let balance = 0;
    let oldestUnpaidDate = null;
    entries.forEach((e) => {
      const before = balance;
      balance += e.type === 'debit' ? e.amount : -e.amount;
      if (before <= 0 && balance > 0) oldestUnpaidDate = e.date;
    });
    if (balance > 0.01) {
      const daysOutstanding = oldestUnpaidDate ? Math.floor((Date.now() - new Date(oldestUnpaidDate)) / (1000 * 60 * 60 * 24)) : 0;
      rows.push({ manufacturer: m.name, manufacturerId: m._id, balance, daysOutstanding });
    }
  }

  const totalPayable = rows.reduce((sum, r) => sum + r.balance, 0);
  res.json({ success: true, data: { rows, totalPayable } });
});

// @desc  Confirmed sales totals grouped by the sales rep's territory
// @route GET /api/reports/sales-by-territory
const getSalesByTerritory = asyncHandler(async (req, res) => {
  const rows = await SalesOrder.aggregate([
    { $match: { stockApplied: true } },
    {
      $lookup: { from: 'employees', localField: 'salesRep', foreignField: '_id', as: 'rep' },
    },
    { $unwind: { path: '$rep', preserveNullAndEmptyArrays: true } },
    {
      $lookup: { from: 'territories', localField: 'rep.territory', foreignField: '_id', as: 'territory' },
    },
    { $unwind: { path: '$territory', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$territory.name', 'Unassigned'] },
        totalSales: { $sum: '$grandTotal' },
        orderCount: { $sum: 1 },
      },
    },
    { $project: { territory: '$_id', totalSales: 1, orderCount: 1, _id: 0 } },
    { $sort: { totalSales: -1 } },
  ]);

  res.json({ success: true, data: { rows } });
});

// @desc  Simplified P&L for a given month: revenue (confirmed orders),
//        COGS (cost of goods sold via stock-out movements), expenses
// @route GET /api/reports/profit-loss?month=&year=
const getProfitAndLoss = asyncHandler(async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [revenueResult, expenseResult, cogsResult] = await Promise.all([
    SalesOrder.aggregate([
      { $match: { stockApplied: true, orderDate: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    StockMovement.aggregate([
      { $match: { type: 'out', createdAt: { $gte: start, $lt: end } } },
      { $lookup: { from: 'batches', localField: 'batch', foreignField: '_id', as: 'batch' } },
      { $unwind: '$batch' },
      { $project: { cost: { $multiply: ['$quantity', { $ifNull: ['$batch.costPrice', 0] }] } } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]),
  ]);

  const revenue = revenueResult[0]?.total || 0;
  const expenses = expenseResult[0]?.total || 0;
  const cogs = cogsResult[0]?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;

  res.json({ success: true, data: { month, year, revenue, cogs, grossProfit, expenses, netProfit } });
});

// @desc  Sales attributed to each referring doctor, ranked best-to-worst by
//        business generated, plus - for cash-commission doctors - how much
//        commission has been earned, paid (ledger credits), and is still
//        owed. Also reports what share of total company sales came through
//        doctor referrals at all, and the total commission expense.
//
//        A doctor who sits at more than one place (e.g. a hospital in the
//        morning, a clinic in the evening) is still ONE doctor with ONE
//        commission total - business from every location they refer from
//        rolls up together. `byLocation` breaks that total down by venue
//        (see SalesOrder.referralLocation) purely for display.
//
//        The commission/discount % is NOT fixed for a doctor company-wide -
//        it can vary by area (Doctor.areaRates), so commission is computed
//        PER TERRITORY and then summed. `byArea` shows exactly which rate
//        applied in each territory and how much commission it earned there.
// @route GET /api/reports/doctor-commissions
const getDoctorCommissions = asyncHandler(async (req, res) => {
  const [salesByDoctorTerritory, salesByDoctorLocation, companyTotalResult] = await Promise.all([
    SalesOrder.aggregate([
      { $match: { stockApplied: true, referringDoctor: { $ne: null } } },
      {
        $group: {
          _id: { doctor: '$referringDoctor', territory: '$territory' },
          totalSales: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    SalesOrder.aggregate([
      { $match: { stockApplied: true, referringDoctor: { $ne: null } } },
      {
        $group: {
          _id: { doctor: '$referringDoctor', location: { $ifNull: ['$referralLocation', 'Unspecified'] } },
          totalSales: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
        },
      },
    ]),
    SalesOrder.aggregate([{ $match: { stockApplied: true } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
  ]);
  const totalCompanySales = companyTotalResult[0]?.total || 0;

  const locationById = new Map();
  for (const r of salesByDoctorLocation) {
    const key = String(r._id.doctor);
    if (!locationById.has(key)) locationById.set(key, []);
    locationById.get(key).push({ location: r._id.location, totalSales: r.totalSales, orderCount: r.orderCount });
  }
  locationById.forEach((arr) => arr.sort((a, b) => b.totalSales - a.totalSales));

  const territoryIds = [...new Set(salesByDoctorTerritory.map((r) => r._id.territory).filter(Boolean).map(String))];
  const territories = await Territory.find({ _id: { $in: territoryIds } });
  const territoryNameById = new Map(territories.map((t) => [String(t._id), t.name]));

  const salesById = new Map();
  for (const r of salesByDoctorTerritory) {
    const key = String(r._id.doctor);
    if (!salesById.has(key)) salesById.set(key, { totalSales: 0, orderCount: 0, byTerritory: [] });
    const agg = salesById.get(key);
    agg.totalSales += r.totalSales;
    agg.orderCount += r.orderCount;
    agg.byTerritory.push({ territoryId: r._id.territory, totalSales: r.totalSales, orderCount: r.orderCount });
  }

  const doctors = await Doctor.find({ _id: { $in: [...salesById.keys()] } });

  const rows = [];
  for (const doctor of doctors) {
    const sales = salesById.get(String(doctor._id));
    const isCash = doctor.incentiveType === 'cash_commission';

    const byArea = sales.byTerritory
      .map((t) => {
        const rate = doctor.getRateForTerritory(t.territoryId);
        const areaCommission = isCash ? Math.round(((t.totalSales * rate.commissionPercent) / 100) * 100) / 100 : 0;
        return {
          territory: t.territoryId ? territoryNameById.get(String(t.territoryId)) || 'Unknown area' : 'Unspecified area',
          totalSales: t.totalSales,
          orderCount: t.orderCount,
          commissionPercent: rate.commissionPercent,
          discountPercent: rate.discountPercent,
          commissionEarned: areaCommission,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    const commissionEarned = Math.round(byArea.reduce((sum, a) => sum + a.commissionEarned, 0) * 100) / 100;

    const entries = await LedgerEntry.find({ partyType: 'doctor', party: doctor._id });
    const commissionPaid = entries.filter((e) => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
    const balanceOwed = isCash ? Math.round((commissionEarned - commissionPaid) * 100) / 100 : 0;

    rows.push({
      doctor: doctor.name,
      doctorId: doctor._id,
      incentiveType: doctor.incentiveType,
      totalSales: sales.totalSales,
      orderCount: sales.orderCount,
      byLocation: locationById.get(String(doctor._id)) || [],
      byArea,
      commissionPercent: doctor.commissionPercent,
      discountPercent: doctor.discountPercent,
      commissionEarned,
      commissionPaid,
      balanceOwed,
      salesSharePercent: totalCompanySales > 0 ? Math.round((sales.totalSales / totalCompanySales) * 10000) / 100 : 0,
    });
  }

  // Rank best-to-worst by business generated for NovaMax (totalSales).
  rows.sort((a, b) => b.totalSales - a.totalSales);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  const totalDoctorReferredSales = rows.reduce((sum, r) => sum + r.totalSales, 0);
  const totalCommissionExpense = rows.reduce((sum, r) => sum + r.commissionEarned, 0);
  const totalCommissionPaid = rows.reduce((sum, r) => sum + r.commissionPaid, 0);
  const totalCommissionOwed = rows.reduce((sum, r) => sum + r.balanceOwed, 0);

  res.json({
    success: true,
    data: {
      rows,
      summary: {
        totalCompanySales,
        totalDoctorReferredSales,
        doctorReferredSalesPercent:
          totalCompanySales > 0 ? Math.round((totalDoctorReferredSales / totalCompanySales) * 10000) / 100 : 0,
        totalCommissionExpense,
        totalCommissionPaid,
        totalCommissionOwed,
        topDoctor: rows[0] ? { name: rows[0].doctor, totalSales: rows[0].totalSales } : null,
      },
    },
  });
});

module.exports = {
  getStockValuation,
  getAgedReceivables,
  getAgedPayables,
  getSalesByTerritory,
  getProfitAndLoss,
  getDoctorCommissions,
};
