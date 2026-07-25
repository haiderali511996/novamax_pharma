'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
  { key: 'country', label: 'Country' },
  { key: 'licenseNumber', label: 'License #' },
];

const fields = [
  { name: 'name', label: 'Manufacturer Name', required: true },
  { name: 'contactPerson', label: 'Contact Person' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone' },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country' },
  { name: 'licenseNumber', label: 'License Number' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function ManufacturersPage() {
  return <ResourceManager title="Manufacturers" endpoint="/manufacturers" columns={columns} fields={fields} />;
}
