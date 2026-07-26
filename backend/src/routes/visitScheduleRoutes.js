const express = require('express');
const VisitSchedule = require('../models/VisitSchedule');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { getDueVisits, getWeekSchedule } = require('../controllers/visitScheduleController');

const router = express.Router();
const ctrl = createCrudController(VisitSchedule, {
  populate: [
    { path: 'assignee', select: 'name employeeId' },
    { path: 'territory', select: 'name' },
    { path: 'party' },
  ],
});

router.use(protect);
router.get('/due', getDueVisits);
router.get('/week', getWeekSchedule);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
