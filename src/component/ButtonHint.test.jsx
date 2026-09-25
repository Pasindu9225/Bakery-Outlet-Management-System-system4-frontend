import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import ButtonHint from "./ButtonHint";

global.IS_REACT_ACT_ENVIRONMENT = true;

const render = (ui) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  act(() => createRoot(host).render(ui));
  return host;
};

test("shows the reason while the button is disabled", () => {
  const host = render(<ButtonHint show>Add a dish first</ButtonHint>);
  expect(host.textContent).toContain("Add a dish first");
});

test("shows nothing once the button can be used", () => {
  const host = render(<ButtonHint show={false}>Add a dish first</ButtonHint>);
  expect(host.textContent).toBe("");
});
