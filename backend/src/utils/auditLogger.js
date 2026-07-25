const AuditLog = require('../models/AuditLog');

// Never let audit logging break the request it's logging - failures are
// swallowed (and reported to stderr) rather than surfaced to the caller.
async function logAudit({ user, action, actionLabel, resource, resourceId, before, after }) {
  try {
    await AuditLog.create({
      user: user?._id,
      userEmail: user?.email,
      action,
      actionLabel,
      resource,
      resourceId,
      before,
      after,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { logAudit };
