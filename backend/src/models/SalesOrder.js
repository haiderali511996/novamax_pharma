const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    // Attributes this order to a medical rep / salesperson for target tracking.
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    // Doctor who referred/prescribed for this sale, if any. Drives the
    // cash-commission ledger posting (see salesOrderController) or the
    // product-discount cascade already baked into the line item prices.
    referringDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    // The formal area/Territory this sale (and referral, if any) belongs to.
    // A doctor's commission/discount % can vary by area (Doctor.areaRates) -
    // this is what picks which rate applies, separate from...
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    // ...this free-text label for the specific venue (e.g. "Nawazsharif
    // Medical Complex" in the morning vs. "City Clinic" in the evening,
    // both possibly in the same territory). A doctor sitting at multiple
    // places still rolls up under ONE doctor record and ONE commission
    // total per area - this just lets reports break that down by venue.
    referralLocation: { type: String, trim: true },
    items: { type: [lineItemSchema], validate: (v) => v.length > 0 },
    subTotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'draft' },
    // Set once stock has been deducted for this order, so confirming twice
    // (or re-saving an already-confirmed order) never double-deducts.
    stockApplied: { type: Boolean, default: false },
    orderDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
