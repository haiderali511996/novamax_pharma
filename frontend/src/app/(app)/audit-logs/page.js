'use client';

import { Fragment, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  action: 'bg-purple-100 text-purple-700',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ resource: '', action: '', userEmail: '' });
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/audit-logs', { ...filters, limit: 200 })
      .then(({ data }) => setLogs(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Audit Log</h1>
      <p className="mb-4 text-sm text-slate-500">
        Every create/update/delete across the system, plus key workflow actions (confirm, receive, approve,
        reject). Admin only.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          placeholder="Filter by resource (e.g. Invoice)"
          value={filters.resource}
          onChange={(e) => setFilters((f) => ({ ...f, resource: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="action">Workflow action</option>
        </select>
        <input
          placeholder="Filter by user email"
          value={filters.userEmail}
          onChange={(e) => setFilters((f) => ({ ...f, userEmail: e.target.value }))}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">When</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">User</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Resource</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log._id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-700">{log.userEmail || 'system'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action] || ''}`}>
                        {log.actionLabel || log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{log.resource}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                        className="text-blue-700 hover:underline"
                      >
                        {expanded === log._id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expanded === log._id && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 px-3 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Before</p>
                            <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-xs">
                              {JSON.stringify(log.before, null, 2) || 'null'}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">After</p>
                            <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-xs">
                              {JSON.stringify(log.after, null, 2) || 'null'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
