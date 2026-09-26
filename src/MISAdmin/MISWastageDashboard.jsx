import React, { useState, useEffect, useMemo, useCallback } from "react";
import { onEnterClick } from "../utils/a11y";
import { friendlyError } from "../utils/friendlyError";
import {
    RefreshCw,
    ChevronDown,
    AlertTriangle,
    Search,
    Calendar,
    Filter,
    Printer,
    FileSpreadsheet,
    FileText,
    Trash2,
    DollarSign,
    TrendingDown,
    BarChart2,
    X,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Hash,
    Banknote,
} from "lucide-react";

import MISAdminNavBar from "../component/MISAdminNavBar.jsx";
import MISAdminSideBar from "../component/MISAdminSideBar.jsx";
import Loader from "../component/Loader.jsx";
import { generatePDF, generateExcel } from "../utils/exportUtils.js";


// Canonical reasons emitted by the backend (REASON_EXPIRED / REASON_DAMAGED /
// REASON_RETURNED / REASON_OTHER). The frontend keeps a friendlier label map
// for the chips and dropdown.
const REASON_OPTIONS = [
    { code: null, label: "All Reasons" },
    { code: "EXPIRED", label: "Expired" },
    { code: "DAMAGED", label: "Damaged" },
    { code: "RETURNED", label: "Returned" },
    { code: "OTHER", label: "Other" },
];

// Design-token colours (CSS variables), so charts and chips follow the light/dark theme.
const BRAND = "rgb(var(--brand-fg))";
const NEUTRAL = "rgb(var(--fg-secondary))";
const REASON_COLORS = {
    EXPIRED: BRAND,
    DAMAGED: "rgb(var(--warning))",
    RETURNED: "rgb(var(--success))",
    OTHER: NEUTRAL,
    // Legacy keys (kept for any human-cased fallbacks)
    Expired: BRAND,
    Damaged: "rgb(var(--warning))",
    Returned: "rgb(var(--success))",
    Other: NEUTRAL,
};
// Soft chip background: the same colour at 10%
const tint = (c) => c.replace(/\)$/, " / 0.1)");

const OUTLET_COLORS = [BRAND, "rgb(var(--brand-fg) / 0.8)", "rgb(var(--brand-fg) / 0.6)", "rgb(var(--brand-fg) / 0.45)", "rgb(var(--brand-fg) / 0.3)"];

const reasonLabel = (code) => {
    if (!code) return "Other";
    const found = REASON_OPTIONS.find((o) => o.code === code);
    return found ? found.label : code;
};

const formatNumber = (n) =>
    typeof n === "number" ? n.toLocaleString() : "0";

