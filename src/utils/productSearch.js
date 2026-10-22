// Sinhala names are spelled many ways in English (Seeni / Sini, Sambol / Sumbal): compare with the vowels
// folded together and spaces/punctuation dropped. Only from 4 letters typed, so short text stays exact.
const fold = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/[aeiou]+/g, "a");
export const soundsLike = (text, query) => {
  const q = fold(query);
  return q.length >= 4 && fold(text).includes(q);
};

// Products matching typed text (name or code, any case, or the name spelled differently); active only;
// ones that start with the text first, spelling matches last.
export const filterProducts = (products, query, limit = 8) => {
  const q = (query || "").trim().toLowerCase();
  const active = (products || []).filter((p) => p.isActive !== false);
  if (!q) return active.slice(0, limit);
  const scored = [];
  for (const p of active) {
    const name = (p.productName || "").toLowerCase();
    const code = (p.productCode || "").toLowerCase();
    if (name.includes(q) || code.includes(q)) {
      scored.push({ p, rank: name.startsWith(q) || code.startsWith(q) ? 0 : 1 });
    } else if (soundsLike(name, q)) {
      scored.push({ p, rank: 2 });
    }
  }
  return scored.sort((a, b) => a.rank - b.rank).slice(0, limit).map((s) => s.p);
};
