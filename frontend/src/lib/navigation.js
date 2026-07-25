export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/reports', label: 'Reports' },
      { href: '/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/products', label: 'Products' },
      { href: '/batches', label: 'Batches & Expiry' },
      { href: '/warehouses', label: 'Warehouses' },
      { href: '/stock-movements', label: 'Stock Movements' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/customers', label: 'Customers' },
      { href: '/sales-orders', label: 'Sales Orders' },
      { href: '/invoices', label: 'Invoices' },
      { href: '/returns', label: 'Returns' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { href: '/suppliers', label: 'Suppliers' },
      { href: '/manufacturers', label: 'Manufacturers' },
      { href: '/purchase-orders', label: 'Purchase Orders' },
    ],
  },
  {
    label: 'Distribution',
    items: [
      { href: '/territories', label: 'Territories / Areas' },
      { href: '/distributors', label: 'Distributors' },
      { href: '/distributor-invoices', label: 'Distributor Invoices' },
    ],
  },
  {
    label: 'Field Force',
    items: [
      { href: '/field-visits', label: 'Doctor & Chemist Visits' },
      { href: '/sales-targets', label: 'Sales Targets' },
      { href: '/expense-claims', label: 'Expense Claims' },
    ],
  },
  {
    label: 'HR & Payroll',
    items: [
      { href: '/employees', label: 'Employees' },
      { href: '/org-chart', label: 'Org Chart' },
      { href: '/attendance', label: 'Attendance' },
      { href: '/leaves', label: 'Leaves' },
      { href: '/payroll', label: 'Payroll' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/accounts', label: 'Accounts' },
      { href: '/transactions', label: 'Transactions' },
      { href: '/expenses', label: 'Expenses' },
    ],
  },
  {
    label: 'Ledgers',
    items: [
      { href: '/ledgers/customers', label: 'Customer Ledger' },
      { href: '/ledgers/distributors', label: 'Distributor Ledger' },
      { href: '/ledgers/manufacturers', label: 'Manufacturer Ledger' },
      { href: '/ledgers/employees', label: 'Employee Ledger' },
      { href: '/ledgers/expenses', label: 'Expense Ledger' },
    ],
  },
  {
    label: 'Compliance',
    items: [{ href: '/licenses', label: 'Licenses & Documents' }],
  },
  {
    label: 'Administration',
    items: [
      { href: '/users', label: 'Users', adminOnly: true },
      { href: '/audit-logs', label: 'Audit Log', adminOnly: true },
    ],
  },
];
