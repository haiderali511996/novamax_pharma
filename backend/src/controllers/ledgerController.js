const asyncHandler = require('express-async-handler');
const LedgerEntry = require('../models/LedgerEntry');
const { PARTY_MODELS } = require('../models/LedgerEntry');

// @desc  Create a manual ledger entry (debit or credit) against a party
// @route POST /api/ledger-entries
const createEntry = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  req.body.source = req.body.source || 'manual';
  const entry = await LedgerEntry.create(req.body);
  res.status(201).json({ success: true, data: entry });
});

// @desc  List raw ledger entries (optionally filtered by partyType/party)
// @route GET /api/ledger-entries
const getEntries = asyncHandler(async (req, res) => {
  const { partyType, party, page = 1, limit = 100 } = req.query;
  const query = {};
  if (partyType) query.partyType = partyType;
  if (party) query.party = party;

  const entries = await LedgerEntry.find(query)
    .sort({ date: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await LedgerEntry.countDocuments(query);

  res.json({ success: true, count: entries.length, total, data: entries });
});

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await LedgerEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!entry) {
    res.status(404);
    throw new Error('Ledger entry not found');
  }
  res.json({ success: true, data: entry });
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await LedgerEntry.findByIdAndDelete(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Ledger entry not found');
  }
  res.json({ success: true, data: {} });
});

// @desc  Full running-balance statement for one party, oldest first
// @route GET /api/ledger-entries/statement?partyType=customer&party=<id>
const getStatement = asyncHandler(async (req, res) => {
  const { partyType, party } = req.query;
  if (!partyType || !party) {
    res.status(400);
    throw new Error('partyType and party query params are required');
  }
  if (!PARTY_MODELS[partyType]) {
    res.status(400);
    throw new Error(`Invalid partyType: ${partyType}`);
  }

  const entries = await LedgerEntry.find({ partyType, party }).sort({ date: 1, createdAt: 1 });

  let balance = 0;
  const rows = entries.map((entry) => {
    balance += entry.type === 'debit' ? entry.amount : -entry.amount;
    return {
      _id: entry._id,
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      reference: entry.reference,
      source: entry.source,
      balance,
    };
  });

  const totalDebit = entries.filter((e) => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = entries.filter((e) => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

  res.json({
    success: true,
    data: { rows, totalDebit, totalCredit, closingBalance: balance },
  });
});

module.exports = { createEntry, getEntries, updateEntry, deleteEntry, getStatement };
