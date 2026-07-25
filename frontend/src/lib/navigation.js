export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard' }],
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
    ],
  },
  {
    label: 'Purchases',
    items: [
      { href: '/suppliers', label: 'Suppliers' },
      { href: '/purchase-orders', label: 'Purchase Orders' },
    ],
  },
  {
    label: 'HR & Payroll',
    items: [
      { href: '/employees', label: 'Employees' },
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
    label: 'Compliance',
    items: [{ href: '/licenses', label: 'Licenses & Documents' }],
  },
  {
    label: 'Administration',
    items: [{ href: '/users', label: 'Users', adminOnly: true }],
  },
];
