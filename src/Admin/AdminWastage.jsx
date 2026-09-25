import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  History,
  LayoutDashboard,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import ExpiryTag from "../component/ExpiryTag.jsx";
import axiosInstance from "../services/api";
import { logExport } from "../services/auditLog";

const STAGE_LABELS = {
  MAIN_STORE: "Main Store",
  MINI_STORE: "Kitchen / Bakery Store",
  MPC_STORE: "MPC Store",
  PRODUCTION: "Production",
  ACTUAL_PRODUCTION: "Actual Production",
  IN_TRANSIT: "In Transit",
  POS: "POS Outlet",
};

const SOURCE_LABELS = {
  AUTO_EXPIRY: "Expiry scan",
  MANUAL: "Reported by staff",
  PRODUCTION_BATCH: "Production batch",
  POS_RETURN: "Customer return",
  DAY_END: "Day-end closing",
  OUTLET_RETURN: "Outlet return",
  STOCK_ADJUSTMENT: "Stock adjustment",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  DISMISSED: "bg-gray-100 text-gray-600 border-gray-200",
};

const money = (v) =>
  v === null || v === undefined || v === ""
    ? "—"
    : `Rs. ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const qty = (v, uom) => (v === null || v === undefined ? "—" : `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 })}${uom ? ` ${uom}` : ""}`);

const stageLabel = (s) => STAGE_LABELS[s] || s;

// The location name only adds something when it differs from the module name.
const locationOf = (e) => (e.locationName && e.locationName !== stageLabel(e.stage) ? e.locationName : null);

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-[600] ${STATUS_STYLES[status] || ""}`}>
      {status === "PENDING" ? "Pending" : status === "CONFIRMED" ? "Confirmed" : "Dismissed"}
    </span>
  );
}

function ExpiryNote({ entry }) {
  if (!entry.expiryDate) return null;
  return (
    <span className={`text-[11px] ${entry.daysPastExpiry ? "text-red-600 font-[600]" : "text-[#667085]"}`}>
      Exp {entry.expiryDate}
      {entry.daysPastExpiry ? ` · ${entry.daysPastExpiry} day${entry.daysPastExpiry === 1 ? "" : "s"} ago` : ""}
    </span>
  );
}

