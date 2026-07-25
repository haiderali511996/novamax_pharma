const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    city: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Territory', territorySchema);
