/**
 * Uber / PickMe prices (owner 12 Nov). Same rule as the server (SaleServiceImpl.shelfPrice): on an Uber / PickMe bill a
 * product sells at its Uber / PickMe price; none set (empty or 0) = the normal price.
 */

/** 'UBER' / 'PICKME' when a payment method name, category or order channel names the app; else null. */
export function appChannel(...hints) {
  for (const h of hints) {
    const n = String(h || "").toLowerCase().replace(/[^a-z]/g, "");
    if (n.includes("uber")) return "UBER";
    if (n.includes("pickme") || n.includes("picme")) return "PICKME";
  }
  return null;
}

/** The product's price on this bill: its app price on an Uber / PickMe bill, else `base` (the normal price). */
export function appPrice(product, channel, base) {
  const v = channel === "UBER" ? product?.uberPrice : channel === "PICKME" ? product?.pickmePrice : null;
  return Number(v) > 0 ? Number(v) : base;
}
