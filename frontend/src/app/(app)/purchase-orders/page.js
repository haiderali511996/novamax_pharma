'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';

const columns = [
  { key: 'poNumber', label: 'PO #' },
  { key: 'supplier.name', label: 'Supplier' },
  { key: 'manufacturer.name', label: 'Manufacturer' },
  { key: 'warehouse.name', label: 'Warehouse' },
  {
    key: 'status',
    label: 'Status',
    render: (i) => (
      <span>
        {i.status}
        {i.stockApplied && (
          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            Received
          </span>
        )}
      </span>
    ),
  },
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
    name: 'manufacturer',
    label: 'Contract Manufacturer (if buying directly from a toll manufacturer)',
    type: 'select-async',
    endpoint: '/manufacturers',
    optionLabel: (m) => m.name,
  },
  {
    name: 'warehouse',
    label: 'Warehouse (stock will be received into here)',
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

function ReceiveButton({ item, reload, setError }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(() =>
    item.items.map((li) => ({
      product: li.product?._id || li.product,
      productLabel: li.product?.name ? `${li.product.name} (${li.product.sku})` : li.product,
      batchNumber: li.batchNumber || '',
      expiryDate: li.expiryDate ? li.expiryDate.slice(0, 10) : '',
    }))
  );
  const [saving, setSaving] = useState(false);

  if (item.stockApplied || item.status === 'cancelled') return null;

  function updateRow(index, key, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  async function handleReceive(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/purchase-orders/${item._id}/receive`, {
        items: rows.map((r) => ({ product: r.product, batchNumber: r.batchNumber, expiryDate: r.expiryDate })),
      });
      setOpen(false);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="mr-3 text-blue-700 hover:underline">
        Receive into Inventory
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-slate-800">Receive {item.poNumber}</h2>
            <p className="mb-4 text-sm text-slate-500">
              Enter the batch number and expiry date for each product being received.
            </p>
            <form onSubmit={handleReceive} className="space-y-3">
              {rows.map((row, index) => (
                <div key={index} className="rounded-md border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">{row.productLabel}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Batch number"
                      value={row.batchNumber}
                      onChange={(e) => updateRow(index, 'batchNumber', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      required
                      value={row.expiryDate}
                      onChange={(e) => updateRow(index, 'expiryDate', e.target.value)}
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Receiving...' : 'Receive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <ResourceManager
      title="Purchase Orders"
      endpoint="/purchase-orders"
      columns={columns}
      fields={fields}
      renderRowActions={(item, ctx) => <ReceiveButton item={item} {...ctx} />}
    />
  );
}
