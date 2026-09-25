import axiosInstance from "./api";

// Page path prefix -> audit module, used when the caller does not name one.
const MODULE_BY_PATH = [
  ["/mis", "MIS"],
  ["/finance", "FINANCE"],
  ["/admin", "ADMIN"],
  ["/pos", "POS"],
  ["/storekeeper", "STOREKEEPER"],
  ["/manager", "MANAGER"],
  ["/bakery", "PRODUCTION"],
  ["/kitchen", "PRODUCTION"],
  ["/worker", "PRODUCTION"],
  ["/mpc", "MPC"],
];

function currentModule() {
  const path = (window.location.pathname || "").toLowerCase();
  const hit = MODULE_BY_PATH.find(([prefix]) => path.startsWith(prefix));
  return hit ? hit[1] : "OTHER";
}

/**
 * Tells the audit log that the logged-in user downloaded or exported something.
 * Fire-and-forget: a failure here must never stop the download itself.
 *
 * @param {string} module  e.g. "FINANCE"; defaults to the module of the current page
 * @param {string} summary e.g. "Exported wastage report 2026-09-01 to 2026-09-24 (CSV)"
 */
export function logExport(module, summary) {
  axiosInstance
    .post("/api/v1/audit/events", { action: "EXPORT", module: module || currentModule(), summary })
    .catch(() => {});
}
