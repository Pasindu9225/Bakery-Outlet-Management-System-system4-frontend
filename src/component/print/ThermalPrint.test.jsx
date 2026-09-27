import { renderToStaticMarkup } from "react-dom/server";
import { BillSlip, KotSlip, money, posTotals } from "./ThermalPrint";

test("amounts are shown as Rs. with thousand separators and 2 decimals", () => {
  expect(money(1234.5)).toBe("Rs. 1,234.50");
  expect(money(undefined)).toBe("Rs. 0.00");
});

test("a bill shows a tax line only when the total includes tax, and a discount only when given", () => {
  expect(posTotals({ subTotal: 310, discount: 0, finalTotal: 310 }).map((t) => t.label)).toEqual(["Subtotal:", "Total:"]);
  const taxed = posTotals({ subTotal: 140, discount: 0, finalTotal: 154 });
  expect(taxed.map((t) => t.label)).toEqual(["Subtotal:", "Tax (10%):", "Total:"]);
  expect(taxed[1].value).toBeCloseTo(14);
  expect(posTotals({ subTotal: 200, discount: 20, finalTotal: 180 }).map((t) => t.label)).toEqual(["Subtotal:", "Discount:", "Total:"]);
});

test("empty fields are left out of bills and KOT slips", () => {
  const bill = renderToStaticMarkup(<BillSlip title="TAX INVOICE" info={[["Bill ID", "BILL-000001"], ["Waiter", null]]}
    sections={[{ items: [{ name: "Tea Bun", qty: 2, amount: 180 }] }]} totals={[{ label: "Total:", value: 180 }]} />);
  expect(bill).toContain("Bill ID: BILL-000001");
  expect(bill).not.toContain("Waiter");
  expect(bill).toContain("Rs. 180.00");
  expect(bill).toContain("Developed by - plover.lk | 077 990 98 96");
  const kot = renderToStaticMarkup(<KotSlip index={0} count={2} info={[["KOT No", "KOT-1"], ["Table", undefined]]} item={{ name: "Fish Bun", qty: 1 }} />);
  expect(kot).toContain("SLIP #1 OF 2");
  expect(kot).toContain("KOT No: KOT-1");
  expect(kot).not.toContain("Table");
  expect(kot).not.toContain("plover.lk");   // KOT slips are for the kitchen, not the customer
});
