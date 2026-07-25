'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'customer.name', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'grandTotal', label: 'Total', render: (i) => `$${i.grandTotal}` },
  { key: 'orderDate', label: 'Date', render: (i) => new Date(i.orderDate).toLocaleDateString() },
];

const itemsPlaceholder = JSON.stringify(
  [{ product: '<productId>', quantity: 1, unitPrice: 10, taxRate: 0, total: 10 }],
  null,
  2
);

const fields = [
  { name: 'orderNumber', label: 'Order Number', required: true },
  {
    name: 'customer',
    label: 'Customer',
    type: 'select-async',
    endpoint: '/customers',
    required: true,
    optionLabel: (c) => c.name,
  },
  { name: 'items', label: 'Items (JSON array)', type: 'json', required: true, placeholder: itemsPlaceholder },
  { name: 'subTotal', label: 'Sub Total', type: 'number', required: true },
  { name: 'taxTotal', label: 'Tax Total', type: 'number' },
  { name: 'grandTotal', label: 'Grand Total', type: 'number', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function SalesOrdersPage() {
  return <ResourceManager title="Sales Orders" endpoint="/sales-orders" columns={columns} fields={fields} />;
}
