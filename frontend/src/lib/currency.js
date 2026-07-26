// NovaMax operates in Pakistan - every price in the app is Pakistani Rupees.
export function formatPKR(amount) {
  const n = Number(amount) || 0;
  return `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// For places that intentionally show a whole-number amount (no decimals).
export function formatPKRWhole(amount) {
  const n = Number(amount) || 0;
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}