export default function AdminWastage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Wastage");
  const [tab, setTab] = useState("overview");

  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stageFilter, setStageFilter] = useState("");
  const [search, setSearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("CONFIRMED");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [watchRows, setWatchRows] = useState([]);
  const [watchDays, setWatchDays] = useState(3);
  const [watchAll, setWatchAll] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [confirmEntry, setConfirmEntry] = useState(null);
  const [dismissEntry, setDismissEntry] = useState(null);

  const [toast, setToast] = useState(null);
  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPending = useCallback(async () => {
    const [s, p] = await Promise.all([
      axiosInstance.get("/api/v1/wastage/admin/summary"),
      axiosInstance.get("/api/v1/wastage/admin/entries", { params: { status: "PENDING" } }),
    ]);
    setSummary(s.data);
    setPending(p.data || []);
  }, []);

  const loadHistory = useCallback(async () => {
    const params = { status: historyStatus };
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    const res = await axiosInstance.get("/api/v1/wastage/admin/entries", { params });
    setHistory(res.data || []);
  }, [historyStatus, fromDate, toDate]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadPending(), loadHistory()]);
    } catch (err) {
      notify(err.message || "Failed to load wastage", "error");
    } finally {
      setLoading(false);
    }
  }, [loadPending, loadHistory]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    axiosInstance
      .get("/api/v1/wastage/reasons")
      .then((res) => setReasons(res.data || []))
      .catch(() => setReasons([]));
  }, []);

  const loadWatch = useCallback(async () => {
    setWatchLoading(true);
    try {
      const res = await axiosInstance.get("/api/v1/wastage/admin/expiry-watch", {
        params: { days: watchDays, includeOk: watchAll },
      });
      setWatchRows(res.data || []);
    } catch (err) {
      notify(err.message || "Failed to load expiry watch", "error");
    } finally {
      setWatchLoading(false);
    }
  }, [watchDays, watchAll]);

  useEffect(() => {
    if (tab === "expiry") loadWatch();
  }, [tab, loadWatch]);

  const runExpiryCheck = async () => {
    setChecking(true);
    try {
      const res = await axiosInstance.post("/api/v1/wastage/admin/expiry-check");
      const created = res.data?.created ?? 0;
      notify(created ? `${created} expired item${created === 1 ? "" : "s"} sent to Pending Review.` : "No new expired stock found.");
      await Promise.all([refresh(), loadWatch()]);
    } catch (err) {
      notify(err.message || "Expiry check failed", "error");
    } finally {
      setChecking(false);
    }
  };

  const matches = useCallback(
    (e) => {
      if (stageFilter && e.stage !== stageFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return [e.itemName, e.locationName, e.entryNo, e.batchRef, e.reportedByName]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    },
    [stageFilter, search]
  );

  const pendingRows = useMemo(() => pending.filter(matches), [pending, matches]);
  const watchVisible = useMemo(() => watchRows.filter(matches), [watchRows, matches]);
  const expiredCount = useMemo(() => watchRows.filter((r) => r.status === "EXPIRED").length, [watchRows]);
  const historyRows = useMemo(() => history.filter(matches), [history, matches]);
  const historyTotal = useMemo(
    () => historyRows.reduce((sum, e) => sum + (Number(e.actualValue) || 0), 0),
    [historyRows]
  );

  const exportCsv = () => {
    const header = ["Entry", "Date", "Stage", "Location", "Item", "Batch", "Qty", "Unit", "Value", "Reason", "Status", "Reported by", "Confirmed by", "Confirmed at", "Admin notes"];
    const rows = historyRows.map((e) => [
      e.entryNo, e.wastageDate, stageLabel(e.stage), e.locationName || "", e.itemName, e.batchRef || "",
      e.actualQty ?? e.qty, e.uom || "", e.actualValue ?? "", e.reasonLabel, e.status,
      e.reportedByName || "", e.confirmedByName || "", e.confirmedAt || "", e.adminNotes || "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wastage-${historyStatus.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logExport("WASTAGE", `Exported ${rows.length} ${historyStatus.toLowerCase()} wastage entries as CSV`);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "expiry", label: "Expiry Watch", icon: CalendarClock },
    { id: "pending", label: "Pending Review", icon: ClipboardList, count: summary?.pendingCount },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden relative font-sans">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection={activeSection} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[22px] font-[700] text-[#1D2939] mb-1">Wastage Management</h1>
              <p className="text-[14px] text-[#667085]">
                Review wastage from every module. Confirmed entries remove the stock and go to reports.
              </p>
            </div>
            <button
              onClick={refresh}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-[14px] text-[#344054] hover:bg-gray-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="flex gap-2 mb-6 border-b border-[#E4E6EA] overflow-x-auto overflow-y-hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-[600] border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id ? "border-[#0F50AA] text-[#0F50AA]" : "border-transparent text-[#667085] hover:text-[#344054]"
                }`}
              >
                <t.icon size={16} /> {t.label}
                {t.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {loading && !summary ? (
            <Loader variant="section" text="Loading wastage..." />
          ) : (
            <>
              {tab === "overview" && <Overview summary={summary} pending={pending} onOpenPending={(stage) => { setStageFilter(stage || ""); setTab("pending"); }} />}

              {tab !== "overview" && (
                <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-4 mb-4 flex flex-col lg:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={18} />
                    <input
                      type="text"
                      placeholder="Search item, location, entry no or batch..."
                      className="w-full pl-10 pr-4 py-2 border border-[#D0D5DD] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-blue-100"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white"
                  >
                    <option value="">All modules</option>
                    {Object.entries(STAGE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  {tab === "expiry" && (
                    <>
                      <select
                        value={watchDays}
                        onChange={(e) => setWatchDays(Number(e.target.value))}
                        className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white"
                        title="Warn this many days before expiry"
                      >
                        {[1, 3, 7, 14].map((d) => (
                          <option key={d} value={d}>Warn {d} day{d === 1 ? "" : "s"} ahead</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-[14px] text-[#344054] px-2">
                        <input type="checkbox" checked={watchAll} onChange={(e) => setWatchAll(e.target.checked)} />
                        Show all dated stock
                      </label>
                      <button
                        onClick={runExpiryCheck}
                        disabled={checking}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-[14px] font-[600] disabled:opacity-50 whitespace-nowrap"
                        title="Send every expired item to Pending Review now (this also runs automatically every night)"
                      >
                        {checking ? <Loader variant="inline" /> : <><AlertTriangle size={16} /> Send expired to review</>}
                      </button>
                    </>
                  )}
                  {tab === "history" && (
                    <>
                      <select
                        value={historyStatus}
                        onChange={(e) => setHistoryStatus(e.target.value)}
                        className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white"
                      >
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="DISMISSED">Dismissed</option>
                      </select>
                      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" title="From" />
                      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" title="To" />
                      <button
                        onClick={exportCsv}
                        disabled={historyRows.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white rounded-lg text-[14px] font-[600] disabled:opacity-50"
                      >
                        <Download size={16} /> Export
                      </button>
                    </>
                  )}
                </div>
              )}

              {tab === "expiry" && (
                <>
                  <p className="text-[13px] text-[#667085] mb-3">
                    {watchLoading ? "Checking stock..." : (
                      <>
                        {watchRows.length} item{watchRows.length === 1 ? "" : "s"} shown
                        {expiredCount > 0 && <> · <span className="text-red-600 font-[600]">{expiredCount} expired</span></>}
                        {" "}· expired stock is sent to Pending Review automatically every night.
                      </>
                    )}
                  </p>
                  <ExpiryTable rows={watchVisible} />
                </>
              )}

              {tab === "pending" && (
                <EntryTable
                  rows={pendingRows}
                  empty="Nothing waiting for review."
                  pending
                  onConfirm={setConfirmEntry}
                  onDismiss={setDismissEntry}
                />
              )}

              {tab === "history" && (
                <>
                  {historyStatus === "CONFIRMED" && (
                    <p className="text-[13px] text-[#667085] mb-3">
                      {historyRows.length} confirmed entr{historyRows.length === 1 ? "y" : "ies"} · total value{" "}
                      <span className="font-[700] text-[#1D2939]">{money(historyTotal)}</span>
                    </p>
                  )}
                  <EntryTable rows={historyRows} empty="No entries for these filters." />
                </>
              )}
            </>
          )}
        </main>
      </div>

      {confirmEntry && (
        <ConfirmModal
          entry={confirmEntry}
          reasons={reasons}
          onClose={() => setConfirmEntry(null)}
          onDone={(msg) => { setConfirmEntry(null); notify(msg); refresh(); }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {dismissEntry && (
        <DismissModal
          entry={dismissEntry}
          onClose={() => setDismissEntry(null)}
          onDone={(msg) => { setDismissEntry(null); notify(msg); refresh(); }}
          onError={(msg) => notify(msg, "error")}
        />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[10000000]">
          <div className={`bg-white border-l-4 ${toast.type === "success" ? "border-green-500" : "border-red-500"} rounded-xl shadow-2xl p-4 flex items-center gap-4 min-w-[320px] max-w-[440px] ring-1 ring-black/5`}>
            <div className={`flex-shrink-0 w-10 h-10 ${toast.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} rounded-full flex items-center justify-center`}>
              {toast.type === "success" ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-[14px] text-[#1D2939] font-[700] uppercase tracking-wider">{toast.type === "success" ? "Success" : "Error"}</p>
              <p className="text-[13px] text-[#475467] font-[500]">{toast.msg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ summary, pending, onOpenPending }) {
  if (!summary) return null;
  const expiredPending = pending.filter((e) => e.reasonCode === "EXPIRED").length;
  const cards = [
    { label: "Waiting for review", value: summary.pendingCount, sub: `Suggested value ${money(summary.pendingValue)}`, icon: ClipboardList, tone: "text-amber-600 bg-amber-50" },
    { label: "Expired items pending", value: expiredPending, sub: "Reported as expired", icon: AlertTriangle, tone: "text-red-600 bg-red-50" },
    { label: "Confirmed this month", value: summary.confirmedThisMonthCount, sub: "Removed from stock", icon: CheckCircle2, tone: "text-green-600 bg-green-50" },
    { label: "Wastage value this month", value: money(summary.confirmedThisMonthValue), sub: "Confirmed entries only", icon: Trash2, tone: "text-[#0F50AA] bg-blue-50" },
  ];
  const byStage = Object.entries(summary.pendingByStage || {});
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-[#E4E6EA] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] text-[#667085] font-[500]">{c.label}</p>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center ${c.tone}`}><c.icon size={18} /></span>
            </div>
            <p className="text-[24px] font-[700] text-[#1D2939]">{c.value}</p>
            <p className="text-[12px] text-[#98A2B3] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E4E6EA] p-5 shadow-sm">
        <h3 className="text-[16px] font-[600] text-[#1D2939] mb-1">Pending by module</h3>
        <p className="text-[13px] text-[#667085] mb-4">Where the waiting wastage was found. Open a module to review it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {byStage.map(([stage, count]) => (
            <button
              key={stage}
              onClick={() => onOpenPending(stage)}
              disabled={!count}
              className="text-left p-4 rounded-lg border border-[#E4E6EA] hover:border-[#0F50AA] hover:bg-blue-50/40 disabled:hover:border-[#E4E6EA] disabled:hover:bg-transparent disabled:cursor-default"
            >
              <p className="text-[13px] text-[#667085]">{stageLabel(stage)}</p>
              <p className={`text-[20px] font-[700] ${count ? "text-amber-600" : "text-[#D0D5DD]"}`}>{count}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpiryTable({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E4E6EA] p-10 text-center text-[14px] text-[#667085]">
        No stock is expired or close to expiry.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-[#E4E6EA] shadow-sm overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-[#E4E6EA] bg-[#F9FAFB]">
            {["Item", "Where", "Batch", "Qty", "Expiry", "", "Wastage entry"].map((h, i) => (
              <th key={i} className="text-left py-3 px-4 text-[12px] font-[600] text-[#667085] uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stockRef} className={`border-b border-[#F0F1F3] ${r.status === "EXPIRED" ? "bg-red-50/40" : ""}`}>
              <td className="py-3 px-4 text-[14px] font-[500] text-[#1D2939]">{r.itemName}</td>
              <td className="py-3 px-4">
                <p className="text-[13px] text-[#344054]">{stageLabel(r.stage)}</p>
                {locationOf(r) && <p className="text-[12px] text-[#98A2B3]">{locationOf(r)}</p>}
              </td>
              <td className="py-3 px-4 text-[13px] text-[#667085]">{r.batchRef || "—"}</td>
              <td className="py-3 px-4 text-[14px] text-[#344054] whitespace-nowrap">{qty(r.qty, r.uom)}</td>
              <td className="py-3 px-4 text-[13px] text-[#344054] whitespace-nowrap">{r.expiryDate}</td>
              <td className="py-3 px-4"><ExpiryTag expiryDate={r.expiryDate} /></td>
              <td className="py-3 px-4 text-[13px]">
                {r.wastageEntryNo ? (
                  <span className="flex items-center gap-2">
                    <span className="text-[#344054]">{r.wastageEntryNo}</span>
                    <StatusBadge status={r.wastageStatus} />
                  </span>
                ) : (
                  <span className="text-[#98A2B3]">{r.status === "EXPIRED" ? "Not yet raised" : "—"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryTable({ rows, empty, pending, onConfirm, onDismiss }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E4E6EA] p-10 text-center text-[14px] text-[#667085]">{empty}</div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-[#E4E6EA] shadow-sm overflow-x-auto">
      <table className="w-full min-w-[960px]">
        <thead>
          <tr className="border-b border-[#E4E6EA] bg-[#F9FAFB]">
            {["Entry", "Item", "Where", "Qty", pending ? "Suggested value" : "Value", "Reason", "Source", pending ? "" : "Status"].map((h, i) => (
              <th key={i} className="text-left py-3 px-4 text-[12px] font-[600] text-[#667085] uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-b border-[#F0F1F3] align-top">
              <td className="py-3 px-4">
                <p className="text-[13px] font-[600] text-[#1D2939]">{e.entryNo}</p>
                <p className="text-[12px] text-[#98A2B3]">{e.wastageDate}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-[14px] font-[500] text-[#1D2939]">{e.itemName}</p>
                <div className="flex flex-col">
                  {e.batchRef && <span className="text-[11px] text-[#667085]">Batch {e.batchRef}</span>}
                  <ExpiryNote entry={e} />
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-[13px] text-[#344054]">{stageLabel(e.stage)}</p>
                {locationOf(e) && <p className="text-[12px] text-[#98A2B3]">{locationOf(e)}</p>}
              </td>
              <td className="py-3 px-4 text-[14px] text-[#344054] whitespace-nowrap">
                {qty(pending ? e.qty : e.actualQty ?? e.qty, e.uom)}
                {pending && e.stockAvailable !== null && e.stockAvailable !== undefined && (
                  <p className="text-[11px] text-[#98A2B3]">In stock: {qty(e.stockAvailable, e.uom)}</p>
                )}
              </td>
              <td className="py-3 px-4 text-[14px] text-[#344054] whitespace-nowrap">{money(pending ? e.systemValue : e.actualValue)}</td>
              <td className="py-3 px-4">
                <p className="text-[13px] text-[#344054]">{e.reasonLabel}</p>
                {e.notes && <p className="text-[11px] text-[#98A2B3] max-w-[220px]">{e.notes}</p>}
                {!pending && e.adminNotes && <p className="text-[11px] text-[#0F50AA] max-w-[220px]">Admin: {e.adminNotes}</p>}
              </td>
              <td className="py-3 px-4">
                <p className="text-[13px] text-[#344054]">{SOURCE_LABELS[e.sourceType] || e.sourceType}</p>
                <p className="text-[11px] text-[#98A2B3]">{pending ? e.reportedByName : e.confirmedByName}</p>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {pending ? (
                  <div className="flex gap-2">
                    <button onClick={() => onConfirm(e)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[13px] font-[600] hover:bg-green-700">
                      <Check size={14} /> Confirm
                    </button>
                    <button onClick={() => onDismiss(e)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg text-[13px] font-[600] hover:bg-gray-50">
                      <XCircle size={14} /> Dismiss
                    </button>
                  </div>
                ) : (
                  <StatusBadge status={e.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmModal({ entry, reasons, onClose, onDone, onError }) {
  const unitCost = entry.systemUnitCost !== null && entry.systemUnitCost !== undefined ? Number(entry.systemUnitCost) : null;
  const [actualQty, setActualQty] = useState(String(entry.qty));
  const [valueEdited, setValueEdited] = useState(false);
  const [actualValue, setActualValue] = useState(entry.systemValue !== null && entry.systemValue !== undefined ? String(entry.systemValue) : "");
  const [reasonCode, setReasonCode] = useState(entry.reasonCode);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Follow the suggested cost while the Admin changes the quantity, until they type their own value.
  useEffect(() => {
    if (!valueEdited && unitCost !== null) {
      const q = Number(actualQty);
      setActualValue(Number.isFinite(q) ? (q * unitCost).toFixed(2) : "");
    }
  }, [actualQty, unitCost, valueEdited]);

  const qtyNum = Number(actualQty);
  const valueNum = actualValue === "" ? null : Number(actualValue);
  const changed =
    qtyNum !== Number(entry.qty) ||
    (entry.systemValue !== null && entry.systemValue !== undefined && valueNum !== null && Math.abs(valueNum - Number(entry.systemValue)) > 0.004);
  const overStock = entry.stockAvailable !== null && entry.stockAvailable !== undefined && !entry.stockDeducted && qtyNum > Number(entry.stockAvailable);

  let error = null;
  if (!(qtyNum > 0)) error = "Enter a quantity greater than zero.";
  else if (overStock) error = `Only ${qty(entry.stockAvailable, entry.uom)} is in stock at this location.`;
  else if (valueNum === null || !(valueNum >= 0)) error = "Enter the actual value.";
  else if (changed && !adminNotes.trim()) error = "Add a note explaining the change.";

  const submit = async () => {
    if (error) return;
    setSaving(true);
    try {
      await axiosInstance.post(`/api/v1/wastage/admin/entries/${entry.id}/confirm`, {
        actualQty: qtyNum,
        actualValue: valueNum,
        reasonCode,
        adminNotes: adminNotes.trim() || null,
      });
      onDone(`${entry.entryNo} confirmed${entry.stockDeducted ? "" : " and removed from stock"}.`);
    } catch (err) {
      onError(err.message || "Could not confirm");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Confirm wastage" subtitle={`${entry.entryNo} · ${entry.itemName}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4 text-[13px]">
        <Info label="Where" value={`${stageLabel(entry.stage)}${locationOf(entry) ? ` · ${locationOf(entry)}` : ""}`} />
        <Info label="Reported" value={`${qty(entry.qty, entry.uom)} by ${entry.reportedByName || "System"}`} />
        <Info label="Suggested cost" value={unitCost !== null ? `${money(unitCost)} per ${entry.uom || "unit"}` : "No cost on record"} />
        <Info label="Stock" value={entry.stockDeducted ? "Already out of stock" : entry.stockAvailable !== null && entry.stockAvailable !== undefined ? `${qty(entry.stockAvailable, entry.uom)} available` : "—"} />
      </div>
      {entry.notes && <p className="text-[12px] text-[#667085] bg-[#F9FAFB] border border-[#E4E6EA] rounded-lg p-3 mb-4">{entry.notes}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Actual quantity${entry.uom ? ` (${entry.uom})` : ""}`}>
          <input type="number" min="0" step="any" value={actualQty} onChange={(e) => setActualQty(e.target.value)} className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
        </Field>
        <Field label="Actual value (Rs.)">
          <input type="number" min="0" step="0.01" value={actualValue} onChange={(e) => { setValueEdited(true); setActualValue(e.target.value); }} className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
        </Field>
      </div>
      <Field label="Reason">
        <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white">
          {(reasons.length ? reasons : [{ code: entry.reasonCode, label: entry.reasonLabel }]).map((r) => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </select>
      </Field>
      <Field label={`Admin note${changed ? " (required — quantity or value changed)" : " (optional)"}`}>
        <textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
      </Field>

      {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg text-[14px] font-[600]">Cancel</button>
        <button onClick={submit} disabled={!!error || saving} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-[14px] font-[600] disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader variant="inline" /> : <><Check size={16} /> Confirm wastage</>}
        </button>
      </div>
    </Modal>
  );
}

function DismissModal({ entry, onClose, onDone, onError }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!notes.trim()) return;
    setSaving(true);
    try {
      await axiosInstance.post(`/api/v1/wastage/admin/entries/${entry.id}/dismiss`, { adminNotes: notes.trim() });
      onDone(`${entry.entryNo} dismissed. Stock was not changed.`);
    } catch (err) {
      onError(err.message || "Could not dismiss");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Dismiss wastage" subtitle={`${entry.entryNo} · ${entry.itemName} · ${qty(entry.qty, entry.uom)}`} onClose={onClose}>
      <p className="text-[13px] text-[#667085] mb-3">
        Dismissing leaves the stock as it is and keeps this entry out of reports.
      </p>
      <Field label="Why is this not wastage? (required)">
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Item was used in production before the check"
          className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg text-[14px] font-[600]">Cancel</button>
        <button onClick={submit} disabled={!notes.trim() || saving} className="flex-1 px-4 py-2.5 bg-[#344054] text-white rounded-lg text-[14px] font-[600] disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader variant="inline" /> : "Dismiss"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100000] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-[#E4E6EA]">
          <div>
            <h3 className="text-[18px] font-[700] text-[#1D2939]">{title}</h3>
            <p className="text-[13px] text-[#667085]">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#98A2B3] hover:text-[#344054]"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-[12px] font-[600] text-[#344054] mb-1">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-[#F9FAFB] rounded-lg border border-[#E4E6EA] p-2.5">
      <p className="text-[11px] text-[#98A2B3] uppercase font-[600]">{label}</p>
      <p className="text-[13px] text-[#1D2939]">{value}</p>
    </div>
  );
}
