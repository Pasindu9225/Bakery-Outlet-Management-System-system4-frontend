// Reads a design token from theme.css at runtime, for libraries that need a colour string
// (chart.js cannot use CSS variables). Call it while rendering; charts should also take
// key={theme} from useTheme() so they redraw when the theme is toggled.
export const themeColor = (name, alpha = 1) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return alpha === 1 ? `rgb(${v})` : `rgb(${v} / ${alpha})`;
};

// Series colours for charts, in order.
export const chartSeries = ["brand-fg", "success", "warning", "error", "info", "violet"];

// Colour token for a data category: the fixed one from `known`, otherwise one picked from the
// label so a category keeps the same colour everywhere (chart slice and table chip).
// ponytail: a hash can give two categories the same colour; switch to a stored per-category colour if that matters.
const CATEGORY_PALETTE = ["brand-fg", "success", "warning", "violet", "info", "chart-orange", "chart-cyan", "chart-pink"];
export const categoryToken = (label, known = {}) => {
  if (!label) return "fg-secondary";
  if (known[label]) return known[label];
  let h = 0;
  for (const ch of String(label)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length];
};
