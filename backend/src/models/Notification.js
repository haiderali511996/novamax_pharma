const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['overdue_customer_invoice', 'overdue_distributor_invoice', 'license_expiry', 'low_stock', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetRole: {
      type: String,
      enum: ['admin', 'manager', 'pharmacist', 'sales', 'hr', 'accountant', 'staff'],
      default: 'sales',
    },
    relatedModel: { type: String, trim: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One notification per overdue invoice, not one per scan run.
notificationSchema.index({ type: 1, relatedId: 1 }, { unique: true, partialFilterExpression: { relatedId: { $exists: true } } });

module.exports = mongoose.model('Notification', notificationSchema);
