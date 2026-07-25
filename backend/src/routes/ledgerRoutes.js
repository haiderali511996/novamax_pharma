const express = require('express');
const { protect } = require('../middleware/auth');
const { createEntry, getEntries, updateEntry, deleteEntry, getStatement } = require('../controllers/ledgerController');

const router = express.Router();

router.use(protect);
router.get('/statement', getStatement);
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').put(updateEntry).delete(deleteEntry);

module.exports = router;
