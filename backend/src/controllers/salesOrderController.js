const asyncHandler = require('express-async-handler');
const SalesOrder = require('../models/SalesOrder');
const Batch = require('../models/Batch');
const StockMovement = require('../models/StockMovement');
const Invoice = require('../models/Invoice');
const { postInvoiceLedgerEntry } = require('./invoiceController');
const { logAudit } = require('../utils/auditLogger');

// @desc  Confirm a sales order: deducts stock (FEFO if no batch was chosen
//        on the line item) and logs a stock-out movement per batch used.
//        Validates availability across all lines before mutating anything,
//        so a shortage on one line doesn't leave stock half-deducted.
// @route POST /api/sales-orders/:id/confirm
const confirmSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Sales order not found');
  }
  if (order.stockApplied) {
    res.status(400);
    throw new Error('Stock has already been deducted for this order');
  }
  if (order.status === 'cancelled') {
    res.status(400);
    throw new Error('Cannot confirm a cancelled order');
  }

  // Plan every deduction first so a shortage on any line aborts cleanly.
  const plan = []; // [{ batch, deductQty }]

  for (const item of order.items) {
    if (item.batch) {
      const batch = await Batch.findById(item.batch);
      if (!batch || String(batch.warehouse) !== String(order.warehouse)) {
        res.status(400);
        throw new Error(`Selected batch for one of the items is invalid for this order's warehouse`);
      }
      if (batch.quantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock in the selected batch (${batch.batchNumber}): have ${batch.quantity}, need ${item.quantity}`);
      }
      plan.push({ batch, deductQty: item.quantity, product: item.product });
    } else {
      const batches = await Batch.find({ product: item.product, warehouse: order.warehouse, quantity: { $gt: 0 } }).sort({
        expiryDate: 1,
      });
      let remaining = item.quantity;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.quantity, remaining);
        plan.push({ batch, deductQty: take, product: item.product });
        remaining -= take;
      }
      if (remaining > 0) {
        res.status(400);
        throw new Error(`Insufficient stock for one of the items to fulfill quantity ${item.quantity} in this warehouse`);
      }
    }
  }

  for (const { batch, deductQty, product } of plan) {
    batch.quantity -= deductQty;
    await batch.save();
    await StockMovement.create({
      product,
      batch: batch._id,
      warehouse: order.warehouse,
      type: 'out',
      quantity: deductQty,
      reason: 'Sales order confirmed',
      reference: order.orderNumber,
      createdBy: req.user._id,
    });
  }

  order.stockApplied = true;
  if (order.status === 'draft') order.status = 'confirmed';
  await order.save();

  await logAudit({
    user: req.user,
    action: 'action',
    actionLabel: 'confirm',
    resource: 'SalesOrder',
    resourceId: order._id,
    after: order,
  });

  res.json({ success: true, data: order });
});

// @desc  Generate the customer invoice for a sales order (one invoice per
//        order - blocked if one already exists). Due date defaults to 30
//        days out unless overridden in the request body.
// @route POST /api/sales-orders/:id/generate-invoice
// @body  { dueDate?, invoiceNumber? }
const generateInvoiceForSalesOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  const existing = await Invoice.findOne({ salesOrder: order._id });
  if (existing) {
    res.status(400);
    throw new Error(`Invoice ${existing.invoiceNumber} already exists for this order`);
  }

  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const invoiceNumber = req.body.invoiceNumber || `INV-${order.orderNumber}`;

  const invoice = await Invoice.create({
    invoiceNumber,
    salesOrder: order._id,
    customer: order.customer,
    amount: order.grandTotal,
    dueDate,
    createdBy: req.user._id,
  });

  await postInvoiceLedgerEntry(invoice, req.user._id, ` (from order ${order.orderNumber})`);

  await logAudit({
    user: req.user,
    action: 'action',
    actionLabel: 'generate-invoice',
    resource: 'SalesOrder',
    resourceId: order._id,
    after: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
  });

  res.status(201).json({ success: true, data: invoice });
});

module.exports = { confirmSalesOrder, generateInvoiceForSalesOrder };
