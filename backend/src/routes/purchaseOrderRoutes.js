const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { receivePurchaseOrder } = require('../controllers/purchaseOrderController');

const router = express.Router();
const ctrl = createCrudController(PurchaseOrder, {
  populate: [
    { path: 'supplier', select: 'name email phone' },
    { path: 'manufacturer', select: 'name' },
    { path: 'warehouse', select: 'name code' },
    { path: 'items.product', select: 'name sku' },
  ],
  searchFields: ['poNumber'],
});

router.use(protect);
router.post('/:id/receive', receivePurchaseOrder);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
