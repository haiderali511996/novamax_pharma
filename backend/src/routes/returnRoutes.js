const express = require('express');
const Return = require('../models/Return');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createReturn, approveReturn, rejectReturn } = require('../controllers/returnController');

const router = express.Router();
const ctrl = createCrudController(Return, {
  populate: [
    { path: 'items.product', select: 'name sku' },
    { path: 'items.batch', select: 'batchNumber expiryDate warehouse' },
  ],
  searchFields: ['returnNumber'],
});

router.use(protect);
router.post('/:id/approve', approveReturn);
router.post('/:id/reject', rejectReturn);
router.route('/').get(ctrl.getAll).post(createReturn);
router.route('/:id').get(ctrl.getOne).delete(ctrl.deleteOne);

module.exports = router;
