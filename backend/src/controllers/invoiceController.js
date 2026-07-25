const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const LedgerEntry = require('../models/LedgerEntry');

// Creating an invoice also posts a debit to the customer's ledger
// (they now owe this amount), so the ledger stays in sync automatically.
const createInvoiceWithLedgerEntry = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const invoice = await Invoice.create(req.body);

  await LedgerEntry.create({
    partyType: 'customer',
    party: invoice.customer,
    date: invoice.createdAt,
    type: 'debit',
    amount: invoice.amount,
    description: `Invoice ${invoice.invoiceNumber}`,
    reference: invoice.invoiceNumber,
    source: 'invoice',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: invoice });
});

module.exports = { createInvoiceWithLedgerEntry };
