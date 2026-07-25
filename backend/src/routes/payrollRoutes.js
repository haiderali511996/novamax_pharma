const express = require('express');
const Payroll = require('../models/Payroll');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createPayroll, updatePayroll } = require('../controllers/payrollController');

const router = express.Router();
const ctrl = createCrudController(Payroll, { populate: [{ path: 'employee', select: 'name employeeId' }] });

router.use(protect);
router.route('/').get(ctrl.getAll).post(createPayroll);
router.route('/:id').get(ctrl.getOne).put(updatePayroll).delete(ctrl.deleteOne);

module.exports = router;
