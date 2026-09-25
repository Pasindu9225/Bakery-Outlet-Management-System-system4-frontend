// Toasts use the theme tokens so they follow light/dark mode (react-hot-toast styles are inline).
export const toastOptions = {
  style: {
    background: "rgb(var(--elevated))",
    color: "rgb(var(--fg))",
    border: "1px solid rgb(var(--border))",
    boxShadow: "var(--shadow-elevated)",
  },
  success: { iconTheme: { primary: "rgb(var(--success))", secondary: "rgb(var(--elevated))" } },
  error: { iconTheme: { primary: "rgb(var(--error))", secondary: "rgb(var(--elevated))" } },
};
