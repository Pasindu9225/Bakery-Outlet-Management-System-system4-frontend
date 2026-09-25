import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { themeColor, categoryToken } from "../utils/themeColors";
import {
  RefreshCw,
  ChevronDown,
  Search,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Eye,
  AlertTriangle,
  Banknote,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import MISAdminNavBar from "../component/MISAdminNavBar.jsx";
import MISAdminSideBar from "../component/MISAdminSideBar.jsx";
import Loader from "../component/Loader.jsx";
import { generatePDF, generateExcel } from "../utils/exportUtils.js";


// Granularity values mirror the backend enum (DAILY|MONTHLY|YEARLY) — the
// label is purely cosmetic.
const GRANULARITY_OPTIONS = [
  { code: "DAILY", label: "Daily" },
  { code: "MONTHLY", label: "Monthly" },
  { code: "YEARLY", label: "Yearly" },
];

// Colour per category (design tokens, so they follow the light/dark theme).
// Other categories get a stable colour picked from their name (see categoryToken).
const CATEGORY_COLORS = {
  "Poultry & Meat": "brand-fg",
  "Vegetables & Fruits": "success",
  "Dairy": "info",
  "Grains & Flour": "warning",
  "Oils & Fats": "chart-orange",
  "Bakery Inputs": "violet",
  "Beverages": "chart-cyan",
  "Spices & Herbs": "chart-pink",
  "Uncategorized": "fg-muted",
};
const categoryColor = (label, alpha) => themeColor(categoryToken(label, CATEGORY_COLORS), alpha);

const ALL_SUPPLIERS = { id: null, label: "All Suppliers" };
const ALL_CATEGORIES = { value: null, label: "All Categories" };
const ALL_OUTLETS = { id: null, label: "All Outlets" };

const RECORDS_THRESHOLD = 50;

const formatMoney = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "Rs. 0";
  const v = Number(n);
  return `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString() : "0");


function DrillDownModal({ title, rows, onClose }) {
  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-line flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-[17px] font-[600] text-fg">{title}</h3>
            <p className="text-[12px] text-fg-secondary mt-0.5">{rows.length} record{rows.length !== 1 ? "s" : ""} found</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app rounded-lg transition-colors">
            <X size={18} className="text-fg-secondary" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-subtle">
              <tr className="border-b border-line">
                {["PO Number", "Date", "Supplier", "Product", "Qty", "Unit Cost", "Total", "Status"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[12px] font-[500] text-fg-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.poNo}-${r.product}-${i}`} className="border-b border-line hover:bg-subtle">
                  <td className="py-3 px-4 text-[12px] font-[500] text-brand-fg">{r.poNo}</td>
                  <td className="py-3 px-4 text-[12px] text-fg">{r.poDate || "—"}</td>
                  <td className="py-3 px-4 text-[12px] text-fg">{r.supplier}</td>
                  <td className="py-3 px-4 text-[12px] font-[500] text-fg">{r.product}</td>
                  <td className="py-3 px-4 text-[12px] text-fg">{Number(r.qty || 0)} {r.unit || ""}</td>
                  <td className="py-3 px-4 text-[12px] text-fg">{formatMoney(r.unitCost)}</td>
                  <td className="py-3 px-4 text-[12px] font-[600] text-fg">{formatMoney(r.totalCost)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-[500] px-2.5 py-1 rounded-full ${r.status === "Received" ? "text-success bg-hover" : r.status === "Cancelled" ? "text-error bg-hover" : "text-warning bg-hover"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-line flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle">Close</button>
        </div>
      </div>
    </div>
  );
}


