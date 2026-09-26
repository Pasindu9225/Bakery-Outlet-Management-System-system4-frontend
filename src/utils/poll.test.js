import { pollWhileVisible } from "./poll";

const setHidden = (hidden) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(() => { jest.useFakeTimers(); setHidden(false); });
afterEach(() => jest.useRealTimers());

test("calls on every interval while the tab is visible", () => {
  const fn = jest.fn();
  const stop = pollWhileVisible(fn, 1000);
  jest.advanceTimersByTime(3000);
  expect(fn).toHaveBeenCalledTimes(3);
  stop();
  jest.advanceTimersByTime(3000);
  expect(fn).toHaveBeenCalledTimes(3);
});

test("does not start a new call while the previous one is still running", async () => {
  let finish;
  const fn = jest.fn(() => new Promise((r) => { finish = r; }));
  const stop = pollWhileVisible(fn, 1000);
  jest.advanceTimersByTime(3000);
  expect(fn).toHaveBeenCalledTimes(1);
  finish();
  await Promise.resolve(); await Promise.resolve();
  jest.advanceTimersByTime(1000);
  expect(fn).toHaveBeenCalledTimes(2);
  stop();
});

test("pauses while hidden and catches up once when shown again", () => {
  const fn = jest.fn();
  const stop = pollWhileVisible(fn, 1000);
  setHidden(true);
  jest.advanceTimersByTime(5000);
  expect(fn).toHaveBeenCalledTimes(0);
  setHidden(false);
  expect(fn).toHaveBeenCalledTimes(1);
  stop();
});

test("showing the tab again does not call if nothing was skipped", () => {
  const fn = jest.fn();
  const stop = pollWhileVisible(fn, 60000);
  setHidden(true);
  setHidden(false);
  expect(fn).toHaveBeenCalledTimes(0);
  stop();
  setHidden(true);
  jest.advanceTimersByTime(120000);
  setHidden(false);
  expect(fn).toHaveBeenCalledTimes(0);
});
