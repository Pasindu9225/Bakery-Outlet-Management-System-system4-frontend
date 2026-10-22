import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import KitchenProductionRequests from "./KitchenProductionRequests";
import { ThemeProvider } from "../context/ThemeContext";

global.IS_REACT_ACT_ENVIRONMENT = true;

const plan = (status) => ({
  id: 1, planName: "Plan 1", planDate: new Date().toISOString(), status, totalQuantity: 25, producedQuantity: 25,
  items: [{ id: 11, productName: "Fish Roll", quantity: 25, producedQuantity: 25, unitOfMeasure: "Pieces" }],
});

let root, container, calls;
const render = async (status) => {
  calls = [];
  global.fetch = jest.fn(async (url, opts = {}) => {
    calls.push([String(url), opts.method || "GET"]);
    const body = String(url).endsWith("/api/v1/worker/production-requests") ? [plan(status)] : [];
    return { ok: true, status: 200, json: async () => body };
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<ThemeProvider><MemoryRouter><KitchenProductionRequests /></MemoryRouter></ThemeProvider>));
};
const buttons = (text) => [...container.querySelectorAll("button")].filter((b) => b.textContent.trim() === text);

afterEach(() => { act(() => root.unmount()); container.remove(); });

test("a finished kitchen task can be sent to the store, once", async () => {
  await render("COMPLETED");
  expect(buttons("Send to Store")).toHaveLength(1);

  await act(async () => buttons("Send to Store")[0].click());
  expect(calls).toContainEqual([expect.stringMatching(/\/production-requests\/1\/dispatch$/), "POST"]);
  expect(buttons("Send to Store")).toHaveLength(0);
  expect(container.textContent).toContain("Distributed");
});

test("a task already sent to the store offers no Send to Store", async () => {
  await render("DISTRIBUTED");
  expect(buttons("Send to Store")).toHaveLength(0);
  expect(container.textContent).toContain("Distributed");
});
