const rateLimit = require('express-rate-limit');

// Login/register are the only unauthenticated endpoints in the API, which
// makes them the sole brute-force/credential-stuffing surface - limit them
// tighter than the rest of the app. Skipped entirely in tests so the suite
// isn't rate-limited by its own volume of requests.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

module.exports = { authLimiter };
