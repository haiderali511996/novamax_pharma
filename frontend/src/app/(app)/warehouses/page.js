'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'city', label: 'City' },
  { key: 'isActive', label: 'Active', render: (i) => (i.isActive ? 'Yes' : 'No') },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function WarehousesPage() {
  return <ResourceManager title="Warehouses" endpoint="/warehouses" columns={columns} fields={fields} />;
}
