const mongoose = require('mongoose');

// The pharma company that manufactures the drugs (upstream of Suppliers,
// who NovaMax places purchase orders with). Tracked separately so its own
// accounts-payable ledger can be kept.
const manufacturerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
