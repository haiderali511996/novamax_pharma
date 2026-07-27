'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'hospital', label: 'Hospitals' },
  { value: 'clinic', label: 'Clinics' },
  { value: 'pharmacy', label: 'Pharmacies' },
];

export default function OsmFacilitySearch({ onImported }) {
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [types, setTypes] = useState(['hospital', 'clinic', 'pharmacy']);
  const [territories, setTerritories] = useState([]);
  const [territoryName, setTerritoryName] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    api
      .get('/territories', { limit: 200 })
      .then(({ data }) => setTerritories(data))
      .catch(() => {});
  }, []);

  function toggleType(value) {
    setTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  function toggleSelected(osmId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(osmId)) next.delete(osmId);
      else next.add(osmId);
      return next;
    });
  }

  async function handleSearch() {
    if (!city.trim() || types.length === 0) return;
    setSearching(true);
    setError('');
    setImportResult(null);
    setResults([]);
    setSelected(new Set());
    try {
      const { data } = await api.get('/facilities/search-osm', { city: city.trim(), types: types.join(','), radiusKm });
      setResults(data.results);
      setSelected(new Set(data.results.map((r) => r.osmId)));
      if (data.results.length === 0) setError('No named facilities found in that radius - try a bigger radius or a nearby larger area.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleImport() {
    const rows = results
      .filter((r) => selected.has(r.osmId))
      .map((r) => ({
        name: r.name,
        type: r.type,
        territoryName: territoryName || undefined,
        address: r.address,
        city: r.city || city.trim(),
        phone: r.phone,
        latitude: r.latitude,
        longitude: r.longitude,
        googleMapsUrl: r.googleMapsUrl,
        notes: 'Imported from OpenStreetMap',
      }));
    if (rows.length === 0) return;
    setImporting(true);
    setError('');
    try {
      const { data } = await api.post('/facilities/import', { rows });
      setImportResult(data);
      setResults([]);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-semibold text-slate-700">Search OpenStreetMap (free, real Pakistan data)</p>
      <p className="mb-3 text-xs text-slate-500">
        Look up real hospitals/clinics/pharmacies near a city or area from OpenStreetMap - no API key or billing required. Data is
        community-maintained (not as complete as Google Maps), so always double-check phone numbers before relying on them.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">City / Area</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Gulberg, Lahore"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Radius (km)</label>
          <input
            type="number"
            min="1"
            max="15"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            className="w-20 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          {TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1 text-sm text-slate-600">
              <input type="checkbox" checked={types.includes(opt.value)} onChange={() => toggleType(opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !city.trim() || types.length === 0}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {importResult && (
        <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imported {importResult.createdCount} facilit{importResult.createdCount === 1 ? 'y' : 'ies'}.
        </p>
      )}

      {results.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-xs text-slate-500">
              {results.length} found - {selected.size} selected. Data &copy; OpenStreetMap contributors, ODbL 1.0.
            </p>
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Assign to Area/Territory</label>
                <select
                  value={territoryName}
                  onChange={(e) => setTerritoryName(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select territory (optional)</option>
                  {territories.map((t) => (
                    <option key={t._id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import Selected (${selected.size})`}
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="w-8 px-2 py-1.5"></th>
                  <th className="px-2 py-1.5 text-left font-medium text-slate-600">Name</th>
                  <th className="px-2 py-1.5 text-left font-medium text-slate-600">Type</th>
                  <th className="px-2 py-1.5 text-left font-medium text-slate-600">Address</th>
                  <th className="px-2 py-1.5 text-left font-medium text-slate-600">Phone</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.osmId} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">
                      <input type="checkbox" checked={selected.has(r.osmId)} onChange={() => toggleSelected(r.osmId)} />
                    </td>
                    <td className="px-2 py-1.5">{r.name}</td>
                    <td className="px-2 py-1.5 capitalize">{r.type}</td>
                    <td className="px-2 py-1.5 text-slate-500">{r.address || '-'}</td>
                    <td className="px-2 py-1.5 text-slate-500">{r.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
