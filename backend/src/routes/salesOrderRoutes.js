const express = require('express');
const SalesOrder = require('../models/SalesOrder');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { confirmSalesOrder } = require('../controllers/salesOrderController');

const router = express.Router();
const ctrl = createCrudController(SalesOrder, {
  populate: [
    { path: 'customer', select: 'name email phone' },
    { path: 'warehouse', select: 'name code' },
    { path: 'items.product', select: 'name sku' },
    { path: 'items.batch', select: 'batchNumber expiryDate' },
  ],
  searchFields: ['orderNumber'],
});

router.use(protect);
router.post('/:id/confirm', confirmSalesOrder);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
