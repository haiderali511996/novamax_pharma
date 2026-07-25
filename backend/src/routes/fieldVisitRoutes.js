const express = require('express');
const FieldVisit = require('../models/FieldVisit');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(FieldVisit, {
  populate: [
    { path: 'employee', select: 'name employeeId' },
    { path: 'territory', select: 'name region' },
    { path: 'samplesGiven.product', select: 'name sku' },
  ],
  searchFields: ['contactName', 'location'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
