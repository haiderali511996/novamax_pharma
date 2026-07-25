const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createTransaction } = require('../controllers/transactionController');

const router = express.Router();
const ctrl = createCrudController(Transaction, { populate: [{ path: 'account', select: 'name code type' }] });

router.use(protect);
router.route('/').get(ctrl.getAll).post(createTransaction);
router.route('/:id').get(ctrl.getOne);

module.exports = router;
