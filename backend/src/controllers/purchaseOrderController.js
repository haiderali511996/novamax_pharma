const asyncHandler = require('express-async-handler');
const PurchaseOrder = require('../models/PurchaseOrder');
const Batch = require('../models/Batch');
const StockMovement = require('../models/StockMovement');

// @desc  Receive a purchase order into inventory: creates or tops up a
//        batch per line (matched on product+warehouse+batchNumber) and
//        logs a stock-in movement. Batch number/expiry can be supplied
//        per line in the request body (matched by product id); otherwise
//        the values already stored on the PO's line items are used.
// @route POST /api/purchase-orders/:id/receive
// @body  { items?: [{ product, batchNumber, expiryDate }] }
const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Purchase order not found');
  }
  if (order.stockApplied) {
    res.status(400);
    throw new Error('This purchase order has already been received into inventory');
  }
  if (order.status === 'cancelled') {
    res.status(400);
    throw new Error('Cannot receive a cancelled purchase order');
  }

  const overrides = req.body.items || [];
  const missing = [];

  const resolved = order.items.map((item) => {
    const override = overrides.find((o) => String(o.product) === String(item.product)) || {};
    const batchNumber = override.batchNumber || item.batchNumber;
    const expiryDate = override.expiryDate || item.expiryDate;
    if (!batchNumber || !expiryDate) missing.push(item.product);
    return { ...item.toObject(), batchNumber, expiryDate };
  });

  if (missing.length) {
    res.status(400);
    throw new Error('Every line item needs a batch number and expiry date before it can be received into inventory');
  }

  for (const item of resolved) {
    let batch = await Batch.findOne({ product: item.product, warehouse: order.warehouse, batchNumber: item.batchNumber });
    if (batch) {
      batch.quantity += item.quantity;
      await batch.save();
    } else {
      batch = await Batch.create({
        product: item.product,
        warehouse: order.warehouse,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        costPrice: item.unitCost,
        supplier: order.supplier,
      });
    }

    await StockMovement.create({
      product: item.product,
      batch: batch._id,
      warehouse: order.warehouse,
      type: 'in',
      quantity: item.quantity,
      reason: 'Purchase order received',
      reference: order.poNumber,
      createdBy: req.user._id,
    });
  }

  order.items = resolved;
  order.stockApplied = true;
  order.status = 'received';
  await order.save();

  res.json({ success: true, data: order });
});

module.exports = { receivePurchaseOrder };
