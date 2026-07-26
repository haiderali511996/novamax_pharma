const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getStockValuation,
  getAgedReceivables,
  getAgedPayables,
  getSalesByTerritory,
  getProfitAndLoss,
  getDoctorCommissions,
} = require('../controllers/reportController');

const router = express.Router();

router.use(protect);
router.get('/stock-valuation', getStockValuation);
router.get('/aged-receivables', getAgedReceivables);
router.get('/aged-payables', getAgedPayables);
router.get('/sales-by-territory', getSalesByTerritory);
router.get('/profit-loss', getProfitAndLoss);
router.get('/doctor-commissions', getDoctorCommissions);

module.exports = router;
