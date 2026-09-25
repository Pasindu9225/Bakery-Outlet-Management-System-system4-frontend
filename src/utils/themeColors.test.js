import { categoryToken } from "./themeColors";

const KNOWN = { "Poultry & Meat": "brand-fg", "Vegetables & Fruits": "success" };

test("a mapped category keeps its colour", () => {
  expect(categoryToken("Poultry & Meat", KNOWN)).toBe("brand-fg");
});

test("unmapped categories get different colours, not all the same grey", () => {
  const a = categoryToken("INGREDIENT", KNOWN);
  const b = categoryToken("DRY ITEMS", KNOWN);
  expect(a).not.toBe(b);
  expect(a).not.toBe("fg-secondary");
});

test("the same category always gets the same colour (donut and table chips match)", () => {
  expect(categoryToken("DRY ITEMS", KNOWN)).toBe(categoryToken("DRY ITEMS", KNOWN));
});

test("no category falls back to neutral", () => {
  expect(categoryToken(undefined, KNOWN)).toBe("fg-secondary");
});
