const express = require('express');
const Batch = require('../models/Batch');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { getExpiryAlerts } = require('../controllers/batchController');

const router = express.Router();
const ctrl = createCrudController(Batch, {
  populate: [
    { path: 'product', select: 'name sku' },
    { path: 'warehouse', select: 'name code' },
  ],
});

router.use(protect);
router.get('/expiry-alerts', getExpiryAlerts);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
