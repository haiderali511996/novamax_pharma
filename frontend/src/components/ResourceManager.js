'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import LineItemsEditor from './LineItemsEditor';

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function AsyncSelectField({ field, value, onChange }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .get(field.endpoint, { limit: 200 })
      .then(({ data }) => {
        if (active) setOptions(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [field.endpoint]);

  return (
    <select
      required={field.required}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
    >
      <option value="">Select {field.label}</option>
      {options.map((opt) => (
        <option key={opt._id} value={opt._id}>
          {field.optionLabel(opt)}
        </option>
      ))}
    </select>
  );
}

function MultiSelectAsyncField({ field, value, onChange }) {
  const [options, setOptions] = useState([]);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    let active = true;
    api
      .get(field.endpoint, { limit: 500 })
      .then(({ data }) => {
        if (active) setOptions(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [field.endpoint]);

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  }

  return (
    <div className="max-h-40 overflow-y-auto rounded-md border border-slate-300 p-2">
      {options.length === 0 && <p className="text-xs text-slate-400">No options available.</p>}
      {options.map((opt) => (
        <label key={opt._id} className="flex items-center gap-2 py-0.5 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(opt._id)}
            onChange={() => toggle(opt._id)}
            className="h-4 w-4 rounded border-slate-300"
          />
          {field.optionLabel(opt)}
        </label>
      ))}
    </div>
  );
}

function FormField({ field, value, onChange, onBulkChange }) {
  if (field.type === 'line-items') {
    return <LineItemsEditor field={field} value={value} onBulkChange={onBulkChange} />;
  }
  if (field.type === 'multiselect-async') {
    return <MultiSelectAsyncField field={field} value={value} onChange={onChange} />;
  }
  if (field.type === 'select-async') {
    return <AsyncSelectField field={field} value={value} onChange={onChange} />;
  }
  if (field.type === 'select') {
    return (
      <select
        required={field.required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      >
        <option value="">Select {field.label}</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'json') {
    return (
      <textarea
        required={field.required}
        value={typeof value === 'string' ? value : JSON.stringify(value ?? [], null, 2)}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={field.placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-emerald-500 focus:outline-none"
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        required={field.required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      />
    );
  }
  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
    );
  }
  return (
    <input
      type={field.type || 'text'}
      required={field.required}
      value={value ?? ''}
      step={field.type === 'number' ? 'any' : undefined}
      onChange={(e) => onChange(field.type === 'number' ? e.target.value : e.target.value)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
    />
  );
}

export default function ResourceManager({
  title,
  endpoint,
  columns,
  fields,
  populateHint,
  allowEdit = true,
  allowDelete = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(endpoint, { search, limit: 100 });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    const initial = {};
    fields.forEach((f) => {
      if (f.type === 'checkbox') initial[f.name] = false;
      else if (f.type === 'line-items' || f.type === 'multiselect-async') initial[f.name] = [];
      else if (f.computed) initial[f.name] = 0;
      else initial[f.name] = '';
    });
    setFormData(initial);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item) {
    const initial = {};
    fields.forEach((f) => {
      const raw = getNested(item, f.name);
      if (f.type === 'select-async') {
        initial[f.name] = raw && typeof raw === 'object' ? raw._id : raw ?? '';
      } else if (f.type === 'multiselect-async') {
        initial[f.name] = Array.isArray(raw)
          ? raw.map((v) => (v && typeof v === 'object' ? v._id : v))
          : [];
      } else {
        initial[f.name] = raw ?? '';
      }
    });
    setFormData(initial);
    setEditingId(item._id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      fields.forEach((f) => {
        if (payload[f.name] === '' && !f.required) {
          delete payload[f.name];
          return;
        }
        if (f.type === 'number' && payload[f.name] !== '') payload[f.name] = Number(payload[f.name]);
        if (f.type === 'json' && typeof payload[f.name] === 'string') {
          payload[f.name] = payload[f.name].trim() ? JSON.parse(payload[f.name]) : [];
        }
      });
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.del(`${endpoint}/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <div className="flex gap-2">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={openCreate}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Add New
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 text-left font-semibold text-slate-600">
                  {col.label}
                </th>
              ))}
              {(allowEdit || allowDelete) && (
                <th className="px-4 py-2 text-right font-semibold text-slate-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-slate-700">
                      {col.render ? col.render(item) : String(getNested(item, col.key) ?? '')}
                    </td>
                  ))}
                  {(allowEdit || allowDelete) && (
                    <td className="px-4 py-2 text-right">
                      {allowEdit && (
                        <button
                          onClick={() => openEdit(item)}
                          className="mr-3 text-emerald-700 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {editingId ? `Edit ${title}` : `Add ${title}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {fields
                .filter((f) => !f.computed)
                .map((f) => (
                  <div key={f.name} className={f.type === 'checkbox' ? 'flex items-center gap-2' : ''}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {f.label}
                      {f.required && <span className="text-red-500"> *</span>}
                    </label>
                    <FormField
                      field={f}
                      value={formData[f.name]}
                      onChange={(v) => setFormData((prev) => ({ ...prev, [f.name]: v }))}
                      onBulkChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                    />
                  </div>
                ))}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {populateHint}
    </div>
  );
}
