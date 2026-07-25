'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const LEVEL_LABELS = {
  ceo: 'CEO',
  director: 'Director',
  regional_sales_manager: 'Regional Sales Manager',
  area_sales_manager: 'Area Sales Manager',
  medical_representative: 'Medical Representative',
  pharmacist: 'Pharmacist',
  warehouse_staff: 'Warehouse Staff',
  accountant: 'Accountant',
  hr_executive: 'HR Executive',
  office_boy: 'Office Boy',
  staff: 'Staff',
  other: 'Other',
};

function buildTree(employees) {
  const byId = new Map(employees.map((e) => [e._id, { ...e, children: [] }]));
  const roots = [];

  byId.forEach((emp) => {
    const parentId = emp.reportsTo?._id || emp.reportsTo;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(emp);
    } else {
      roots.push(emp);
    }
  });

  return roots;
}

function OrgNode({ node, depth = 0 }) {
  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        style={{ marginLeft: depth * 28 }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          {node.name?.charAt(0) ?? '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{node.name}</p>
          <p className="text-xs text-slate-500">
            {node.designation || LEVEL_LABELS[node.designationLevel] || 'Staff'}
            {node.territory?.name ? ` · ${node.territory.name}` : ''}
          </p>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="mt-2 border-l-2 border-slate-200" style={{ marginLeft: depth * 28 + 18 }}>
          {node.children.map((child) => (
            <OrgNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/employees/org-chart')
      .then(({ data }) => setEmployees(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tree = useMemo(() => buildTree(employees), [employees]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Organization Chart</h1>
      <p className="mb-6 text-sm text-slate-500">
        Reporting structure from CEO down to field and support staff. Set &quot;Reports To&quot; on each
        employee under Employees to build this chart.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {!loading && tree.length === 0 && (
        <p className="text-sm text-slate-400">
          No employees yet. Add employees and set their &quot;Reports To&quot; field to see the org chart.
        </p>
      )}

      <div>
        {tree.map((root) => (
          <OrgNode key={root._id} node={root} />
        ))}
      </div>
    </div>
  );
}
