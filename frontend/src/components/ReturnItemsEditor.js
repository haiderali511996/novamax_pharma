'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

function emptyRow() {
  return { product: '', batch: '', quantity: 1, unitPrice: 0 };
}

// Return items must reference the exact batch stock goes back into (so we
// know which warehouse to restock), unlike sales/purchase order lines which
// can leave the batch to be resolved automatically.
export default function ReturnItemsEditor({ field, value, onBulkChange }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [rows, setRows] = useState(() => (Array.isArray(value) && value.length ? value.map((r) => ({
    product: r.product?._id || r.product || '',
    batch: r.batch?._id || r.batch || '',
    quantity: r.quantity ?? 1,
    unitPrice: r.unitPrice ?? 0,
  })) : [emptyRow()]));

  useEffect(() => {
    api.get('/products', { limit: 500 }).then(({ data }) => setProducts(data)).catch(() => {});
    api.get('/batches', { limit: 500 }).then(({ data }) => setBatches(data)).catch(() => {});
  }, []);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.unitPrice || 0), 0),
    [rows]
  );

  function commit(nextRows) {
    setRows(nextRows);
    const items = nextRows
      .filter((r) => r.product && r.batch)
      .map((r) => ({
        product: r.product,
        batch: r.batch,
        quantity: Number(r.quantity || 0),
        unitPrice: Number(r.unitPrice || 0),
        total: Number(r.quantity || 0) * Number(r.unitPrice || 0),
      }));
    const newTotal = items.reduce((sum, i) => sum + i.total, 0);
    onBulkChange({ [field.name]: items, [field.totalTarget]: newTotal });
  }

  function updateRow(index, key, val) {
    commit(rows.map((r, i) => (i === index ? { ...r, [key]: val } : r)));
  }

  function addRow() {
    commit([...rows, emptyRow()]);
  }

  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index);
    commit(next.length ? next : [emptyRow()]);
  }

  return (
    <div className="rounded-md border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-xs">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Product</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Batch (restocked here)</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Qty</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Unit Price</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Line Total</th>
            <th className="px-2 py-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const batchOptions = batches.filter((b) => (b.product?._id || b.product) === row.product);
            return (
              <tr key={index}>
                <td className="px-2 py-1.5">
                  <select
                    value={row.product}
                    onChange={(e) => updateRow(index, 'product', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={row.batch}
                    onChange={(e) => updateRow(index, 'batch', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    disabled={!row.product}
                  >
                    <option value="">Select batch</option>
                    {batchOptions.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.batchNumber} - {b.warehouse?.name || 'Warehouse'} (exp {new Date(b.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                    className="w-16 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.unitPrice}
                    onChange={(e) => updateRow(index, 'unitPrice', e.target.value)}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">
                  ${(Number(row.quantity || 0) * Number(row.unitPrice || 0)).toFixed(2)}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button type="button" onClick={() => removeRow(index)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-200 px-2 py-2">
        <button type="button" onClick={addRow} className="text-xs font-medium text-emerald-700 hover:underline">
          + Add item
        </button>
        <div className="text-xs text-slate-600">
          Total: <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
