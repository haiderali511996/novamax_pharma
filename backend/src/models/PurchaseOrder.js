const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    // Filled in at receiving time (see the /receive action) so each line
    // becomes a trackable batch in inventory.
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    // Contract manufacturer that actually produces this order's goods
    // (distinct from "supplier", which may be a distribution middleman).
    // Optional - only set this when buying directly from a toll manufacturer.
    // Stamped onto every batch created when the PO is received.
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: { type: [lineItemSchema], validate: (v) => v.length > 0 },
    subTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'ordered', 'received', 'cancelled'], default: 'draft' },
    // Set once stock has been received into inventory for this PO, so
    // receiving twice never double-credits stock.
    stockApplied: { type: Boolean, default: false },
    orderDate: { type: Date, default: Date.now },
    expectedDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
