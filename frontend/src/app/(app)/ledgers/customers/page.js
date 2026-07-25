'use client';

import LedgerView from '@/components/LedgerView';

export default function CustomerLedgerPage() {
  return (
    <LedgerView
      title="Customer Ledger"
      partyType="customer"
      partyEndpoint="/customers"
      partyLabel="Customer"
      debitLabel="Invoiced"
      creditLabel="Payment Received"
      balanceLabel="Amount Owed by Customer"
    />
  );
}
