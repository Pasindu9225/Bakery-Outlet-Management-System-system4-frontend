import { act } from "react-dom/test-utils";
import { confirmDialog } from "./ConfirmDialog";

global.IS_REACT_ACT_ENVIRONMENT = true;

const open = async (msg, opts) => {
  let result;
  await act(async () => { result = confirmDialog(msg, opts); });
  return { p: result }; // wrapped: returning the promise itself would wait for it
};
const button = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent === text);

test("shows the message and resolves true on confirm", async () => {
  const { p } = await open("Delete this item?", { confirmText: "Delete" });
  expect(document.body.textContent).toContain("Delete this item?");
  await act(async () => button("Delete").click());
  await expect(p).resolves.toBe(true);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("resolves false on cancel", async () => {
  const { p } = await open("Sure?");
  await act(async () => button("Cancel").click());
  await expect(p).resolves.toBe(false);
});

test("Escape cancels", async () => {
  const { p } = await open("Sure?");
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await expect(p).resolves.toBe(false);
});
