const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

// Creating a transaction also updates the linked account's running balance.
const createTransaction = asyncHandler(async (req, res) => {
  const { account: accountId, type, amount } = req.body;

  const account = await Account.findById(accountId);
  if (!account) {
    res.status(404);
    throw new Error('Account not found');
  }

  account.balance += type === 'debit' ? Number(amount) : -Number(amount);
  await account.save();

  req.body.createdBy = req.user._id;
  const transaction = await Transaction.create(req.body);
  res.status(201).json({ success: true, data: transaction });
});

module.exports = { createTransaction };
