'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

const columns = [
  { key: 'employee.name', label: 'Sales Rep' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'targetAmount', label: 'Target', render: (i) => formatPKR(i.targetAmount) },
];

const fields = [
  {
    name: 'employee',
    label: 'Sales Rep',
    type: 'select-async',
    endpoint: '/employees',
    required: true,
    optionLabel: (e) => `${e.name} (${e.employeeId})`,
  },
  {
    name: 'territory',
    label: 'Territory',
    type: 'select-async',
    endpoint: '/territories',
    optionLabel: (t) => `${t.name}${t.region ? ` (${t.region})` : ''}`,
  },
  { name: 'month', label: 'Month (1-12)', type: 'number', required: true },
  { name: 'year', label: 'Year', type: 'number', required: true },
  { name: 'targetAmount', label: 'Target Amount', type: 'number', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

function ProgressButton({ item }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function view() {
    setOpen(true);
    setError('');
    try {
      const { data } = await api.get(`/sales-targets/${item._id}/progress`);
      setProgress(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <button onClick={view} className="mr-3 text-blue-700 hover:underline">
        View Progress
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              {item.employee?.name} - {item.month}/{item.year}
            </h2>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {progress ? (
              <div className="space-y-2 text-sm">
                <p>
                  Target: <span className="font-semibold">{formatPKR(progress.target.targetAmount)}</span>
                </p>
                <p>
                  Achieved (confirmed orders): <span className="font-semibold">{formatPKR(progress.achieved)}</span>
                </p>
                <p>Orders counted: {progress.orderCount}</p>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${progress.percentage >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, progress.percentage)}%` }}
                  />
                </div>
                <p className="text-right font-semibold">{progress.percentage}%</p>
              </div>
            ) : (
              !error && <p className="text-sm text-slate-400">Loading...</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SalesTargetsPage() {
  return (
    <ResourceManager
      title="Sales Targets"
      endpoint="/sales-targets"
      columns={columns}
      fields={fields}
      renderRowActions={(item) => <ProgressButton item={item} />}
    />
  );
}
