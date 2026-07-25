'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'creditLimit', label: 'Credit Limit', render: (i) => `$${i.creditLimit}` },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: ['individual', 'pharmacy', 'hospital', 'clinic', 'distributor'],
  },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone' },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'taxId', label: 'Tax ID' },
  { name: 'creditLimit', label: 'Credit Limit', type: 'number' },
];

export default function CustomersPage() {
  return <ResourceManager title="Customers" endpoint="/customers" columns={columns} fields={fields} />;
}
