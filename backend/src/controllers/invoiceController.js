const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const LedgerEntry = require('../models/LedgerEntry');

// Posts a debit to the customer's ledger for a just-created invoice, so
// the ledger stays in sync automatically. Shared by direct invoice
// creation and by generating an invoice from a confirmed sales order.
async function postInvoiceLedgerEntry(invoice, userId, descriptionSuffix = '') {
  await LedgerEntry.create({
    partyType: 'customer',
    party: invoice.customer,
    date: invoice.createdAt,
    type: 'debit',
    amount: invoice.amount,
    description: `Invoice ${invoice.invoiceNumber}${descriptionSuffix}`,
    reference: invoice.invoiceNumber,
    source: 'invoice',
    createdBy: userId,
  });
}

const createInvoiceWithLedgerEntry = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const invoice = await Invoice.create(req.body);
  await postInvoiceLedgerEntry(invoice, req.user._id);
  res.status(201).json({ success: true, data: invoice });
});

module.exports = { createInvoiceWithLedgerEntry, postInvoiceLedgerEntry };
