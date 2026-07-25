'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'product.name', label: 'Product' },
  { key: 'warehouse.name', label: 'Warehouse' },
  { key: 'type', label: 'Type' },
  { key: 'quantity', label: 'Qty' },
  { key: 'reason', label: 'Reason' },
  { key: 'createdAt', label: 'Date', render: (i) => new Date(i.createdAt).toLocaleString() },
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
    name: 'batch',
    label: 'Batch',
    type: 'select-async',
    endpoint: '/batches',
    optionLabel: (b) => `${b.batchNumber} - qty ${b.quantity}`,
  },
  {
    name: 'warehouse',
    label: 'Warehouse',
    type: 'select-async',
    endpoint: '/warehouses',
    required: true,
    optionLabel: (w) => `${w.name} (${w.code})`,
  },
  { name: 'type', label: 'Type', type: 'select', options: ['in', 'out', 'adjustment', 'transfer'], required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', required: true },
  { name: 'reason', label: 'Reason' },
  { name: 'reference', label: 'Reference' },
];

export default function StockMovementsPage() {
  return (
    <ResourceManager
      title="Stock Movements"
      endpoint="/stock-movements"
      columns={columns}
      fields={fields}
      allowEdit={false}
      allowDelete={false}
    />
  );
}
