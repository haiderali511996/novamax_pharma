const express = require('express');
const { protect } = require('../middleware/auth');
const { getPriceQuote } = require('../controllers/pricingController');

const router = express.Router();

router.use(protect);
router.get('/quote', getPriceQuote);

module.exports = router;
