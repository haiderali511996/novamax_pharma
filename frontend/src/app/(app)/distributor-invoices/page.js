'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'distributor.name', label: 'Distributor' },
  { key: 'pharmacyName', label: 'Pharmacy' },
  { key: 'invoiceDate', label: 'Invoice Date', render: (i) => new Date(i.invoiceDate).toLocaleDateString() },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'amountPaid', label: 'Paid', render: (i) => `$${i.amountPaid}` },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date', render: (i) => new Date(i.dueDate).toLocaleDateString() },
];

const fields = [
  { name: 'invoiceNumber', label: 'Invoice Number', required: true },
  { name: 'invoiceDate', label: 'Invoice Date', type: 'date' },
  {
    name: 'distributor',
    label: 'Distributor',
    type: 'select-async',
    endpoint: '/distributors',
    required: true,
    optionLabel: (d) => d.name,
  },
  { name: 'pharmacyName', label: 'Pharmacy / Customer Name' },
  { name: 'pharmacyLicenseNumber', label: 'Pharmacy License Number' },
  { name: 'pharmacyAddress', label: 'Pharmacy Address', type: 'textarea' },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'amountPaid', label: 'Amount Paid', type: 'number' },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function DistributorInvoicesPage() {
  return (
    <ResourceManager
      title="Distributor Invoices"
      endpoint="/distributor-invoices"
      columns={columns}
      fields={fields}
    />
  );
}
