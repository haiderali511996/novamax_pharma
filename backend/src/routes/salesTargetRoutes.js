const express = require('express');
const SalesTarget = require('../models/SalesTarget');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { getProgress } = require('../controllers/salesTargetController');

const router = express.Router();
const ctrl = createCrudController(SalesTarget, {
  populate: [
    { path: 'employee', select: 'name employeeId' },
    { path: 'territory', select: 'name region' },
  ],
});

router.use(protect);
router.get('/:id/progress', getProgress);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
