'use client';

import LedgerView from '@/components/LedgerView';

export default function EmployeeLedgerPage() {
  return (
    <LedgerView
      title="Employee Ledger"
      partyType="employee"
      partyEndpoint="/employees"
      partyLabel="Employee"
      debitLabel="Advance / Loan"
      creditLabel="Salary Paid / Repayment"
      balanceLabel="Net Advance Owed by Employee"
    />
  );
}
