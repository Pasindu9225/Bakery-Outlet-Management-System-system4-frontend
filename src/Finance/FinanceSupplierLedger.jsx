import React, { useState, useEffect, useMemo } from "react";
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
  DollarSign,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Eye,
  Filter,
  Plus,
  AlertCircle,
  Banknote,
} from "lucide-react";

import { generatePDF, generateExcel } from "../utils/exportUtils";


import FinanceNavBar from "../component/FinanceNavBar.jsx";
import FinanceSideBar from "../component/FinanceSideBar.jsx";
import Loader from "../component/Loader.jsx";


const TX_TYPES  = ["All Types", "GRN", "PO", "Payment", "Return", "Adjustment"];
const TX_STATUS = ["All Status", "Overdue", "Pending", "Cleared"];

const TYPE_STYLE = {
  GRN:        { text: "text-[#0F50AA]", bg: "bg-[#EEF3FB]" },
  PO:         { text: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
  Payment:    { text: "text-[#199D26]", bg: "bg-[#F0FDF4]" },
  Return:     { text: "text-[#F4A100]", bg: "bg-[#FFFBEB]" },
  Adjustment: { text: "text-[#6B7280]", bg: "bg-[#F3F4F6]" },
};

const STATUS_STYLE = {
  Overdue: { text: "text-[#EF4444]", bg: "bg-[#FEF2F2]", icon: <AlertTriangle size={11} /> },
  Pending: { text: "text-[#F4A100]", bg: "bg-[#FFFBEB]", icon: <Clock size={11} />         },
  Cleared: { text: "text-[#199D26]", bg: "bg-[#F0FDF4]", icon: <CheckCircle size={11} />   },
};


function SupplierDropdown({ suppliers, value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  const selected = suppliers.find((s) => s.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors min-w-[220px]"
      >
        {selected ? (
          <div className="w-6 h-6 bg-[#0F50AA] rounded-md flex items-center justify-center text-white text-[10px] font-[700] flex-shrink-0">
            {selected.code}
          </div>
        ) : (
          <BookOpen size={14} className="text-[#667085] flex-shrink-0" />
        )}
        <span className="flex-1 text-left truncate">
          {selected ? selected.name : "Select Supplier"}
        </span>
        <ChevronDown size={13} className="text-[#667085] flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-xl z-50 w-72">
            <div className="p-2 border-b border-[#E4E6EA]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-[#E4E6EA] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-[12px] text-[#667085]">No suppliers found</p>
              ) : filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onChange(s.id); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FA] transition-colors ${value === s.id ? "bg-[#EEF3FB]" : ""}`}
                >
                  <div className="w-7 h-7 bg-[#0F50AA] rounded-md flex items-center justify-center text-white text-[10px] font-[700] flex-shrink-0">
                    {s.code}
                  </div>
                  <div>
                    <p className={`text-[13px] font-[500] ${value === s.id ? "text-[#0F50AA]" : "text-[#383E49]"}`}>{s.name}</p>
                    <p className="text-[10px] text-[#667085]">{s.id}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function FilterDropdown({ open, setOpen, value, options, onChange }) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors min-w-[150px]"
      >
        <Filter size={13} className="text-[#667085]" />
        <span className="flex-1 text-left truncate">{value}</span>
        <ChevronDown size={13} className="text-[#667085]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-full">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors first:rounded-t-lg last:rounded-b-lg ${value === o ? "text-[#0F50AA] font-[500] bg-[#EEF3FB]" : "text-[#383E49]"}`}
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


function DocViewModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-[#E4E6EA] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-[600] text-[#383E49]">Document Reference</h3>
            <p className="text-[12px] text-[#667085] mt-0.5 flex items-center gap-1">
              <Hash size={11} />{row.ref}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg">
            <X size={16} className="text-[#667085]" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Reference No.",  value: row.ref },
              { label: "Date",           value: row.date },
              { label: "Type",           value: row.type },
              { label: "Status",         value: row.status },
              { label: "Description",    value: row.description },
              { label: "Debit Amount",   value: row.debit  > 0 ? `Rs. ${row.debit.toLocaleString()}`  : "-" },
              { label: "Credit Amount",  value: row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : "-" },
              { label: "Running Balance",value: `Rs. ${row.balance.toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className={label === "Description" ? "col-span-2" : ""}>
                <p className="text-[11px] text-[#667085] mb-0.5">{label}</p>
                <p className="text-[13px] font-[500] text-[#383E49]">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[#E4E6EA] flex justify-end gap-2">
          <button 
            onClick={() => {
              generatePDF({
                title: "Transaction Details",
                subtitle: `Reference: ${row.ref} | Date: ${row.date}`,
                headers: ["Field", "Value"],
                data: [
                  ["Type", row.type],
                  ["Status", row.status],
                  ["Description", row.description],
                  ["Debit Amount", row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : "-"],
                  ["Credit Amount", row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : "-"],
                  ["Running Balance", `Rs. ${row.balance.toLocaleString()}`],
                ],
                fileName: `Transaction_${row.ref}`
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA]"
          >
            <FileText size={13} /> Export PDF
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


export default function FinanceSupplierLedger() {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const activeSection                        = "Supplier Ledger";

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  // Live data
  const [suppliers, setSuppliers]           = useState([]);
  const [rawRows, setRawRows]               = useState([]);

  // Supplier selection
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Filters
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [txType, setTxType]                 = useState("All Types");
  const [txStatus, setTxStatus]             = useState("All Status");
  const [typeOpen, setTypeOpen]             = useState(false);
  const [statusOpen, setStatusOpen]         = useState(false);
  const [tableSearch, setTableSearch]       = useState("");

  // Table
  const [sortCol, setSortCol]               = useState("date");
  const [sortDir, setSortDir]               = useState("desc");
  const [page, setPage]                     = useState(1);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [adjModalOpen, setAdjModalOpen]     = useState(false);
  const PAGE_SIZE                            = 8;

  // Doc modal
  const [docModal, setDocModal]             = useState(null);

  const supplier = suppliers.find((s) => s.id === selectedSupplier);

  // Build the supplier-ledger query string from the active filters.
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate)   params.append("endDate",   endDate);
    if (txType   !== "All Types")  params.append("type",   txType);
    if (txStatus !== "All Status") params.append("status", txStatus);
    const q = params.toString();
    return q ? `?${q}` : "";
  };

  // Convert API ledger rows (with string dates and possibly string numbers)
  // into the shape the existing UI expects.
  const normalizeEntries = (rows) =>
    (rows || []).map((r) => ({
      id:          r.id,
      date:        r.date,
      ref:         r.ref,
      type:        r.type,
      description: r.description,
      debit:       Number(r.debit  ?? 0),
      credit:      Number(r.credit ?? 0),
      balance:     Number(r.balance ?? 0),
      status:      r.status,
    }));

  // Load suppliers on mount.
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = process.env.REACT_APP_BASE_URL;
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${baseUrl}/api/v1/finance/suppliers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`Failed to load suppliers: ${res.status}`);
        }
        const data = await res.json();
        setSuppliers(data || []);
        if ((data || []).length > 0) {
          setSelectedSupplier(data[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch suppliers:", e);
        setError("Failed to load suppliers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Load ledger when supplier or filters change.
  useEffect(() => {
    if (!selectedSupplier) return;
    const fetchLedger = async () => {
      try {
        setLoading(true);
        setError(null);
        const sup = suppliers.find((s) => s.id === selectedSupplier);
        if (!sup) return;
        const baseUrl = process.env.REACT_APP_BASE_URL;
        const token = localStorage.getItem("authToken");
        const url = `${baseUrl}/api/v1/finance/suppliers/${sup.supplierId}/ledger${buildQuery()}`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`Failed to load ledger: ${res.status}`);
        }
        const data = await res.json();
        setRawRows(normalizeEntries(data));
        setPage(1);
      } catch (e) {
        console.error("Failed to fetch ledger:", e);
        setError("Failed to load ledger. Please try again.");
        setRawRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [selectedSupplier, suppliers, startDate, endDate, txType, txStatus, refreshKey]);

  // Client-side search-only filtering (the rest is server-side).
  const filtered = useMemo(() => {
    if (!tableSearch) return rawRows;
    const q = tableSearch.toLowerCase();
    return rawRows.filter(
      (r) =>
        (r.ref && r.ref.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [rawRows, tableSearch]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (["debit","credit","balance"].includes(sortCol)) { av = +av; bv = +bv; }
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
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
    return sortDir === "asc"
      ? <ArrowUp   size={12} className="text-[#0F50AA]" />
      : <ArrowDown size={12} className="text-[#0F50AA]" />;
  };

  // Apply triggers a refetch by toggling a useEffect dep -- here we just
  // force a re-run of the ledger fetch by reapplying filters.
  const handleApply = () => { setRefreshKey((k) => k + 1); setPage(1); };
  const handleReset = () => {
    setStartDate(""); setEndDate("");
    setTxType("All Types"); setTxStatus("All Status");
    setTableSearch(""); setPage(1);
  };

  // Summary metrics from filtered
  const totalDebit   = filtered.reduce((s, r) => s + r.debit,   0);
  const totalCredit  = filtered.reduce((s, r) => s + r.credit,  0);
  const closingBal   = filtered.length > 0 ? filtered[0].balance : 0;
  const overdueCount = filtered.filter((r) => r.status === "Overdue").length;

  const handleExportPDF = () => {
    if (sorted.length === 0) return;
    generatePDF({
      title: "Supplier Ledger Report",
      subtitle: `Supplier: ${supplier?.name || "N/A"} (${supplier?.id || "N/A"})`,
      orientation: "l",
      summary: [
        { label: "Total Debit", value: `Rs. ${totalDebit.toLocaleString()}` },
        { label: "Total Credit", value: `Rs. ${totalCredit.toLocaleString()}` },
        { label: "Closing Balance", value: `Rs. ${closingBal.toLocaleString()}` }
      ],
      headers: ["Date", "Reference", "Type", "Description", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)", "Status"],
      data: sorted.map(r => [
        r.date,
        r.ref,
        r.type,
        r.description,
        r.debit > 0 ? r.debit.toLocaleString() : "-",
        r.credit > 0 ? r.credit.toLocaleString() : "-",
        r.balance.toLocaleString(),
        r.status
      ]),
      fileName: `Supplier_Ledger_${supplier?.name || "Report"}`
    });
  };

  const handleExportExcel = () => {
    if (sorted.length === 0) return;
    generateExcel({
      headers: ["Date", "Reference", "Type", "Description", "Debit", "Credit", "Balance", "Status"],
      data: sorted.map(r => [
        r.date,
        r.ref,
        r.type,
        r.description,
        r.debit,
        r.credit,
        r.balance,
        r.status
      ]),
      fileName: `Supplier_Ledger_${supplier?.name || "Report"}`
    });
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <FinanceSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <FinanceNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Supplier Ledger</h1>
              <p className="text-[14px] text-[#667085]">View, track, and reconcile supplier transactions</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button
                onClick={() => setAdjModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
              >
                <Plus size={15} /> Manual Adjustment
              </button>
              <button
                onClick={handleApply}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <button 
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                <FileText size={15} /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
              >
                <FileSpreadsheet size={15} /> Excel
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Filter Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">Supplier</label>
                <SupplierDropdown
                  suppliers={suppliers}
                  value={selectedSupplier}
                  onChange={(id) => setSelectedSupplier(id)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">Type</label>
                <FilterDropdown
                  open={typeOpen} setOpen={setTypeOpen}
                  value={txType} options={TX_TYPES}
                  onChange={(v) => { setTxType(v); setPage(1); }}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">Status</label>
                <FilterDropdown
                  open={statusOpen} setOpen={setStatusOpen}
                  value={txStatus} options={TX_STATUS}
                  onChange={(v) => { setTxStatus(v); setPage(1); }}
                />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-1.5 pt-5">
                <button
                  onClick={handleApply}
                  className="w-full px-3 py-2.5 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[
              {
                label: "Total Debit",
                value: `Rs. ${totalDebit.toLocaleString()}`,
                icon: <TrendingUp size={20} />,
                color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30",
              },
              {
                label: "Total Credit",
                value: `Rs. ${totalCredit.toLocaleString()}`,
                icon: <TrendingDown size={20} />,
                color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30",
              },
              {
                label: "Closing Balance",
                value: `Rs. ${closingBal.toLocaleString()}`,
                icon: <Banknote size={20} />,
                color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30",
              },
              {
                label: "Overdue Entries",
                value: overdueCount,
                icon: <AlertTriangle size={20} />,
                color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`${card.color} ${card.hoverColor} rounded-lg p-5 text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-white/80 mb-2">{card.label}</p>
                    <h2 className="text-[26px] font-bold leading-none">{card.value}</h2>
                  </div>
                  <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">Ledger Entries</h3>
                <p className="text-[12px] text-[#667085] mt-0.5">
                  {supplier?.name || "No supplier selected"} - Showing {paginated.length} of {sorted.length} records
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={14} />
                  <input
                    type="text"
                    placeholder="Search reference or description..."
                    className="pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent w-60"
                    value={tableSearch}
                    onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA]">
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading ledger transactions..." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                        {[
                          { key: "date",        label: "Date"            },
                          { key: "ref",         label: "Reference No."   },
                          { key: "type",        label: "Type"            },
                          { key: "description", label: "Description"     },
                          { key: "debit",       label: "Debit (Rs.)"       },
                          { key: "credit",      label: "Credit (Rs.)"      },
                          { key: "balance",     label: "Running Balance" },
                          { key: "status",      label: "Status"          },
                          { key: "actions",     label: "Action", noSort: true },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => !col.noSort && handleSort(col.key)}
                            className={`text-left py-3.5 px-4 text-[12px] font-[500] text-[#667085] whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-[#383E49]"}`}
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
                          <td colSpan={9} className="py-16 text-center">
                            <AlertTriangle size={36} className="mx-auto text-[#C8CDD5] mb-3" />
                            <p className="text-[14px] font-[500] text-[#383E49]">No ledger entries found</p>
                            <p className="text-[12px] text-[#667085]">Try adjusting your filters</p>
                          </td>
                        </tr>
                      ) : paginated.map((row) => {
                        const typeStyle   = TYPE_STYLE[row.type]   || { text: "text-[#667085]", bg: "bg-[#F0F1F3]" };
                        const statusStyle = STATUS_STYLE[row.status] || { text: "text-[#667085]", bg: "bg-[#F0F1F3]", icon: null };
                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors ${row.status === "Overdue" ? "bg-red-50/40" : ""}`}
                          >
                            <td className="py-3.5 px-4">
                              <p className="text-[13px] font-[500] text-[#383E49] whitespace-nowrap">{row.date}</p>
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => setDocModal(row)}
                                className="text-[13px] font-[600] text-[#0F50AA] hover:underline whitespace-nowrap flex items-center gap-1"
                              >
                                <Hash size={10} />{row.ref}
                              </button>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[11px] font-[600] px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                                {row.type}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-[200px]">
                              <p className="text-[12px] text-[#667085] truncate" title={row.description}>
                                {row.description}
                              </p>
                            </td>

                            <td className="py-3.5 px-4">
                              {row.debit > 0 ? (
                                <span className="text-[13px] font-[700] text-[#EF4444]">
                                  Rs. {row.debit.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#C8CDD5]">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {row.credit > 0 ? (
                                <span className="text-[13px] font-[700] text-[#199D26]">
                                  Rs. {row.credit.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[12px] text-[#C8CDD5]">-</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`text-[13px] font-[700] ${row.balance === 0 ? "text-[#199D26]" : row.status === "Overdue" ? "text-[#EF4444]" : "text-[#383E49]"}`}>
                                Rs. {row.balance.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-[500] px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                {statusStyle.icon}{row.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => setDocModal(row)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EEF3FB] text-[#0F50AA] text-[11px] font-[500] rounded-lg hover:bg-[#0F50AA] hover:text-white transition-colors"
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E4E6EA]">
                    <p className="text-[12px] text-[#667085]">
                      Page {page} of {totalPages} - {sorted.length} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={15} className="text-[#667085]" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-[#0F50AA] text-white" : "text-[#667085] hover:bg-[#F0F1F3]"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={15} className="text-[#667085]" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Document View Modal */}
      {docModal && (
        <DocViewModal row={docModal} onClose={() => setDocModal(null)} />
      )}

      {adjModalOpen && (
        <ManualAdjustmentModal
          suppliers={suppliers}
          preSelectedId={selectedSupplier}
          onClose={() => setAdjModalOpen(false)}
          onSuccess={() => {
            setAdjModalOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function ManualAdjustmentModal({ suppliers, preSelectedId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    supplierId: preSelectedId || "",
    adjustmentDate: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    remarks: "",
  });

  const baseUrl = process.env.REACT_APP_BASE_URL;
  const authHeaders = () => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId) return setError("Please select a supplier");
    if (!formData.amount || isNaN(formData.amount)) return setError("Please enter a valid amount");
    if (!formData.remarks) return setError("Remarks are required");

    const sup = suppliers.find(s => s.id === formData.supplierId);
    if (!sup) return setError("Invalid supplier selected");

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${baseUrl}/api/v1/finance/manual-adjustments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          supplierId: sup.supplierId,
          date: formData.adjustmentDate,
          amount: parseFloat(formData.amount),
          description: formData.description,
          remarks: formData.remarks,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create adjustment");
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E6EA] flex items-center justify-between bg-[#F8F9FA]">
          <h3 className="text-[16px] font-[600] text-[#383E49]">New Manual Adjustment</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#E4E6EA] rounded-full transition-colors">
            <X size={18} className="text-[#667085]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0F50AA] outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase">Date</label>
              <input
                type="date"
                value={formData.adjustmentDate}
                onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0F50AA] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase">Amount (Rs.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Positive for Debit, Negative for Credit"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0F50AA] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase">Description</label>
            <input
              type="text"
              placeholder="Short summary of the adjustment"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0F50AA] outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase">Remarks (Internal)</label>
            <textarea
              rows="3"
              placeholder="Detailed reason for this manual adjustment..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:ring-2 focus:ring-[#0F50AA] outline-none resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E4E6EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#667085] text-[13px] font-[500] hover:bg-[#F8F9FA] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-all disabled:opacity-50"
            >
              {loading ? <Loader variant="inline" /> : <Plus size={16} />}
              Create Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
