// Collapsed / expanded side menu, remembered per device. CSS in index.css reads <html data-sidebar>.
const KEY = "bms-sidebar";

const read = () => {
  try { return localStorage.getItem(KEY) === "collapsed"; } catch { return false; }
};

export const isSidebarCollapsed = () => document.documentElement.dataset.sidebar === "collapsed";

export const applySidebarPref = () => {
  document.documentElement.dataset.sidebar = read() ? "collapsed" : "expanded";
};

export const toggleSidebar = () => {
  const collapsed = !isSidebarCollapsed();
  document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "expanded";
  try { localStorage.setItem(KEY, collapsed ? "collapsed" : "expanded"); } catch { /* private mode: still works this visit */ }
  return collapsed;
};
