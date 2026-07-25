const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getNotifications, markAsRead, triggerScan } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.post('/scan-overdue', authorize('admin', 'manager'), triggerScan);

module.exports = router;
