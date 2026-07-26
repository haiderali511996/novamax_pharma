const express = require('express');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');

const router = express.Router();
const ctrl = createCrudController(Doctor, {
  populate: [
    { path: 'territory', select: 'name' },
    { path: 'assignedRep', select: 'name' },
  ],
  searchFields: ['name', 'specialization', 'hospitalClinic', 'phone'],
});

router.use(protect);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
