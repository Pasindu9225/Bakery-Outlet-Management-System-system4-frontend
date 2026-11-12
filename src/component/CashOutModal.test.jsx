import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CashOutSlip } from "./CashOutModal";

test("the cash out slip shows counted vs float + sales cash and the excess or short", () => {
  const c = { amount: 21040, expectedCash: 20160, floatAmount: 0, cardSales: 2700, denominations: "1000x21,10x4", number: 1, approvedBy: "mgr" };
  const html = renderToStaticMarkup(<CashOutSlip cashOut={c} outlet={{}} />);
  expect(html).toContain("CASH OUT REPORT");
  expect(html).toContain("Excess");
  expect(html).toContain("880.00");
  expect(html).toContain("21,000.00");
  expect(renderToStaticMarkup(<CashOutSlip cashOut={{ ...c, amount: 20000 }} outlet={{}} />)).toContain("Short");
});
