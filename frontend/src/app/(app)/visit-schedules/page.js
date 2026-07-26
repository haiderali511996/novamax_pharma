'use client';

import { useEffect, useState } from 'react';
import ResourceManager from '@/components/ResourceManager';
import { api } from '@/lib/api';

const PURPOSE_LABELS = {
  retake_order: 'Re-take Order',
  collect_invoice: 'Collect Invoice/Payment',
  both: 'Re-take Order & Collect Invoice',
  visit_only: 'Visit Only',
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function partyName(row) {
  return row.party?.name || '-';
}

const columns = [
  { key: 'assignee.name', label: 'Rep / Distributor Worker' },
  { key: 'partyType', label: 'Visits' },
  { key: 'party', label: 'Party', render: partyName },
  { key: 'territory.name', label: 'Area' },
  {
    key: 'frequency',
    label: 'Schedule',
    render: (r) =>
      r.frequency === 'weekly'
        ? `Weekly - every ${DAY_LABELS[r.dayOfWeek]}`
        : `Monthly - day ${r.dayOfMonth}`,
  },
  { key: 'purpose', label: 'Purpose', render: (r) => PURPOSE_LABELS[r.purpose] || r.purpose },
];

const fields = [
  { name: 'assignee', label: 'Rep / Distributor Worker', type: 'select-async', endpoint: '/employees', optionLabel: (e) => e.name, required: true },
  {
    name: 'partyType',
    label: 'Visiting a...',
    type: 'select',
    options: [
      { value: 'customer', label: 'Customer' },
      { value: 'distributor', label: 'Distributor' },
      { value: 'facility', label: 'Hospital/Clinic/Pharmacy (Facility Directory)' },
    ],
    required: true,
  },
  {
    name: 'party',
    label: 'Party',
    type: 'select-async',
    endpoint: (formData) =>
      formData.partyType === 'distributor' ? '/distributors' : formData.partyType === 'facility' ? '/facilities' : formData.partyType === 'customer' ? '/customers' : '',
    optionLabel: (p) => p.name,
    required: true,
  },
  { name: 'territory', label: 'Area / Territory', type: 'select-async', endpoint: '/territories', optionLabel: (t) => t.name },
  {
    name: 'frequency',
    label: 'Frequency',
    type: 'select',
    options: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ],
    required: true,
  },
  {
    name: 'dayOfWeek',
    label: 'Day of Week (for weekly schedules)',
    type: 'select',
    options: DAY_LABELS.map((label, value) => ({ value: String(value), label })),
  },
  { name: 'dayOfMonth', label: 'Day of Month (for monthly schedules, 1-31)', type: 'number' },
  {
    name: 'purpose',
    label: 'Purpose of Visit',
    type: 'select',
    options: Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + 1); // Monday
  return d;
}

function WeekView() {
  const [start, setStart] = useState(() => startOfWeek(new Date()));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get('/visit-schedules/week', { start: start.toISOString().slice(0, 10) })
      .then((res) => {
        if (active) setDays(res.data.days);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [start]);

  function shiftWeek(deltaDays) {
    const next = new Date(start);
    next.setDate(next.getDate() + deltaDays);
    setStart(next);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => shiftWeek(-7)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          &larr; Previous Week
        </button>
        <p className="text-sm font-medium text-slate-600">
          Week of {start.toLocaleDateString()}
        </p>
        <button onClick={() => shiftWeek(7)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Next Week &rarr;
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
          {days.map((day) => (
            <div key={day.date} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {day.dayName}
                <span className="ml-1 font-normal text-slate-400">{day.date}</span>
              </p>
              {day.rows.length === 0 ? (
                <p className="text-xs text-slate-400">No visits due</p>
              ) : (
                <ul className="space-y-2">
                  {day.rows.map((row) => (
                    <li key={row._id} className="rounded-md bg-slate-50 p-2 text-xs">
                      <p className="font-medium text-slate-700">{row.assignee?.name}</p>
                      <p className="text-slate-500">{partyName(row)}</p>
                      <p className="text-indigo-600">{PURPOSE_LABELS[row.purpose] || row.purpose}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisitSchedulesPage() {
  const [tab, setTab] = useState('week');

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('week')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'week' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-300'}`}
        >
          This Week&apos;s Beat Plan
        </button>
        <button
          onClick={() => setTab('manage')}
          className={`rounded-md px-4 py-2 text-sm font-medium ${tab === 'manage' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-300'}`}
        >
          Manage Schedules
        </button>
      </div>
      {tab === 'week' ? (
        <WeekView />
      ) : (
        <ResourceManager
          title="Visit Schedules (Re-take Orders & Collect Invoices)"
          endpoint="/visit-schedules"
          columns={columns}
          fields={fields}
        />
      )}
    </div>
  );
}
