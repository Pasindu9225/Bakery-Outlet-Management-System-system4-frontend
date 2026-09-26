import { friendlyError } from "./friendlyError";

test("no connection becomes a plain instruction", () => {
  expect(friendlyError(new TypeError("Failed to fetch"))).toBe(
    "Can't reach the server. Check the internet connection, then try again.");
  expect(friendlyError({ message: "Network Error", code: "ERR_NETWORK" })).toMatch(/^Can't reach the server/);
});

test("status codes say what happened and what to do", () => {
  expect(friendlyError(new Error("Failed to fetch users: 500"))).toBe(
    "Couldn't fetch users. The server had a problem. Try again in a minute; if it keeps happening, tell your manager.");
  expect(friendlyError(new Error("Failed to load requests (403)"))).toBe(
    "Couldn't load requests. You don't have permission for this. Ask an admin if you need it.");
  expect(friendlyError({ response: { status: 401 } })).toBe("Your session has ended. Please sign in again.");
});

test("a message from the server is kept (it explains the problem)", () => {
  expect(friendlyError({ response: { status: 400, data: { message: "Promo code has expired" } } })).toBe("Promo code has expired");
});

test("context goes in front", () => {
  expect(friendlyError(new TypeError("Failed to fetch"), "Couldn't save the adjustment")).toBe(
    "Couldn't save the adjustment. Can't reach the server. Check the internet connection, then try again.");
});

test("already-plain messages stay; technical junk does not leak", () => {
  expect(friendlyError(new Error("Please select an outlet"))).toBe("Please select an outlet");
  expect(friendlyError(new Error("Unknown error"))).toBe(
    "Something went wrong. Try again; if it keeps happening, tell your manager.");
  expect(friendlyError(new SyntaxError("Unexpected token < in JSON at position 0"))).toBe(
    "Something went wrong. Try again; if it keeps happening, tell your manager.");
  expect(friendlyError(undefined)).toBe("Something went wrong. Try again; if it keeps happening, tell your manager.");
});

test("a fallback message is used only when there is nothing better", () => {
  const fb = { fallback: "Promotion expired or invalid." };
  expect(friendlyError({ response: { status: 400, data: { message: "Promo code has expired" } } }, fb)).toBe("Promo code has expired");
  expect(friendlyError({ response: { status: 400 } }, fb)).toBe("Promotion expired or invalid.");
  expect(friendlyError(new TypeError("Failed to fetch"), fb)).toMatch(/^Can't reach the server/);
  expect(friendlyError(new Error("Request failed with status code 500"), fb)).toBe("Promotion expired or invalid.");
});

test("a one-word fallback like 'Error' is ignored", () => {
  expect(friendlyError(new Error("Unknown error"), { fallback: "Error" })).toBe(
    "Something went wrong. Try again; if it keeps happening, tell your manager.");
});

test("the app's own plain message still wins over a fallback", () => {
  expect(friendlyError(new Error("Please select an outlet"), { fallback: "Failed to save." })).toBe("Please select an outlet");
});

test("a one-word prefix like 'Error' is dropped", () => {
  expect(friendlyError(new TypeError("Failed to fetch"), "Error")).toMatch(/^Can't reach the server/);
});
