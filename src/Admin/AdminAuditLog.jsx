import React, { useCallback, useEffect, useState } from "react";
import { friendlyError } from "../utils/friendlyError";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileClock,
  KeyRound,
  LogIn,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import axiosInstance from "../services/api";
import { getRoleName } from "../utils/auth";
import { logExport } from "../services/auditLog";

const PAGE_SIZE = 50;

const ACTION_LABELS = {
  CREATE: "Added",
  UPDATE: "Changed",
  DELETE: "Deleted",
  BULK_UPDATE: "Bulk change",
  BULK_DELETE: "Bulk delete",
  LOGIN: "Logged in",
  LOGIN_FAILED: "Failed login",
  LOGIN_BLOCKED: "Login blocked",
  LOGOUT: "Logged out",
  EXPORT: "Exported",
  SYSTEM: "System",
};

const ACTION_STYLES = {
  CREATE: "bg-success/10 text-success border-success/30",
  UPDATE: "bg-brand/10 text-brand-fg border-brand/20",
  DELETE: "bg-error/10 text-error border-error/30",
  BULK_UPDATE: "bg-brand/10 text-brand-fg border-brand/20",
  BULK_DELETE: "bg-error/10 text-error border-error/30",
  LOGIN: "bg-hover text-fg border-line",
  LOGIN_FAILED: "bg-error/10 text-error border-error/30",
  LOGIN_BLOCKED: "bg-error/10 text-error border-error/30",
  LOGOUT: "bg-hover text-fg border-line",
  EXPORT: "bg-plum/10 text-plum border-plum/30",
  SYSTEM: "bg-warning/10 text-warning border-warning/30",
};

const MODULE_LABELS = {
  ACCOUNTS: "Accounts & logins",
  ADMIN: "Admin",
  FINANCE: "Finance",
  MANAGER: "Manager",
  MIS: "MIS",
  NOTIFICATION: "Notifications",
  POS: "POS",
  STOREKEEPER: "Storekeeper",
  WASTAGE: "Wastage",
  PRODUCTION: "Production (kitchen/bakery)",
  AUDIT: "Audit log",
  OTHER: "Other",
};

// "RawMaterial" -> "Raw material", "unitCost" -> "Unit cost"
const humanize = (s) => {
  if (!s) return "";
  if (s === "AuthModel") return "User account";
  const t = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase().trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const moduleLabel = (m) => MODULE_LABELS[m] || humanize(m);

const when = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
};

const isoDay = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
};

