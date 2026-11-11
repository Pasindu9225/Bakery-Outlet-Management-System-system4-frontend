import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import axios from "axios";
import OpeningFloatGate from "./OpeningFloatGate";

jest.mock("axios");
global.IS_REACT_ACT_ENVIRONMENT = true;

const show = async (status) => {
  localStorage.setItem("userId", "u1");
  localStorage.setItem("authToken", "t");
  axios.get.mockResolvedValue({ data: status });
  document.body.innerHTML = "";
  const host = document.createElement("div");
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(<OpeningFloatGate />); });
  return document.body.textContent; // the popup is drawn on document.body (portal)
};

test("asks for the opening cash float when the cashier has not declared one today", async () => {
  expect(await show({ opened: false, closed: false })).toContain("Enter Opening Cash Float");
});

test("does not ask once the float is open", async () => {
  expect(await show({ opened: true, closed: false })).not.toContain("Enter Opening Cash Float");
});
