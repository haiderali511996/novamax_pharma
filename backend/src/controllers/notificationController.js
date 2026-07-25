const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const DistributorInvoice = require('../models/DistributorInvoice');

const OVERDUE_DAYS = 30;
const OPEN_STATUSES = ['unpaid', 'partially_paid', 'overdue'];

// Scans customer + distributor invoices for anything unpaid for 30+ days
// past its due date and intimates the sales team via a Notification record.
// Uses an upsert keyed on (type, relatedId) so re-running the scan never
// creates duplicate alerts or clobbers an already-read notification.
async function scanOverdueInvoices() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OVERDUE_DAYS);

  const [overdueCustomerInvoices, overdueDistributorInvoices] = await Promise.all([
    Invoice.find({ status: { $in: OPEN_STATUSES }, dueDate: { $lte: cutoff } }).populate('customer', 'name phone email'),
    DistributorInvoice.find({ status: { $in: OPEN_STATUSES }, dueDate: { $lte: cutoff } }).populate('distributor', 'name phone email'),
  ]);

  let created = 0;

  for (const invoice of overdueCustomerInvoices) {
    const balance = invoice.amount - invoice.amountPaid;
    const res = await Notification.updateOne(
      { type: 'overdue_customer_invoice', relatedId: invoice._id },
      {
        $setOnInsert: {
          type: 'overdue_customer_invoice',
          relatedId: invoice._id,
          relatedModel: 'Invoice',
          targetRole: 'sales',
          title: `Overdue invoice: ${invoice.invoiceNumber}`,
          message: `${invoice.customer?.name || 'Customer'} has an outstanding balance of $${balance.toFixed(
            2
          )} on invoice ${invoice.invoiceNumber}, overdue since ${invoice.dueDate.toDateString()}.`,
          isRead: false,
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount) created += 1;
  }

  for (const invoice of overdueDistributorInvoices) {
    const balance = invoice.amount - invoice.amountPaid;
    const res = await Notification.updateOne(
      { type: 'overdue_distributor_invoice', relatedId: invoice._id },
      {
        $setOnInsert: {
          type: 'overdue_distributor_invoice',
          relatedId: invoice._id,
          relatedModel: 'DistributorInvoice',
          targetRole: 'sales',
          title: `Overdue distributor invoice: ${invoice.invoiceNumber}`,
          message: `${invoice.distributor?.name || 'Distributor'}${
            invoice.pharmacyName ? ` (billed to ${invoice.pharmacyName})` : ''
          } has an outstanding balance of $${balance.toFixed(2)} on invoice ${
            invoice.invoiceNumber
          }, overdue since ${invoice.dueDate.toDateString()}.`,
          isRead: false,
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount) created += 1;
  }

  return { scanned: overdueCustomerInvoices.length + overdueDistributorInvoices.length, created };
}

// @desc  List notifications visible to the current user (their role, or all for admin)
// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { isRead } = req.query;
  const query = {};
  if (req.user.role !== 'admin') query.targetRole = req.user.role;
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(200);
  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

  res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
});

// @desc  Mark a notification as read
// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, data: notification });
});

// @desc  Manually trigger the overdue-invoice scan (also runs automatically on a timer)
// @route POST /api/notifications/scan-overdue
const triggerScan = asyncHandler(async (req, res) => {
  const result = await scanOverdueInvoices();
  res.json({ success: true, data: result });
});

module.exports = { scanOverdueInvoices, getNotifications, markAsRead, triggerScan };
