const express = require('express');
const DistributorInvoice = require('../models/DistributorInvoice');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(DistributorInvoice, {
  populate: [{ path: 'distributor', select: 'name territory location' }],
  searchFields: ['invoiceNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
