'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

const STATUS_LABELS = { sale_based: 'Sale Based', partially_paid: 'Partially Paid', fully_paid: 'Fully Paid' };

export default function DistributorInvoicePrintPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/distributor-invoices/${id}`)
      .then(({ data }) => setInvoice(data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!invoice) return <p className="text-sm text-slate-400">Loading...</p>;

  const distributor = invoice.distributor || {};
  const hasItems = invoice.items && invoice.items.length > 0;
  const balance = invoice.amount - invoice.amountPaid;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-slate-800 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="border-2 border-slate-800 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase">{distributor.name}</h1>
          {distributor.location && <p className="text-xs">{distributor.location}</p>}
          <p className="text-xs">
            {distributor.phone && `Ph: ${distributor.phone}`}
            {distributor.licenseNumber && `  Lic No. ${distributor.licenseNumber}`}
          </p>
          <p className="mt-2 text-lg font-bold tracking-widest">SALE INVOICE</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-400 pt-3">
          <div>
            <p>
              <span className="font-semibold">Customer Name:</span> {invoice.pharmacyName || '-'}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {invoice.pharmacyAddress || '-'}
            </p>
            <p>
              <span className="font-semibold">License:</span> {invoice.pharmacyLicenseNumber || '-'}
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">Invoice Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              {invoice.isCancelled ? 'Cancelled' : STATUS_LABELS[invoice.status] || invoice.status}
            </p>
          </div>
        </div>

        {hasItems && (
          <table className="mt-4 w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-400">
                <th className="py-1 text-left">Sr#</th>
                <th className="py-1 text-left">Item Name</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-left">Batch No</th>
                <th className="py-1 text-left">Expiry</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Tax%</th>
                <th className="py-1 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1">{item.product?.name || '-'}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
                  <td className="py-1">{item.batchNumber || '-'}</td>
                  <td className="py-1">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="py-1 text-right">{formatPKR(item.unitPrice)}</td>
                  <td className="py-1 text-right">{item.taxRate || 0}%</td>
                  <td className="py-1 text-right">{formatPKR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1">
            <div className="flex justify-between border-t border-slate-400 pt-1 font-semibold">
              <span>Total:</span>
              <span>{formatPKR(invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>{formatPKR(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-400 pt-1 font-bold">
              <span>Balance Due:</span>
              <span>{formatPKR(balance)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <p className="mt-4 border-t border-slate-300 pt-2 text-xs text-slate-600">Notes: {invoice.notes}</p>
        )}
      </div>
    </div>
  );
}
