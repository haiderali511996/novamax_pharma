'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'hospitalClinic', label: 'Hospital/Clinic' },
  { key: 'territory.name', label: 'Territory' },
  { key: 'assignedRep.name', label: 'Assigned Rep' },
  {
    key: 'incentiveType',
    label: 'Default Incentive',
    render: (d) =>
      d.incentiveType === 'cash_commission'
        ? `${d.commissionPercent}% cash commission`
        : `${d.discountPercent}% product discount`,
  },
  {
    key: 'areaRates',
    label: 'Area-Specific Rates',
    render: (d) =>
      d.areaRates?.length
        ? d.areaRates
            .map((r) => `${r.territory?.name || 'Unknown area'}: ${d.incentiveType === 'cash_commission' ? r.commissionPercent : r.discountPercent}%`)
            .join(', ')
        : 'Same rate everywhere',
  },
];

const fields = [
  { name: 'name', label: 'Doctor Name', required: true },
  { name: 'specialization', label: 'Specialization' },
  { name: 'hospitalClinic', label: 'Hospital / Clinic' },
  { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email' },
  { name: 'territory', label: 'Territory', type: 'select-async', endpoint: '/territories', optionLabel: (t) => t.name },
  {
    name: 'assignedRep',
    label: 'Assigned Medical Rep',
    type: 'select-async',
    endpoint: '/employees',
    optionLabel: (e) => e.name,
  },
  {
    name: 'incentiveType',
    label: 'How is this doctor compensated for referrals?',
    type: 'select',
    options: [
      { value: 'cash_commission', label: 'Cash commission (% of sales value paid directly to the doctor)' },
      { value: 'product_discount', label: 'Product discount (extra % off Trade Price for their referred sales)' },
    ],
    required: true,
  },
  {
    name: 'commissionPercent',
    label: 'Default Commission % (e.g. 20 for "20K PKR per 1 Lac sales")',
    type: 'number',
  },
  {
    name: 'discountPercent',
    label: 'Default Product Discount % off TP (e.g. 20, 25, 50)',
    type: 'number',
  },
  {
    name: 'areaRates',
    label:
      'Area-Specific Rates (this doctor\'s commission/discount is NOT fixed - it can differ per territory; leave a territory out to use the default rate above)',
    type: 'area-rates',
  },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function DoctorsPage() {
  return <ResourceManager title="Doctors" endpoint="/doctors" columns={columns} fields={fields} />;
}
