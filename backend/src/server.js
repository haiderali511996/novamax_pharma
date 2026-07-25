require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const batchRoutes = require('./routes/batchRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const salesOrderRoutes = require('./routes/salesOrderRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const territoryRoutes = require('./routes/territoryRoutes');
const distributorRoutes = require('./routes/distributorRoutes');
const distributorInvoiceRoutes = require('./routes/distributorInvoiceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { scanOverdueInvoices } = require('./controllers/notificationController');

const app = express();

app.use(helmet());
// Auth uses a Bearer token, not cookies, so no credentials mode is needed;
// that also lets CLIENT_URL default to '*' without violating CORS rules.
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'NovaMax ERP API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/distributors', distributorRoutes);
app.use('/api/distributor-invoices', distributorInvoiceRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

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

module.exports = app;
