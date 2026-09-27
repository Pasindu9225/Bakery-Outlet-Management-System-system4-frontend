import { reportSheetRows } from "./exportToExcel";

test("a report sheet keeps its title and info lines above the table, then a blank row", () => {
  const rows = reportSheetRows({
    title: "Sales Report",
    notes: ["Generated: 26/09/2026", "Period: 2026-09-01 to 2026-09-26"],
    headers: ["Product", "Qty", "Total"],
    rows: [["Bread", 3, 450], ["Cake", 1, 1200]],
  });
  expect(rows).toEqual([
    ["Sales Report"],
    ["Generated: 26/09/2026"],
    ["Period: 2026-09-01 to 2026-09-26"],
    [],
    ["Product", "Qty", "Total"],
    ["Bread", 3, 450],
    ["Cake", 1, 1200],
  ]);
});

test("empty info lines are left out", () => {
  expect(reportSheetRows({ title: "T", notes: ["", null, "Kept"], headers: ["A"], rows: [] }))
    .toEqual([["T"], ["Kept"], [], ["A"]]);
});
