'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'poNumber', label: 'PO #' },
  { key: 'supplier.name', label: 'Supplier' },
  { key: 'status', label: 'Status' },
  { key: 'grandTotal', label: 'Total', render: (i) => `$${i.grandTotal}` },
  { key: 'orderDate', label: 'Date', render: (i) => new Date(i.orderDate).toLocaleDateString() },
];

const fields = [
  { name: 'poNumber', label: 'PO Number', required: true },
  {
    name: 'supplier',
    label: 'Supplier',
    type: 'select-async',
    endpoint: '/suppliers',
    required: true,
    optionLabel: (s) => s.name,
  },
  {
    name: 'items',
    label: 'Items',
    type: 'line-items',
    required: true,
    productEndpoint: '/products',
    priceField: 'unitCost',
    showTax: false,
    totalsTargets: { subTotal: 'subTotal', grandTotal: 'grandTotal' },
  },
  { name: 'subTotal', label: 'Sub Total', type: 'number', computed: true },
  { name: 'grandTotal', label: 'Grand Total', type: 'number', computed: true },
  { name: 'status', label: 'Status', type: 'select', options: ['draft', 'ordered', 'received', 'cancelled'] },
  { name: 'expectedDate', label: 'Expected Date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function PurchaseOrdersPage() {
  return (
    <ResourceManager title="Purchase Orders" endpoint="/purchase-orders" columns={columns} fields={fields} />
  );
}