function DualLineChart({ data, onPointClick }) {
  if (!data || data.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-fg-secondary text-[13px]">No trend data</div>;
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "This Year",
        data: data.map((d) => Number(d.thisYear || 0)),
        borderColor: themeColor("brand-fg"),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, themeColor("brand-fg", 0.15));
          gradient.addColorStop(1, themeColor("brand-fg", 0));
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: themeColor("surface"),
        pointBorderColor: themeColor("brand-fg"),
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: themeColor("brand-fg"),
        pointHoverBorderColor: themeColor("surface"),
        pointHoverBorderWidth: 2,
      },
      {
        label: "Last Year",
        data: data.map((d) => Number(d.lastYear || 0)),
        borderColor: themeColor("fg-muted"),
        borderDash: [5, 5],
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        pointRadius: 0, // Keep last year cleaner
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: themeColor("fg-secondary"),
        },
      },
      tooltip: {
        backgroundColor: themeColor("elevated"),
        titleColor: themeColor("fg"),
        bodyColor: themeColor("fg-secondary"),
        borderColor: themeColor("border"),
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatMoney(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: themeColor("fg-secondary") },
      },
      y: {
        grid: { color: themeColor("border"), drawBorder: false },
        ticks: {
          font: { size: 11 },
          color: themeColor("fg-secondary"),
          callback: (value) => (value >= 1000 ? `Rs. ${value / 1000}k` : `Rs. ${value}`),
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onPointClick) {
        const index = elements[0].index;
        onPointClick(data[index]);
      }
    },
  };

  return (
    <div className="h-[260px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}


function GroupedBarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-fg-secondary text-[13px]">No trend data</div>;
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "This Year",
        data: data.map((d) => Number(d.thisYear || 0)),
        backgroundColor: themeColor("brand-fg"),
        borderRadius: 4,
      },
      {
        label: "Last Year",
        data: data.map((d) => Number(d.lastYear || 0)),
        backgroundColor: themeColor("fg-muted"),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 11 },
          color: themeColor("fg-secondary"),
        },
      },
      tooltip: {
        backgroundColor: themeColor("elevated"),
        titleColor: themeColor("fg"),
        bodyColor: themeColor("fg-secondary"),
        borderColor: themeColor("border"),
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatMoney(context.raw)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: themeColor("border"), drawBorder: false },
        ticks: {
          callback: (value) => (value >= 1000 ? `Rs. ${value / 1000}k` : `Rs. ${value}`),
        },
      },
    },
  };

  return (
    <div className="h-[260px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}


function CategoryDonut({ data, onSliceClick }) {
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0);

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const centerTextPlugin = {
    id: "centerText",
    // Drawn after the ring, centred in the hole (the chart area, not the whole canvas, which includes the legend).
    afterDatasetsDraw: (chart) => {
      const { ctx, height } = chart;
      const { left, right, top, bottom } = chart.chartArea;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      ctx.save();
      const fontSize = (height / 150).toFixed(2);
      ctx.font = `bold ${fontSize}em sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = themeColor("fg");

      const text = total >= 1000 ? `Rs. ${(total / 1000).toFixed(1)}k` : `Rs. ${total}`;
      const textX = Math.round(cx - ctx.measureText(text).width / 2);
      const textY = cy - 5;
      ctx.fillText(text, textX, textY);

      ctx.font = `${(height / 350).toFixed(2)}em sans-serif`;
      ctx.fillStyle = themeColor("fg-secondary");
      const subtext = "Total Spend";
      const subtextX = Math.round(cx - ctx.measureText(subtext).width / 2);
      const subtextY = cy + 15;
      ctx.fillText(subtext, subtextX, subtextY);
      ctx.restore();
    },
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 },
          color: themeColor("fg-secondary"),
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = Math.round((value / total) * 100);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  fontColor: themeColor("fg-secondary"),
                  hidden: false,
                  index: i,
                  pointStyle: 'rectRounded'
                };
              });
            }
            return [];
          }
        },
      },
      tooltip: {
        backgroundColor: themeColor("elevated"),
        titleColor: themeColor("fg"),
        bodyColor: themeColor("fg-secondary"),
        borderColor: themeColor("border"),
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `${context.label}: ${formatMoney(context.raw)}`,
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onSliceClick) {
        const index = elements[0].index;
        onSliceClick(data[index]);
      }
    },
  };

  return (
    <div className="h-[280px] w-full">
      <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
    </div>
  );
}


export default function MISPurchasingTrends() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Purchasing Trends";

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [supplierOptions, setSupplierOptions] = useState([ALL_SUPPLIERS]);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplier, setSupplier] = useState(ALL_SUPPLIERS);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [outlet, setOutlet] = useState(ALL_OUTLETS);
  const [granularity, setGranularity] = useState(GRANULARITY_OPTIONS[1]); // MONTHLY
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [outletOpen, setOutletOpen] = useState(false);
  const [granularityOpen, setGranularityOpen] = useState(false);

  // Table
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState("poDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Drill-down
  const [drillDown, setDrillDown] = useState(null);

  const baseUrl = process.env.REACT_APP_BASE_URL;

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // ── Fetchers ──

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/finance/suppliers`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Suppliers request failed (${res.status})`);
      const data = await res.json();
      const opts = (Array.isArray(data) ? data : []).map((s) => ({
        id: s.supplierId,
        label: s.name,
      }));
      setSupplierOptions([ALL_SUPPLIERS, ...opts]);
    } catch (err) {
      console.error("MIS purchasing: supplier list failed:", err);
      // Soft failure — supplier dropdown stays at "All Suppliers"; the
      // user can still see / filter by anything else and the dashboard
      // payload still renders.
    }
  }, [baseUrl, authHeaders]);

  const fetchDashboard = useCallback(async () => {
    // Validation
    const today = new Date().toISOString().split("T")[0];
    if (startDate && startDate > today) { setPageError("Start date cannot be in the future."); return; }
    if (endDate && endDate > today) { setPageError("End date cannot be in the future."); return; }
    if (startDate && endDate && startDate > endDate) { setPageError("Start date cannot be after end date."); return; }

    try {
      setLoading(true);
      setPageError(null);
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (supplier?.id != null) params.set("supplierId", supplier.id);
      if (category?.value) params.set("category", category.value);
      if (outlet?.id != null) params.set("outletId", outlet.id);
      if (granularity?.code) params.set("granularity", granularity.code);

      const url = `${baseUrl}/api/v1/mis/purchasing/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setDashboard(data);
      setPage(1);
    } catch (err) {
      console.error("MIS purchasing dashboard load failed:", err);
      setPageError(err.message || "Failed to load purchasing trends.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authHeaders, startDate, endDate, supplier, category, outlet, granularity]);

  // Initial load — suppliers in parallel with first dashboard fetch.
  useEffect(() => {
    fetchSuppliers();
    fetchDashboard();
  }, []);

  // Re-fetch dashboard whenever any filter changes. Suppliers list stays
  // cached from the initial mount.
  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate, supplier, category, outlet, granularity]);

  // ── Derived ──

  const records = useMemo(() => dashboard?.records || [], [dashboard]);
  const summary = dashboard?.summary || {};
  const trend = dashboard?.trend || [];
  const supplierRanking = dashboard?.supplierRanking || [];

  // Category options: derive from records (so we only show categories that
  // actually have spend in the current window). Backend uses
  // "Uncategorized" as the fallback label, which we keep.
  const categoryOptions = useMemo(() => {
    const seen = new Set();
    records.forEach((r) => {
      if (r.category && !seen.has(r.category)) seen.add(r.category);
    });
    return [ALL_CATEGORIES, ...Array.from(seen).map((label) => ({ value: label, label }))];
  }, [records]);

  // Outlet options: backend ignores outlet today (POs are central) so we
  // keep the dropdown as a single placeholder. The user still sees the
  // banner explaining the limitation when they pick a real outlet.
  const outletOptions = useMemo(() => [ALL_OUTLETS], []);

  // Category breakdown — colour up via the static palette, fall back to a
  // neutral grey for new categories the palette doesn't know about.
  const categoryData = useMemo(() => {
    const list = dashboard?.categoryBreakdown || [];
    return list.map((c) => ({
      label: c.label,
      value: Number(c.value || 0),
      color: categoryColor(c.label),
    }));
  }, [dashboard, theme]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSupplier(ALL_SUPPLIERS);
    setCategory(ALL_CATEGORIES);
    setOutlet(ALL_OUTLETS);
    setSearchTerm("");
    setPage(1);
    // Filter-state changes trigger fetchDashboard via the effect above.
  };

  // Server-side records cap is 200; if we ever bump up against the
  // RECORDS_THRESHOLD (50), call /records to walk the full result set
  // page-by-page so the user can still explore older POs.
  const filteredTable = useMemo(() => {
    if (!searchTerm) return records;
    const s = searchTerm.toLowerCase();
    return records.filter((r) =>
      (r.poNo || "").toLowerCase().includes(s)
      || (r.product || "").toLowerCase().includes(s)
      || (r.supplier || "").toLowerCase().includes(s)
    );
  }, [records, searchTerm]);

  const sorted = useMemo(() => {
    return [...filteredTable].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "totalCost" || sortCol === "qty" || sortCol === "unitCost") {
        av = av != null ? Number(av) : 0;
        bv = bv != null ? Number(bv) : 0;
      } else {
        av = av != null ? String(av) : "";
        bv = bv != null ? String(bv) : "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTable, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const handleExportPDF = () => {
    if (!dashboard || !dashboard.records) return;
    const headers = ["PO Number", "Date", "Supplier", "Category", "Product", "Qty", "Total Cost", "Status"];
    const data = dashboard.records.map(r => [
      r.poNo || "—",
      r.poDate || "—",
      r.supplier || "—",
      r.category || "—",
      r.product || "—",
      `${r.qty || 0} ${r.unit || ""}`,
      formatMoney(r.totalCost),
      r.status || "—"
    ]);

    generatePDF({
      title: "MIS Purchasing Trends Report",
      subtitle: `Report from ${startDate || "All Time"} to ${endDate || "Today"} (${granularity.label})`,
      headers,
      data,
      fileName: "MIS_Purchasing_Report",
      summary: [
        { label: "Total Spend", value: formatMoney(summary.totalSpend) },
        { label: "Total POs", value: summary.totalPos || 0 },
        { label: "Avg Order Value", value: formatMoney(summary.avgOrderValue) }
      ]
    });
  };

  const handleExportExcel = () => {
    if (!dashboard || !dashboard.records) return;
    const headers = ["PO Number", "Date", "Supplier", "Category", "Product", "Qty", "Total Cost", "Status"];
    const data = dashboard.records.map(r => [
      r.poNo || "—",
      r.poDate || "—",
      r.supplier || "—",
      r.category || "—",
      r.product || "—",
      r.qty || 0,
      r.totalCost || 0,
      r.status || "—"
    ]);
    generateExcel({
      headers,
      data,
      fileName: "MIS_Purchasing_Report"
    });
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-brand-fg" /> : <ArrowDown size={12} className="text-brand-fg" />;
  };

  // ── Summary card values ──
  const totalPOs = summary.totalPos ?? 0;
  const totalSpend = summary.totalSpend ?? 0;
  const avgOrderValue = summary.avgOrderValue ?? 0;
  const pendingPOs = summary.pendingPos ?? 0;

  // Supplier ranking — backend already sorts desc by totalSpend, but we
  // slice to 5 here so the widget stays visually identical to the spec.
  const top5Suppliers = supplierRanking.slice(0, 5);
  const topSpend = top5Suppliers.length > 0 ? Number(top5Suppliers[0].totalSpend || 0) : 1;

  // Generic dropdown — accepts either {label} or string options. We pass
  // {label,id|value} shapes.
  const Dropdown = ({ open, setOpen, value, options, onChange, icon: Icon, optionKey = "label" }) => (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 border border-line rounded-lg text-[13px] text-fg bg-surface hover:bg-subtle transition-colors w-full min-w-[148px]">
        {Icon && <Icon size={13} className="text-fg-secondary flex-shrink-0" />}
        <span className="flex-1 text-left truncate">{value?.[optionKey] ?? value}</span>
        <ChevronDown size={13} className="text-fg-secondary flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-elevated border border-line rounded-lg shadow-lg z-50 min-w-full max-h-60 overflow-y-auto">
          {options.map((o, idx) => {
            const label = o?.[optionKey] ?? o;
            const selected = (value?.[optionKey] ?? value) === label;
            return (
              <button key={`${label}-${idx}`} onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-subtle transition-colors first:rounded-t-lg last:rounded-b-lg ${selected ? "text-brand-fg font-[500] bg-app" : "text-fg"}`}>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <MISAdminSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MISAdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection={activeSection} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg mb-1">Purchasing Trends</h1>
              <p className="text-[14px] text-fg-secondary">Analyze purchasing patterns, costs, and supplier performance over time</p>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <button onClick={fetchDashboard}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors">
                <RefreshCw size={15} /> Refresh
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors">
                <FileText size={15} /> PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors">
                <FileSpreadsheet size={15} /> Excel
              </button>
            </div>
          </div>

          {pageError && (
            <div className="mb-5 p-4 rounded-lg border border-error/30 bg-hover text-error text-[13px] flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-[600] mb-0.5">Failed to load purchasing trends</p>
                <p className="text-[12px] text-error/90">{pageError}</p>
              </div>
              <button onClick={fetchDashboard}
                className="text-[12px] font-[500] underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          {/* ── Filter Panel ── */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">

              {/* Start Date */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                  <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg" />
                </div>
              </div>

              {/* End Date */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                  <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg" />
                </div>
              </div>

              {/* Granularity */}
              <div className="lg:col-span-2">
                <Dropdown open={granularityOpen} setOpen={setGranularityOpen}
                  value={granularity} options={GRANULARITY_OPTIONS}
                  onChange={(v) => { setGranularity(v); setPage(1); }}
                  icon={BarChart2} />
              </div>

              {/* Supplier */}
              <div className="lg:col-span-2">
                <Dropdown open={supplierOpen} setOpen={setSupplierOpen}
                  value={supplier} options={supplierOptions}
                  onChange={(v) => { setSupplier(v); setPage(1); }}
                  icon={Filter} />
              </div>

              {/* Category */}
              <div className="lg:col-span-2">
                <Dropdown open={categoryOpen} setOpen={setCategoryOpen}
                  value={category} options={categoryOptions}
                  onChange={(v) => { setCategory(v); setPage(1); }}
                  icon={Filter} />
              </div>

              {/* Outlet */}
              <div className="lg:col-span-2">
                <Dropdown open={outletOpen} setOpen={setOutletOpen}
                  value={outlet} options={outletOptions}
                  onChange={(v) => { setOutlet(v); setPage(1); }}
                  icon={Filter} />
              </div>

            </div>

            {/* Clear filters affordance */}
            {(startDate || endDate || supplier?.id != null || category?.value
                || outlet?.id != null || searchTerm) && (
              <div className="mt-3 flex justify-end">
                <button onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-[500] text-fg-secondary hover:text-brand-fg transition-colors">
                  <RefreshCw size={12} /> Clear filters
                </button>
              </div>
            )}
          </div>

          {dashboard?.dataLimitation && (
            <div className="mb-5 p-3 rounded-lg border border-warning/30 bg-hover text-warning text-[12px] flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{dashboard.dataLimitationReason
                || "Some filters cannot be applied to the current data set; results may be wider than the selected scope."}</span>
            </div>
          )}

          {loading ? (
            <Loader variant="section" text="Loading purchasing trends data..." />
          ) : (
            <>
              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {[
                  { label: "Total Purchase Orders", value: formatNumber(Number(totalPOs)), icon: <ShoppingCart size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                  { label: "Total Spend", value: formatMoney(totalSpend), icon: <Banknote size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                  { label: "Avg. Order Value", value: formatMoney(avgOrderValue), icon: <TrendingUp size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                  { label: "Pending POs", value: formatNumber(Number(pendingPOs)), icon: <Package size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                ].map((card, i) => (
                  <div key={i} className={`${card.color} ${card.hoverColor} rounded-lg p-5 text-on-brand shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}>
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

              {/* ── Charts Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">

                {/* Line Chart – Trend Comparison */}
                <div className="lg:col-span-2 bg-surface rounded-lg shadow-sm border border-line p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-[600] text-fg">Purchase Spend Trend</h3>
                      <p className="text-[12px] text-fg-secondary">{granularity.label} comparison – This Year vs Last Year</p>
                    </div>
                  </div>
                  <DualLineChart key={theme}
                    data={trend}
                    onPointClick={(d) => setDrillDown({
                      title: `Purchases – ${d.label}`,
                      rows: records,
                    })}
                  />
                </div>

                {/* Donut – Category Breakdown */}
                <div className="lg:col-span-2 bg-surface rounded-lg shadow-sm border border-line p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-[600] text-fg">Spend by Category</h3>
                      <p className="text-[12px] text-fg-secondary">Distribution of purchase value</p>
                    </div>
                  </div>
                  {categoryData.length > 0 ? (
                    <CategoryDonut key={theme}
                      data={categoryData}
                      onSliceClick={(sl) => setDrillDown({
                        title: `Category – ${sl.label}`,
                        rows: records.filter((r) => r.category === sl.label),
                      })}
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-fg-secondary text-[13px]">No data</div>
                  )}
                </div>
              </div>

              {/* ── Bottom Row: Bar Chart + Supplier Ranking ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                {/* Grouped Bar Chart */}
                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-[600] text-fg">Purchase Volume Comparison</h3>
                      <p className="text-[12px] text-fg-secondary">This Year (blue) vs Last Year (gray)</p>
                    </div>
                  </div>
                  <GroupedBarChart key={theme} data={trend} />
                </div>

                {/* Supplier Spend Ranking */}
                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                  <h3 className="text-[15px] font-[600] text-fg mb-4">Top Suppliers by Spend</h3>
                  {top5Suppliers.length === 0 ? (
                    <p className="text-[13px] text-fg-secondary">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {top5Suppliers.map((s, i) => {
                        const val = Number(s.totalSpend || 0);
                        const pct = Math.round((val / (topSpend || 1)) * 100);
                        return (
                          <div key={`${s.supplierName}-${i}`} className="cursor-pointer group"
                            onClick={() => setDrillDown({
                              title: `Supplier – ${s.supplierName}`,
                              rows: records.filter((r) => r.supplier === s.supplierName),
                            })}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-brand text-on-brand text-[10px] flex items-center justify-center font-[600]">{i + 1}</span>
                                <span className="text-[13px] font-[500] text-fg group-hover:text-brand-fg transition-colors">{s.supplierName}</span>
                              </div>
                              <span className="text-[12px] font-[600] text-fg">{formatMoney(val)}</span>
                            </div>
                            <div className="w-full bg-line rounded-full h-2">
                              <div className="h-2 rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Detailed PO Table ── */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div>
                    <h3 className="text-[18px] font-[600] text-fg">Purchase Order Records</h3>
                    <p className="text-[12px] text-fg-secondary mt-0.5">
                      Showing {paginated.length} of {sorted.length} records
                      {records.length >= RECORDS_THRESHOLD && (
                        <span className="ml-1 text-warning">(showing latest {records.length}; refine filters for older POs)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={15} />
                      <input type="text" placeholder="Search PO, product or supplier..."
                        className="pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent w-56"
                        value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
                    </div>
                    <button
                      onClick={handleExportPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle">
                      <Printer size={13} /> Print
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line bg-subtle">
                        {[
                          { key: "poNo", label: "PO Number" },
                          { key: "poDate", label: "Date" },
                          { key: "supplier", label: "Supplier" },
                          { key: "category", label: "Category" },
                          { key: "product", label: "Product" },
                          { key: "qty", label: "Qty" },
                          { key: "totalCost", label: "Total Cost" },
                          { key: "status", label: "Status", noSort: true },
                          { key: "actions", label: "", noSort: true },
                        ].map((col) => (
                          <th key={col.key}
                            onClick={() => !col.noSort && handleSort(col.key)}
                            className={`text-left py-3.5 px-4 text-[12px] font-[500] text-fg-secondary ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}>
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
                            <ShoppingCart size={40} className="mx-auto text-fg-muted mb-3" />
                            <p className="text-[14px] font-[500] text-fg">No purchase orders found</p>
                            <p className="text-[12px] text-fg-secondary">Try adjusting your filters</p>
                          </td>
                        </tr>
                      ) : paginated.map((r, i) => (
                        <tr key={`${r.poNo}-${r.product}-${i}`} className="border-b border-line hover:bg-subtle transition-colors">

                          {/* PO Number */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-[500] text-brand-fg">{r.poNo}</p>
                            </div>
                            <p className="text-[10px] text-fg-secondary flex items-center gap-1 mt-0.5">
                              <Truck size={9} /> {r.grnNo && r.grnNo !== "—" ? r.grnNo : "GRN Pending"}
                            </p>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-[13px] text-fg">{r.poDate || "—"}</td>

                          {/* Supplier */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-hover rounded-md flex items-center justify-center text-brand-fg font-[700] text-[11px] flex-shrink-0">
                                {(r.supplier || "?").charAt(0)}
                              </div>
                              <span className="text-[12px] font-[500] text-fg">{r.supplier || "—"}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-4 px-4">
                            <span className="text-[11px] font-[500] px-2 py-0.5 rounded-full"
                              style={{ color: categoryColor(r.category), backgroundColor: categoryColor(r.category, 0.1) }}>
                              {r.category || "Uncategorized"}
                            </span>
                          </td>

                          {/* Product */}
                          <td className="py-4 px-4 text-[13px] font-[500] text-fg">{r.product || "—"}</td>

                          {/* Qty */}
                          <td className="py-4 px-4">
                            <span className="text-[14px] font-[600] text-fg">{Number(r.qty || 0)}</span>
                            <span className="text-[11px] text-fg-secondary ml-1">{r.unit || ""}</span>
                          </td>

                          {/* Total Cost */}
                          <td className="py-4 px-4">
                            <p className="text-[14px] font-[700] text-fg">{formatMoney(r.totalCost)}</p>
                            <p className="text-[11px] text-fg-secondary mt-0.5">{formatMoney(r.unitCost)}/{r.unit || "u"}</p>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`text-[12px] font-[500] px-3 py-1 rounded-full ${r.status === "Received" ? "text-success bg-hover" : r.status === "Cancelled" ? "text-error bg-hover" : "text-warning bg-hover"}`}>
                              {r.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setDrillDown({ title: `PO Details – ${r.poNo}`, rows: [r] })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-app text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-line transition-colors">
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                    <p className="text-[12px] text-fg-secondary">
                      Page {page} of {totalPages} · {sorted.length} records
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft size={15} className="text-fg-secondary" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}>
                          {p}
                        </button>
                      ))}
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight size={15} className="text-fg-secondary" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Drill-down Modal */}
      {drillDown && (
        <DrillDownModal title={drillDown.title} rows={drillDown.rows} onClose={() => setDrillDown(null)} />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
