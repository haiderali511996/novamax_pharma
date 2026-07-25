'use client';

import ResourceManager from '@/components/ResourceManager';

const CATEGORY_OPTIONS = [
  { value: 'salaries', label: 'Salaries' },
  { value: 'running_expense', label: 'Running Expense' },
  { value: 'office_expense', label: 'Office Expense' },
  { value: 'promotional_material', label: 'Promotional Material' },
  { value: 'other', label: 'Other' },
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]));

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category', render: (i) => CATEGORY_LABELS[i.category] || i.category },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'date', label: 'Date', render: (i) => new Date(i.date).toLocaleDateString() },
];

const fields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS },
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
