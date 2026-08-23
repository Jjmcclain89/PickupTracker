// Compact display for dollar amounts, e.g. 1400 -> "1.4k", 1000 -> "1k".
export function formatAmount(amount: number): string {
  if (amount < 1000) return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const thousands = Math.round((amount / 1000) * 10) / 10;
  const rounded = Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1);
  return `${rounded}k`;
}
