import React, { useState, useEffect, useMemo, useCallback } from "react";
import { onEnterClick } from "../utils/a11y";
import {
  RefreshCw,
  ChevronDown,
  Search,
  Calendar,
  FileText,
  FileSpreadsheet,
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Users,
  ShoppingCart,
  Eye,
  ReceiptText,
  Phone,
  Mail,
  MapPin,
  BadgeAlert,
} from "lucide-react";

import { generatePDF, generateExcel } from "../utils/exportUtils";


import FinanceNavBar from "../component/FinanceNavBar.jsx";
import FinanceSideBar from "../component/FinanceSideBar.jsx";


// ── Helpers ─────────────────────────────────────────────────────────────

/** Normalise a raw {@code SupplierOutstandingDto} from the API into a row
 *  shape with safe numeric defaults so the UI never explodes on null. */
function toRow(s) {
  return {
    id: s.id,
    supplierId: s.supplierId,
    name: s.name || "Unknown",
    type: s.type || "Supplier",
    totalOutstanding: Number(s.totalOutstanding || 0),
    overdueAmount: Number(s.overdueAmount || 0),
    unpaidInvoices: Number(s.unpaidInvoices || 0),
    earliestDueDate: s.earliestDueDate || "",
    lastTransaction: s.lastTransaction || "",
    phone: s.phone || "—",
    email: s.email || "—",
    address: s.address || "—",
  };
}

/** Normalise an {@code OutstandingGrnDto} from the drill-down endpoint into
 *  the modal row shape. */
function toInvoice(g) {
  return {
    grnId: g.grnId,
    ref: g.ref,
    description: g.description,
    date: g.date || "—",
    dueDate: g.dueDate || "—",
    amount: Number(g.amount || 0),
    paid: Number(g.paid || 0),
    outstanding: Number(g.outstanding || 0),
    status: g.status || "Pending",
  };
}


