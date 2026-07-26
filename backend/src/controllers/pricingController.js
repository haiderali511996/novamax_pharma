const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Doctor = require('../models/Doctor');
const Customer = require('../models/Customer');
const { calculateCascadingPrice } = require('../utils/pricing');

// @desc  Quote the cascading trade-discount price for a product, optionally
//        attributed to a referring doctor (in a given territory - the
//        doctor's discount % can vary by area) and/or a specific pharmacy
//        customer. Used by the sales-order builder to prefill unit price.
// @route GET /api/pricing/quote?product=<id>&doctor=<id>&territory=<id>&customer=<id>
const getPriceQuote = asyncHandler(async (req, res) => {
  const { product: productId, doctor: doctorId, territory: territoryId, customer: customerId } = req.query;
  if (!productId) {
    res.status(400);
    throw new Error('product query param is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let doctorDiscountPercent = 0;
  if (doctorId) {
    const doctor = await Doctor.findById(doctorId);
    if (doctor && doctor.incentiveType === 'product_discount') {
      doctorDiscountPercent = doctor.getRateForTerritory(territoryId).discountPercent;
    }
  }

  let pharmacyDiscountPercent = 0;
  if (customerId) {
    const customer = await Customer.findById(customerId);
    if (customer) pharmacyDiscountPercent = customer.pharmacyDiscountPercent;
  }

  const quote = calculateCascadingPrice({ tp: product.sellingPrice, doctorDiscountPercent, pharmacyDiscountPercent });

  res.json({ success: true, data: quote });
});

module.exports = { getPriceQuote };
