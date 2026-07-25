'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'isActive', label: 'Active', render: (i) => (i.isActive ? 'Yes' : 'No') },
];

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Password', type: 'password' },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: ['admin', 'manager', 'pharmacist', 'sales', 'hr', 'accountant', 'staff'],
    required: true,
  },
  { name: 'department', label: 'Department' },
  { name: 'phone', label: 'Phone' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
];

export default function UsersPage() {
  return <ResourceManager title="Users" endpoint="/users" columns={columns} fields={fields} />;
}
