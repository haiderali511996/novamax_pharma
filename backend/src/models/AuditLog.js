const mongoose = require('mongoose');

// Who changed what, when. Populated automatically for every resource that
// goes through the generic CRUD factory, plus explicitly from a few
// business-workflow actions (confirm order, receive PO, approve return,
// etc.) that don't go through plain create/update/delete.
const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true },
    action: { type: String, enum: ['create', 'update', 'delete', 'action'], required: true },
    // Human label for non-CRUD actions, e.g. "confirm", "receive", "approve".
    actionLabel: { type: String, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
