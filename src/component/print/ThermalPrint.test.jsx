import { renderToStaticMarkup } from "react-dom/server";
import { BillSlip, KotSlip, PosPrintout, money, posTotals } from "./ThermalPrint";

test("amounts are shown as Rs. with thousand separators and 2 decimals", () => {
  expect(money(1234.5)).toBe("Rs. 1,234.50");
  expect(money(undefined)).toBe("Rs. 0.00");
});

test("a bill shows a tax line only when the total includes tax, and a discount only when given", () => {
  expect(posTotals({ subTotal: 310, discount: 0, finalTotal: 310 }).map((t) => t.label)).toEqual(["Total:"])   // no discount or tax: Total only;
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

test("kitchen items print one KOT slip per kitchen, listing all of that kitchen's items", () => {
  const html = renderToStaticMarkup(<PosPrintout printData={{ printBill: false, kotItems: [
    { productName: "Chicken Kottu", qty: 1, kotNumber: "KOT-1", mpcName: "Rice Corner" },
    { productName: "Egg Kottu", qty: 2, kotNumber: "KOT-2", mpcName: "Rice Corner", specialInstructions: "No chilli" },
    { productName: "Fresh Juice", qty: 1, kotNumber: "KOT-3", mpcName: "Juice Bar" },
  ] }} />);
  expect(html.match(/>KOT</g)).toHaveLength(2);
  expect(html).toContain("SLIP #1 OF 2");
  expect(html).toContain("KOT No: KOT-1, KOT-2");
  expect(html).toContain("KOT ITEM: Egg Kottu");
  expect(html).toContain("Comment:");
  expect(html).toContain("Egg Kottu: No chilli");
  expect(html).not.toContain("PLEASE PREPARE");
  expect(html).toContain("Kitchen: Juice Bar");
});

test("a proforma has no time, no developer line and asks to settle for the invoice", () => {
  const html = renderToStaticMarkup(<PosPrintout printData={{ type: "PROFORMA", items: [{ productName: "Tea", qty: 1, unitPrice: 100 }], subTotal: 100, finalTotal: 100 }} />);
  expect(html).toContain("PROFORMA INVOICE (UNPAID)");
  expect(html).not.toContain("Time:");
  expect(html).not.toContain("plover.lk");
  expect(html).toContain("GET THE INVOICE.");
  const bill = renderToStaticMarkup(<PosPrintout printData={{ transactionId: "BILL-1", items: [], subTotal: 0, finalTotal: 0 }} />);
  expect(bill).toContain(">INVOICE<");
  expect(bill).not.toContain("TAX INVOICE");
});
