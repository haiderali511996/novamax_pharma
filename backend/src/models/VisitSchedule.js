const mongoose = require('mongoose');

// Recurring plan for when a medical rep or distributor worker should visit
// a customer/distributor/facility - e.g. "every Monday, re-take the order"
// or "1st of every month, collect the invoice payment". This is the PLAN;
// FieldVisit remains the log of what actually happened on the ground.
const PARTY_MODELS = { customer: 'Customer', distributor: 'Distributor', facility: 'Facility' };

const visitScheduleSchema = new mongoose.Schema(
  {
    // The rep or distributor-side worker responsible for this visit.
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    partyType: { type: String, enum: Object.keys(PARTY_MODELS), required: true },
    party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
    partyModel: { type: String, required: true, enum: Object.values(PARTY_MODELS) },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    frequency: { type: String, enum: ['weekly', 'monthly'], required: true },
    // 0 = Sunday .. 6 = Saturday, required when frequency is 'weekly'.
    dayOfWeek: { type: Number, min: 0, max: 6 },
    // 1-31, required when frequency is 'monthly'. A month shorter than this
    // day (e.g. 31 in February) is treated as due on that month's last day.
    dayOfMonth: { type: Number, min: 1, max: 31 },
    purpose: {
      type: String,
      enum: ['retake_order', 'collect_invoice', 'both', 'visit_only'],
      default: 'both',
    },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

visitScheduleSchema.pre('validate', function setPartyModel(next) {
  if (this.partyType) this.partyModel = PARTY_MODELS[this.partyType];
  if (this.frequency === 'weekly' && this.dayOfWeek === undefined) {
    this.invalidate('dayOfWeek', 'dayOfWeek is required for a weekly schedule');
  }
  if (this.frequency === 'monthly' && this.dayOfMonth === undefined) {
    this.invalidate('dayOfMonth', 'dayOfMonth is required for a monthly schedule');
  }
  next();
});

visitScheduleSchema.index({ assignee: 1, isActive: 1 });

module.exports = mongoose.model('VisitSchedule', visitScheduleSchema);
module.exports.PARTY_MODELS = PARTY_MODELS;
