'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const TYPE_LABELS = {
  overdue_customer_invoice: 'Overdue Customer Invoice',
  overdue_distributor_invoice: 'Overdue Distributor Invoice',
  license_expiry: 'License Expiry',
  low_stock: 'Low Stock',
  other: 'Notice',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runScan() {
    setScanning(true);
    setError('');
    try {
      await api.post('/notifications/scan-overdue');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500">
            Automatic intimations for invoices unpaid 30+ days, sent to the Sales team. Also runs every 6
            hours in the background.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {scanning ? 'Scanning...' : 'Run Scan Now'}
          </button>
        )}
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-400">No notifications.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 shadow-sm ${
                n.isRead ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {TYPE_LABELS[n.type] || n.type}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead(n._id)}
                  className="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
