'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

// Minimal CSV parser - good enough for a simple, comma-separated, no-nested-
// quotes export (e.g. from Excel/Google Sheets "Download as CSV"). Expected
// header row: name,type,territoryName,address,city,phone,contactPerson,latitude,longitude,googleMapsUrl,notes
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

export default function FacilityCsvImport({ onImported }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error('No data rows found in that file');
      const { data } = await api.post('/facilities/import', { rows });
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-semibold text-slate-700">Import from CSV</p>
      <p className="mb-3 text-xs text-slate-500">
        Header row: <code className="rounded bg-slate-100 px-1 py-0.5">name,type,territoryName,address,city,phone,contactPerson,latitude,longitude,googleMapsUrl,notes</code>.
        Only <code className="rounded bg-slate-100 px-1 py-0.5">name</code> is required per row - a territory name that doesn&apos;t exist yet is created automatically.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        disabled={busy}
        className="text-sm"
      />
      {busy && <p className="mt-2 text-xs text-slate-400">Importing...</p>}
      {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {result && (
        <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported {result.createdCount} facilit{result.createdCount === 1 ? 'y' : 'ies'}.
          {result.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-red-700">
              {result.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row} ({e.name || 'no name'}): {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
