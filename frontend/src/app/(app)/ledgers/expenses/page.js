'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'running_expense', label: 'Running Expense' },
  { value: 'office_expense', label: 'Office Expense' },
  { value: 'promotional_material', label: 'Promotional Material' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default function ExpenseLedgerPage() {
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/expenses', { category: category || undefined, limit: 500 })
      .then(({ data }) => setExpenses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const rows = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    return sorted.map((exp) => {
      running += exp.amount;
      return { ...exp, running };
    });
  }, [expenses]);

  const total = rows.length ? rows[rows.length - 1].running : 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Expense Ledger</h1>
      <p className="mb-4 text-sm text-slate-500">
        Chronological register per expense category, with a running total. Add or edit individual expenses
        under Finance &rarr; Expenses.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
          Total: {formatPKR(total)}
        </div>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Title</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Category</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-600">Running Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  No expenses found for this category.
                </td>
              </tr>
            ) : (
              rows.map((exp) => (
                <tr key={exp._id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-slate-700">{exp.title}</td>
                  <td className="px-3 py-2 text-slate-700">{CATEGORY_LABELS[exp.category] || exp.category}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatPKR(exp.amount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-800">{formatPKR(exp.running)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
