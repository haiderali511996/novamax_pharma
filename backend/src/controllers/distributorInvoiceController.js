const asyncHandler = require('express-async-handler');
const DistributorInvoice = require('../models/DistributorInvoice');
const LedgerEntry = require('../models/LedgerEntry');

// Creating a distributor invoice also posts a debit to the distributor's
// ledger (they now owe this amount), mirroring how a customer Invoice posts
// to the customer ledger.
const createDistributorInvoiceWithLedgerEntry = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const invoice = await DistributorInvoice.create(req.body);

  await LedgerEntry.create({
    partyType: 'distributor',
    party: invoice.distributor,
    date: invoice.invoiceDate || invoice.createdAt,
    type: 'debit',
    amount: invoice.amount,
    description: `Invoice ${invoice.invoiceNumber}${invoice.pharmacyName ? ` (billed to ${invoice.pharmacyName})` : ''}`,
    reference: invoice.invoiceNumber,
    source: 'invoice',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: invoice });
});

module.exports = { createDistributorInvoiceWithLedgerEntry };
