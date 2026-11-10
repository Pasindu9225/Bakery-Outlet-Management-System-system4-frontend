import { eBillText, posBill } from "./eBill";

test("cash e-bill: Cake Republic, outlet, cash given and change", () => {
  const text = eBillText(posBill({ transactionId: "BILL-000012", items: [{ productName: "Fish Bun", qty: 2, unitPrice: 120 }],
    subTotal: 240, discount: 0, finalTotal: 240, paymentMethod: "Cash", cashGiven: 1000, change: 760 }, { name: "Garden Club Cafe - Kandy" }));
  const lines = text.split("\n");
  expect(lines[0]).toBe("Cake Republic");
  expect(lines[1]).toBe("Garden Club Cafe - Kandy");
  expect(text).toContain("Cash Rs.1,000.00");
  expect(text).toContain("Change Rs.760.00");
});

test("card e-bill has no cash / change lines", () => {
  const text = eBillText(posBill({ transactionId: "BILL-000013", items: [], subTotal: 240, finalTotal: 240, paymentMethod: "Card", cashGiven: 0, change: 0 }, {}));
  expect(text).not.toMatch(/Cash Rs|Change Rs/);
});
