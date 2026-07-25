'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

function emptyRow() {
  return { product: '', quantity: 1, unitPrice: 0, taxRate: 0 };
}

function normalizeRows(rawItems) {
  if (!Array.isArray(rawItems)) return [emptyRow()];
  if (rawItems.length === 0) return [emptyRow()];
  return rawItems.map((row) => ({
    product: row.product && typeof row.product === 'object' ? row.product._id : row.product || '',
    quantity: row.quantity ?? 1,
    unitPrice: row.unitPrice ?? row.unitCost ?? 0,
    taxRate: row.taxRate ?? 0,
  }));
}

// Reusable line-item builder for Sales Orders / Purchase Orders. Computes
// per-row and grand totals and reports them upward so the parent form's
// subTotal/taxTotal/grandTotal fields stay in sync without manual entry.
export default function LineItemsEditor({ field, value, onBulkChange }) {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState(() => normalizeRows(value));
  const priceKey = field.priceField || 'unitPrice';
  const showTax = !!field.showTax;

  useEffect(() => {
    api
      .get(field.productEndpoint || '/products', { limit: 500 })
      .then(({ data }) => setProducts(data))
      .catch(() => {});
  }, [field.productEndpoint]);

  useEffect(() => {
    setRows(normalizeRows(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.name]);

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxTotal = 0;
    rows.forEach((row) => {
      const lineBase = Number(row.quantity || 0) * Number(row[priceKey] || 0);
      subTotal += lineBase;
      if (showTax) taxTotal += (lineBase * Number(row.taxRate || 0)) / 100;
    });
    return { subTotal, taxTotal, grandTotal: subTotal + taxTotal };
  }, [rows, priceKey, showTax]);

  function commit(nextRows) {
    setRows(nextRows);
    const items = nextRows
      .filter((r) => r.product)
      .map((r) => {
        const lineBase = Number(r.quantity || 0) * Number(r[priceKey] || 0);
        const lineTax = showTax ? (lineBase * Number(r.taxRate || 0)) / 100 : 0;
        return {
          product: r.product,
          quantity: Number(r.quantity || 0),
          [priceKey]: Number(r[priceKey] || 0),
          ...(showTax ? { taxRate: Number(r.taxRate || 0) } : {}),
          total: lineBase + lineTax,
        };
      });

    let subTotal = 0;
    let taxTotal = 0;
    nextRows.forEach((row) => {
      const lineBase = Number(row.quantity || 0) * Number(row[priceKey] || 0);
      subTotal += lineBase;
      if (showTax) taxTotal += (lineBase * Number(row.taxRate || 0)) / 100;
    });

    const patch = { [field.name]: items };
    if (field.totalsTargets?.subTotal) patch[field.totalsTargets.subTotal] = subTotal;
    if (field.totalsTargets?.taxTotal && showTax) patch[field.totalsTargets.taxTotal] = taxTotal;
    if (field.totalsTargets?.grandTotal) patch[field.totalsTargets.grandTotal] = subTotal + taxTotal;
    onBulkChange(patch);
  }

  function updateRow(index, key, val) {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: val } : row));
    commit(next);
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
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Qty</th>
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">
              {priceKey === 'unitCost' ? 'Unit Cost' : 'Unit Price'}
            </th>
            {showTax && <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Tax %</th>}
            <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Line Total</th>
            <th className="px-2 py-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const lineBase = Number(row.quantity || 0) * Number(row[priceKey] || 0);
            const lineTax = showTax ? (lineBase * Number(row.taxRate || 0)) / 100 : 0;
            return (
              <tr key={index}>
                <td className="px-2 py-1.5">
                  <select
                    value={row.product}
                    onChange={(e) => {
                      const product = products.find((p) => p._id === e.target.value);
                      const next = rows.map((r, i) =>
                        i === index
                          ? {
                              ...r,
                              product: e.target.value,
                              [priceKey]: product
                                ? priceKey === 'unitCost'
                                  ? product.costPrice
                                  : product.sellingPrice
                                : r[priceKey],
                            }
                          : r
                      );
                      commit(next);
                    }}
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
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row[priceKey]}
                    onChange={(e) => updateRow(index, priceKey, e.target.value)}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                {showTax && (
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.taxRate}
                      onChange={(e) => updateRow(index, 'taxRate', e.target.value)}
                      className="w-16 rounded border border-slate-300 px-2 py-1"
                    />
                  </td>
                )}
                <td className="whitespace-nowrap px-2 py-1.5 text-slate-700">
                  ${(lineBase + lineTax).toFixed(2)}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-red-600 hover:underline"
                  >
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
          Subtotal: <span className="font-semibold">${totals.subTotal.toFixed(2)}</span>
          {showTax && (
            <>
              {' '}
              &nbsp;Tax: <span className="font-semibold">${totals.taxTotal.toFixed(2)}</span>
            </>
          )}
          {' '}
          &nbsp;Total: <span className="font-semibold">${totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
