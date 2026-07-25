'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'territory.name', label: 'Territory' },
  { key: 'location', label: 'Location' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
  { key: 'products', label: 'Products Carried', render: (i) => (i.products || []).length },
];

const promoItemsPlaceholder = JSON.stringify(
  [{ name: 'Branded pens', quantity: 500, description: 'Q3 launch giveaway' }],
  null,
  2
);

const fields = [
  { name: 'name', label: 'Distributor Name', required: true },
  {
    name: 'territory',
    label: 'Territory / Area',
    type: 'select-async',
    endpoint: '/territories',
    required: true,
    optionLabel: (t) => `${t.name}${t.region ? ` (${t.region})` : ''}`,
  },
  { name: 'location', label: 'Location / Address' },
  { name: 'contactPerson', label: 'Contact Person' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone' },
  { name: 'licenseNumber', label: 'License Number' },
  {
    name: 'products',
    label: 'Products Carried',
    type: 'multiselect-async',
    endpoint: '/products',
    optionLabel: (p) => `${p.name} (${p.sku})`,
  },
  {
    name: 'promotionalItems',
    label: 'Promotional Items (JSON array)',
    type: 'json',
    placeholder: promoItemsPlaceholder,
  },
  { name: 'creditLimit', label: 'Credit Limit', type: 'number' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function DistributorsPage() {
  return <ResourceManager title="Distributors" endpoint="/distributors" columns={columns} fields={fields} />;
}
