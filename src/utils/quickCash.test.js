import { quickCashAmounts } from "./quickCash";

test("exact first, then the next round notes above the total", () => {
  expect(quickCashAmounts(820)).toEqual([820, 900, 1000, 5000]);
  expect(quickCashAmounts(1500)).toEqual([1500, 1600, 2000, 5000]);
});

test("the next Rs 5,000 note is always offered (the most common big note)", () => {
  expect(quickCashAmounts(2000)).toEqual([2000, 2500, 3000, 5000]);
  expect(quickCashAmounts(4800)).toEqual([4800, 4900, 5000]);
});

test("decimals keep the exact amount and every other amount is above it", () => {
  const a = quickCashAmounts(1234.5);
  expect(a[0]).toBe(1234.5);
  expect(a.slice(1).every((x) => x > 1234.5)).toBe(true);
});

test("zero or bad totals give nothing", () => {
  expect(quickCashAmounts(0)).toEqual([]);
  expect(quickCashAmounts(NaN)).toEqual([]);
});