function ActionBadge({ action }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[12px] font-[600] whitespace-nowrap ${ACTION_STYLES[action] || ""}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function Who({ row }) {
  if (row.username === "SYSTEM") return <span className="text-fg-secondary italic">System</span>;
  if (row.username === "ANONYMOUS") return <span className="text-error font-[600]">Not logged in</span>;
  return (
    <div className="leading-tight">
      <div className="font-[600] text-fg-strong">{row.userFullName || row.username}</div>
      <div className="text-[12px] text-fg-secondary">
        {row.userFullName ? `${row.username} · ` : ""}
        {row.roleId ? getRoleName(row.roleId) : ""}
      </div>
    </div>
  );
}

function RecordRef({ row }) {
  if (!row.entityType) return <span className="text-fg-muted">—</span>;
  return (
    <div className="leading-tight">
      <div className="text-fg">{humanize(row.entityType)}{row.entityId ? ` #${row.entityId.length > 12 ? row.entityId.slice(0, 8) + "…" : row.entityId}` : ""}</div>
      {row.entityLabel && <div className="text-[12px] text-fg-secondary">{row.entityLabel}</div>}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="bg-surface rounded-xl border border-line shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${tone}`}><Icon size={20} /></div>
      <div>
        <div className="text-[22px] font-[700] text-fg-strong">{value ?? "—"}</div>
        <div className="text-[12px] text-fg-secondary">{label}</div>
      </div>
    </div>
  );
}

function AuditTable({ rows, onOpen, emptyText }) {
  if (!rows.length) {
    return <div className="bg-surface rounded-xl border border-line p-10 text-center text-[14px] text-fg-secondary">{emptyText}</div>;
  }
  return (
    <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="bg-subtle text-fg-secondary text-[12px] uppercase">
          <tr>
            <th className="text-left px-4 py-3 font-[600]">When</th>
            <th className="text-left px-4 py-3 font-[600]">Who</th>
            <th className="text-left px-4 py-3 font-[600]">What</th>
            <th className="text-left px-4 py-3 font-[600]">Record</th>
            <th className="text-left px-4 py-3 font-[600]">Details</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-t border-line hover:bg-subtle ${(r.action === "LOGIN_FAILED" || r.action === "LOGIN_BLOCKED") ? "bg-error/10" : ""}`}>
              <td className="px-4 py-3 whitespace-nowrap text-fg">{when(r.occurredAt)}</td>
              <td className="px-4 py-3"><Who row={r} /></td>
              <td className="px-4 py-3">
                <ActionBadge action={r.action} />
                <div className="text-[12px] text-fg-secondary mt-1">{moduleLabel(r.module)}</div>
              </td>
              <td className="px-4 py-3"><RecordRef row={r} /></td>
              <td className="px-4 py-3 text-fg max-w-[420px]">
                <div className="line-clamp-2">{r.summary}</div>
                {r.operation && r.module !== "ACCOUNTS" && <div className="text-[12px] text-fg-muted mt-0.5">Screen action: {r.operation}</div>}
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onOpen(r)} className="inline-flex items-center gap-1 text-brand-fg hover:underline text-[13px] font-[600]">
                  <Eye size={14} /> View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pager({ page, totalPages, total, onPage }) {
  if (!total) return null;
  return (
    <div className="flex items-center justify-between mt-3 text-[13px] text-fg-secondary">
      <span>{total.toLocaleString()} entr{total === 1 ? "y" : "ies"}</span>
      <div className="flex items-center gap-2">
        <button aria-label="Previous" disabled={page <= 0} onClick={() => onPage(page - 1)} className="p-1.5 rounded border border-line-strong bg-surface disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        <button aria-label="Next" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)} className="p-1.5 rounded border border-line-strong bg-surface disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function DetailModal({ row, onClose, onHistory }) {
  if (!row) return null;
  const meta = [
    ["When", when(row.occurredAt)],
    ["User", row.username === "SYSTEM" ? "System (automatic)" : row.username === "ANONYMOUS" ? "Not logged in" : `${row.userFullName || ""} (${row.username})`],
    ["Role", row.roleId ? getRoleName(row.roleId) : "—"],
    ["Outlet / production centre", [row.outletId && `Outlet #${row.outletId}`, row.productionCenterId && `Centre #${row.productionCenterId}`].filter(Boolean).join(", ") || "—"],
    ["Module", moduleLabel(row.module)],
    ["Screen action", row.operation || "—"],
    ["Request", row.httpMethod ? `${row.httpMethod} ${row.endpoint}` : "—"],
    ["IP address", row.ipAddress || "—"],
    ["Browser / device", row.userAgent || "—"],
    ["Request id", row.requestId || "—"],
  ];
  return (
    <div className="fixed inset-0 bg-backdrop z-[100000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-elevated rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1"><ActionBadge action={row.action} /><span className="text-[12px] text-fg-secondary">Entry #{row.id}</span></div>
            <h2 className="text-[16px] font-[700] text-fg-strong">{row.summary}</h2>
          </div>
          <button aria-label="Close" onClick={onClose} className="p-1 text-fg-secondary hover:text-fg-strong"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            {meta.map(([k, v]) => (
              <div key={k} className="flex gap-2 min-w-0">
                <dt className="text-fg-secondary whitespace-nowrap">{k}:</dt>
                <dd className="text-fg-strong break-all">{v}</dd>
              </div>
            ))}
          </dl>

          {row.changes?.length > 0 && (
            <div>
              <h3 className="text-[14px] font-[700] text-fg-strong mb-2">
                {row.action === "CREATE" ? "Values when added" : row.action === "DELETE" ? "Values when deleted" : "What changed"}
              </h3>
              <div className="border border-line rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-subtle text-fg-secondary text-[12px]">
                    <tr>
                      <th className="text-left px-3 py-2 font-[600]">Field</th>
                      {row.action !== "CREATE" && <th className="text-left px-3 py-2 font-[600]">Before</th>}
                      {row.action !== "DELETE" && <th className="text-left px-3 py-2 font-[600]">After</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {row.changes.map((c) => (
                      <tr key={c.field} className="border-t border-line">
                        <td className="px-3 py-2 text-fg font-[600]">{humanize(c.field)}</td>
                        {row.action !== "CREATE" && <td className="px-3 py-2 text-error break-all">{c.old ?? <span className="text-fg-muted">empty</span>}</td>}
                        {row.action !== "DELETE" && <td className="px-3 py-2 text-success break-all">{c.new ?? <span className="text-fg-muted">empty</span>}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {row.changes.some((c) => c.old === "******" || c.new === "******") && (
                <p className="text-[12px] text-fg-secondary mt-2">Passwords and security codes are never stored; ****** only shows that they changed.</p>
              )}
            </div>
          )}

          {row.entityType && row.entityId && (
            <button
              onClick={() => onHistory(row.entityType, row.entityId)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-line-strong rounded-lg text-[14px] text-fg hover:bg-subtle"
            >
              <FileClock size={16} /> Full history of this {humanize(row.entityType).toLowerCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLog() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState("activity");
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({ usernames: [], modules: [], entityTypes: [], actions: [] });

  const [filters, setFilters] = useState({ from: daysAgo(7), to: isoDay(new Date()), username: "", module: "", action: "", entityType: "", q: "" });
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const [historyKey, setHistoryKey] = useState({ entityType: "", entityId: "" });
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(0);
  };

  // What each tab adds on top of the shared filters.
  const tabParams = useCallback(() => {
    const p = { ...filters };
    if (tab === "security") p.module = "ACCOUNTS";
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "" && v !== null && v !== undefined));
  }, [filters, tab]);

  const loadMeta = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([
        axiosInstance.get("/api/v1/audit/summary"),
        axiosInstance.get("/api/v1/audit/filters"),
      ]);
      setSummary(s.data);
      setOptions(f.data);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Could not load the audit log" }));
    }
  }, []);

  const loadPage = useCallback(async () => {
    if (tab === "history" || (tab === "user" && !filters.username)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/api/v1/audit/logs", { params: { ...tabParams(), page, size: PAGE_SIZE } });
      setResult(res.data);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Could not load the audit log" }));
      setResult({ content: [], totalElements: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [tab, filters.username, tabParams, page]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadPage(); }, [loadPage]);

  const refresh = () => { loadMeta(); loadPage(); if (tab === "history") loadHistory(); };

  const loadHistory = async (type = historyKey.entityType, id = historyKey.entityId) => {
    if (!type || !String(id).trim()) return;
    setHistoryLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/api/v1/audit/history", { params: { entityType: type, entityId: String(id).trim() } });
      setHistoryRows(res.data || []);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Could not load the record history" }));
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = (entityType, entityId) => {
    setSelected(null);
    setHistoryKey({ entityType, entityId });
    setTab("history");
    loadHistory(entityType, entityId);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = tabParams();
      const all = [];
      for (let p = 0; p < 50; p++) {
        const res = await axiosInstance.get("/api/v1/audit/logs", { params: { ...params, page: p, size: 200 } });
        all.push(...(res.data.content || []));
        if (p + 1 >= res.data.totalPages) break;
      }
      const header = ["When", "Username", "Name", "Role", "Module", "Action", "Record type", "Record id", "Record", "Summary", "Changes", "Screen action", "IP address"];
      const rows = all.map((r) => [
        r.occurredAt, r.username, r.userFullName || "", r.roleId ? getRoleName(r.roleId) : "", moduleLabel(r.module),
        ACTION_LABELS[r.action] || r.action, humanize(r.entityType), r.entityId || "", r.entityLabel || "", r.summary,
        (r.changes || []).map((c) => `${c.field}: ${c.old ?? ""} -> ${c.new ?? ""}`).join("; "), r.operation || "", r.ipAddress || "",
      ]);
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${filters.from || "start"}-to-${filters.to || "today"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      logExport("AUDIT", `Exported ${all.length} audit log entries (${filters.from || "start"} to ${filters.to || "today"}) as CSV`);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Export failed" }));
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { id: "activity", label: "All Activity", icon: Activity },
    { id: "security", label: "Logins & Security", icon: KeyRound },
    { id: "user", label: "By User", icon: UserRound },
    { id: "history", label: "Record History", icon: FileClock },
  ];

  const input = "px-3 py-2 border border-line-strong rounded-lg text-[14px] bg-surface";

  return (
    <div className="flex bg-app h-screen overflow-hidden relative font-sans">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Audit Log" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[700] text-fg-strong mb-1">Audit Log</h1>
              <p className="text-[14px] text-fg-secondary">
                Who added, changed or deleted what, and when. Entries are kept permanently and cannot be edited or removed.
              </p>
            </div>
            <button onClick={refresh} className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-surface border border-line-strong rounded-lg text-[14px] text-fg hover:bg-subtle">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <Stat label="Changes today" value={summary?.changesToday} icon={Activity} tone="bg-brand/10 text-brand-fg" />
            <Stat label="Logins today" value={summary?.loginsToday} icon={LogIn} tone="bg-hover text-fg-secondary" />
            <Stat label="Failed logins today" value={summary?.failedLoginsToday} icon={ShieldAlert} tone={summary?.failedLoginsToday ? "bg-error/10 text-error" : "bg-hover text-fg-secondary"} />
            <Stat label="Active users today" value={summary?.activeUsersToday} icon={Users} tone="bg-success/10 text-success" />
            <Stat label="Exports today" value={summary?.exportsToday} icon={Download} tone="bg-plum/10 text-plum" />
          </div>

          <div className="flex gap-2 mb-4 border-b border-line overflow-x-auto overflow-y-hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPage(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-[600] border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id ? "border-brand-fg text-brand-fg" : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-[14px] text-error">{error}</div>}

          {tab === "history" ? (
            <>
              <div className="bg-surface rounded-xl shadow-sm border border-line p-4 mb-4 flex flex-col md:flex-row gap-3">
                <select className={input} value={historyKey.entityType} onChange={(e) => setHistoryKey((k) => ({ ...k, entityType: e.target.value }))}>
                  <option value="">Choose record type…</option>
                  {options.entityTypes.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
                </select>
                <input className={`${input} flex-1`} placeholder="Record id (e.g. 12)" value={historyKey.entityId}
                  onChange={(e) => setHistoryKey((k) => ({ ...k, entityId: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && loadHistory()} />
                <button onClick={() => loadHistory()} disabled={!historyKey.entityType || !historyKey.entityId}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg text-[14px] font-[600] disabled:opacity-50">
                  <Search size={16} /> Show history
                </button>
              </div>
              {historyLoading ? <Loader variant="section" text="Loading history..." /> : (
                <AuditTable rows={historyRows} onOpen={setSelected}
                  emptyText={historyKey.entityType && historyKey.entityId ? "No audit entries for this record." : "Choose a record type and id to see who created it and every change since."} />
              )}
            </>
          ) : (
            <>
              <div className="bg-surface rounded-xl shadow-sm border border-line p-4 mb-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={18} />
                    <input type="text" placeholder="Search description, user or record name…"
                      className="w-full pl-10 pr-4 py-2 border border-line-strong rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-brand-fg"
                      value={filters.q} onChange={(e) => set("q", e.target.value)} />
                  </div>
                  <label className="flex items-center gap-2 text-[13px] text-fg-secondary">From
                    <input type="date" className={input} value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-fg-secondary">To
                    <input type="date" className={input} value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select className={input} value={filters.username} onChange={(e) => set("username", e.target.value)}>
                    <option value="">{tab === "user" ? "Choose a user…" : "All users"}</option>
                    {options.usernames.map((u) => <option key={u} value={u}>{u === "SYSTEM" ? "System (automatic)" : u === "ANONYMOUS" ? "Not logged in" : u}</option>)}
                  </select>
                  {tab !== "security" && (
                    <select className={input} value={filters.module} onChange={(e) => set("module", e.target.value)}>
                      <option value="">All modules</option>
                      {options.modules.map((m) => <option key={m} value={m}>{moduleLabel(m)}</option>)}
                    </select>
                  )}
                  <select className={input} value={filters.action} onChange={(e) => set("action", e.target.value)}>
                    <option value="">All actions</option>
                    {(tab === "security" ? ["LOGIN", "LOGIN_FAILED", "LOGIN_BLOCKED", "LOGOUT"] : options.actions).map((a) => (
                      <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
                    ))}
                  </select>
                  {tab !== "security" && (
                    <select className={input} value={filters.entityType} onChange={(e) => set("entityType", e.target.value)}>
                      <option value="">All record types</option>
                      {options.entityTypes.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
                    </select>
                  )}
                  <button onClick={exportCsv} disabled={exporting || !result.totalElements}
                    className="ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-line-strong rounded-lg text-[14px] text-fg hover:bg-subtle disabled:opacity-50 whitespace-nowrap">
                    {exporting ? <Loader variant="inline" /> : <><Download size={16} /> Export CSV</>}
                  </button>
                </div>
              </div>

              {tab === "user" && !filters.username ? (
                <div className="bg-surface rounded-xl border border-line p-10 text-center text-[14px] text-fg-secondary">
                  Choose a user to see everything they did in the selected dates.
                </div>
              ) : loading ? (
                <Loader variant="section" text="Loading audit log..." />
              ) : (
                <>
                  <AuditTable rows={result.content} onOpen={setSelected} emptyText="No audit entries match these filters." />
                  <Pager page={page} totalPages={result.totalPages} total={result.totalElements} onPage={setPage} />
                </>
              )}
            </>
          )}
        </main>
      </div>

      <DetailModal row={selected} onClose={() => setSelected(null)} onHistory={openHistory} />
    </div>
  );
}
