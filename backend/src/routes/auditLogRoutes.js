const express = require('express');
const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

// @desc  List audit log entries, newest first, optionally filtered
// @route GET /api/audit-logs?resource=&resourceId=&action=&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, resource, resourceId, action, userEmail } = req.query;
    const query = {};
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;
    if (action) query.action = action;
    if (userEmail) query.userEmail = { $regex: userEmail, $options: 'i' };

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await AuditLog.countDocuments(query);

    res.json({ success: true, count: logs.length, total, page: Number(page), data: logs });
  })
);

module.exports = router;
