'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';

const columns = [
  { key: 'employee.name', label: 'Employee' },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount', render: (i) => `$${i.amount}` },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date', render: (i) => new Date(i.date).toLocaleDateString() },
];

const fields = [
  {
    name: 'employee',
    label: 'Employee',
    type: 'select-async',
    endpoint: '/employees',
    required: true,
    optionLabel: (e) => `${e.name} (${e.employeeId})`,
  },
  { name: 'title', label: 'Title', required: true },
  { name: 'category', label: 'Category', type: 'select', options: ['travel', 'fuel', 'meals', 'lodging', 'other'] },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'receiptUrl', label: 'Receipt URL' },
];

function ApproveRejectButtons({ item, reload, setError }) {
  const [busy, setBusy] = useState(false);

  if (item.status !== 'pending') return null;

  async function act(action) {
    setBusy(true);
    try {
      await api.post(`/expense-claims/${item._id}/${action}`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => act('approve')} disabled={busy} className="mr-3 text-emerald-700 hover:underline disabled:opacity-50">
        Approve &amp; Reimburse
      </button>
      <button onClick={() => act('reject')} disabled={busy} className="mr-3 text-red-600 hover:underline disabled:opacity-50">
        Reject
      </button>
    </>
  );
}

export default function ExpenseClaimsPage() {
  return (
    <ResourceManager
      title="Expense Claims"
      endpoint="/expense-claims"
      columns={columns}
      fields={fields}
      allowEdit={false}
      renderRowActions={(item, ctx) => <ApproveRejectButtons item={item} {...ctx} />}
    />
  );
}
