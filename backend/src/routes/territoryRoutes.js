const express = require('express');
const Territory = require('../models/Territory');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(Territory, { searchFields: ['name', 'region', 'city'] });

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
