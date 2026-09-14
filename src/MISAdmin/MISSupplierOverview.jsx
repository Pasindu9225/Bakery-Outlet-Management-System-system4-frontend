import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Calendar,
  FileText,
  FileSpreadsheet,
  Printer,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Banknote,
} from "lucide-react";

import MISAdminNavBar from "../component/MISAdminNavBar.jsx";
import MISAdminSideBar from "../component/MISAdminSideBar.jsx";
import Loader from "../component/Loader.jsx";
import { generatePDF, generateExcel } from "../utils/exportUtils.js";



// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const formatMoney = (n) => {
  const v = Number(n);
  if (n == null || Number.isNaN(v)) return "Rs. 0";
  return `Rs. ${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
  if (!d) return "—";
  return d;
};


// ──────────────────────────────────────────────────────────────────────
// Detail modal — fetches its own data on mount.
// ──────────────────────────────────────────────────────────────────────

function SupplierDetailModal({ supplierId, baseUrl, authHeaders, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [poGrns, setPoGrns] = useState([]);

  const [txSearch, setTxSearch] = useState("");
  const [txSortCol, setTxSortCol] = useState("date");
  const [txSortDir, setTxSortDir] = useState("desc");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = authHeaders();
        const [detailRes, txRes, poRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/mis/suppliers/${supplierId}`, { headers }),
          fetch(`${baseUrl}/api/v1/mis/suppliers/${supplierId}/transactions`, { headers }),
          fetch(`${baseUrl}/api/v1/mis/suppliers/${supplierId}/po-grn`, { headers }),
        ]);
        if (!detailRes.ok) throw new Error(`Detail request failed (${detailRes.status})`);
        if (!txRes.ok) throw new Error(`Transactions request failed (${txRes.status})`);
        if (!poRes.ok) throw new Error(`PO/GRN request failed (${poRes.status})`);
        const [detailJson, txJson, poJson] = await Promise.all([
          detailRes.json(),
          txRes.json(),
          poRes.json(),
        ]);
        if (cancelled) return;
        setDetail(detailJson);
        setTransactions(Array.isArray(txJson) ? txJson : []);
        setPoGrns(Array.isArray(poJson) ? poJson : []);
      } catch (err) {
        if (cancelled) return;
        console.error("MIS supplier detail load failed:", err);
        setError(err.message || "Failed to load supplier details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [supplierId, baseUrl, authHeaders]);

  const filteredTx = useMemo(() => {
    const s = txSearch.toLowerCase();
    const rows = !s ? transactions : transactions.filter((t) =>
      (t.ref || "").toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s)
    );
    return [...rows].sort((a, b) => {
      let av = a[txSortCol];
      let bv = b[txSortCol];
      if (txSortCol === "debit" || txSortCol === "credit" || txSortCol === "balance") {
        av = Number(av || 0);
        bv = Number(bv || 0);
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return txSortDir === "asc" ? -1 : 1;
      if (av > bv) return txSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [transactions, txSearch, txSortCol, txSortDir]);

  const handleTxSort = (col) => {
    if (txSortCol === col) setTxSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setTxSortCol(col); setTxSortDir("asc"); }
  };

  const TxSortIcon = ({ col }) => {
    if (txSortCol !== col) return <ArrowUpDown size={11} className="text-[#C8CDD5]" />;
    return txSortDir === "asc" ? <ArrowUp size={11} className="text-[#0F50AA]" /> : <ArrowDown size={11} className="text-[#0F50AA]" />;
  };

  const handleExportPDF = () => {
    if (!detail) return;
    const headers = ["Date", "Reference", "Description", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)"];
    const data = transactions.map(tx => [
      tx.date || "—",
      tx.ref || "—",
      tx.description || "—",
      tx.debit || 0,
      tx.credit || 0,
      tx.balance || 0
    ]);
    generatePDF({
      title: `Supplier Statement: ${detail.name}`,
      subtitle: `Registration ID: ${detail.registrationId || "—"}`,
      headers,
      data,
      fileName: `Supplier_${detail.id}_Statement`,
      summary: [
        { label: "Total Outstanding", value: formatMoney(detail.outstandingBalance) }
      ]
    });
  };

  const handleExportExcel = () => {
    if (!detail) return;
    const headers = ["Date", "Reference", "Description", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)"];
    const data = transactions.map(tx => [
      tx.date || "—",
      tx.ref || "—",
      tx.description || "—",
      tx.debit || 0,
      tx.credit || 0,
      tx.balance || 0
    ]);
    generateExcel({
      headers,
      data,
      fileName: `Supplier_${detail.id}_Transactions`
    });
  };

  const deliveryStatus = (s) => {
    if (s === "Delivered") return "text-[#199D26] bg-[#F0FDF4]";
    if (s === "Pending") return "text-[#F4A100] bg-[#FFFBEB]";
    return "text-[#667085] bg-[#F0F1F3]";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="p-6 border-b border-[#E4E6EA] flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0F50AA] rounded-xl flex items-center justify-center text-white font-[700] text-[16px]">
              {detail?.name?.charAt(0) || "?"}
            </div>
            <div>
              <h3 className="text-[20px] font-[600] text-[#383E49]">{detail?.name || "Loading..."}</h3>
              <p className="text-[12px] text-[#667085] mt-0.5 flex items-center gap-1">
                <Hash size={11} />{detail?.id || "—"} {detail?.registrationId ? `· Reg: ${detail.registrationId}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA]">
              <FileText size={13} /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494]">
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors ml-1">
              <X size={18} className="text-[#667085]" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {loading && (
            <div className="text-center py-16">
              <RefreshCw size={32} className="mx-auto text-[#0F50AA] mb-3 animate-spin" />
              <p className="text-[14px] font-[500] text-[#383E49]">Loading supplier details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-[500] text-red-700">Failed to load supplier details</p>
                <p className="text-[12px] text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Profile Info */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-[#E4E6EA]">
                <h4 className="text-[15px] font-[600] text-[#383E49] mb-4">Profile Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Phone size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Phone</p>
                      <p className="text-[13px] font-[500] text-[#383E49]">{detail.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Email</p>
                      <p className="text-[13px] font-[500] text-[#383E49]">{detail.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Address</p>
                      <p className="text-[13px] font-[500] text-[#383E49]">{detail.address || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Registration Date</p>
                      <p className="text-[13px] font-[500] text-[#383E49]">{formatDate(detail.registrationDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Registration ID</p>
                      <p className="text-[13px] font-[500] text-[#383E49]">{detail.registrationId || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Banknote size={15} className="text-[#0F50AA] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#667085]">Outstanding Balance</p>
                      <p className={`text-[13px] font-[700] ${Number(detail.outstandingBalance) > 0 ? (detail.overdue ? "text-[#EF4444]" : "text-[#F4A100]") : "text-[#199D26]"}`}>
                        {formatMoney(detail.outstandingBalance)}
                        {detail.overdue && Number(detail.outstandingBalance) > 0 && (
                          <span className="ml-1.5 text-[10px] font-[500] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">Overdue</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[15px] font-[600] text-[#383E49]">Transaction History</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                    <input type="text" placeholder="Search ref or description..."
                      className="pl-8 pr-3 py-1.5 border border-[#E4E6EA] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] w-52"
                      value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
                  </div>
                </div>
                <div className="border border-[#E4E6EA] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                        {[
                          { key: "date", label: "Date" },
                          { key: "ref", label: "Reference" },
                          { key: "description", label: "Description" },
                          { key: "debit", label: "Debit (Rs.)" },
                          { key: "credit", label: "Credit (Rs.)" },
                          { key: "balance", label: "Balance (Rs.)" },
                        ].map((col) => (
                          <th key={col.key} onClick={() => handleTxSort(col.key)}
                            className="text-left py-3 px-4 text-[12px] font-[500] text-[#667085] cursor-pointer hover:text-[#383E49]">
                            <div className="flex items-center gap-1">{col.label}<TxSortIcon col={col.key} /></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.length === 0 ? (
                        <tr><td colSpan={6} className="py-10 text-center text-[13px] text-[#667085]">No transactions found</td></tr>
                      ) : filteredTx.map((tx, i) => (
                        <tr key={tx.id || i} className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA]">
                          <td className="py-3 px-4 text-[12px] text-[#383E49]">{tx.date || "—"}</td>
                          <td className="py-3 px-4">
                            <span className="text-[12px] font-[500] text-[#0F50AA]">{tx.ref}</span>
                          </td>
                          <td className="py-3 px-4 text-[12px] text-[#667085]">{tx.description}</td>
                          <td className="py-3 px-4 text-[12px] font-[600] text-[#EF4444]">
                            {Number(tx.debit) > 0 ? formatMoney(tx.debit) : "—"}
                          </td>
                          <td className="py-3 px-4 text-[12px] font-[600] text-[#199D26]">
                            {Number(tx.credit) > 0 ? formatMoney(tx.credit) : "—"}
                          </td>
                          <td className="py-3 px-4 text-[12px] font-[700] text-[#383E49]">
                            {formatMoney(tx.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purchase & Delivery Records */}
              <div>
                <h4 className="text-[15px] font-[600] text-[#383E49] mb-3">Purchase & Delivery Records</h4>
                <div className="border border-[#E4E6EA] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                        {["PO Number", "PO Date", "GRN Number", "GRN Date", "Product", "Qty", "Amount (Rs.)", "Status"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-[12px] font-[500] text-[#667085]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {poGrns.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-[13px] text-[#667085]">No records found</td></tr>
                      ) : poGrns.map((r, i) => (
                        <tr key={r.poNo || i} className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA]">
                          <td className="py-3 px-4 text-[12px] font-[500] text-[#0F50AA]">{r.poNo}</td>
                          <td className="py-3 px-4 text-[12px] text-[#383E49]">{formatDate(r.poDate)}</td>
                          <td className="py-3 px-4 text-[12px] font-[500] text-[#383E49]">{r.grnNo}</td>
                          <td className="py-3 px-4 text-[12px] text-[#383E49]">{formatDate(r.grnDate)}</td>
                          <td className="py-3 px-4 text-[12px] font-[500] text-[#383E49]">{r.productSummary}</td>
                          <td className="py-3 px-4 text-[12px] text-[#383E49]">{r.qty != null ? Number(r.qty).toLocaleString() : "—"} {r.unit || ""}</td>
                          <td className="py-3 px-4 text-[12px] font-[600] text-[#383E49]">{formatMoney(r.amount)}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${deliveryStatus(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────

export default function MISSupplierOverview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Supplier Overview";

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeCount: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);

  // Table
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Detail modal — store the id rather than the full row so the modal
  // always re-fetches fresh data.
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const baseUrl = process.env.REACT_APP_BASE_URL;

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/mis/suppliers/summary`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Summary request failed (${res.status})`);
      const data = await res.json();
      setSummary({
        totalSuppliers: data.totalSuppliers ?? 0,
        activeCount: data.activeCount ?? 0,
        totalOutstanding: Number(data.totalOutstanding ?? 0),
        overdueCount: data.overdueCount ?? 0,
      });
    } catch (err) {
      console.error("MIS supplier summary load failed:", err);
      // Surface to the table-level banner so users see a single error.
      setPageError(err.message || "Failed to load supplier summary");
    }
  }, [baseUrl, authHeaders]);

  const fetchList = useCallback(async () => {
    // Validation
    const today = new Date().toISOString().split("T")[0];
    if (startDate && startDate > today) { setPageError("Start date cannot be in the future."); return; }
    if (endDate && endDate > today) { setPageError("End date cannot be in the future."); return; }
    if (startDate && endDate && startDate > endDate) { setPageError("Start date cannot be after end date."); return; }

    try {
      setLoading(true);
      setPageError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const url = `${baseUrl}/api/v1/mis/suppliers${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Suppliers request failed (${res.status})`);
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err) {
      console.error("MIS supplier list load failed:", err);
      setPageError(err.message || "Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authHeaders, searchTerm, statusFilter, startDate, endDate]);

  // Initial load: summary + list.
  useEffect(() => {
    fetchSummary();
    fetchList();
  }, []);

  // Re-fetch list whenever filters change.
  useEffect(() => {
    fetchList();
  }, [searchTerm, statusFilter, startDate, endDate]);

  const handleRefresh = () => {
    fetchSummary();
    fetchList();
  };

  const handleClearFilters = () => {
    setSearchTerm(""); setStatusFilter("All");
    setStartDate(""); setEndDate(""); setPage(1);
  };

  // Client-side sort over the server-filtered list.
  const sorted = useMemo(() => {
    return [...suppliers].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (sortCol === "outstandingBalance") {
        av = Number(av || 0);
        bv = Number(bv || 0);
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [suppliers, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const handleExportPDF = () => {
    const headers = ["ID", "Name", "Phone", "Status", "Outstanding", "Last Transaction"];
    const data = suppliers.map(s => [
      s.id || "—",
      s.name || "—",
      s.phone || "—",
      s.status || "—",
      formatMoney(s.outstandingBalance),
      s.lastTransactionDate || "—"
    ]);
    generatePDF({
      title: "MIS Supplier Summary Report",
      subtitle: `Report generated on ${new Date().toLocaleDateString()}`,
      headers,
      data,
      fileName: "MIS_Supplier_Summary",
      summary: [
        { label: "Total Suppliers", value: summary.totalSuppliers },
        { label: "Total Outstanding", value: formatMoney(summary.totalOutstanding) }
      ]
    });
  };

  const handleExportExcel = () => {
    const headers = ["ID", "Name", "Phone", "Email", "Status", "Outstanding", "Last Transaction"];
    const data = suppliers.map(s => [
      s.id || "—",
      s.name || "—",
      s.phone || "—",
      s.email || "—",
      s.status || "—",
      s.outstandingBalance || 0,
      s.lastTransactionDate || "—"
    ]);
    generateExcel({
      headers,
      data,
      fileName: "MIS_Supplier_Summary"
    });
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-[#0F50AA]" /> : <ArrowDown size={12} className="text-[#0F50AA]" />;
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <MISAdminSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MISAdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection={activeSection} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Supplier Overview</h1>
              <p className="text-[14px] text-[#667085]">Comprehensive view of all suppliers and their performance metrics</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors">
                <RefreshCw size={15} />
                Refresh
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors">
                <FileText size={15} /> PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors">
                <FileSpreadsheet size={15} /> Excel
              </button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[
              { label: "Total Suppliers", value: summary.totalSuppliers, icon: <Users size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
              { label: "Active Suppliers", value: summary.activeCount, icon: <CheckCircle size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
              { label: "Total Outstanding", value: formatMoney(summary.totalOutstanding), icon: <Banknote size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
              { label: "Overdue Accounts", value: summary.overdueCount, icon: <AlertTriangle size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
            ].map((card, i) => (
              <div key={i}
                className={`${card.color} ${card.hoverColor} rounded-lg p-5 text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-white/80 mb-2">{card.label}</p>
                    <h2 className="text-[28px] font-bold leading-none">{card.value}</h2>
                  </div>
                  <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter Panel ── */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">

              {/* Search */}
              <div className="lg:col-span-4 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="Search by supplier name or ID..."
                  className="w-full pl-9 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Status */}
              <div className="lg:col-span-2 relative">
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors"
                >
                  <Filter size={14} className="text-[#667085]" />
                  <span className="flex-1 text-left truncate">
                    {statusFilter}
                  </span>
                  <ChevronDown size={13} className="text-[#667085]" />
                </button>

                {statusOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 w-full">
                    {["All", "Active", "Inactive"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setStatusFilter(opt);
                          setStatusOpen(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors first:rounded-t-lg last:rounded-b-lg ${statusFilter === opt
                            ? "text-[#0F50AA] font-[500] bg-[#F0F1F3]"
                            : "text-[#383E49]"
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]"
                    size={13}
                  />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]"
                    size={13}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>
              </div>

              {/* Clear Button */}
              <div className="lg:col-span-2">
                <button
                  onClick={handleClearFilters}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                >
                  <RefreshCw size={13} />
                  Clear
                </button>
              </div>

            </div>
          </div>

          {/* ── Error Banner ── */}
          {pageError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[14px] font-[500] text-red-700">Failed to load supplier data</p>
                <p className="text-[12px] text-red-600 mt-1">{pageError}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="text-[12px] font-[500] text-red-700 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Supplier Table ── */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">Supplier List</h3>
                <p className="text-[12px] text-[#667085] mt-0.5">
                  Showing {paginated.length} of {sorted.length} suppliers
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA]">
                <Printer size={13} /> Print
              </button>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading suppliers..." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                        {[
                          { key: "name", label: "Supplier Name" },
                          { key: "contact", label: "Contact Info", noSort: true },
                          { key: "status", label: "Status" },
                          { key: "outstandingBalance", label: "Outstanding Balance" },
                          { key: "lastTransactionDate", label: "Last Transaction" },
                          { key: "actions", label: "Actions", noSort: true },
                        ].map((col) => (
                          <th key={col.key}
                            onClick={() => !col.noSort && handleSort(col.key)}
                            className={`text-left py-3.5 px-4 text-[12px] font-[500] text-[#667085] ${col.noSort ? "" : "cursor-pointer hover:text-[#383E49]"}`}>
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
                          <td colSpan={6} className="py-16 text-center">
                            <Users size={40} className="mx-auto text-[#C8CDD5] mb-3" />
                            <p className="text-[14px] font-[500] text-[#383E49]">No suppliers found</p>
                            <p className="text-[12px] text-[#667085]">Try adjusting your filters</p>
                          </td>
                        </tr>
                      ) : paginated.map((s) => (
                        <tr key={s.id || s.supplierId}
                          className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors">

                          {/* Supplier Name */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#EEF3FB] rounded-lg flex items-center justify-center text-[#0F50AA] font-[700] text-[14px] flex-shrink-0">
                                {(s.name || "?").charAt(0)}
                              </div>
                              <div>
                                <p className="text-[13px] font-[600] text-[#383E49]">{s.name}</p>
                                <p className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                                  <Hash size={9} />{s.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Phone size={11} className="text-[#667085]" />
                              <span className="text-[12px] text-[#383E49]">{s.phone || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail size={11} className="text-[#667085]" />
                              <span className="text-[12px] text-[#667085]">{s.email || "—"}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-3 py-1 rounded-full ${s.status === "Active"
                                ? "text-[#199D26] bg-[#F0FDF4]"
                                : "text-[#667085] bg-[#F0F1F3]"
                              }`}>
                              {s.status === "Active"
                                ? <CheckCircle size={12} />
                                : <Clock size={12} />}
                              {s.status}
                            </span>
                          </td>

                          {/* Outstanding Balance */}
                          <td className="py-4 px-4">
                            <p className={`text-[14px] font-[700] ${Number(s.outstandingBalance) === 0
                                ? "text-[#199D26]"
                                : s.overdue
                                  ? "text-[#EF4444]"
                                  : "text-[#F4A100]"
                              }`}>
                              {formatMoney(s.outstandingBalance)}
                            </p>
                            {s.overdue && Number(s.outstandingBalance) > 0 && (
                              <span className="text-[10px] font-[500] text-[#EF4444] flex items-center gap-0.5 mt-0.5">
                                <AlertTriangle size={9} /> Overdue
                              </span>
                            )}
                            {Number(s.outstandingBalance) === 0 && (
                              <span className="text-[10px] font-[500] text-[#199D26]">Cleared</span>
                            )}
                          </td>

                          {/* Last Transaction */}
                          <td className="py-4 px-4">
                            <p className="text-[13px] font-[500] text-[#383E49]">{formatDate(s.lastTransactionDate)}</p>
                            <p className="text-[11px] text-[#667085] mt-0.5">{s.totalPos ?? 0} POs · {s.totalGrns ?? 0} GRNs</p>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedSupplierId(s.supplierId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors">
                                <Eye size={13} />
                                Details
                              </button>
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F1F3] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#E4E6EA] transition-colors">
                                <FileSpreadsheet size={13} />
                                Export
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E4E6EA]">
                    <p className="text-[12px] text-[#667085]">
                      Page {page} of {totalPages} · {sorted.length} suppliers
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft size={15} className="text-[#667085]" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-[#0F50AA] text-white" : "text-[#667085] hover:bg-[#F0F1F3]"}`}>
                          {p}
                        </button>
                      ))}
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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

      {/* Supplier Detail Modal */}
      {selectedSupplierId != null && (
        <SupplierDetailModal
          supplierId={selectedSupplierId}
          baseUrl={baseUrl}
          authHeaders={authHeaders}
          onClose={() => setSelectedSupplierId(null)}
        />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
