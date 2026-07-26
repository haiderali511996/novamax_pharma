'use client';

import LedgerView from '@/components/LedgerView';

export default function DoctorLedgerPage() {
  return (
    <LedgerView
      title="Doctor Commission Ledger"
      partyType="doctor"
      partyEndpoint="/doctors"
      partyLabel="Doctor"
      debitLabel="Commission Earned"
      creditLabel="Commission Paid"
      balanceLabel="Commission We Owe Doctor"
    />
  );
}
