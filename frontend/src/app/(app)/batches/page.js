'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'product.name', label: 'Product' },
  { key: 'warehouse.name', label: 'Warehouse' },
  { key: 'manufacturer.name', label: 'Manufacturer' },
  { key: 'batchNumber', label: 'Batch #' },
  { key: 'quantity', label: 'Qty' },
  {
    key: 'expiryDate',
    label: 'Expiry Date',
    render: (i) => new Date(i.expiryDate).toLocaleDateString(),
  },
];

const fields = [
  {
    name: 'product',
    label: 'Product',
    type: 'select-async',
    endpoint: '/products',
    required: true,
    optionLabel: (p) => `${p.name} (${p.sku})`,
  },
  {
    name: 'warehouse',
    label: 'Warehouse',
    type: 'select-async',
    endpoint: '/warehouses',
    required: true,
    optionLabel: (w) => `${w.name} (${w.code})`,
  },
  { name: 'batchNumber', label: 'Batch Number', required: true },
  {
    name: 'manufacturer',
    label: 'Manufacturer (who produced this batch)',
    type: 'select-async',
    endpoint: '/manufacturers',
    optionLabel: (m) => m.name,
  },
  { name: 'manufactureDate', label: 'Manufacture Date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'costPrice', label: 'Cost Price', type: 'number' },
];

export default function BatchesPage() {
  return <ResourceManager title="Batches & Expiry" endpoint="/batches" columns={columns} fields={fields} />;
}
