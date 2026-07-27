const express = require('express');
const Facility = require('../models/Facility');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const { importFacilities, searchOsmFacilities } = require('../controllers/facilityController');

const router = express.Router();
const ctrl = createCrudController(Facility, {
  populate: [{ path: 'territory', select: 'name region' }],
  searchFields: ['name', 'address', 'city', 'phone', 'contactPerson'],
});

router.use(protect);
router.post('/import', importFacilities);
router.get('/search-osm', searchOsmFacilities);
router.route('/').get(ctrl.getAll).post(ctrl.createOne);
router.route('/:id').get(ctrl.getOne).put(ctrl.updateOne).delete(ctrl.deleteOne);

module.exports = router;
