const asyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');
const Invoice = require('../models/Invoice');
const DistributorInvoice = require('../models/DistributorInvoice');
const LedgerEntry = require('../models/LedgerEntry');
const SalesOrder = require('../models/SalesOrder');
const Expense = require('../models/Expense');
const StockMovement = require('../models/StockMovement');

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

module.exports = { getStockValuation, getAgedReceivables, getAgedPayables, getSalesByTerritory, getProfitAndLoss };
