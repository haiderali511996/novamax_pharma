const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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
const manufacturerRoutes = require('./routes/manufacturerRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const returnRoutes = require('./routes/returnRoutes');
const fieldVisitRoutes = require('./routes/fieldVisitRoutes');
const salesTargetRoutes = require('./routes/salesTargetRoutes');
const expenseClaimRoutes = require('./routes/expenseClaimRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const pricingRoutes = require('./routes/pricingRoutes');

// Pure Express app construction - no DB connection, no listening, no
// background timers. Safe to require from tests (with their own DB
// connection already established) as well as from server.js for real runs.
const app = express();

// Behind a reverse proxy (nginx, or cPanel/LiteSpeed's Node app handler) in
// production, requests arrive with an X-Forwarded-For header. Express must
// be told to trust it (rather than treating it as untrusted-and-suspicious)
// or express-rate-limit refuses to identify requesters and throws on every
// request. `1` trusts exactly one hop, matching a single reverse proxy in
// front of the app - not a public-facing Node process taking raw traffic.
app.set('trust proxy', 1);

app.use(helmet());
// Auth uses a Bearer token, not cookies, so no credentials mode is needed;
// that also lets CLIENT_URL default to '*' without violating CORS rules.
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// General defense-in-depth ceiling on the whole API; auth routes carry a
// much tighter limit of their own (see routes/authRoutes.js).
if (process.env.NODE_ENV !== 'test') {
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

app.get('/api/health', (req, res) => res.json({ success: true, message: 'NovaMax ERP API is running' }));

// Uploaded license documents / expense receipts. Cross-Origin-Resource-Policy
// is relaxed just for this path so the frontend (a different origin) can
// embed/preview them, e.g. images inline instead of only opening in a new tab.
//
// Served under /api/uploads (not just /uploads) so the whole backend lives
// under one URL prefix - some hosts (e.g. cPanel's "Setup Node.js App",
// which maps this backend to a subpath like /api on shared hosting with no
// reverse-proxy config of our own) only route that one prefix to this app.
app.use(
  '/api/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, '..', 'uploads'))
);

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
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/ledger-entries', ledgerRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/field-visits', fieldVisitRoutes);
app.use('/api/sales-targets', salesTargetRoutes);
app.use('/api/expense-claims', expenseClaimRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pricing', pricingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
