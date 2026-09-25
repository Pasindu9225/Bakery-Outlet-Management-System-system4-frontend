import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Placed between the search bar and the notification bell in every top nav bar.
// Track: neutral in light, brand in dark; the knob is always the surface colour.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex items-center h-8 w-14 rounded-full flex-shrink-0 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: isDark ? "rgb(var(--brand))" : "rgb(var(--border-strong) / 0.6)",
      }}
    >
      <span className="absolute inset-0 flex items-center justify-between px-[7px] pointer-events-none">
        <Sun
          size={13}
          style={{ color: isDark ? "rgb(var(--fg-on-brand))" : "rgb(var(--warning))", opacity: isDark ? 0.5 : 1 }}
          className="transition-opacity duration-300"
        />
        <Moon
          size={13}
          style={{ color: isDark ? "rgb(var(--fg-on-brand))" : "rgb(var(--fg-secondary))", opacity: isDark ? 1 : 0.6 }}
          className="transition-opacity duration-300"
        />
      </span>
      <span
        className="relative inline-block h-6 w-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out"
        style={{
          backgroundColor: isDark ? "rgb(var(--fg-on-brand))" : "rgb(var(--surface))",
          transform: isDark ? "translateX(1.625rem)" : "translateX(0.25rem)",
        }}
      />
    </button>
  );
}
