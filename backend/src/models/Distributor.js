const mongoose = require('mongoose');

const promotionalItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const distributorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory', required: true },
    location: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    promotionalItems: { type: [promotionalItemSchema], default: [] },
    creditLimit: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Distributor', distributorSchema);
