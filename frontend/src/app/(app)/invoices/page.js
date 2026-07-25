'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'customer.name', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'amountPaid', label: 'Paid', render: (i) => `$${i.amountPaid}` },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date', render: (i) => new Date(i.dueDate).toLocaleDateString() },
];

const fields = [
  { name: 'invoiceNumber', label: 'Invoice Number', required: true },
  {
    name: 'customer',
    label: 'Customer',
    type: 'select-async',
    endpoint: '/customers',
    required: true,
    optionLabel: (c) => c.name,
  },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'amountPaid', label: 'Amount Paid', type: 'number' },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
  },
];

export default function InvoicesPage() {
  return <ResourceManager title="Invoices" endpoint="/invoices" columns={columns} fields={fields} />;
}
