const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(protect);

// @desc  Upload a single file (license document, expense receipt, etc.)
//        Returns a relative URL the frontend stores on the owning record
//        (e.g. License.documentUrl, ExpenseClaim.receiptUrl).
// @route POST /api/uploads
router.post(
  '/',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400);
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }
    res.status(201).json({
      success: true,
      data: { url: `/uploads/${req.file.filename}`, originalName: req.file.originalname },
    });
  })
);

module.exports = router;
