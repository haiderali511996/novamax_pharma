const express = require('express');
const SalesOrder = require('../models/SalesOrder');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(SalesOrder, {
  populate: [
    { path: 'customer', select: 'name email phone' },
    { path: 'items.product', select: 'name sku' },
  ],
  searchFields: ['orderNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
