'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'region', label: 'Region' },
  { key: 'city', label: 'City' },
  { key: 'isActive', label: 'Active', render: (i) => (i.isActive ? 'Yes' : 'No') },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'region', label: 'Region' },
  { name: 'city', label: 'City' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function TerritoriesPage() {
  return <ResourceManager title="Territories / Areas" endpoint="/territories" columns={columns} fields={fields} />;
}
