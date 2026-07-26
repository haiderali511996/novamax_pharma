'use client';

import ResourceManager from '@/components/ResourceManager';
import { formatPKR } from '@/lib/currency';

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'balance', label: 'Balance', render: (i) => formatPKR(i.balance) },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: ['asset', 'liability', 'equity', 'income', 'expense'],
    required: true,
  },
  { name: 'balance', label: 'Opening Balance', type: 'number' },
];

export default function AccountsPage() {
  return <ResourceManager title="Accounts" endpoint="/accounts" columns={columns} fields={fields} />;
}
