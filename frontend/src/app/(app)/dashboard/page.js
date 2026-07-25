'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CARDS = [
  { key: 'products', label: 'Active Products', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'lowStockBatches', label: 'Low Stock Batches', color: 'bg-amber-50 text-amber-700' },
  { key: 'nearExpiryBatches', label: 'Near-Expiry Batches (90d)', color: 'bg-red-50 text-red-700' },
  { key: 'customers', label: 'Customers', color: 'bg-sky-50 text-sky-700' },
  { key: 'suppliers', label: 'Suppliers', color: 'bg-indigo-50 text-indigo-700' },
  { key: 'salesOrders', label: 'Sales Orders', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'purchaseOrders', label: 'Purchase Orders', color: 'bg-purple-50 text-purple-700' },
  { key: 'employees', label: 'Active Employees', color: 'bg-teal-50 text-teal-700' },
  { key: 'unpaidInvoices', label: 'Unpaid Invoices', color: 'bg-orange-50 text-orange-700' },
  { key: 'monthlyExpenses', label: 'Expenses This Month', color: 'bg-rose-50 text-rose-700', currency: true },
  { key: 'licenseAlerts', label: 'License Renewals Due', color: 'bg-yellow-50 text-yellow-700' },
  { key: 'distributors', label: 'Active Distributors', color: 'bg-cyan-50 text-cyan-700' },
  { key: 'unreadNotifications', label: 'Unread Notifications', color: 'bg-red-50 text-red-700' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Welcome back, {user?.name}</h1>
      <p className="mb-6 text-sm text-slate-500">Here&apos;s what&apos;s happening at NovaMax Pharma today.</p>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CARDS.map((card) => (
          <div key={card.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className={`mt-2 inline-block rounded px-2 py-1 text-2xl font-bold ${card.color}`}>
              {stats
                ? card.currency
                  ? `$${Number(stats[card.key]).toLocaleString()}`
                  : stats[card.key]
                : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
