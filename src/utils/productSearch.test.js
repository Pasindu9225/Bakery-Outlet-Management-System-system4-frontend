import { filterProducts } from "./productSearch";

const P = [
  { id: 1, productName: "Fish Bun", productCode: "BP001", isActive: true },
  { id: 2, productName: "Tea Bun", productCode: "BP002", isActive: true },
  { id: 3, productName: "Old Cake", productCode: "OC1", isActive: false },
  { id: 4, productName: "Indian chicken MP", productCode: "ICMP001", isActive: true },
];

test("matches name or code, any case", () => {
  expect(filterProducts(P, "bun").map((p) => p.id)).toEqual([1, 2]);
  expect(filterProducts(P, "icmp").map((p) => p.id)).toEqual([4]);
});

test("names starting with the text come first", () => {
  expect(filterProducts(P, "b").map((p) => p.id)).toEqual([1, 2]); // both contain b; code starts BP
  expect(filterProducts(P, "tea")[0].id).toBe(2);
});

test("inactive products are never offered", () => {
  expect(filterProducts(P, "cake")).toEqual([]);
});

test("empty text lists active products, capped", () => {
  expect(filterProducts(P, "", 2).map((p) => p.id)).toEqual([1, 2]);
});
