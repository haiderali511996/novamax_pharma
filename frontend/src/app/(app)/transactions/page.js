'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'account.name', label: 'Account' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date', render: (i) => new Date(i.date).toLocaleDateString() },
];

const fields = [
  {
    name: 'account',
    label: 'Account',
    type: 'select-async',
    endpoint: '/accounts',
    required: true,
    optionLabel: (a) => `${a.name} (${a.code})`,
  },
  { name: 'type', label: 'Type', type: 'select', options: ['debit', 'credit'], required: true },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'description', label: 'Description' },
  { name: 'reference', label: 'Reference' },
];

export default function TransactionsPage() {
  return (
    <ResourceManager
      title="Transactions"
      endpoint="/transactions"
      columns={columns}
      fields={fields}
      allowEdit={false}
      allowDelete={false}
    />
  );
}
