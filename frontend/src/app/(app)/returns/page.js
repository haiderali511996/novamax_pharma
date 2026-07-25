'use client';

import { useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';

const columns = [
  { key: 'returnNumber', label: 'Return #' },
  { key: 'partyType', label: 'Party Type' },
  { key: 'party.name', label: 'Party' },
  { key: 'totalAmount', label: 'Amount', render: (i) => `$${i.totalAmount}` },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date', render: (i) => new Date(i.createdAt).toLocaleDateString() },
];

const fields = [
  { name: 'returnNumber', label: 'Return Number', required: true },
  {
    name: 'partyType',
    label: 'Return From',
    type: 'select',
    options: [
      { value: 'customer', label: 'Customer' },
      { value: 'distributor', label: 'Distributor' },
    ],
    required: true,
  },
  {
    name: 'party',
    label: 'Party',
    type: 'select-async',
    endpoint: (formData) => (formData.partyType === 'distributor' ? '/distributors' : formData.partyType === 'customer' ? '/customers' : ''),
    optionLabel: (p) => p.name,
    required: true,
  },
  { name: 'items', label: 'Returned Items', type: 'return-items', required: true, totalTarget: 'totalAmount' },
  { name: 'totalAmount', label: 'Total Amount', type: 'number', computed: true },
  { name: 'reason', label: 'Reason', type: 'textarea' },
];

function ApproveRejectButtons({ item, reload, setError }) {
  const [busy, setBusy] = useState(false);

  if (item.status !== 'pending') return null;

  async function act(action) {
    setBusy(true);
    try {
      await api.post(`/returns/${item._id}/${action}`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => act('approve')}
        disabled={busy}
        className="mr-3 text-emerald-700 hover:underline disabled:opacity-50"
      >
        Approve &amp; Restock
      </button>
      <button onClick={() => act('reject')} disabled={busy} className="mr-3 text-red-600 hover:underline disabled:opacity-50">
        Reject
      </button>
    </>
  );
}

export default function ReturnsPage() {
  return (
    <ResourceManager
      title="Returns"
      endpoint="/returns"
      columns={columns}
      fields={fields}
      allowEdit={false}
      renderRowActions={(item, ctx) => <ApproveRejectButtons item={item} {...ctx} />}
    />
  );
}
