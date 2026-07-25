const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(User, { searchFields: ['name', 'email'] });

router.use(protect, authorize('admin'));

router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
