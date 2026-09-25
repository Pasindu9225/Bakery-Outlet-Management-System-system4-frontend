// Amounts a cashier is likely to be handed: the exact total, then the next round notes above it
// (next 500, 1000 and 5000; the next 100 only fills a gap, so the Rs 5,000 note is never pushed out).
const nextAbove = (total, step) => Math.floor(total / step) * step + step;

export const quickCashAmounts = (total) => {
  if (!(total > 0)) return [];
  const ups = [...new Set([500, 1000, 5000].map((step) => nextAbove(total, step)))];
  if (ups.length < 3) ups.push(nextAbove(total, 100));
  return [total, ...[...new Set(ups)].sort((a, b) => a - b)];
};
