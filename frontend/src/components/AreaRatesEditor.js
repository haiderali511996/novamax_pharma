'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function emptyRow() {
  return { territory: '', commissionPercent: '', discountPercent: '' };
}

function normalizeRows(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((row) => ({
    territory: row.territory && typeof row.territory === 'object' ? row.territory._id : row.territory || '',
    commissionPercent: row.commissionPercent ?? '',
    discountPercent: row.discountPercent ?? '',
  }));
}

// Lets a doctor have a different commission/discount % per territory,
// instead of one rate fixed for every area they refer business from.
// Any territory left out here just uses the doctor's default rate fields.
export default function AreaRatesEditor({ field, value, onBulkChange }) {
  const [territories, setTerritories] = useState([]);
  const [rows, setRows] = useState(() => normalizeRows(value));

  useEffect(() => {
    api
      .get('/territories', { limit: 500 })
      .then(({ data }) => setTerritories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRows(normalizeRows(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.name]);

  function commit(nextRows) {
    setRows(nextRows);
    const areaRates = nextRows
      .filter((r) => r.territory)
      .map((r) => ({
        territory: r.territory,
        ...(r.commissionPercent !== '' ? { commissionPercent: Number(r.commissionPercent) } : {}),
        ...(r.discountPercent !== '' ? { discountPercent: Number(r.discountPercent) } : {}),
      }));
    onBulkChange({ [field.name]: areaRates });
  }

  function updateRow(index, key, val) {
    const next = rows.map((r, i) => (i === index ? { ...r, [key]: val } : r));
    commit(next);
  }

  function addRow() {
    commit([...rows, emptyRow()]);
  }

  function removeRow(index) {
    commit(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-md border border-slate-300">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium text-slate-600">Territory / Area</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-600">Commission %</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-600">Discount %</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-2 text-xs text-slate-400">
                No area-specific rates - every territory uses the default rate above.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <select
                    value={row.territory}
                    onChange={(e) => updateRow(index, 'territory', e.target.value)}
                    className="w-full rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="">Select territory</option>
                    {territories.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={row.commissionPercent}
                    onChange={(e) => updateRow(index, 'commissionPercent', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={row.discountPercent}
                    onChange={(e) => updateRow(index, 'discountPercent', e.target.value)}
                    className="w-20 rounded border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button type="button" onClick={() => removeRow(index)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="border-t border-slate-200 px-2 py-2">
        <button type="button" onClick={addRow} className="text-xs font-medium text-emerald-700 hover:underline">
          + Add area rate
        </button>
      </div>
    </div>
  );
}
