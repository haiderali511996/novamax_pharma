'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employee.name', label: 'Employee' },
  { key: 'type', label: 'Type' },
  { key: 'startDate', label: 'Start', render: (i) => new Date(i.startDate).toLocaleDateString() },
  { key: 'endDate', label: 'End', render: (i) => new Date(i.endDate).toLocaleDateString() },
  { key: 'status', label: 'Status' },
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
  { name: 'type', label: 'Type', type: 'select', options: ['sick', 'casual', 'annual', 'unpaid', 'other'] },
  { name: 'startDate', label: 'Start Date', type: 'date', required: true },
  { name: 'endDate', label: 'End Date', type: 'date', required: true },
  { name: 'reason', label: 'Reason', type: 'textarea' },
  { name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
];

export default function LeavesPage() {
  return <ResourceManager title="Leaves" endpoint="/leaves" columns={columns} fields={fields} />;
}
