'use client';

import LedgerView from '@/components/LedgerView';

export default function ManufacturerLedgerPage() {
  return (
    <LedgerView
      title="Manufacturer Ledger"
      partyType="manufacturer"
      partyEndpoint="/manufacturers"
      partyLabel="Manufacturer"
      debitLabel="Bill Received"
      creditLabel="Payment Made"
      balanceLabel="Amount We Owe Manufacturer"
    />
  );
}
