const express = require('express');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createInvoiceWithLedgerEntry } = require('../controllers/invoiceController');

const router = express.Router();
const ctrl = createCrudController(Invoice, {
  populate: [{ path: 'customer', select: 'name email phone' }],
  searchFields: ['invoiceNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(createInvoiceWithLedgerEntry);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
