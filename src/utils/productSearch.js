// Products matching typed text (name or code, any case); active only; ones that start with the text first.
export const filterProducts = (products, query, limit = 8) => {
  const q = (query || "").trim().toLowerCase();
  const active = (products || []).filter((p) => p.isActive !== false);
  if (!q) return active.slice(0, limit);
  const scored = [];
  for (const p of active) {
    const name = (p.productName || "").toLowerCase();
    const code = (p.productCode || "").toLowerCase();
    if (!name.includes(q) && !code.includes(q)) continue;
    scored.push({ p, rank: name.startsWith(q) || code.startsWith(q) ? 0 : 1 });
  }
  return scored.sort((a, b) => a.rank - b.rank).slice(0, limit).map((s) => s.p);
};
