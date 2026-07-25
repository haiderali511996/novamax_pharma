const express = require('express');
const DistributorInvoice = require('../models/DistributorInvoice');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createDistributorInvoiceWithLedgerEntry } = require('../controllers/distributorInvoiceController');

const router = express.Router();
const ctrl = createCrudController(DistributorInvoice, {
  populate: [
    { path: 'distributor', select: 'name territory location phone licenseNumber' },
    { path: 'items.product', select: 'name sku' },
  ],
  searchFields: ['invoiceNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(createDistributorInvoiceWithLedgerEntry);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
