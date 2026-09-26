import { applySidebarPref, toggleSidebar, isSidebarCollapsed } from "./sidebarPref";

beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.sidebar; });

test("menu starts expanded", () => {
  applySidebarPref();
  expect(isSidebarCollapsed()).toBe(false);
  expect(document.documentElement.dataset.sidebar).toBe("expanded");
});

test("toggle collapses, remembers, and expands again", () => {
  expect(toggleSidebar()).toBe(true);
  expect(document.documentElement.dataset.sidebar).toBe("collapsed");
  expect(localStorage.getItem("bms-sidebar")).toBe("collapsed");
  delete document.documentElement.dataset.sidebar;
  applySidebarPref(); // e.g. next page load
  expect(isSidebarCollapsed()).toBe(true);
  expect(toggleSidebar()).toBe(false);
  expect(localStorage.getItem("bms-sidebar")).toBe("expanded");
});
