'use client';

import Link from 'next/link';
import ResourceManager from '@/components/ResourceManager';
import { formatPKR } from '@/lib/currency';

const STATUS_OPTIONS = [
  { value: 'sale_based', label: 'Sale Based (nothing paid yet)' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'fully_paid', label: 'Fully Paid' },
];

const STATUS_LABELS = { sale_based: 'Sale Based', partially_paid: 'Partially Paid', fully_paid: 'Fully Paid' };

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'customer.name', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: (i) => formatPKR(i.amount) },
  { key: 'amountPaid', label: 'Paid', render: (i) => formatPKR(i.amountPaid) },
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
  {
    name: 'customer',
    label: 'Customer',
    type: 'select-async',
    endpoint: '/customers',
    required: true,
    optionLabel: (c) => c.name,
  },
  {
    name: 'salesOrder',
    label: 'Sales Order (optional)',
    type: 'select-async',
    endpoint: '/sales-orders',
    optionLabel: (o) => `${o.orderNumber} - ${formatPKR(o.grandTotal)}`,
  },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'amountPaid', label: 'Amount Paid', type: 'number' },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { name: 'isCancelled', label: 'Cancelled', type: 'checkbox' },
];

export default function InvoicesPage() {
  return (
    <ResourceManager
      title="Invoices"
      endpoint="/invoices"
      columns={columns}
      fields={fields}
      renderRowActions={(item) => (
        <Link href={`/invoices/${item._id}/print`} target="_blank" className="mr-3 text-blue-700 hover:underline">
          Print
        </Link>
      )}
    />
  );
}
