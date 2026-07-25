const express = require('express');
const ExpenseClaim = require('../models/ExpenseClaim');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { createExpenseClaim, approveExpenseClaim, rejectExpenseClaim } = require('../controllers/expenseClaimController');

const router = express.Router();
const ctrl = createCrudController(ExpenseClaim, { populate: [{ path: 'employee', select: 'name employeeId' }] });

router.use(protect);
router.post('/:id/approve', approveExpenseClaim);
router.post('/:id/reject', rejectExpenseClaim);
router.route('/').get(ctrl.getAll).post(createExpenseClaim);
router.route('/:id').get(ctrl.getOne).delete(ctrl.deleteOne);

module.exports = router;
