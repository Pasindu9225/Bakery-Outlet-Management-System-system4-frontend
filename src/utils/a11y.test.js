import { onEnterClick } from "./a11y";

const el = () => { const d = document.createElement("div"); document.body.appendChild(d); return d; };

test("Enter and Space on the element itself act like a click", () => {
  const d = el(); let clicks = 0; d.addEventListener("click", () => clicks++);
  for (const key of ["Enter", " "]) {
    const e = { key, target: d, currentTarget: d, preventDefault: jest.fn() };
    onEnterClick(e);
    expect(e.preventDefault).toHaveBeenCalled();
  }
  expect(clicks).toBe(2);
});

test("keys pressed on a button inside the card are left alone (no double action)", () => {
  const d = el(); const inner = document.createElement("button"); d.appendChild(inner);
  let clicks = 0; d.addEventListener("click", () => clicks++);
  onEnterClick({ key: "Enter", target: inner, currentTarget: d, preventDefault() {} });
  expect(clicks).toBe(0);
});

test("other keys do nothing", () => {
  const d = el(); let clicks = 0; d.addEventListener("click", () => clicks++);
  onEnterClick({ key: "a", target: d, currentTarget: d, preventDefault() {} });
  expect(clicks).toBe(0);
});
