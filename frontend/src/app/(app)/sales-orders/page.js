'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';

const columns = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'customer.name', label: 'Customer' },
  { key: 'warehouse.name', label: 'Warehouse' },
  {
    key: 'status',
    label: 'Status',
    render: (i) => (
      <span>
        {i.status}
        {i.stockApplied && (
          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            Stock deducted
          </span>
        )}
      </span>
    ),
  },
  { key: 'grandTotal', label: 'Total', render: (i) => `$${i.grandTotal}` },
  { key: 'orderDate', label: 'Date', render: (i) => new Date(i.orderDate).toLocaleDateString() },
];

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
  {
    name: 'warehouse',
    label: 'Warehouse (stock will be deducted from here on confirm)',
    type: 'select-async',
    endpoint: '/warehouses',
    required: true,
    optionLabel: (w) => `${w.name} (${w.code})`,
  },
  {
    name: 'items',
    label: 'Items',
    type: 'line-items',
    required: true,
    productEndpoint: '/products',
    priceField: 'unitPrice',
    showTax: true,
    totalsTargets: { subTotal: 'subTotal', taxTotal: 'taxTotal', grandTotal: 'grandTotal' },
  },
  { name: 'subTotal', label: 'Sub Total', type: 'number', computed: true },
  { name: 'taxTotal', label: 'Tax Total', type: 'number', computed: true },
  { name: 'grandTotal', label: 'Grand Total', type: 'number', computed: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

function SalesOrderActions({ item, reload, setError }) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (!confirm(`Confirm order ${item.orderNumber} and deduct stock from its warehouse?`)) return;
    setBusy(true);
    try {
      await api.post(`/sales-orders/${item._id}/confirm`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateInvoice() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/sales-orders/${item._id}/generate-invoice`);
      alert(`Invoice ${data.invoiceNumber} created for $${data.amount}`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!item.stockApplied && item.status !== 'cancelled' && (
        <button onClick={handleConfirm} disabled={busy} className="mr-3 text-blue-700 hover:underline disabled:opacity-50">
          {busy ? 'Working...' : 'Confirm & Deduct Stock'}
        </button>
      )}
      {item.stockApplied && (
        <button onClick={handleGenerateInvoice} disabled={busy} className="mr-3 text-purple-700 hover:underline disabled:opacity-50">
          {busy ? 'Working...' : 'Generate Invoice'}
        </button>
      )}
    </>
  );
}

export default function SalesOrdersPage() {
  return (
    <ResourceManager
      title="Sales Orders"
      endpoint="/sales-orders"
      columns={columns}
      fields={fields}
      renderRowActions={(item, ctx) => <SalesOrderActions item={item} {...ctx} />}
    />
  );
}
