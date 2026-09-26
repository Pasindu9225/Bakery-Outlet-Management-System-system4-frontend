import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import FieldError from "./FieldError";

global.IS_REACT_ACT_ENVIRONMENT = true;
const render = (ui) => { const h = document.createElement("div"); document.body.appendChild(h); act(() => createRoot(h).render(ui)); return h; };

test("shows the message under the field and announces it", () => {
  const h = render(<FieldError msg="Choose a batch." />);
  expect(h.textContent).toContain("Choose a batch.");
  expect(h.querySelector('[role="alert"]')).not.toBeNull();
});

test("renders nothing when the field is fine", () => {
  expect(render(<FieldError msg="" />).textContent).toBe("");
});
