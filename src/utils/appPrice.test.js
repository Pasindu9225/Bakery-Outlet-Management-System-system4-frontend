import { appChannel, appPrice } from "./appPrice";

test("Uber / PickMe bills use the app price; none set = the normal price", () => {
  const kottu = { price: 1000, uberPrice: 1200, pickmePrice: 0 };
  expect(appPrice(kottu, "UBER", 1000)).toBe(1200);
  expect(appPrice(kottu, "PICKME", 1000)).toBe(1000);   // 0 = not set
  expect(appPrice(kottu, null, 1000)).toBe(1000);
  expect(appPrice(undefined, "UBER", 1000)).toBe(1000);
});

test("the channel comes from the payment method name or the order channel", () => {
  expect(appChannel("Cash", "UBER")).toBe("UBER");
  expect(appChannel("Pick Me")).toBe("PICKME");
  expect(appChannel("PickMe Food")).toBe("PICKME");
  expect(appChannel("Visa Card", null)).toBe(null);
});
