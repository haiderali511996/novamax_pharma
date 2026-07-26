const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // The exact batch stock is put back into - authoritative for which
    // warehouse the return replenishes, so no separate warehouse field
    // is needed on the return itself.
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PARTY_MODELS = { customer: 'Customer', distributor: 'Distributor' };

const returnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, trim: true },
    partyType: { type: String, enum: Object.keys(PARTY_MODELS), required: true },
    party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
    partyModel: { type: String, required: true, enum: Object.values(PARTY_MODELS) },
    items: { type: [returnItemSchema], validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    reasonCategory: {
      type: String,
      enum: ['unsold_slow_moving', 'near_expiry', 'expired', 'damaged', 'wrong_item', 'other'],
      default: 'unsold_slow_moving',
    },
    reason: { type: String, trim: true },
    // restock: goods are sellable, put the quantity back into the batch.
    // writeoff: goods are not sellable (expired/damaged) - the party is
    // still credited (they don't owe for it), but stock is NOT put back;
    // instead it's recorded as a loss via a stock-adjustment movement.
    disposition: { type: String, enum: ['restock', 'writeoff'], default: 'restock' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Set once stock has been put back and the ledger credited, so
    // approving twice never double-restocks or double-credits.
    stockApplied: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

returnSchema.pre('validate', function setPartyModel(next) {
  if (this.partyType) this.partyModel = PARTY_MODELS[this.partyType];
  next();
});

module.exports = mongoose.model('Return', returnSchema);
module.exports.PARTY_MODELS = PARTY_MODELS;
