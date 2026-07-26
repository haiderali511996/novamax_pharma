'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Reusable running-balance statement for any ledger party type
// (customer / manufacturer / employee). Debit/credit labels and the
// balance interpretation are passed in per page since the meaning
// differs (receivable vs payable vs advance).
export default function LedgerView({ title, partyType, partyEndpoint, partyLabel, debitLabel, creditLabel, balanceLabel }) {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'debit', amount: '', description: '', reference: '', date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(partyEndpoint, { limit: 500 })
      .then(({ data }) => setParties(data))
      .catch((err) => setError(err.message));
  }, [partyEndpoint]);

  async function loadStatement(partyId) {
    if (!partyId) {
      setStatement(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ledger-entries/statement', { partyType, party: partyId });
      setStatement(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePartyChange(e) {
    const id = e.target.value;
    setSelectedParty(id);
    loadStatement(id);
  }

  function openAddEntry() {
    setForm({ type: 'debit', amount: '', description: '', reference: '', date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/ledger-entries', {
        partyType,
        party: selectedParty,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        reference: form.reference || undefined,
        date: form.date || undefined,
      });
      setShowForm(false);
      await loadStatement(selectedParty);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id) {
    if (!confirm('Delete this ledger entry?')) return;
    try {
      await api.del(`/ledger-entries/${id}`);
      await loadStatement(selectedParty);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">{title}</h1>
      <p className="mb-4 text-sm text-slate-500">
        Select a {partyLabel.toLowerCase()} to see their running account statement.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedParty}
          onChange={handlePartyChange}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Select {partyLabel}</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {selectedParty && (
          <button
            onClick={openAddEntry}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Add Entry
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!selectedParty ? (
        <p className="text-sm text-slate-400">No {partyLabel.toLowerCase()} selected yet.</p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Loading statement...</p>
      ) : statement ? (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium uppercase text-slate-400">{debitLabel} Total</p>
              <p className="mt-1 text-lg font-bold text-slate-800">${statement.totalDebit.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium uppercase text-slate-400">{creditLabel} Total</p>
              <p className="mt-1 text-lg font-bold text-slate-800">${statement.totalCredit.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-medium uppercase text-emerald-700">{balanceLabel}</p>
              <p className="mt-1 text-lg font-bold text-emerald-800">${statement.closingBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Description</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">{debitLabel}</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">{creditLabel}</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Balance</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  statement.rows.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.description}
                        {row.reference && <span className="ml-1 text-xs text-slate-400">({row.reference})</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {row.type === 'debit' ? `$${row.amount.toFixed(2)}` : ''}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {row.type === 'credit' ? `$${row.amount.toFixed(2)}` : ''}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800">${row.balance.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        {row.source === 'manual' && (
                          <button onClick={() => handleDeleteEntry(row._id)} className="text-red-600 hover:underline">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Add Ledger Entry</h2>
            <form onSubmit={handleAddEntry} className="space-y-3">
              <div>
                <label htmlFor="ledger-entry-type" className="mb-1 block text-sm font-medium text-slate-700">Entry Type</label>
                <select
                  id="ledger-entry-type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="debit">{debitLabel}</option>
                  <option value="credit">{creditLabel}</option>
                </select>
              </div>
              <div>
                <label htmlFor="ledger-entry-amount" className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
                <input
                  id="ledger-entry-amount"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ledger-entry-date" className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input
                  id="ledger-entry-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ledger-entry-description" className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
                <input
                  id="ledger-entry-description"
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ledger-entry-reference" className="mb-1 block text-sm font-medium text-slate-700">Reference</label>
                <input
                  id="ledger-entry-reference"
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
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
    </div>
  );
}