function DrillDownModal({ record, invoices, loading, error, onClose }) {
  const statusStyle = {
    Overdue: { text: "text-error", bg: "bg-subtle",  icon: <AlertTriangle size={11} /> },
    Pending: { text: "text-warning", bg: "bg-hover",  icon: <Clock size={11} />         },
    Cleared: { text: "text-success", bg: "bg-hover",  icon: <CheckCircle size={11} />   },
  };

  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-line flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-[600] text-fg">{record.name}</h3>
                <span className="text-[12px] font-[500] px-2.5 py-0.5 rounded-full text-brand-fg bg-hover">
                  {record.type}
                </span>
              </div>
              <p className="text-[12px] text-fg-secondary mt-0.5 flex items-center gap-1">
                <Hash size={11} />{record.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                generatePDF({
                  title: `Outstanding Invoices: ${record.name}`,
                  subtitle: `ID: ${record.id}`,
                  headers: ["Reference", "Date", "Due Date", "Amount (Rs.)", "Paid (Rs.)", "Outstanding (Rs.)", "Status"],
                  data: invoices.map(inv => [
                    inv.ref,
                    inv.date,
                    inv.dueDate,
                    inv.amount.toLocaleString(),
                    inv.paid.toLocaleString(),
                    inv.outstanding.toLocaleString(),
                    inv.status
                  ]),
                  fileName: `Outstanding_${record.name}`
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle"
            >
              <FileText size={13} /> PDF
            </button>
            <button 
              onClick={() => {
                generateExcel({
                  headers: ["Reference", "Date", "Due Date", "Amount", "Paid", "Outstanding", "Status"],
                  data: invoices.map(inv => [
                    inv.ref,
                    inv.date,
                    inv.dueDate,
                    inv.amount,
                    inv.paid,
                    inv.outstanding,
                    inv.status
                  ]),
                  fileName: `Outstanding_${record.name}`
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand text-on-brand text-[12px] font-[500] rounded-lg hover:bg-brand-hover"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-app rounded-lg ml-1">
              <X size={18} className="text-fg-secondary" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Profile strip */}
          <div className="bg-subtle rounded-xl p-4 border border-line">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-brand-fg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-fg-secondary">Phone</p>
                  <p className="text-[13px] font-[500] text-fg">{record.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-brand-fg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-fg-secondary">Email</p>
                  <p className="text-[13px] font-[500] text-fg break-all">{record.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-brand-fg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-fg-secondary">Address</p>
                  <p className="text-[13px] font-[500] text-fg">{record.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Outstanding", value: `Rs. ${record.totalOutstanding.toLocaleString()}`, color: "text-fg", bg: "bg-subtle" },
              { label: "Overdue Amount",    value: `Rs. ${record.overdueAmount.toLocaleString()}`,    color: record.overdueAmount > 0 ? "text-error" : "text-success", bg: record.overdueAmount > 0 ? "bg-error/10" : "bg-success/10" },
              { label: "Unpaid Invoices",   value: record.unpaidInvoices,                          color: "text-warning",  bg: "bg-warning/10" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 border border-line text-center`}>
                <p className="text-[12px] text-fg-secondary mb-1">{label}</p>
                <p className={`text-[22px] font-[700] ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Invoice table */}
          <div>
            <h4 className="text-[15px] font-[600] text-fg mb-3">
              Unpaid Invoices &amp; GRNs
            </h4>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-lg px-4 py-3 mb-3">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12 border border-line rounded-xl bg-subtle">
                <RefreshCw size={28} className="text-brand-fg animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 border border-line rounded-xl bg-subtle">
                <CheckCircle size={36} className="mx-auto text-success mb-2" />
                <p className="text-[14px] font-[500] text-fg">No outstanding invoices</p>
                <p className="text-[12px] text-fg-secondary">This supplier is fully settled.</p>
              </div>
            ) : (
              <div className="border border-line rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-subtle border-b border-line">
                      {["Reference", "Date", "Due Date", "Invoice Amt", "Paid", "Outstanding", "Status"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-[12px] font-[500] text-fg-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const ss = statusStyle[inv.status] || { text: "text-fg-secondary", bg: "bg-app", icon: null };
                      return (
                        <tr key={inv.grnId} className={`border-b border-line last:border-0 hover:bg-subtle ${inv.status === "Overdue" ? "bg-error/10" : ""}`}>
                          <td className="py-3 px-4 text-[12px] font-[600] text-brand-fg">{inv.ref}</td>
                          <td className="py-3 px-4 text-[12px] text-fg">{inv.date}</td>
                          <td className="py-3 px-4 text-[12px] text-fg">{inv.dueDate}</td>
                          <td className="py-3 px-4 text-[12px] font-[600] text-fg">Rs. {inv.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-[12px] font-[600] text-success">
                            {inv.paid > 0 ? `Rs. ${inv.paid.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-[12px] font-[700] text-error">Rs. {inv.outstanding.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[12px] font-[500] px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>
                              {ss.icon}{inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-line flex justify-end">
          <button onClick={onClose} className="px-5 py-2 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


function FilterDropdown({ open, setOpen, value, options, onChange, icon: Icon }) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 border border-line rounded-lg text-[13px] text-fg bg-surface hover:bg-subtle transition-colors min-w-[160px]"
      >
        {Icon && <Icon size={13} className="text-fg-secondary" />}
        <span className="flex-1 text-left truncate">{value}</span>
        <ChevronDown size={13} className="text-fg-secondary" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 bg-elevated border border-line rounded-lg shadow-lg z-50 min-w-full">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-subtle transition-colors first:rounded-t-lg last:rounded-b-lg ${value === o ? "text-brand-fg font-[500] bg-hover" : "text-fg"}`}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


export default function FinanceOutstandingSummary() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const activeSection                      = "Outstanding Summary";

  // Live data
  const [records, setRecords]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [pageError, setPageError]         = useState(null);

  // Drill-down
  const [drillRecord, setDrillRecord]     = useState(null);
  const [drillInvoices, setDrillInvoices] = useState([]);
  const [drillLoading, setDrillLoading]   = useState(false);
  const [drillError, setDrillError]       = useState(null);

  // Filters (server-side: applied on Apply / Reset / mount)
  const [searchTerm, setSearchTerm]       = useState("");
  const [overdueFilter, setOverdueFilter] = useState("All");          // All / Overdue Only
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [overdueOpen, setOverdueOpen]     = useState(false);

  // Table
  const [sortCol, setSortCol]             = useState("totalOutstanding");
  const [sortDir, setSortDir]             = useState("desc");
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE                          = 6;

  const baseUrl = process.env.REACT_APP_BASE_URL;

  const authHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Fetch summary (mount + Apply) ──
  const fetchSummary = useCallback(async (filters) => {
    try {
      setLoading(true);
      setPageError(null);
      const params = new URLSearchParams();
      if (filters.search)        params.set("search", filters.search);
      if (filters.overdueOnly)   params.set("overdueOnly", "true");
      if (filters.dueFrom)       params.set("dueFrom", filters.dueFrom);
      if (filters.dueTo)         params.set("dueTo", filters.dueTo);

      const url = `${baseUrl}/api/v1/finance/outstanding-summary${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load summary: ${res.status}`);
      const data = await res.json();
      setRecords((data || []).map(toRow));
    } catch (e) {
      console.error("Failed to fetch outstanding summary:", e);
      setPageError("Failed to load outstanding summary. Please try again.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // ── Initial load ──
  useEffect(() => {
    fetchSummary({});
  }, []);

  // ── Drill-down fetch when row is opened ──
  useEffect(() => {
    if (!drillRecord) {
      setDrillInvoices([]);
      setDrillError(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        setDrillLoading(true);
        setDrillError(null);
        const res = await fetch(
          `${baseUrl}/api/v1/finance/suppliers/${drillRecord.supplierId}/outstanding-detail`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error(`Failed to load detail: ${res.status}`);
        const data = await res.json();
        setDrillInvoices((data?.invoices || []).map(toInvoice));
      } catch (e) {
        console.error("Failed to fetch outstanding detail:", e);
        setDrillError("Failed to load supplier invoices. Please try again.");
        setDrillInvoices([]);
      } finally {
        setDrillLoading(false);
      }
    };
    fetchDetail();
  }, [drillRecord]);

  const handleApply = () => {
    setPage(1);
    fetchSummary({
      search: searchTerm.trim() || undefined,
      overdueOnly: overdueFilter === "Overdue Only",
      dueFrom: startDate || undefined,
      dueTo: endDate || undefined,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setOverdueFilter("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchSummary({});
  };

  const handleRefresh = () => {
    fetchSummary({
      search: searchTerm.trim() || undefined,
      overdueOnly: overdueFilter === "Overdue Only",
      dueFrom: startDate || undefined,
      dueTo: endDate || undefined,
    });
  };

  // Client-side search-on-the-fly so the UI stays snappy as the user types
  // before they hit Apply.
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
  }, [records, searchTerm]);

  // Sorted (client-side)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (["totalOutstanding", "overdueAmount", "unpaidInvoices"].includes(sortCol)) {
        av = +av; bv = +bv;
      }
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
    return sortDir === "asc"
      ? <ArrowUp   size={12} className="text-brand-fg" />
      : <ArrowDown size={12} className="text-brand-fg" />;
  };

  // Summary metrics — computed off the unfiltered server payload so cards
  // reflect the global view, not the current page filter.
  const totalSupplierOutstanding = records.reduce((s, r) => s + r.totalOutstanding, 0);
  const totalOverdue             = records.reduce((s, r) => s + r.overdueAmount, 0);
  const totalUnpaidInvoices      = records.reduce((s, r) => s + r.unpaidInvoices, 0);

  const handleExportSummaryPDF = () => {
    if (sorted.length === 0) return;
    generatePDF({
      title: "Supplier Outstanding Summary Report",
      orientation: "l",
      summary: [
        { label: "Total Outstanding", value: `Rs. ${totalSupplierOutstanding.toLocaleString()}` },
        { label: "Total Overdue", value: `Rs. ${totalOverdue.toLocaleString()}` },
        { label: "Unpaid Invoices", value: totalUnpaidInvoices.toString() }
      ],
      headers: ["Supplier", "ID", "Total Outstanding (Rs.)", "Overdue Amount (Rs.)", "Earliest Due", "Unpaid Invoices", "Last Transaction"],
      data: sorted.map(r => [
        r.name,
        r.id,
        r.totalOutstanding.toLocaleString(),
        r.overdueAmount.toLocaleString(),
        r.earliestDueDate,
        r.unpaidInvoices,
        r.lastTransaction
      ]),
      fileName: "Supplier_Outstanding_Summary"
    });
  };

  const handleExportSummaryExcel = () => {
    if (sorted.length === 0) return;
    generateExcel({
      headers: ["Supplier", "ID", "Total Outstanding", "Overdue Amount", "Earliest Due", "Unpaid Invoices", "Last Transaction"],
      data: sorted.map(r => [
        r.name,
        r.id,
        r.totalOutstanding,
        r.overdueAmount,
        r.earliestDueDate,
        r.unpaidInvoices,
        r.lastTransaction
      ]),
      fileName: "Supplier_Outstanding_Summary"
    });
  };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <FinanceSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <FinanceNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg mb-1">Supplier Outstanding Summary</h1>
              <p className="text-[14px] text-fg-secondary">Overview of unpaid supplier balances and overdue invoices</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button 
                onClick={handleExportSummaryPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
              >
                <FileText size={15} /> PDF
              </button>
              <button 
                onClick={handleExportSummaryExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
              >
                <FileSpreadsheet size={15} /> Excel
              </button>
            </div>
          </div>

          {pageError && (
            <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-lg px-4 py-3 mb-4">
              {pageError}
            </div>
          )}

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {[
              { label: "Supplier Payables",   value: `Rs. ${totalSupplierOutstanding.toLocaleString()}`, icon: <ShoppingCart size={20} />,  color: "bg-brand",   hoverColor: "hover:bg-brand-hover",   iconBg: "bg-brand/30"   },
              { label: "Total Overdue",       value: `Rs. ${totalOverdue.toLocaleString()}`,             icon: <BadgeAlert size={20} />,     color: "bg-info-solid",   hoverColor: "hover:bg-info-solid",   iconBg: "bg-info/30"   },
              { label: "Unpaid Invoices",     value: totalUnpaidInvoices,                             icon: <ReceiptText size={20} />,    color: "bg-info-solid",    hoverColor: "hover:bg-info-solid",    iconBg: "bg-info/30"    },
            ].map((card, i) => (
              <div key={i}
                className={`${card.color} ${card.hoverColor} rounded-lg p-5 text-on-brand shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-on-brand/80 mb-2">{card.label}</p>
                    <h2 className="text-[26px] font-bold leading-none">{card.value}</h2>
                  </div>
                  <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter Panel ── */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">

              {/* Search */}
              <div className="lg:col-span-4 relative">
                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">Search</label>
                <Search className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-fg-secondary" size={14} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="w-full pl-9 pr-4 py-2.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              {/* Overdue Status */}
              <div className="lg:col-span-2">
                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">Overdue</label>
                <FilterDropdown
                  open={overdueOpen} setOpen={setOverdueOpen}
                  value={overdueFilter} options={["All", "Overdue Only"]}
                  onChange={(v) => { setOverdueFilter(v); setPage(1); }}
                  icon={AlertTriangle}
                />
              </div>

              {/* Due Date From */}
              <div className="lg:col-span-2">
                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">Due From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg"
                  />
                </div>
              </div>

              {/* Due Date To */}
              <div className="lg:col-span-2">
                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">Due To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="lg:col-span-2 flex flex-col gap-1.5 pt-5">
                <button
                  onClick={handleApply}
                  className="w-full px-3 py-2.5 bg-brand text-on-brand text-[12px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle transition-colors"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* ── Summary Table ── */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h3 className="text-[18px] font-[600] text-fg">Outstanding Balances</h3>
                <p className="text-[12px] text-fg-secondary mt-0.5">
                  Showing {paginated.length} of {sorted.length} suppliers · Click any row for details
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle">
                <Printer size={13} /> Print
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-28">
                <RefreshCw size={38} className="text-brand-fg animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line bg-subtle">
                        {[
                          { key: "name",             label: "Supplier"             },
                          { key: "totalOutstanding", label: "Total Outstanding"    },
                          { key: "overdueAmount",    label: "Overdue Amount"       },
                          { key: "earliestDueDate",  label: "Earliest Due Date"    },
                          { key: "unpaidInvoices",   label: "Unpaid Invoices"      },
                          { key: "lastTransaction",  label: "Last Transaction"     },
                          { key: "actions",          label: "Action", noSort: true },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => !col.noSort && handleSort(col.key)}
                            className={`text-left py-3.5 px-4 text-[12px] font-[500] text-fg-secondary whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {!col.noSort && <SortIcon col={col.key} />}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <Users size={40} className="mx-auto text-fg-muted mb-3" />
                            <p className="text-[14px] font-[500] text-fg">No outstanding balances</p>
                            <p className="text-[12px] text-fg-secondary">All suppliers are settled, or your filters are too narrow.</p>
                          </td>
                        </tr>
                      ) : paginated.map((r) => {
                        const isOverdue = r.overdueAmount > 0;

                        return (
                          <tr
                            key={r.id}
                            role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setDrillRecord(r)}
                            className={`border-b border-line hover:bg-subtle transition-colors cursor-pointer ${isOverdue ? "bg-error/10" : ""}`}
                          >
                            {/* Name */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-[13px] font-[600] text-fg">{r.name}</p>
                                  <p className="text-[12px] text-fg-secondary flex items-center gap-1 mt-0.5">
                                    <Hash size={9} />{r.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Total Outstanding */}
                            <td className="py-4 px-4">
                              <p className="text-[14px] font-[700] text-fg">
                                Rs. {r.totalOutstanding.toLocaleString()}
                              </p>
                            </td>

                            {/* Overdue Amount */}
                            <td className="py-4 px-4">
                              {r.overdueAmount > 0 ? (
                                <div>
                                  <p className="text-[14px] font-[700] text-error">
                                    Rs. {r.overdueAmount.toLocaleString()}
                                  </p>
                                  <span className="text-[12px] font-[500] text-error flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle size={9} /> Overdue
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[13px] font-[500] text-success">—</span>
                              )}
                            </td>

                            {/* Earliest Due Date */}
                            <td className="py-4 px-4">
                              <p className={`text-[13px] font-[500] ${isOverdue ? "text-error" : "text-fg"}`}>
                                {r.earliestDueDate || "—"}
                              </p>
                            </td>

                            {/* Unpaid Invoices */}
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-hover text-brand-fg text-[12px] font-[700]">
                                {r.unpaidInvoices}
                              </span>
                            </td>

                            {/* Last Transaction */}
                            <td className="py-4 px-4">
                              <p className="text-[13px] text-fg-secondary">{r.lastTransaction || "—"}</p>
                            </td>

                            {/* Action */}
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setDrillRecord(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hover text-brand-fg text-[12px] font-[500] rounded-lg hover:bg-brand-hover hover:text-on-brand transition-colors"
                              >
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                    <p className="text-[12px] text-fg-secondary">
                      Page {page} of {totalPages} · {sorted.length} suppliers
                    </p>
                    <div className="flex items-center gap-2">
                      <button aria-label="Previous"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={15} className="text-fg-secondary" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button aria-label="Next"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={15} className="text-fg-secondary" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Drill-down Modal */}
      {drillRecord && (
        <DrillDownModal
          record={drillRecord}
          invoices={drillInvoices}
          loading={drillLoading}
          error={drillError}
          onClose={() => setDrillRecord(null)}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
