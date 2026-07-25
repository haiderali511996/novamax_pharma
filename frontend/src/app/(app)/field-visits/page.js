'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employee.name', label: 'Rep' },
  { key: 'visitType', label: 'Type' },
  { key: 'contactName', label: 'Contact' },
  { key: 'location', label: 'Location' },
  { key: 'visitDate', label: 'Visit Date', render: (i) => new Date(i.visitDate).toLocaleDateString() },
  {
    key: 'nextVisitDate',
    label: 'Next Visit',
    render: (i) => (i.nextVisitDate ? new Date(i.nextVisitDate).toLocaleDateString() : '-'),
  },
];

const samplesPlaceholder = JSON.stringify([{ product: '<productId>', quantity: 5 }], null, 2);

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
    name: 'visitType',
    label: 'Visit Type',
    type: 'select',
    options: ['doctor', 'chemist', 'hospital', 'pharmacy', 'other'],
  },
  { name: 'contactName', label: 'Contact Name (doctor/chemist)', required: true },
  { name: 'location', label: 'Location' },
  {
    name: 'territory',
    label: 'Territory',
    type: 'select-async',
    endpoint: '/territories',
    optionLabel: (t) => `${t.name}${t.region ? ` (${t.region})` : ''}`,
  },
  { name: 'visitDate', label: 'Visit Date', type: 'date' },
  { name: 'samplesGiven', label: 'Samples Given (JSON array)', type: 'json', placeholder: samplesPlaceholder },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'nextVisitDate', label: 'Next Visit Date', type: 'date' },
];

export default function FieldVisitsPage() {
  return <ResourceManager title="Doctor & Chemist Visits" endpoint="/field-visits" columns={columns} fields={fields} />;
}
