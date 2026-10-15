import * as XLSX from "xlsx";
import { pickSheet, sheetRows } from "./ExcelImport";

const book = (sheets) => {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, aoa]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name));
  return wb;
};

test("picks the template tab by name, else by its headings", () => {
  const wb = book({ Instructions: [["read me"]], "5 BOM (Recipes)": [["Product code *"]] });
  expect(pickSheet(wb, "bom")).toBe("5 BOM (Recipes)");

  const renamed = book({ Sheet1: [["Product code *", "Selling price (Rs.) *"]], Sheet2: [["Product code *", "Ingredient code *"]] });
  expect(pickSheet(renamed, "bom")).toBe("Sheet2");
  expect(pickSheet(renamed, "products")).toBe("Sheet1");
  expect(pickSheet(renamed, "users")).toBeUndefined();
});

test("skips the hint row and blank rows, keeps Excel row numbers", () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Product code *", "Quantity"],
    ["ℹ Code from the Products sheet", "e.g. 0.4"],
    ["BR-001", 0.4],
    ["", ""],
    ["BR-002", "1"],
  ]);
  expect(sheetRows(sheet)).toEqual([
    { _row: 3, "Product code *": "BR-001", Quantity: "0.4" },
    { _row: 5, "Product code *": "BR-002", Quantity: "1" },
  ]);
});

test("older templates: hint row without ℹ is skipped only as the first row", () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["First name *", "Email *"],
    ["e.g. Nimal", "Different for each person. e.g. nimal@shop.lk"],
    ["Kamal", "kamal@shop.lk"],
    ["e.g. typed by mistake", "x@shop.lk"],
  ]);
  expect(sheetRows(sheet).map((r) => r._row)).toEqual([3, 4]);
});
