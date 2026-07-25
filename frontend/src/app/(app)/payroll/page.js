'use client';

import ResourceManager from '@/components/ResourceManager';

const columns = [
  { key: 'employee.name', label: 'Employee' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'netPay', label: 'Net Pay', render: (i) => `$${i.netPay}` },
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
  { name: 'month', label: 'Month (1-12)', type: 'number', required: true },
  { name: 'year', label: 'Year', type: 'number', required: true },
  { name: 'basicSalary', label: 'Basic Salary', type: 'number', required: true },
  { name: 'allowances', label: 'Allowances', type: 'number' },
  { name: 'deductions', label: 'Deductions', type: 'number' },
  { name: 'netPay', label: 'Net Pay', type: 'number', required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['pending', 'paid'] },
];

export default function PayrollPage() {
  return <ResourceManager title="Payroll" endpoint="/payroll" columns={columns} fields={fields} />;
}
