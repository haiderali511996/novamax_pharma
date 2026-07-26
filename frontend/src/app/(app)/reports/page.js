'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { exportToCSV } from '@/lib/csv';

const REPORTS = [
  { key: 'stock-valuation', label: 'Stock Valuation' },
  { key: 'aged-receivables', label: 'Aged Receivables' },
  { key: 'aged-payables', label: 'Aged Payables' },
  { key: 'sales-by-territory', label: 'Sales by Territory' },
  { key: 'doctor-commissions', label: 'Doctor Commissions' },
  { key: 'profit-loss', label: 'Profit & Loss' },
];

function StockValuationReport({ data }) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Total stock value: <span className="font-semibold">${data.totalValue.toFixed(2)}</span>
      </p>
      <ReportTable
        rows={data.rows}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'sku', label: 'SKU' },
          { key: 'warehouse', label: 'Warehouse' },
          { key: 'manufacturer', label: 'Manufacturer' },
          { key: 'batchNumber', label: 'Batch' },
          { key: 'quantity', label: 'Qty' },
          { key: 'costPrice', label: 'Cost Price', render: (r) => `$${r.costPrice}` },
          { key: 'value', label: 'Value', render: (r) => `$${r.value.toFixed(2)}` },
        ]}
        filename="stock-valuation"
      />
    </div>
  );
}

function AgedReceivablesReport({ data }) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-5 gap-2 text-center text-sm">
        {Object.entries(data.buckets).map(([bucket, amount]) => (
          <div key={bucket} className="rounded-md border border-slate-200 bg-white p-2">
            <p className="text-xs text-slate-400">{bucket}</p>
            <p className="font-semibold text-slate-800">${amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <ReportTable
        rows={data.rows}
        columns={[
          { key: 'partyType', label: 'Type' },
          { key: 'party', label: 'Party' },
          { key: 'invoiceNumber', label: 'Invoice #' },
          { key: 'balance', label: 'Balance', render: (r) => `$${r.balance.toFixed(2)}` },
          { key: 'daysOverdue', label: 'Days Overdue' },
          { key: 'bucket', label: 'Bucket' },
        ]}
        filename="aged-receivables"
      />
    </div>
  );
}

function AgedPayablesReport({ data }) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Total payable: <span className="font-semibold">${data.totalPayable.toFixed(2)}</span>
      </p>
      <ReportTable
        rows={data.rows}
        columns={[
          { key: 'manufacturer', label: 'Manufacturer' },
          { key: 'balance', label: 'Balance', render: (r) => `$${r.balance.toFixed(2)}` },
          { key: 'daysOutstanding', label: 'Days Outstanding' },
        ]}
        filename="aged-payables"
      />
    </div>
  );
}

function SalesByTerritoryReport({ data }) {
  return (
    <ReportTable
      rows={data.rows}
      columns={[
        { key: 'territory', label: 'Territory' },
        { key: 'orderCount', label: 'Orders' },
        { key: 'totalSales', label: 'Total Sales', render: (r) => `$${r.totalSales.toFixed(2)}` },
      ]}
      filename="sales-by-territory"
    />
  );
}

function DoctorCommissionsReport({ data }) {
  const { summary } = data;
  return (
    <div>
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-400">% of Business From Doctors</p>
            <p className="text-lg font-semibold text-violet-700">{summary.doctorReferredSalesPercent}%</p>
            <p className="text-xs text-slate-400">
              ${summary.totalDoctorReferredSales.toFixed(0)} of ${summary.totalCompanySales.toFixed(0)}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-400">Commission Expense (Earned)</p>
            <p className="text-lg font-semibold text-rose-700">${summary.totalCommissionExpense.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-400">Commission Paid</p>
            <p className="text-lg font-semibold text-emerald-700">${summary.totalCommissionPaid.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-400">Still Owed to Doctors</p>
            <p className="text-lg font-semibold text-amber-700">${summary.totalCommissionOwed.toFixed(2)}</p>
          </div>
        </div>
      )}
      <ReportTable
        rows={data.rows}
        columns={[
          { key: 'rank', label: 'Rank', render: (r) => `#${r.rank}` },
          { key: 'doctor', label: 'Doctor' },
          {
            key: 'incentiveType',
            label: 'Incentive',
            render: (r) => (r.incentiveType === 'cash_commission' ? `${r.commissionPercent}% commission` : `${r.discountPercent}% discount`),
          },
          { key: 'orderCount', label: 'Orders' },
          { key: 'totalSales', label: 'Sales Referred', render: (r) => `$${r.totalSales.toFixed(2)}` },
          { key: 'salesSharePercent', label: '% of Company Sales', render: (r) => `${r.salesSharePercent}%` },
          { key: 'commissionEarned', label: 'Commission Earned', render: (r) => `$${r.commissionEarned.toFixed(2)}` },
          { key: 'commissionPaid', label: 'Commission Paid', render: (r) => `$${r.commissionPaid.toFixed(2)}` },
          {
            key: 'balanceOwed',
            label: 'Balance Owed',
            render: (r) => <span className={r.balanceOwed > 0 ? 'font-semibold text-red-700' : ''}>${r.balanceOwed.toFixed(2)}</span>,
          },
        ]}
        filename="doctor-commissions"
      />
    </div>
  );
}

function ProfitLossReport({ data }) {
  const rows = [
    { label: 'Revenue', value: data.revenue },
    { label: 'Cost of Goods Sold', value: -data.cogs },
    { label: 'Gross Profit', value: data.grossProfit, bold: true },
    { label: 'Expenses', value: -data.expenses },
    { label: 'Net Profit', value: data.netProfit, bold: true },
  ];
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        {data.month}/{data.year}
      </p>
      <div className="max-w-md space-y-1 rounded-lg border border-slate-200 bg-white p-4">
        {rows.map((r) => (
          <div key={r.label} className={`flex justify-between text-sm ${r.bold ? 'border-t pt-1 font-semibold' : ''}`}>
            <span>{r.label}</span>
            <span className={r.value < 0 ? 'text-red-600' : 'text-slate-800'}>${r.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTable({ rows, columns, filename }) {
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => exportToCSV(filename, rows, columns.map((c) => ({ key: c.key, label: c.label })))}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left font-semibold text-slate-600">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                  No data.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-slate-700">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const RENDERERS = {
  'stock-valuation': StockValuationReport,
  'aged-receivables': AgedReceivablesReport,
  'aged-payables': AgedPayablesReport,
  'sales-by-territory': SalesByTerritoryReport,
  'doctor-commissions': DoctorCommissionsReport,
  'profit-loss': ProfitLossReport,
};

export default function ReportsPage() {
  const [active, setActive] = useState('stock-valuation');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setData(null);
    api
      .get(`/reports/${active}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [active]);

  const Renderer = RENDERERS[active];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Reports</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => {
              // Reset data/loading in the same batch as the tab switch, so
              // the very next render never pairs the new tab's Renderer
              // with the previous tab's (structurally different) data.
              setData(null);
              setLoading(true);
              setError('');
              setActive(r.key);
            }}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active === r.key ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-slate-400">Loading...</p> : data && Renderer && <Renderer data={data} />}
    </div>
  );
}
