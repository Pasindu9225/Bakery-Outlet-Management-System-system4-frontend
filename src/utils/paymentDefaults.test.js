import { defaultPaymentMethodName } from "./paymentDefaults";

test("Cash is the default even when it is not first in the list", () => {
  expect(defaultPaymentMethodName([{ name: "Bank Transfer" }, { name: "Card" }, { name: "Cash" }])).toBe("Cash");
  expect(defaultPaymentMethodName([{ name: "Bank Transfer" }, { name: "CASH" }])).toBe("CASH");
});

test("without a cash method, the first method is used; no methods gives empty", () => {
  expect(defaultPaymentMethodName([{ name: "Card" }, { name: "Uber" }])).toBe("Card");
  expect(defaultPaymentMethodName([])).toBe("");
  expect(defaultPaymentMethodName(undefined)).toBe("");
});