const formatMoney = (n) => {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    return `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


function DrillDownModal({ title, rows, onClose }) {
    return (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-line flex items-center justify-between">
                    <div>
                        <h3 className="text-[17px] font-[600] text-fg">{title}</h3>
                        <p className="text-[12px] text-fg-secondary mt-0.5">{rows.length} record{rows.length !== 1 ? "s" : ""} found</p>
                    </div>
                    <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-app rounded-lg transition-colors">
                        <X size={18} className="text-fg-secondary" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-subtle">
                            <tr className="border-b border-line">
                                {["Date", "Outlet", "Product", "Qty", "Value", "Reason"].map((h) => (
                                    <th key={h} className="text-left py-3 px-4 text-[12px] font-[500] text-fg-secondary">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-line hover:bg-subtle">
                                    <td className="py-3 px-4 text-[12px] text-fg">{r.date || "—"}</td>
                                    <td className="py-3 px-4 text-[12px] text-fg">{r.outlet || "—"}</td>
                                    <td className="py-3 px-4 text-[12px] font-[500] text-fg">{r.product || "—"}</td>
                                    <td className="py-3 px-4 text-[12px] text-fg">{r.qty} {r.unit}</td>
                                    <td className="py-3 px-4 text-[12px] text-fg">{formatMoney(r.value)}</td>
                                    <td className="py-3 px-4">
                                        <span className="text-[12px] font-[500] px-2 py-0.5 rounded-full"
                                            style={{ color: REASON_COLORS[r.reason] || NEUTRAL, backgroundColor: tint(REASON_COLORS[r.reason] || NEUTRAL) }}>
                                            {reasonLabel(r.reason)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-line flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}


function SimpleBarChart({ data, color = BRAND, onBarClick }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-2 h-36 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer" role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => onBarClick && onBarClick(d)}>
                    <span className="text-[12px] text-fg-secondary opacity-0 group-hover:opacity-100 transition-opacity font-[500]">{d.value}</span>
                    <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                        style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: 4 }} />
                    <span className="text-[12px] text-fg-secondary truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
}


function SimpleLineChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-32 flex items-center justify-center text-fg-secondary text-[13px]">No data</div>
        );
    }
    const max = Math.max(...data.map((d) => d.value), 1);
    const min = Math.min(...data.map((d) => d.value), 0);
    const range = max - min || 1;
    const W = 100, H = 70;
    const denom = data.length === 1 ? 1 : data.length - 1;
    const pts = data.map((d, i) => ({
        x: (i / denom) * W,
        y: H - ((d.value - min) / range) * H,
        ...d,
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H + 10}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" style={{ stopColor: BRAND }} stopOpacity="0.18" />
                        <stop offset="100%" style={{ stopColor: BRAND }} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#lineGrad)" />
                <path d={pathD} fill="none" className="stroke-brand-fg" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.8" className="fill-brand-fg" />
                ))}
            </svg>
            <div className="flex justify-between mt-1">
                {data.map((d, i) => (
                    <span key={i} className="text-[12px] text-fg-secondary" style={{ width: `${100 / data.length}%`, textAlign: "center" }}>{d.label}</span>
                ))}
            </div>
        </div>
    );
}


function SimplePieChart({ data, onSliceClick }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = 0;
    const slices = data.map((d) => {
        const start = angle;
        angle += (d.value / total) * 360;
        return { ...d, start, end: angle };
    });

    const polarToXY = (angleDeg, r) => {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
    };

    const describeSlice = (start, end, r = 40) => {
        const s = polarToXY(start, r);
        const e = polarToXY(end, r);
        const large = end - start > 180 ? 1 : 0;
        return `M 50 50 L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
    };

    return (
        <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
                {slices.map((sl, i) => (
                    <path key={i} d={describeSlice(sl.start, sl.end)} style={{ fill: sl.color }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onSliceClick && onSliceClick(sl)} />
                ))}
                <circle cx="50" cy="50" r="22" className="fill-surface" />
                <text x="50" y="54" textAnchor="middle" className="text-[8px] fill-fg" fontSize="8" fontWeight="600">{total}</text>
            </svg>
            <div className="flex-1 space-y-1.5">
                {slices.map((sl, i) => (
                    <div key={i} className="flex items-center gap-2 cursor-pointer hover:opacity-80" role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => onSliceClick && onSliceClick(sl)}>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: sl.color }} />
                        <span className="text-[12px] text-fg-secondary flex-1 truncate">{sl.label}</span>
                        <span className="text-[12px] font-[600] text-fg">{Math.round((sl.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function MISWastageDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const activeSection = "Wastage Dashboard";

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [dashboard, setDashboard] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // Outlet/product use the {id, name} shape so we can keep a friendly
    // label in the dropdown while sending the numeric id to the API.
    const ALL_OUTLETS = useMemo(() => ({ id: null, name: "All Outlets" }), []);
    const ALL_PRODUCTS = useMemo(() => ({ id: null, name: "All Products" }), []);
    const [outlet, setOutlet] = useState(ALL_OUTLETS);
    const [product, setProduct] = useState(ALL_PRODUCTS);
    const [reasonOption, setReasonOption] = useState(REASON_OPTIONS[0]);
    const [outletOpen, setOutletOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [reasonOpen, setReasonOpen] = useState(false);

    // Table
    const [searchTerm, setSearchTerm] = useState("");
    const [sortCol, setSortCol] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;

    // Drill-down modal
    const [drillDown, setDrillDown] = useState(null);

    const baseUrl = process.env.REACT_APP_BASE_URL;

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem("authToken");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const fetchDashboard = useCallback(async () => {
        // Validation
        const today = new Date().toISOString().split("T")[0];
        if (startDate && startDate > today) {
            setPageError("Start date cannot be in the future.");
            return;
        }
        if (endDate && endDate > today) {
            setPageError("End date cannot be in the future.");
            return;
        }
        if (startDate && endDate && startDate > endDate) {
            setPageError("Start date cannot be after end date.");
            return;
        }

        try {
            setLoading(true);
            setPageError(null);
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            if (outlet?.id != null) params.set("outletId", outlet.id);
            if (product?.id != null) params.set("productId", product.id);
            if (reasonOption?.code) params.set("reason", reasonOption.code);

            const url = `${baseUrl}/api/v1/mis/wastage/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
            const res = await fetch(url, { headers: authHeaders() });
            if (!res.ok) {
                throw new Error(`Request failed (${res.status})`);
            }
            const data = await res.json();
            setDashboard(data);
            setPage(1);
        } catch (err) {
            console.error("MIS wastage dashboard load failed:", err);
            setPageError(friendlyError(err, { fallback: "Failed to load wastage dashboard." }));
            setDashboard(null);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, authHeaders, startDate, endDate, outlet, product, reasonOption]);

    // Initial load.
    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleApplyFilters = () => {
        fetchDashboard();
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setOutlet(ALL_OUTLETS);
        setProduct(ALL_PRODUCTS);
        setReasonOption(REASON_OPTIONS[0]);
        setSearchTerm("");
        setProductSearch("");
        setPage(1);
        // Re-fetch with cleared filters; the next render's fetchDashboard
        // uses the latest state, so we trigger a new fetch on next tick.
        setTimeout(() => fetchDashboard(), 0);
    };

    const records = useMemo(() => dashboard?.records || [], [dashboard]);
    const summary = dashboard?.summary || {};
    const topProducts = dashboard?.topProducts || [];
    const outletBreakdown = dashboard?.outletBreakdown || [];
    const reasonBreakdown = dashboard?.reasonBreakdown || [];
    const trend = dashboard?.trend || [];

    // Derive outlet & product dropdown options from the dashboard payload —
    // simpler than introducing two extra lookup fetches and keeps the lists
    // scoped to outlets/products that actually have wastage in the window.
    const outletOptions = useMemo(() => {
        const seen = new Map();
        records.forEach((r) => {
            if (r.outlet && !seen.has(r.outlet)) {
                seen.set(r.outlet, { id: r.outletId ?? null, name: r.outlet });
            }
        });
        return [ALL_OUTLETS, ...Array.from(seen.values())];
    }, [records, ALL_OUTLETS]);

    const productOptions = useMemo(() => {
        const seen = new Map();
        records.forEach((r) => {
            if (r.product && !seen.has(r.product)) {
                seen.set(r.product, { id: r.productId ?? null, name: r.product });
            }
        });
        return [ALL_PRODUCTS, ...Array.from(seen.values())];
    }, [records, ALL_PRODUCTS]);

    const filteredProducts = productOptions.filter((item) =>
        item.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    // Search-filtered table rows. (Outlet/product/reason filters are
    // server-side; the table search is purely client-side over the records
    // returned in the envelope.)
    const filteredTable = useMemo(() => {
        if (!searchTerm) return records;
        const s = searchTerm.toLowerCase();
        return records.filter((r) =>
            (r.product || "").toLowerCase().includes(s)
            || (r.outlet || "").toLowerCase().includes(s)
            || (r.id || "").toLowerCase().includes(s)
        );
    }, [records, searchTerm]);

    const sorted = useMemo(() => {
        return [...filteredTable].sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (sortCol === "value" || sortCol === "qty") {
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
    };

    const handleExportPDF = () => {
        if (!dashboard || !dashboard.records) return;
        const headers = ["Date", "Outlet", "Product", "Qty", "Unit", "Value", "Reason", "Source"];
        const data = dashboard.records.map(r => [
            r.date || "—",
            r.outlet || "—",
            r.product || "—",
            r.qty || 0,
            r.unit || "units",
            formatMoney(r.value),
            reasonLabel(r.reason),
            r.source || "—"
        ]);

        generatePDF({
            title: "MIS Wastage Report",
            subtitle: `Report from ${startDate || "All Time"} to ${endDate || "Today"}`,
            headers,
            data,
            fileName: "MIS_Wastage_Report",
            summary: [
                { label: "Total Quantity", value: dashboard.summary?.totalQty || 0 },
                { label: "Total Value", value: formatMoney(dashboard.summary?.totalValue) },
                { label: "Record Count", value: dashboard.summary?.recordCount || 0 }
            ]
        });
    };

    const handleExportExcel = () => {
        if (!dashboard || !dashboard.records) return;
        const headers = ["Date", "Outlet", "Product", "Qty", "Unit", "Value", "Reason", "Source"];
        const data = dashboard.records.map(r => [
            r.date || "—",
            r.outlet || "—",
            r.product || "—",
            r.qty || 0,
            r.unit || "units",
            r.value || 0,
            reasonLabel(r.reason),
            r.source || "—"
        ]);

        generateExcel({
            headers,
            data,
            fileName: "MIS_Wastage_Report"
        });
    };

    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-brand-fg" /> : <ArrowDown size={12} className="text-brand-fg" />;
    };

    // ── Derived chart series ──
    const barData = useMemo(() => topProducts.slice(0, 7).map((g) => ({
        label: (g.label || "").split(" ")[0] || "—",
        fullLabel: g.label,
        value: Number(g.value || 0),
        qty: g.qty,
    })), [topProducts]);

    const trendData = useMemo(() => trend.map((p) => ({
        label: p.label,
        value: Number(p.value || 0),
    })), [trend]);

    const pieData = useMemo(() => reasonBreakdown.map((g) => ({
        label: reasonLabel(g.label),
        rawLabel: g.label,
        value: g.recordCount || g.qty || 0,
        color: REASON_COLORS[g.label] || NEUTRAL,
    })), [reasonBreakdown]);

    // Summary card values
    const totalQty = summary.totalQty ?? 0;
    const totalValue = summary.totalValue;
    const wastagePercent = summary.wastagePercent;
    const recordCount = summary.recordCount ?? records.length;

    const wastagePercentDisplay = summary.salesDataAvailable === false
        ? { primary: "—", subtitle: "Sales data unavailable" }
        : { primary: wastagePercent != null ? `${Number(wastagePercent).toFixed(1)}%` : "—", subtitle: null };

    const top5Products = topProducts.slice(0, 5);
    const outletRanked = outletBreakdown;

    const Dropdown = ({ open, setOpen, value, options, onChange, icon: Icon, optionKey = "label", optionValue = (o) => o }) => (
        <div className="relative">
            <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2.5 border border-line rounded-lg text-[13px] text-fg bg-surface hover:bg-subtle transition-colors min-w-[160px] w-full">
                {Icon && <Icon size={14} className="text-fg-secondary" />}
                <span className="flex-1 text-left truncate">{value?.[optionKey] ?? value}</span>
                <ChevronDown size={13} className="text-fg-secondary" />
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 bg-elevated border border-line rounded-lg shadow-lg z-50 min-w-full max-h-60 overflow-y-auto">
                    {options.map((o, idx) => {
                        const label = o?.[optionKey] ?? o;
                        const selected = (value?.[optionKey] ?? value) === label;
                        return (
                            <button key={`${label}-${idx}`} onClick={() => { onChange(optionValue(o)); setOpen(false); }}
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
                            <h1 className="text-[20px] font-[600] text-fg mb-1">Wastage Dashboard</h1>
                            <p className="text-[14px] text-fg-secondary">Monitor wastage trends across all outlets in real-time</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <button onClick={fetchDashboard}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors">
                                <RefreshCw size={15} />
                                Refresh
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors">
                                <FileText size={15} />
                                PDF
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors">
                                <FileSpreadsheet size={15} />
                                Excel
                            </button>
                        </div>
                    </div>

                    {pageError && (
                        <div className="mb-5 p-4 rounded-lg border border-error/30 bg-hover text-error text-[13px] flex items-start gap-3">
                            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-[600] mb-0.5">Failed to load wastage dashboard</p>
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
                                    <Calendar
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary"
                                        size={14}
                                    />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        max={new Date().toISOString().slice(0, 10)}
                                        className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* End Date */}
                            <div className="lg:col-span-2">
                                <div className="relative">
                                    <Calendar
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary"
                                        size={14}
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        max={new Date().toISOString().slice(0, 10)}
                                        className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Outlet */}
                            <div className="lg:col-span-2">
                                <Dropdown
                                    open={outletOpen}
                                    setOpen={setOutletOpen}
                                    value={outlet}
                                    options={outletOptions}
                                    onChange={setOutlet}
                                    icon={Filter}
                                    optionKey="name"
                                />
                            </div>

                            {/* Product Searchable */}
                            <div className="lg:col-span-2 relative">
                                <button
                                    onClick={() => setProductOpen(!productOpen)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 border border-line rounded-lg text-[13px] text-fg bg-surface hover:bg-subtle transition-colors"
                                >
                                    <span className="flex-1 text-left truncate">
                                        {product?.name}
                                    </span>
                                    <ChevronDown size={13} className="text-fg-secondary" />
                                </button>

                                {productOpen && (
                                    <div className="absolute top-full mt-1 left-0 bg-elevated border border-line rounded-lg shadow-lg z-50 w-full">

                                        <div className="p-2 border-b border-line">
                                            <input
                                                type="text"
                                                placeholder="Search product..."
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                className="w-full px-3 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                            />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((item, idx) => (
                                                    <button
                                                        key={`${item.name}-${idx}`}
                                                        onClick={() => {
                                                            setProduct(item);
                                                            setProductOpen(false);
                                                            setProductSearch("");
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-subtle transition-colors ${product?.name === item.name
                                                                ? "text-brand-fg font-[500] bg-app"
                                                                : "text-fg"
                                                            }`}
                                                    >
                                                        {item.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-[13px] text-fg-secondary">
                                                    No products found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="lg:col-span-2">
                                <Dropdown
                                    open={reasonOpen}
                                    setOpen={setReasonOpen}
                                    value={reasonOption}
                                    options={REASON_OPTIONS}
                                    onChange={setReasonOption}
                                    optionKey="label"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="lg:col-span-2 flex gap-2">
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
                                >
                                    Apply
                                </button>

                                <button
                                    onClick={handleClearFilters}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
                                >
                                    <RefreshCw size={13} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {dashboard?.dataLimitation && (
                        <div className="mb-5 p-3 rounded-lg border border-warning/30 bg-hover text-warning text-[12px] flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{dashboard.dataLimitationReason || "Some sources lack value data; totals may understate true wastage value."}</span>
                        </div>
                    )}

                    {loading ? (
                        <Loader variant="section" text="Loading wastage dashboard data..." />
                    ) : (
                        <>
                            {/* ── Summary Cards ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                {[
                                    { label: "Total Wastage Qty", value: `${formatNumber(totalQty)} units`, icon: <Trash2 size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                                    { label: "Total Wastage Value", value: formatMoney(totalValue), icon: <Banknote size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                                    { label: "Wastage % of Sales", value: wastagePercentDisplay.primary, subtitle: wastagePercentDisplay.subtitle, icon: <TrendingDown size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                                    { label: "Wastage Records", value: formatNumber(recordCount), icon: <BarChart2 size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                                ].map((card, i) => (
                                    <div key={i}
                                        className={`${card.color} ${card.hoverColor} rounded-lg p-5 text-on-brand shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[13px] font-medium text-on-brand/80 mb-2">{card.label}</p>
                                                <h2 className="text-[26px] font-bold leading-none">{card.value}</h2>
                                                {card.subtitle && (
                                                    <p className="text-[12px] text-on-brand/70 mt-2">{card.subtitle}</p>
                                                )}
                                            </div>
                                            <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                                                {card.icon}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Charts Row ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

                                {/* Bar Chart */}
                                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[15px] font-[600] text-fg">Wastage by Product</h3>
                                            <p className="text-[12px] text-fg-secondary">Value (Rs.) per product</p>
                                        </div>
                                    </div>
                                    {barData.length > 0 ? (
                                        <SimpleBarChart
                                            data={barData}
                                            color={BRAND}
                                            onBarClick={(d) => setDrillDown({ title: `Wastage – ${d.fullLabel || d.label}`, rows: records.filter((r) => r.product === d.fullLabel) })}
                                        />
                                    ) : (
                                        <div className="h-36 flex items-center justify-center text-fg-secondary text-[13px]">No data</div>
                                    )}
                                </div>

                                {/* Line Chart */}
                                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[15px] font-[600] text-fg">Wastage Trend</h3>
                                            <p className="text-[12px] text-fg-secondary">Daily wastage value (Rs.)</p>
                                        </div>
                                    </div>
                                    <SimpleLineChart data={trendData} />
                                </div>

                                {/* Pie Chart */}
                                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[15px] font-[600] text-fg">Wastage Reasons</h3>
                                            <p className="text-[12px] text-fg-secondary">Distribution by reason</p>
                                        </div>
                                    </div>
                                    {pieData.length > 0 ? (
                                        <SimplePieChart
                                            data={pieData}
                                            onSliceClick={(sl) => setDrillDown({ title: `Wastage – ${sl.label}`, rows: records.filter((r) => r.reason === sl.rawLabel) })}
                                        />
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-fg-secondary text-[13px]">No data</div>
                                    )}
                                </div>
                            </div>

                            {/* ── Hotspots + Top Products Row ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

                                {/* Top 5 Products */}
                                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                                    <h3 className="text-[15px] font-[600] text-fg mb-4">Top 5 Wasted Products</h3>
                                    {top5Products.length === 0 ? (
                                        <p className="text-[13px] text-fg-secondary">No data</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {top5Products.map((p, i) => {
                                                const value = Number(p.value || 0);
                                                const max = Number(top5Products[0].value || 1);
                                                const pct = Math.round((value / (max || 1)) * 100);
                                                return (
                                                    <div key={`${p.label}-${i}`}
                                                        className="cursor-pointer group"
                                                        role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setDrillDown({ title: `Top Waste – ${p.label}`, rows: records.filter((r) => r.product === p.label) })}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-brand text-on-brand text-[12px] flex items-center justify-center font-[600]">{i + 1}</span>
                                                                <span className="text-[13px] font-[500] text-fg group-hover:text-brand-fg transition-colors">{p.label}</span>
                                                            </div>
                                                            <span className="text-[12px] font-[600] text-fg">{formatMoney(value)}</span>
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

                                {/* Hotspot Outlets */}
                                <div className="bg-surface rounded-lg shadow-sm border border-line p-5">
                                    <h3 className="text-[15px] font-[600] text-fg mb-4">Hotspot Outlets</h3>
                                    {outletRanked.length === 0 ? (
                                        <p className="text-[13px] text-fg-secondary">No data</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {outletRanked.map((o, i) => {
                                                const value = Number(o.value || 0);
                                                const max = Number(outletRanked[0].value || 1);
                                                const pct = Math.round((value / (max || 1)) * 100);
                                                return (
                                                    <div key={`${o.label}-${i}`}
                                                        className="cursor-pointer group"
                                                        role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setDrillDown({ title: `Outlet Waste – ${o.label}`, rows: records.filter((r) => r.outlet === o.label) })}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: OUTLET_COLORS[i] || NEUTRAL }} />
                                                                <span className="text-[13px] font-[500] text-fg group-hover:text-brand-fg transition-colors">{o.label}</span>
                                                            </div>
                                                            <span className="text-[12px] font-[600] text-fg">{formatMoney(value)}</span>
                                                        </div>
                                                        <div className="w-full bg-line rounded-full h-2">
                                                            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: OUTLET_COLORS[i] || NEUTRAL }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Detailed Wastage Table ── */}
                            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                                    <div>
                                        <h3 className="text-[18px] font-[600] text-fg">Detailed Wastage Records</h3>
                                        <p className="text-[12px] text-fg-secondary mt-0.5">Showing {paginated.length} of {sorted.length} records</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={15} />
                                            <input type="text" placeholder="Search product or outlet..."
                                                className="pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent w-52"
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
                                                    { key: "date", label: "Date" },
                                                    { key: "outlet", label: "Outlet" },
                                                    { key: "product", label: "Product Name" },
                                                    { key: "qty", label: "Qty Wasted" },
                                                    { key: "value", label: "Value (Rs.)" },
                                                    { key: "reason", label: "Reason" },
                                                    { key: "remarks", label: "Remarks", noSort: true },
                                                ].map((col) => (
                                                    <th key={col.key}
                                                        className={`text-left py-3 px-3 text-[12px] font-[500] text-fg-secondary ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}
                                                        onClick={() => !col.noSort && handleSort(col.key)}>
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
                                                        <AlertTriangle size={36} className="mx-auto text-fg-muted mb-3" />
                                                        <p className="text-[14px] font-[500] text-fg">No wastage records found</p>
                                                        <p className="text-[12px] text-fg-secondary">Try adjusting your filters</p>
                                                    </td>
                                                </tr>
                                            ) : paginated.map((r) => (
                                                <tr key={r.id}
                                                    className="border-b border-line hover:bg-subtle transition-colors cursor-pointer"
                                                    role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setDrillDown({ title: `Record ${r.id} Details`, rows: [r] })}>
                                                    <td className="py-3.5 px-3">
                                                        <p className="text-[13px] font-[500] text-fg">{r.date || "—"}</p>
                                                        <p className="text-[12px] text-fg-secondary flex items-center gap-1 mt-0.5"><Hash size={9} />{r.id}</p>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-[13px] text-fg">{r.outlet || "—"}</td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-[13px] font-[500] text-fg">{r.product || "—"}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-[14px] font-[600] text-fg">{r.qty}</span>
                                                        <span className="text-[12px] text-fg-secondary ml-1">{r.unit}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-[13px] font-[600] text-fg">{formatMoney(r.value)}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-[12px] font-[500] px-2.5 py-1 rounded-full"
                                                            style={{ color: REASON_COLORS[r.reason] || NEUTRAL, backgroundColor: tint(REASON_COLORS[r.reason] || NEUTRAL) }}>
                                                            {reasonLabel(r.reason)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-[12px] text-fg-secondary max-w-[140px] truncate">{r.remarks || "—"}</td>
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
                                            <button aria-label="Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                                className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                <ChevronLeft size={15} className="text-fg-secondary" />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
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
