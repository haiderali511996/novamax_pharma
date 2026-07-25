const express = require('express');
const StockMovement = require('../models/StockMovement');
const Batch = require('../models/Batch');
const { protect } = require('../middleware/auth');
const { createCrudController } = require('../utils/crudFactory');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const ctrl = createCrudController(StockMovement, {
  populate: [
    { path: 'product', select: 'name sku' },
    { path: 'warehouse', select: 'name code' },
    { path: 'batch', select: 'batchNumber expiryDate' },
  ],
});

router.use(protect);

// Creating a stock movement also adjusts the related batch quantity.
const createMovementAndAdjustStock = asyncHandler(async (req, res) => {
  const { batch: batchId, type, quantity } = req.body;

  if (batchId) {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      res.status(404);
      throw new Error('Batch not found');
    }
    if (type === 'in') batch.quantity += Number(quantity);
    else if (type === 'out') batch.quantity = Math.max(0, batch.quantity - Number(quantity));
    else if (type === 'adjustment') batch.quantity = Number(quantity);
    await batch.save();
  }

  req.body.createdBy = req.user._id;
  const movement = await StockMovement.create(req.body);
  res.status(201).json({ success: true, data: movement });
});

router.route('/').get(ctrl.getAll).post(createMovementAndAdjustStock);
router.route('/:id').get(ctrl.getOne);

module.exports = router;
