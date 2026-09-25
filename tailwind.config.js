// Colours come from the design tokens in src/theme.css (light values on :root, dark values on .dark).
// Components use these names (bg-surface, text-fg, border-line, bg-brand/10 ...), never raw hex.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
        fontFamily: {
        inter: ['Inter', 'sans-serif'],
          playfair: ['"Playfair Display"', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        app: token("app"),
        surface: token("surface"),
        subtle: token("subtle"),
        elevated: token("elevated"),
        hover: token("hover"),
        active: token("active"),
        fg: { DEFAULT: token("fg"), strong: token("fg-strong"), secondary: token("fg-secondary"), muted: token("fg-muted") },
        "on-brand": token("fg-on-brand"),
        line: { DEFAULT: token("border"), strong: token("border-strong") },
        brand: { DEFAULT: token("brand"), hover: token("brand-hover"), fg: token("brand-fg") },
        success: { DEFAULT: token("success"), solid: token("success-solid") },
        warning: { DEFAULT: token("warning"), solid: token("warning-solid") },
        error: { DEFAULT: token("error"), solid: token("error-solid") },
        info: { DEFAULT: token("info"), solid: token("info-solid") },
        plum: { DEFAULT: token("violet"), solid: token("violet-solid") },
        "neutral-solid": token("neutral-solid"),
        backdrop: "rgb(var(--overlay) / var(--overlay-alpha))",
      },
      boxShadow: {
        elevated: "var(--shadow-elevated)",
      },
    },
  },
  plugins: [],
}
