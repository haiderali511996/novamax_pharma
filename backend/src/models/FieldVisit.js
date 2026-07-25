const mongoose = require('mongoose');

const sampleGivenSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

// Field-force CRM: a medical rep's visit log to a doctor, chemist,
// hospital, or pharmacy - separate from sales/purchase transactions.
const fieldVisitSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    visitType: { type: String, enum: ['doctor', 'chemist', 'hospital', 'pharmacy', 'other'], default: 'doctor' },
    contactName: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    visitDate: { type: Date, default: Date.now },
    samplesGiven: { type: [sampleGivenSchema], default: [] },
    notes: { type: String, trim: true },
    nextVisitDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FieldVisit', fieldVisitSchema);
