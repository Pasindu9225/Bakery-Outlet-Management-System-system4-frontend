import React, { useCallback, useEffect, useState } from "react";
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
  CREATE: "bg-green-50 text-green-700 border-green-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  BULK_UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  BULK_DELETE: "bg-red-50 text-red-700 border-red-200",
  LOGIN: "bg-gray-100 text-gray-700 border-gray-200",
  LOGIN_FAILED: "bg-red-100 text-red-800 border-red-300",
  LOGIN_BLOCKED: "bg-red-100 text-red-800 border-red-300",
  LOGOUT: "bg-gray-100 text-gray-700 border-gray-200",
  EXPORT: "bg-purple-50 text-purple-700 border-purple-200",
  SYSTEM: "bg-amber-50 text-amber-700 border-amber-200",
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-[600] whitespace-nowrap ${ACTION_STYLES[action] || ""}`}>
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function Who({ row }) {
  if (row.username === "SYSTEM") return <span className="text-[#667085] italic">System</span>;
  if (row.username === "ANONYMOUS") return <span className="text-red-600 font-[600]">Not logged in</span>;
  return (
    <div className="leading-tight">
      <div className="font-[600] text-[#1D2939]">{row.userFullName || row.username}</div>
      <div className="text-[11px] text-[#667085]">
        {row.userFullName ? `${row.username} · ` : ""}
        {row.roleId ? getRoleName(row.roleId) : ""}
      </div>
    </div>
  );
}

function RecordRef({ row }) {
  if (!row.entityType) return <span className="text-[#98A2B3]">—</span>;
  return (
    <div className="leading-tight">
      <div className="text-[#344054]">{humanize(row.entityType)}{row.entityId ? ` #${row.entityId.length > 12 ? row.entityId.slice(0, 8) + "…" : row.entityId}` : ""}</div>
      {row.entityLabel && <div className="text-[11px] text-[#667085]">{row.entityLabel}</div>}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4E6EA] shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${tone}`}><Icon size={20} /></div>
      <div>
        <div className="text-[22px] font-[700] text-[#1D2939]">{value ?? "—"}</div>
        <div className="text-[12px] text-[#667085]">{label}</div>
      </div>
    </div>
  );
}

function AuditTable({ rows, onOpen, emptyText }) {
  if (!rows.length) {
    return <div className="bg-white rounded-xl border border-[#E4E6EA] p-10 text-center text-[14px] text-[#667085]">{emptyText}</div>;
  }
  return (
    <div className="bg-white rounded-xl border border-[#E4E6EA] shadow-sm overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="bg-[#F9FAFB] text-[#667085] text-[12px] uppercase">
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
            <tr key={r.id} className={`border-t border-[#F2F4F7] hover:bg-[#F9FAFB] ${(r.action === "LOGIN_FAILED" || r.action === "LOGIN_BLOCKED") ? "bg-red-50/40" : ""}`}>
              <td className="px-4 py-3 whitespace-nowrap text-[#344054]">{when(r.occurredAt)}</td>
              <td className="px-4 py-3"><Who row={r} /></td>
              <td className="px-4 py-3">
                <ActionBadge action={r.action} />
                <div className="text-[11px] text-[#667085] mt-1">{moduleLabel(r.module)}</div>
              </td>
              <td className="px-4 py-3"><RecordRef row={r} /></td>
              <td className="px-4 py-3 text-[#344054] max-w-[420px]">
                <div className="line-clamp-2">{r.summary}</div>
                {r.operation && r.module !== "ACCOUNTS" && <div className="text-[11px] text-[#98A2B3] mt-0.5">Screen action: {r.operation}</div>}
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onOpen(r)} className="inline-flex items-center gap-1 text-[#0F50AA] hover:underline text-[13px] font-[600]">
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
    <div className="flex items-center justify-between mt-3 text-[13px] text-[#667085]">
      <span>{total.toLocaleString()} entr{total === 1 ? "y" : "ies"}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 0} onClick={() => onPage(page - 1)} className="p-1.5 rounded border border-[#D0D5DD] bg-white disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        <button disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)} className="p-1.5 rounded border border-[#D0D5DD] bg-white disabled:opacity-40"><ChevronRight size={16} /></button>
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
    <div className="fixed inset-0 bg-black/40 z-[100000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-[#E4E6EA]">
          <div>
            <div className="flex items-center gap-2 mb-1"><ActionBadge action={row.action} /><span className="text-[12px] text-[#667085]">Entry #{row.id}</span></div>
            <h2 className="text-[16px] font-[700] text-[#1D2939]">{row.summary}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#667085] hover:text-[#1D2939]"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
            {meta.map(([k, v]) => (
              <div key={k} className="flex gap-2 min-w-0">
                <dt className="text-[#667085] whitespace-nowrap">{k}:</dt>
                <dd className="text-[#1D2939] break-all">{v}</dd>
              </div>
            ))}
          </dl>

          {row.changes?.length > 0 && (
            <div>
              <h3 className="text-[14px] font-[700] text-[#1D2939] mb-2">
                {row.action === "CREATE" ? "Values when added" : row.action === "DELETE" ? "Values when deleted" : "What changed"}
              </h3>
              <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#F9FAFB] text-[#667085] text-[12px]">
                    <tr>
                      <th className="text-left px-3 py-2 font-[600]">Field</th>
                      {row.action !== "CREATE" && <th className="text-left px-3 py-2 font-[600]">Before</th>}
                      {row.action !== "DELETE" && <th className="text-left px-3 py-2 font-[600]">After</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {row.changes.map((c) => (
                      <tr key={c.field} className="border-t border-[#F2F4F7]">
                        <td className="px-3 py-2 text-[#344054] font-[600]">{humanize(c.field)}</td>
                        {row.action !== "CREATE" && <td className="px-3 py-2 text-red-700 break-all">{c.old ?? <span className="text-[#98A2B3]">empty</span>}</td>}
                        {row.action !== "DELETE" && <td className="px-3 py-2 text-green-700 break-all">{c.new ?? <span className="text-[#98A2B3]">empty</span>}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {row.changes.some((c) => c.old === "******" || c.new === "******") && (
                <p className="text-[12px] text-[#667085] mt-2">Passwords and security codes are never stored; ****** only shows that they changed.</p>
              )}
            </div>
          )}

          {row.entityType && row.entityId && (
            <button
              onClick={() => onHistory(row.entityType, row.entityId)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] rounded-lg text-[14px] text-[#344054] hover:bg-gray-50"
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
      setError(err.response?.data?.message || err.message || "Could not load the audit log");
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
      setError(err.response?.data?.message || err.message || "Could not load the audit log");
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
      setError(err.response?.data?.message || err.message || "Could not load the record history");
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
      setError(err.response?.data?.message || err.message || "Export failed");
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

  const input = "px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white";

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden relative font-sans">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Audit Log" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[700] text-[#1D2939] mb-1">Audit Log</h1>
              <p className="text-[14px] text-[#667085]">
                Who added, changed or deleted what, and when. Entries are kept permanently and cannot be edited or removed.
              </p>
            </div>
            <button onClick={refresh} className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-[14px] text-[#344054] hover:bg-gray-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <Stat label="Changes today" value={summary?.changesToday} icon={Activity} tone="bg-blue-50 text-blue-600" />
            <Stat label="Logins today" value={summary?.loginsToday} icon={LogIn} tone="bg-gray-100 text-gray-600" />
            <Stat label="Failed logins today" value={summary?.failedLoginsToday} icon={ShieldAlert} tone={summary?.failedLoginsToday ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"} />
            <Stat label="Active users today" value={summary?.activeUsersToday} icon={Users} tone="bg-green-50 text-green-600" />
            <Stat label="Exports today" value={summary?.exportsToday} icon={Download} tone="bg-purple-50 text-purple-600" />
          </div>

          <div className="flex gap-2 mb-4 border-b border-[#E4E6EA] overflow-x-auto overflow-y-hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPage(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-[600] border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id ? "border-[#0F50AA] text-[#0F50AA]" : "border-transparent text-[#667085] hover:text-[#344054]"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[14px] text-red-700">{error}</div>}

          {tab === "history" ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-4 mb-4 flex flex-col md:flex-row gap-3">
                <select className={input} value={historyKey.entityType} onChange={(e) => setHistoryKey((k) => ({ ...k, entityType: e.target.value }))}>
                  <option value="">Choose record type…</option>
                  {options.entityTypes.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
                </select>
                <input className={`${input} flex-1`} placeholder="Record id (e.g. 12)" value={historyKey.entityId}
                  onChange={(e) => setHistoryKey((k) => ({ ...k, entityId: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && loadHistory()} />
                <button onClick={() => loadHistory()} disabled={!historyKey.entityType || !historyKey.entityId}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0F50AA] text-white rounded-lg text-[14px] font-[600] disabled:opacity-50">
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
              <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-4 mb-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={18} />
                    <input type="text" placeholder="Search description, user or record name…"
                      className="w-full pl-10 pr-4 py-2 border border-[#D0D5DD] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-blue-100"
                      value={filters.q} onChange={(e) => set("q", e.target.value)} />
                  </div>
                  <label className="flex items-center gap-2 text-[13px] text-[#667085]">From
                    <input type="date" className={input} value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-[#667085]">To
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
                    className="ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-[14px] text-[#344054] hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
                    {exporting ? <Loader variant="inline" /> : <><Download size={16} /> Export CSV</>}
                  </button>
                </div>
              </div>

              {tab === "user" && !filters.username ? (
                <div className="bg-white rounded-xl border border-[#E4E6EA] p-10 text-center text-[14px] text-[#667085]">
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
