'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'date', label: 'Date', render: (i) => new Date(i.date).toLocaleDateString() },
];

const fields = [
  { name: 'title', label: 'Title', required: true },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: ['rent', 'utilities', 'salaries', 'supplies', 'marketing', 'transport', 'other'],
  },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'date', label: 'Date', type: 'date' },
  {
    name: 'paymentMethod',
    label: 'Payment Method',
    type: 'select',
    options: ['cash', 'bank_transfer', 'card', 'cheque'],
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function ExpensesPage() {
  return <ResourceManager title="Expenses" endpoint="/expenses" columns={columns} fields={fields} />;
}
