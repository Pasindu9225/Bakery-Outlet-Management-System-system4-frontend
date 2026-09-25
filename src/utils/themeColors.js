// Reads a design token from theme.css at runtime, for libraries that need a colour string
// (chart.js cannot use CSS variables). Call it while rendering; charts should also take
// key={theme} from useTheme() so they redraw when the theme is toggled.
export const themeColor = (name, alpha = 1) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return alpha === 1 ? `rgb(${v})` : `rgb(${v} / ${alpha})`;
};

// Series colours for charts, in order.
export const chartSeries = ["brand-fg", "success", "warning", "error", "info", "violet"];
