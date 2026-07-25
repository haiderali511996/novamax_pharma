'use client';

import ResourceManager from '@/components/ResourceManager';

const STATUS_OPTIONS = [
  { value: 'sale_based', label: 'Sale Based (nothing paid yet)' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'fully_paid', label: 'Fully Paid' },
];

const STATUS_LABELS = { sale_based: 'Sale Based', partially_paid: 'Partially Paid', fully_paid: 'Fully Paid' };

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'distributor.name', label: 'Distributor' },
  { key: 'pharmacyName', label: 'Pharmacy' },
  { key: 'invoiceDate', label: 'Invoice Date', render: (i) => new Date(i.invoiceDate).toLocaleDateString() },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'amountPaid', label: 'Paid', render: (i) => `$${i.amountPaid}` },
  {
    key: 'status',
    label: 'Status',
    render: (i) => (
      <span>
        {i.isCancelled ? 'Cancelled' : STATUS_LABELS[i.status] || i.status}
        {!i.isCancelled && i.isOverdue && (
          <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
            Overdue
          </span>
        )}
      </span>
    ),
  },
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
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { name: 'isCancelled', label: 'Cancelled', type: 'checkbox' },
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
