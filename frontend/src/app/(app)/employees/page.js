'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { name: 'employeeId', label: 'Employee ID', required: true },
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone' },
  { name: 'designation', label: 'Designation' },
  { name: 'department', label: 'Department' },
  { name: 'joinDate', label: 'Join Date', type: 'date' },
  { name: 'salary', label: 'Salary', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'terminated'] },
];

export default function EmployeesPage() {
  return <ResourceManager title="Employees" endpoint="/employees" columns={columns} fields={fields} />;
}
