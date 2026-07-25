'use client';

import LedgerView from '@/components/LedgerView';

export default function DistributorLedgerPage() {
  return (
    <LedgerView
      title="Distributor Ledger"
      partyType="distributor"
      partyEndpoint="/distributors"
      partyLabel="Distributor"
      debitLabel="Invoiced"
      creditLabel="Payment / Return Received"
      balanceLabel="Amount Owed by Distributor"
    />
  );
}
