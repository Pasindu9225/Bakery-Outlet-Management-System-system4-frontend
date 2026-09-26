// The payment method selected when a bill opens: Cash (most sales), else the first available.
export const defaultPaymentMethodName = (methods) => {
  const list = Array.isArray(methods) ? methods : [];
  const cash = list.find((m) => (m.name || "").trim().toLowerCase() === "cash");
  return (cash || list[0] || {}).name || "";
};
