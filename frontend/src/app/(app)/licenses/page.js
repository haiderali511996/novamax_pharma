'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'licenseNumber', label: 'License #' },
  { key: 'issuingAuthority', label: 'Issuing Authority' },
  { key: 'expiryDate', label: 'Expiry Date', render: (i) => new Date(i.expiryDate).toLocaleDateString() },
  { key: 'status', label: 'Status' },
];

const fields = [
  { name: 'title', label: 'Title', required: true },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: ['drug_license', 'gmp_certificate', 'fda_registration', 'business_license', 'tax_certificate', 'other'],
  },
  { name: 'licenseNumber', label: 'License Number' },
  { name: 'issuingAuthority', label: 'Issuing Authority' },
  { name: 'issueDate', label: 'Issue Date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
  { name: 'documentUrl', label: 'Document (PDF or image)', type: 'file-upload' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'renewal_pending'] },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function LicensesPage() {
  return (
    <ResourceManager title="Licenses & Documents" endpoint="/licenses" columns={columns} fields={fields} />
  );
}
