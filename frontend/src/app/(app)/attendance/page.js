'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employee.name', label: 'Employee' },
  { key: 'date', label: 'Date', render: (i) => new Date(i.date).toLocaleDateString() },
  { key: 'status', label: 'Status' },
  { key: 'checkIn', label: 'Check In' },
  { key: 'checkOut', label: 'Check Out' },
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
  { name: 'date', label: 'Date', type: 'date', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['present', 'absent', 'half_day', 'leave', 'holiday'],
  },
  { name: 'checkIn', label: 'Check In (HH:MM)' },
  { name: 'checkOut', label: 'Check Out (HH:MM)' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function AttendancePage() {
  return <ResourceManager title="Attendance" endpoint="/attendance" columns={columns} fields={fields} />;
}
