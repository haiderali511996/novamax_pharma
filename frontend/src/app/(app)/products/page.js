'use client';

import ResourceManager from '@/components/ResourceManager';
import { formatPKR } from '@/lib/currency';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'manufacturer.name', label: 'Manufacturer' },
  { key: 'sellingPrice', label: 'Price', render: (i) => formatPKR(i.sellingPrice) },
  { key: 'reorderLevel', label: 'Reorder Level' },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'sku', label: 'SKU', required: true },
  { name: 'genericName', label: 'Generic Name' },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'device', 'other'],
  },
  {
    name: 'manufacturer',
    label: 'Manufacturer',
    type: 'select-async',
    endpoint: '/manufacturers',
    optionLabel: (m) => m.name,
  },
  { name: 'unit', label: 'Unit' },
  { name: 'packSize', label: 'Pack Size' },
  { name: 'costPrice', label: 'Cost Price', type: 'number', required: true },
  { name: 'sellingPrice', label: 'Selling Price', type: 'number', required: true },
  { name: 'taxRate', label: 'Tax Rate (%)', type: 'number' },
  { name: 'reorderLevel', label: 'Reorder Level', type: 'number' },
  { name: 'requiresPrescription', label: 'Requires Prescription', type: 'checkbox' },
  { name: 'isControlledSubstance', label: 'Controlled Substance', type: 'checkbox' },
];

export default function ProductsPage() {
  return <ResourceManager title="Products" endpoint="/products" columns={columns} fields={fields} />;
}
