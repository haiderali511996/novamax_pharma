'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'reportsTo.name', label: 'Reports To' },
  { key: 'territory.name', label: 'Territory' },
  { key: 'status', label: 'Status' },
];

const LEVEL_OPTIONS = [
  'ceo',
  'director',
  'regional_sales_manager',
  'area_sales_manager',
  'medical_representative',
  'pharmacist',
  'warehouse_staff',
  'accountant',
  'hr_executive',
  'office_boy',
  'staff',
  'other',
];

const fields = [
  { name: 'employeeId', label: 'Employee ID', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone' },
  { name: 'designation', label: 'Job Title (e.g. Senior Medical Representative)' },
  { name: 'designationLevel', label: 'Org Level', type: 'select', options: LEVEL_OPTIONS },
  { name: 'department', label: 'Department' },
  {
    name: 'reportsTo',
    label: 'Reports To',
    type: 'select-async',
    endpoint: '/employees',
    optionLabel: (e) => `${e.name} (${e.designation || e.employeeId})`,
  },
  {
    name: 'territory',
    label: 'Territory / Area',
    type: 'select-async',
    endpoint: '/territories',
    optionLabel: (t) => `${t.name}${t.region ? ` (${t.region})` : ''}`,
  },
  { name: 'joinDate', label: 'Join Date', type: 'date' },
  { name: 'salary', label: 'Salary', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'terminated'] },
];

export default function EmployeesPage() {
  return <ResourceManager title="Employees" endpoint="/employees" columns={columns} fields={fields} />;
}
