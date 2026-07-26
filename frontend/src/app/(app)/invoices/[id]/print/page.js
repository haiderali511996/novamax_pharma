'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

const STATUS_LABELS = { sale_based: 'Sale Based', partially_paid: 'Partially Paid', fully_paid: 'Fully Paid' };

export default function InvoicePrintPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [salesOrder, setSalesOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/invoices/${id}`)
      .then(async ({ data }) => {
        setInvoice(data);
        if (data.salesOrder) {
          const orderId = data.salesOrder._id || data.salesOrder;
          const { data: order } = await api.get(`/sales-orders/${orderId}`);
          setSalesOrder(order);
        }
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!invoice) return <p className="text-sm text-slate-400">Loading...</p>;

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
          <h1 className="text-2xl font-bold uppercase text-emerald-700">NovaMax Pharma</h1>
          <p className="mt-2 text-lg font-bold tracking-widest">SALE INVOICE</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-400 pt-3">
          <div>
            <p>
              <span className="font-semibold">Customer:</span> {invoice.customer?.name || '-'}
            </p>
            {invoice.customer?.phone && (
              <p>
                <span className="font-semibold">Phone:</span> {invoice.customer.phone}
              </p>
            )}
          </div>
          <div className="text-right">
            <p>
              <span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              {invoice.isCancelled ? 'Cancelled' : STATUS_LABELS[invoice.status] || invoice.status}
            </p>
            {salesOrder && (
              <p>
                <span className="font-semibold">Order #:</span> {salesOrder.orderNumber}
              </p>
            )}
          </div>
        </div>

        {salesOrder && salesOrder.items?.length > 0 && (
          <table className="mt-4 w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-slate-400">
                <th className="py-1 text-left">Sr#</th>
                <th className="py-1 text-left">Item Name</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Tax%</th>
                <th className="py-1 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {salesOrder.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1">{item.product?.name || '-'}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
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
      </div>
    </div>
  );
}
