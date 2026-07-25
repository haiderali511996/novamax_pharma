const express = require('express');
const Distributor = require('../models/Distributor');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(Distributor, {
  populate: [
    { path: 'territory', select: 'name region city' },
    { path: 'products', select: 'name sku' },
  ],
  searchFields: ['name', 'location', 'contactPerson', 'phone', 'licenseNumber'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
