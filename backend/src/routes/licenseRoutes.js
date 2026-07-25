const express = require('express');
const License = require('../models/License');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { getRenewalAlerts } = require('../controllers/licenseController');

const router = express.Router();
const ctrl = createCrudController(License, { searchFields: ['title', 'licenseNumber', 'issuingAuthority'] });

router.use(protect);
router.get('/renewal-alerts', getRenewalAlerts);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
