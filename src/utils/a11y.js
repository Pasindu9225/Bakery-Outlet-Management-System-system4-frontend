// Keyboard support for clickable cards/rows: Enter or Space on the element acts like a click.
// Keys pressed on a button or field inside it are left to that control.
export const onEnterClick = (e) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.currentTarget.click();
  }
};
