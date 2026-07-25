require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { scanOverdueInvoices } = require('./controllers/notificationController');

const PORT = process.env.PORT || 5000;
const SCAN_INTERVAL_MS = 6 * 60 * 60 * 1000; // re-check overdue invoices every 6 hours

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`NovaMax ERP API listening on port ${PORT}`));

    if (process.env.NODE_ENV !== 'test') {
      scanOverdueInvoices().catch((err) => console.error('Overdue invoice scan failed:', err.message));
      setInterval(() => {
        scanOverdueInvoices().catch((err) => console.error('Overdue invoice scan failed:', err.message));
      }, SCAN_INTERVAL_MS);
    }
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
