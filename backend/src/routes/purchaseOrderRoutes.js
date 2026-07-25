const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(PurchaseOrder, {
  populate: [
    { path: 'supplier', select: 'name email phone' },
    { path: 'items.product', select: 'name sku' },
  ],
  searchFields: ['poNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
