import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    RefreshCw,
    ChevronDown,
    Search,
    Calendar,
    FileText,
    FileSpreadsheet,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    X,
    BarChart2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Banknote,
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    Eye,
    Layers,
    PieChart,
    Activity,
    Users,
    Truck,
    Repeat,
    Sliders,
    Info,
} from "lucide-react";

import { generatePDF, generateExcel } from "../utils/exportUtils";


import FinanceNavBar from "../component/FinanceNavBar.jsx";
import FinanceSideBar from "../component/FinanceSideBar.jsx";

// ── Report catalog ──────────────────────────────────────────────────────
//
// `endpoint` is appended to /api/v1/finance/reports/<endpoint>.
// Each entry inside `reports` carries the human label (used in the dropdown)
// AND the `type` query-param value the backend expects. Backend normalises
// camelCase / kebab-case / spaces, so labels can be kept human-friendly
// while the `type` field stays explicit.
const REPORT_CATEGORIES = [
    {
        id: "payments",
        label: "Payment & Outstanding",
        icon: <Banknote size={16} />,
        color: "bg-blue-500",
        endpoint: "payments",
        reports: [
            { label: "Daily Payment Summary",   type: "Daily",   period: "Daily" },
            { label: "Monthly Payment Summary", type: "Monthly", period: "Monthly" },
            { label: "Yearly Payment Summary",  type: "Yearly",  period: "Yearly" },
            { label: "Outstanding Balances",    type: "Monthly", period: "Monthly" },
        ],
    },
    {
        id: "sales",
        label: "Sales Reports",
        icon: <TrendingUp size={16} />,
        color: "bg-indigo-500",
        endpoint: "sales",
        reports: [
            { label: "Sales by Product",        type: "byProduct" },
            { label: "Sales by Time Interval",  type: "byInterval" },
            { label: "Discounts & Returns",     type: "discountsReturns" },
        ],
    },
    {
        id: "production",
        label: "Production Cost & Wastage",
        icon: <Package size={16} />,
        color: "bg-cyan-500",
        endpoint: "wastage",
        reports: [
            { label: "Raw Material Costs",  type: "rawMaterialCosts" },
            { label: "Production Overheads", type: "byProduct" },
            { label: "Wastage by Product",  type: "byProduct" },
            { label: "Wastage by Outlet",   type: "byOutlet" },
        ],
    },
    {
        id: "profitability",
        label: "Gross Profitability",
        icon: <BarChart2 size={16} />,
        color: "bg-sky-500",
        endpoint: "profitability",
        reports: [
            { label: "Profit by Product",  type: "byProduct" },
            { label: "Profit by Category", type: "byCategory" },
            { label: "Profit by Outlet",   type: "byOutlet" },
            { label: "Low-Margin Products", type: "lowMargin" },
        ],
    },
    {
        id: "staff",
        label: "Staff Meal Analysis",
        icon: <Users size={16} />,
        color: "bg-violet-500",
        endpoint: "staff-meals",
        reports: [
            { label: "Free Meal Issuance",   type: "" },
            { label: "Staff Meal Cost Report", type: "" },
        ],
    },
    {
        id: "stock",
        label: "Stock Movement",
        icon: <Layers size={16} />,
        color: "bg-teal-500",
        endpoint: "stock-movement",
        reports: [
            { label: "Stock Inflow/Outflow", type: "inflow" },
            { label: "Adjustments Log",      type: "adjustments" },
            { label: "Current Stock Levels", type: "currentStock" },
        ],
    },
    {
        id: "purchase",
        label: "Purchase Price Analysis",
        icon: <Truck size={16} />,
        color: "bg-blue-600",
        endpoint: "purchase-price",
        reports: [
            { label: "Price by Supplier",      type: "bySupplier" },
            { label: "Price by Product",       type: "byProduct" },
            { label: "Price Change Over Time", type: "priceChange" },
        ],
    },
    {
        id: "variance",
        label: "Standard vs Actual Production",
        icon: <Repeat size={16} />,
        color: "bg-indigo-600",
        endpoint: "variance",
        reports: [
            { label: "Price Variance",       type: "priceVariance" },
            { label: "Quantity Variance",    type: "quantityVariance" },
            { label: "Production Comparison", type: "productionComparison" },
        ],
    },
];

const PERIOD_OPTIONS = ["Daily", "Monthly", "Yearly", "Custom Range"];
// Outlet list is loaded inside the component from /api/v1/admin/outlet/all.

const STATUS_STYLE = {
    Overdue: { text: "text-[#EF4444]", bg: "bg-[#FEF2F2]", icon: <AlertTriangle size={11} /> },
    Pending: { text: "text-[#F4A100]", bg: "bg-[#FFFBEB]", icon: <Clock size={11} /> },
    Cleared: { text: "text-[#199D26]", bg: "bg-[#F0FDF4]", icon: <CheckCircle size={11} /> },
};

// Coerce backend numeric fields (which may arrive as numbers, strings, or
// missing entirely) into a plain Number we can format safely.
const toNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

/** Normalise a backend ReportRowDto into the shape the tables expect. */
function normaliseRow(raw, idx) {
    return {
        id: raw.id || `R-${idx}`,
        date: raw.date || "—",
        supplier: raw.supplier || raw.employee || "—",
        ref: raw.ref || "—",
        totalInvoiced: toNumber(raw.totalInvoiced),
        paid: toNumber(raw.paid),
        outstanding: toNumber(raw.outstanding),
        status: raw.status || "Pending",
        product: raw.product || "—",
        category: raw.category || "—",
        outlet: raw.outlet || "—",
        sales: toNumber(raw.sales),
        discounts: toNumber(raw.discounts),
        returns: toNumber(raw.returns),
        net: toNumber(raw.net),
        // exactQty keeps fractions (e.g. 0.4 kg of wasted flour) that the whole-number qty drops
        qty: raw.exactQty != null ? toNumber(raw.exactQty) : raw.qty != null ? toNumber(raw.qty) : null,
        unit: raw.unit || "",
        costPerUnit: toNumber(raw.costPerUnit),
        totalCost: toNumber(raw.totalCost),
        reason: raw.reason || "—",
        change: raw.change != null ? toNumber(raw.change) : null,
        employee: raw.employee || raw.supplier || "—",
    };
}

function MiniBarChart({ data, valueKey, labelKey, color = "#0F50AA" }) {
    const max = Math.max(...data.map((d) => d[valueKey]), 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                            height: `${Math.max(4, (d[valueKey] / max) * 48)}px`,
                            backgroundColor: color,
                            opacity: 0.7 + (i / data.length) * 0.3,
                        }}
                    />
                    <span className="text-[9px] text-[#667085] truncate w-full text-center">{d[labelKey]}</span>
                </div>
            ))}
        </div>
    );
}

function FilterDropdown({ open, setOpen, value, options, onChange, icon, label, getLabel }) {
    const display = (o) => (getLabel ? getLabel(o) : o);
    return (
        <div className="relative">
            {label && <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">{label}</label>}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors min-w-[150px] w-full"
            >
                {icon && <span className="text-[#667085]">{icon}</span>}
                <span className="flex-1 text-left truncate">{display(value)}</span>
                <ChevronDown size={13} className="text-[#667085]" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-full">
                        {options.map((o) => {
                            const lbl = display(o);
                            const isSelected = display(value) === lbl;
                            return (
                                <button
                                    key={lbl}
                                    onClick={() => { onChange(o); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors first:rounded-t-lg last:rounded-b-lg ${isSelected ? "text-[#0F50AA] font-[500] bg-[#EEF3FB]" : "text-[#383E49]"}`}
                                >
                                    {lbl}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function ReportDetailModal({ row, reportType, onClose }) {
    const isPayment = reportType && ["Daily Payment Summary", "Monthly Payment Summary", "Yearly Payment Summary", "Outstanding Balances"].includes(reportType);
    const isSales = reportType && ["Sales by Product", "Sales by Time Interval", "Discounts & Returns"].includes(reportType);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-5 border-b border-[#E4E6EA] flex items-center justify-between">
                    <div>
                        <h3 className="text-[16px] font-[600] text-[#383E49]">Record Details</h3>
                        <p className="text-[12px] text-[#667085] mt-0.5">{row.ref || row.product || row.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg">
                        <X size={16} className="text-[#667085]" />
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    {isPayment && [
                        { label: "Date", value: row.date },
                        { label: "Supplier", value: row.supplier },
                        { label: "Reference", value: row.ref },
                        { label: "Total Invoiced", value: `Rs. ${row.totalInvoiced?.toLocaleString()}` },
                        { label: "Amount Paid", value: `Rs. ${row.paid?.toLocaleString()}` },
                        { label: "Outstanding", value: `Rs. ${row.outstanding?.toLocaleString()}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-[#F0F1F3] last:border-0">
                            <p className="text-[12px] text-[#667085]">{label}</p>
                            <p className="text-[13px] font-[500] text-[#383E49]">{value}</p>
                        </div>
                    ))}
                    {isSales && [
                        { label: "Date", value: row.date },
                        { label: "Product", value: row.product },
                        { label: "Category", value: row.category },
                        { label: "Outlet", value: row.outlet },
                        { label: "Gross Sales", value: `Rs. ${row.sales?.toLocaleString()}` },
                        { label: "Discounts", value: `Rs. ${row.discounts?.toLocaleString()}` },
                        { label: "Returns", value: `Rs. ${row.returns?.toLocaleString()}` },
                        { label: "Net Sales", value: `Rs. ${row.net?.toLocaleString()}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-[#F0F1F3] last:border-0">
                            <p className="text-[12px] text-[#667085]">{label}</p>
                            <p className="text-[13px] font-[500] text-[#383E49]">{value}</p>
                        </div>
                    ))}
                    {!isPayment && !isSales && [
                        { label: "Date", value: row.date },
                        { label: "Product", value: row.product },
                        { label: "Outlet", value: row.outlet },
                        { label: "Quantity", value: `${row.qty ?? "—"} ${row.unit || ""}` },
                        { label: "Cost/Unit", value: `Rs. ${row.costPerUnit?.toLocaleString()}` },
                        { label: "Total Cost", value: `Rs. ${row.totalCost?.toLocaleString()}` },
                        { label: "Reason", value: row.reason },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-[#F0F1F3] last:border-0">
                            <p className="text-[12px] text-[#667085]">{label}</p>
                            <p className="text-[13px] font-[500] text-[#383E49]">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-[#E4E6EA] flex justify-end gap-2">
                    <button 
                        onClick={() => {
                            const fields = isPayment ? [
                                ["Date", row.date],
                                ["Supplier", row.supplier],
                                ["Reference", row.ref],
                                ["Total Invoiced", `Rs. ${row.totalInvoiced?.toLocaleString()}`],
                                ["Amount Paid", `Rs. ${row.paid?.toLocaleString()}`],
                                ["Outstanding", `Rs. ${row.outstanding?.toLocaleString()}`]
                            ] : isSales ? [
                                ["Date", row.date],
                                ["Product", row.product],
                                ["Category", row.category],
                                ["Outlet", row.outlet],
                                ["Gross Sales", `Rs. ${row.sales?.toLocaleString()}`],
                                ["Net Sales", `Rs. ${row.net?.toLocaleString()}`]
                            ] : [
                                ["Date", row.date],
                                ["Product", row.product],
                                ["Outlet", row.outlet],
                                ["Quantity", `${row.qty ?? "—"} ${row.unit || ""}`],
                                ["Cost/Unit", `Rs. ${row.costPerUnit?.toLocaleString()}`],
                                ["Total Cost", `Rs. ${row.totalCost?.toLocaleString()}`]
                            ];

                            generatePDF({
                                title: "Record Details",
                                subtitle: `Reference: ${row.ref || row.product || row.id}`,
                                headers: ["Field", "Value"],
                                data: fields,
                                fileName: `Record_${row.ref || row.id}`
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

function PaymentTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE }) {
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-[#0F50AA]" /> : <ArrowDown size={12} className="text-[#0F50AA]" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                            {[
                                { key: "date", label: "Date" },
                                { key: "supplier", label: "Supplier" },
                                { key: "ref", label: "Reference" },
                                { key: "totalInvoiced", label: "Total Invoiced (Rs.)" },
                                { key: "paid", label: "Paid (Rs.)" },
                                { key: "outstanding", label: "Outstanding (Rs.)" },
                                { key: "status", label: "Status" },
                                { key: "actions", label: "Action", noSort: true },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => !col.noSort && onSort(col.key)}
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-[#667085] whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-[#383E49]"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={8} className="py-16 text-center">
                                <BarChart2 size={36} className="mx-auto text-[#C8CDD5] mb-3" />
                                <p className="text-[14px] font-[500] text-[#383E49]">No data for selected filters</p>
                                <p className="text-[12px] text-[#667085]">Try adjusting your report parameters</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const ss = STATUS_STYLE[row.status] || { text: "text-[#667085]", bg: "bg-[#F0F1F3]", icon: null };
                            return (
                                <tr key={row.id} className={`border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors ${row.status === "Overdue" ? "bg-red-50/30" : ""}`}>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[500] text-[#383E49] whitespace-nowrap">{row.date}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[500] text-[#383E49]">{row.supplier}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[12px] text-[#0F50AA] font-[600]">{row.ref}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[600] text-[#383E49]">Rs. {row.totalInvoiced.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[600] text-[#199D26]">Rs. {row.paid.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className={`text-[13px] font-[700] ${row.outstanding > 0 ? "text-[#EF4444]" : "text-[#199D26]"}`}>Rs. {row.outstanding.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-[500] px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>{ss.icon}{row.status}</span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EEF3FB] text-[#0F50AA] text-[11px] font-[500] rounded-lg hover:bg-[#0F50AA] hover:text-white transition-colors">
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
                    <p className="text-[12px] text-[#667085]">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-[#667085]" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-[#0F50AA] text-white" : "text-[#667085] hover:bg-[#F0F1F3]"}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-[#667085]" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function SalesTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE }) {
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-[#0F50AA]" /> : <ArrowDown size={12} className="text-[#0F50AA]" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                            {[
                                { key: "date", label: "Date" },
                                { key: "product", label: "Product" },
                                { key: "category", label: "Category" },
                                { key: "outlet", label: "Outlet" },
                                { key: "sales", label: "Gross Sales (Rs.)" },
                                { key: "discounts", label: "Discounts (Rs.)" },
                                { key: "returns", label: "Returns (Rs.)" },
                                { key: "net", label: "Net Sales (Rs.)" },
                                { key: "totalCost", label: "Cost (Rs.)" },
                                { key: "gp", label: "GP (Rs.)", noSort: true },
                                { key: "actions", label: "Action", noSort: true },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => !col.noSort && onSort(col.key)}
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-[#667085] whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-[#383E49]"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={11} className="py-16 text-center">
                                <TrendingUp size={36} className="mx-auto text-[#C8CDD5] mb-3" />
                                <p className="text-[14px] font-[500] text-[#383E49]">No sales data found</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const gp = row.net - row.totalCost;
                            return (
                                <tr key={row.id} className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors">
                                    <td className="py-3.5 px-4"><p className="text-[13px] text-[#383E49] whitespace-nowrap">{row.date}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[600] text-[#383E49]">{row.product}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[11px] font-[500] px-2 py-0.5 rounded-full bg-[#EEF3FB] text-[#0F50AA]">{row.category}</span></td>
                                    <td className="py-3.5 px-4"><p className="text-[12px] text-[#667085]">{row.outlet}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-[#383E49]">Rs. {row.sales.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[12px] text-[#F4A100] font-[600]">{row.discounts > 0 ? `-Rs. ${row.discounts.toLocaleString()}` : "—"}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[12px] text-[#EF4444] font-[600]">{row.returns > 0 ? `-Rs. ${row.returns.toLocaleString()}` : "—"}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-[#199D26]">Rs. {row.net.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-[#7C3AED]">Rs. {row.totalCost.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className={`text-[13px] font-[700] ${gp >= 0 ? "text-[#199D26]" : "text-[#EF4444]"}`}>Rs. {gp.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EEF3FB] text-[#0F50AA] text-[11px] font-[500] rounded-lg hover:bg-[#0F50AA] hover:text-white transition-colors">
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
                    <p className="text-[12px] text-[#667085]">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-[#667085]" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-[#0F50AA] text-white" : "text-[#667085] hover:bg-[#F0F1F3]"}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-[#667085]" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function WastageTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE }) {
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-[#0F50AA]" /> : <ArrowDown size={12} className="text-[#0F50AA]" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const REASON_STYLE = {
        Expired: { text: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
        Spoilage: { text: "text-[#F4A100]", bg: "bg-[#FFFBEB]" },
        Overproduction: { text: "text-[#7C3AED]", bg: "bg-[#F5F3FF]" },
        "Cooking Loss": { text: "text-[#0F50AA]", bg: "bg-[#EEF3FB]" },
        Spillage: { text: "text-[#199D26]", bg: "bg-[#F0FDF4]" },
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                            {[
                                { key: "date", label: "Date" },
                                { key: "product", label: "Product" },
                                { key: "category", label: "Category" },
                                { key: "outlet", label: "Outlet" },
                                { key: "qty", label: "Qty" },
                                { key: "costPerUnit", label: "Cost/Unit (Rs.)" },
                                { key: "totalCost", label: "Total Cost (Rs.)" },
                                { key: "reason", label: "Reason" },
                                { key: "actions", label: "Action", noSort: true },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => !col.noSort && onSort(col.key)}
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-[#667085] whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-[#383E49]"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={9} className="py-16 text-center">
                                <Package size={36} className="mx-auto text-[#C8CDD5] mb-3" />
                                <p className="text-[14px] font-[500] text-[#383E49]">No wastage records found</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const rs = REASON_STYLE[row.reason] || { text: "text-[#667085]", bg: "bg-[#F0F1F3]" };
                            return (
                                <tr key={row.id} className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors">
                                    <td className="py-3.5 px-4"><p className="text-[13px] text-[#383E49] whitespace-nowrap">{row.date}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[600] text-[#383E49]">{row.product}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[11px] font-[500] px-2 py-0.5 rounded-full bg-[#EEF3FB] text-[#0F50AA]">{row.category}</span></td>
                                    <td className="py-3.5 px-4"><p className="text-[12px] text-[#667085]">{row.outlet}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[600] text-[#383E49]">{row.qty ?? "—"} {row.unit}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] text-[#383E49]">Rs. {row.costPerUnit.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-[#EF4444]">Rs. {row.totalCost.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center text-[11px] font-[500] px-2.5 py-1 rounded-full ${rs.bg} ${rs.text}`}>{row.reason}</span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#EEF3FB] text-[#0F50AA] text-[11px] font-[500] rounded-lg hover:bg-[#0F50AA] hover:text-white transition-colors">
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
                    <p className="text-[12px] text-[#667085]">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-[#667085]" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-[#0F50AA] text-white" : "text-[#667085] hover:bg-[#F0F1F3]"}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-[#E4E6EA] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-[#667085]" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function PlaceholderTable({ reportType }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF3FB] flex items-center justify-center mb-4">
                <Activity size={28} className="text-[#0F50AA]" />
            </div>
            <p className="text-[15px] font-[600] text-[#383E49] mb-1">{reportType}</p>
            <p className="text-[13px] text-[#667085] max-w-xs">
                Select filters above and click <span className="font-[600] text-[#0F50AA]">Generate Report</span> to load this report.
            </p>
        </div>
    );
}

function UnavailableState({ reason, reportType }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FFFBEB] flex items-center justify-center mb-4">
                <Info size={28} className="text-[#F4A100]" />
            </div>
            <p className="text-[15px] font-[600] text-[#383E49] mb-1">{reportType}</p>
            <p className="text-[13px] text-[#667085] max-w-md">
                {reason || "No data available — this report needs additional data to be configured first."}
            </p>
        </div>
    );
}

export default function FinanceReports() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const activeSection = "Financial Reports";

    // Report selection
    const [selectedCategory, setSelectedCategory] = useState(REPORT_CATEGORIES[0]);
    const [selectedReport, setSelectedReport] = useState(REPORT_CATEGORIES[0].reports[0]);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Filters
    const [period, setPeriod] = useState("Monthly");
    const [periodOpen, setPeriodOpen] = useState(false);
    const [outlet, setOutlet] = useState("All Outlets");
    const [outletOpen, setOutletOpen] = useState(false);
    const [outletOptions, setOutletOptions] = useState(["All Outlets"]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [generated, setGenerated] = useState(false);

    // Live data
    const [rawData, setRawData] = useState([]);
    const [reportEnvelope, setReportEnvelope] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState(null);

    // Product Filter States
    const [products, setProducts] = useState(["All Products"]);
    const [selectedProduct, setSelectedProduct] = useState("All Products");
    const [productOpen, setProductOpen] = useState(false);

    // Table
    const [sortCol, setSortCol] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    // Modal
    const [detailModal, setDetailModal] = useState(null);

    const baseUrl = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${baseUrl}/api/v1/admin/outlet/all`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                const names = Array.isArray(data)
                    ? data.map((o) => o?.name).filter(Boolean)
                    : [];
                setOutletOptions(["All Outlets", ...names]);
            })
            .catch(() => {});

        // Fetch products list to populate Sales by Product dropdown
        fetch(`${baseUrl}/api/manager/products`, { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                const items = Array.isArray(data)
                    ? data
                        .filter(item => item.name && (item.type === "product" || item.type === "Semi-Finished" || item.type === "Oilman"))
                        .map(item => item.name)
                    : [];
                setProducts(["All Products", ...items]);
            })
            .catch((err) => console.error("Failed to load products list:", err));
    }, [baseUrl]);

    const authHeaders = () => {
        const token = localStorage.getItem("authToken");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const handleSort = (col) => {
        if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    // Fetch the selected report from the backend.
    const fetchReport = useCallback(async () => {
        if (!selectedCategory || !selectedReport) return;
        try {
            setLoading(true);
            setPageError(null);
            setReportEnvelope(null);
            setRawData([]);

            const params = new URLSearchParams();
            // type — only meaningful for endpoints that branch on it
            if (selectedReport.type) params.set("type", selectedReport.type);
            // period — payments endpoint uses this; others ignore
            const effectivePeriod = selectedReport.period || period;
            if (selectedCategory.endpoint === "payments" && effectivePeriod) {
                params.set("period", effectivePeriod);
            }
            if (startDate) params.set("from", startDate);
            if (endDate) params.set("to", endDate);
            // outlet param: backend takes a numeric outlet id; we pass it only
            // when the user selects something other than the default. If a
            // server-side mapping table existed we'd resolve the id here; for
            // now the placeholder just leaves it off.
            // (See spec: outlet filtering by id is wireable once outlets are
            // surfaced via an API.)

            const url = `${baseUrl}/api/v1/finance/reports/${selectedCategory.endpoint}${
                params.toString() ? `?${params.toString()}` : ""
            }`;
            const res = await fetch(url, { headers: authHeaders() });
            if (!res.ok) throw new Error(`Failed to load report: ${res.status}`);
            const env = await res.json();

            setReportEnvelope(env);
            const rows = Array.isArray(env?.rows) ? env.rows : [];
            setRawData(rows.map(normaliseRow));
        } catch (e) {
            console.error("Failed to fetch report:", e);
            setPageError("Failed to load report. Please try again.");
            setReportEnvelope(null);
            setRawData([]);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, selectedCategory, selectedReport, period, startDate, endDate]);

    const handleGenerate = () => {
        setGenerated(true);
        setPage(1);
        fetchReport();
    };

    const handleReset = () => {
        setPeriod("Monthly");
        setOutlet("All Outlets");
        setStartDate(""); setEndDate("");
        setSelectedProduct("All Products");
        setSearchTerm(""); setGenerated(false); setPage(1);
        setReportEnvelope(null); setRawData([]); setPageError(null);
    };

    // When the user picks a different report, clear the previous result so the
    // placeholder is shown until they hit Generate again.
    useEffect(() => {
        setGenerated(false);
        setReportEnvelope(null);
        setRawData([]);
        setSelectedProduct("All Products");
        setPage(1);
    }, [selectedCategory.id, selectedReport.label]);

    const handleExportPDF = () => {
        if (sorted.length === 0) return;
        
        const headers = isPaymentReport ? ["Date", "Supplier", "Ref", "Invoiced (Rs.)", "Paid (Rs.)", "Outstanding (Rs.)", "Status"] :
                        isSalesReport ? ["Date", "Product", "Category", "Outlet", "Gross (Rs.)", "Net (Rs.)", "Cost (Rs.)", "GP (Rs.)"] :
                        ["Date", "Product", "Outlet", "Qty", "Cost/Unit (Rs.)", "Total Cost (Rs.)", "Reason"];
        
        const data = sorted.map(r => isPaymentReport ? [
            r.date, r.supplier, r.ref, r.totalInvoiced.toLocaleString(), r.paid.toLocaleString(), r.outstanding.toLocaleString(), r.status
        ] : isSalesReport ? [
            r.date, r.product, r.category, r.outlet, r.sales.toLocaleString(), r.net.toLocaleString(), r.totalCost.toLocaleString(), (r.net - r.totalCost).toLocaleString()
        ] : [
            r.date, r.product, r.outlet, `${r.qty ?? ""} ${r.unit}`, r.costPerUnit.toLocaleString(), r.totalCost.toLocaleString(), r.reason
        ]);

        generatePDF({
            title: selectedReport.label,
            subtitle: `Category: ${selectedCategory.label} | Period: ${period}`,
            orientation: "l",
            headers: headers,
            data: data,
            fileName: selectedReport.label.replace(/\s+/g, '_')
        });
    };

    const handleExportExcel = () => {
        if (sorted.length === 0) return;
        const headers = isPaymentReport ? ["Date", "Supplier", "Ref", "Invoiced", "Paid", "Outstanding", "Status"] :
                        isSalesReport ? ["Date", "Product", "Category", "Outlet", "Gross", "Net", "Cost", "GP"] :
                        ["Date", "Product", "Outlet", "Qty", "Cost/Unit", "Total Cost", "Reason"];
        
        const rows = sorted.map(r => isPaymentReport ? [
            r.date, r.supplier, r.ref, r.totalInvoiced, r.paid, r.outstanding, r.status
        ] : isSalesReport ? [
            r.date, r.product, r.category, r.outlet, r.sales, r.net, r.totalCost, (r.net - r.totalCost)
        ] : [
            r.date, r.product, r.outlet, `${r.qty ?? ""} ${r.unit}`, r.costPerUnit, r.totalCost, r.reason
        ]);

        generateExcel({
            headers: headers,
            data: rows,
            fileName: selectedReport.label.replace(/\s+/g, '_')
        });
    };

    // Filter & sort (client-side, after server returns the report).
    const filtered = useMemo(() => {
        return rawData.filter((r) => {
            if (outlet !== "All Outlets" && r.outlet && r.outlet !== outlet) return false;
            if (selectedReport.label === "Sales by Product" && selectedProduct !== "All Products" &&
                r.product?.trim().toLowerCase() !== selectedProduct?.trim().toLowerCase()) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
            }
            return true;
        });
    }, [rawData, outlet, searchTerm, selectedReport, selectedProduct]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (typeof av === "number" || typeof bv === "number") { av = +av; bv = +bv; }
            if (av == null) av = "";
            if (bv == null) bv = "";
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filtered, sortCol, sortDir]);

    // Summary metrics
    const isPaymentReport = selectedCategory.id === "payments";
    const isSalesReport = selectedCategory.id === "sales";
    const isWastageReport = selectedCategory.id === "production";
    const isStaffReport = selectedCategory.id === "staff";
    const isStockReport = selectedCategory.id === "stock";
    const isPurchaseReport = selectedCategory.id === "purchase";

    // Use a wastage-style table for staff/stock/purchase/wastage — they all
    // share the (qty, cost/unit, total cost, reason) shape.
    const useWastageShape = isWastageReport || isStaffReport || isStockReport || isPurchaseReport;

    const summaryCards = useMemo(() => {
        if (isPaymentReport) {
            const totalPaid = filtered.reduce((s, r) => s + (r.paid || 0), 0);
            const totalOutstanding = filtered.reduce((s, r) => s + (r.outstanding || 0), 0);
            const overdueCount = filtered.filter((r) => r.status === "Overdue").length;
            return [
                { label: "Total Invoiced", value: `Rs. ${filtered.reduce((s, r) => s + (r.totalInvoiced || 0), 0).toLocaleString()}`, icon: <Banknote size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
                { label: "Total Paid", value: `Rs. ${totalPaid.toLocaleString()}`, icon: <CheckCircle size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
                { label: "Total Outstanding", value: `Rs. ${totalOutstanding.toLocaleString()}`, icon: <TrendingDown size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
                { label: "Overdue Entries", value: overdueCount, icon: <AlertTriangle size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
            ];
        }
        if (isSalesReport) {
            return [
                { label: "Gross Sales", value: `Rs. ${filtered.reduce((s, r) => s + (r.sales || 0), 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
                { label: "Net Sales", value: `Rs. ${filtered.reduce((s, r) => s + (r.net || 0), 0).toLocaleString()}`, icon: <Banknote size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
                { label: "Total Discounts", value: `Rs. ${filtered.reduce((s, r) => s + (r.discounts || 0), 0).toLocaleString()}`, icon: <TrendingDown size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
                { label: "Total Returns", value: `Rs. ${filtered.reduce((s, r) => s + (r.returns || 0), 0).toLocaleString()}`, icon: <Repeat size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
            ];
        }
        if (useWastageShape) {
            return [
                { label: "Total Cost", value: `Rs. ${filtered.reduce((s, r) => s + (r.totalCost || 0), 0).toLocaleString()}`, icon: <AlertTriangle size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
                { label: "Total Items", value: filtered.length, icon: <Package size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
                { label: "Top Reason", value: filtered.length > 0 ? (filtered[0].reason || "—") : "—", icon: <Clock size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
                { label: "Outlets/Suppliers", value: [...new Set(filtered.map((r) => r.outlet || r.supplier))].filter(Boolean).length, icon: <Layers size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
            ];
        }
        return [
            { label: "Total Records", value: filtered.length, icon: <BarChart2 size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
            { label: "Date Range", value: period, icon: <Calendar size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
            { label: "Report Type", value: selectedCategory.label.split(" ")[0], icon: <PieChart size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
            { label: "Filters Active", value: [startDate, endDate, outlet !== "All Outlets"].filter(Boolean).length, icon: <Sliders size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
        ];
    }, [filtered, isPaymentReport, isSalesReport, useWastageShape, period, selectedCategory, outlet, startDate, endDate]);

    // Chart data for mini charts
    const chartData = useMemo(() => {
        if (isPaymentReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.supplier || r.ref || "").split(" ")[0], value: r.totalInvoiced }));
        }
        if (isSalesReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.product || "").split(" ")[0], value: r.net }));
        }
        if (useWastageShape) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.product || "").split(" ")[0] || "—", value: r.totalCost }));
        }
        return [];
    }, [filtered, isPaymentReport, isSalesReport, useWastageShape]);

    const dataUnavailable = !!reportEnvelope?.dataUnavailable;

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

                    {/* ── Page Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Financial Reports</h1>
                            <p className="text-[14px] text-[#667085]">Generate, analyze, and export comprehensive financial reports</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <button 
                                onClick={handleExportPDF}
                                disabled={!generated || sorted.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
                            >
                                <FileText size={15} /> PDF
                            </button>
                            <button 
                                onClick={handleExportExcel}
                                disabled={!generated || sorted.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-50"
                            >
                                <FileSpreadsheet size={15} /> Excel
                            </button>
                        </div>
                    </div>

                    {pageError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 mb-4">
                            {pageError}
                        </div>
                    )}

                    {/* ── Report Category Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                        {REPORT_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setSelectedReport(cat.reports[0]);
                                    setGenerated(false);
                                    setPage(1);
                                }}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center
                                    ${selectedCategory.id === cat.id
                                        ? "border-[#0F50AA] bg-[#EEF3FB] shadow-sm"
                                        : "border-[#E4E6EA] bg-white hover:border-[#0F50AA]/30 hover:bg-[#F8F9FA]"}`}
                            >
                                <div className={`w-9 h-9 rounded-lg ${cat.color} flex items-center justify-center text-white`}>
                                    {cat.icon}
                                </div>
                                <p className={`text-[10px] font-[600] leading-tight ${selectedCategory.id === cat.id ? "text-[#0F50AA]" : "text-[#667085]"}`}>
                                    {cat.label}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* ── Filter Panel ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EA] p-4 sm:p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sliders size={15} className="text-[#0F50AA]" />
                            <h3 className="text-[14px] font-[600] text-[#383E49]">Report Parameters</h3>
                            <span className="ml-auto text-[11px] text-[#667085] bg-[#F8F9FA] px-2 py-0.5 rounded-full border border-[#E4E6EA]">
                                {selectedCategory.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">

                            {/* Report Type */}
                            <div className={selectedReport.label === "Sales by Product" ? "lg:col-span-2" : "lg:col-span-3"}>
                                <FilterDropdown
                                    label="Report Type"
                                    open={reportOpen} setOpen={setReportOpen}
                                    value={selectedReport}
                                    options={selectedCategory.reports}
                                    onChange={(v) => { setSelectedReport(v); setGenerated(false); setPage(1); }}
                                    icon={<Filter size={13} />}
                                    getLabel={(r) => r.label}
                                />
                            </div>

                            {/* Product selection dropdown shown only for Sales by Product */}
                            {selectedReport.label === "Sales by Product" && (
                                <div className="lg:col-span-2">
                                    <FilterDropdown
                                        label="Product"
                                        open={productOpen} setOpen={setProductOpen}
                                        value={selectedProduct}
                                        options={products}
                                        onChange={(p) => { setSelectedProduct(p); setPage(1); }}
                                        icon={<Package size={13} />}
                                    />
                                </div>
                            )}

                            {/* Period */}
                            <div className="lg:col-span-2">
                                <FilterDropdown
                                    label="Period"
                                    open={periodOpen} setOpen={setPeriodOpen}
                                    value={period} options={PERIOD_OPTIONS}
                                    onChange={setPeriod}
                                    icon={<Calendar size={13} />}
                                />
                            </div>

                            {/* From Date */}
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                                    <input
                                        type="date" value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                    />
                                </div>
                            </div>

                            {/* To Date */}
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                                    <input
                                        type="date" value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                    />
                                </div>
                            </div>

                            {/* Outlet */}
                            <div className={selectedReport.label === "Sales by Product" ? "lg:col-span-1" : "lg:col-span-2"}>
                                <FilterDropdown
                                    label="Outlet"
                                    open={outletOpen} setOpen={setOutletOpen}
                                    value={outlet} options={outletOptions}
                                    onChange={setOutlet}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="lg:col-span-1 flex flex-col gap-1.5 pt-5">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full px-3 py-2.5 bg-[#0F50AA] text-white text-[12px] font-[600] rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-60"
                                >
                                    {loading ? "Loading…" : "Generate"}
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

                    {/* ── Summary Cards (only when generated and data available) ── */}
                    {generated && !dataUnavailable && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            {summaryCards.map((card, i) => (
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
                    )}

                    {/* ── Chart + Table Section ── */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                            <div>
                                <h3 className="text-[18px] font-[600] text-[#383E49]">{selectedReport.label}</h3>
                                <p className="text-[12px] text-[#667085] mt-0.5">
                                    {!generated
                                        ? "Configure filters above and click Generate"
                                        : dataUnavailable
                                            ? "Data unavailable for this report"
                                            : `Showing ${Math.min(PAGE_SIZE, sorted.length)} of ${sorted.length} records · ${period}`}
                                </p>
                            </div>
                            {generated && !dataUnavailable && (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search records..."
                                            className="pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent w-52"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mini Chart Row (when generated, data available, and we have rows) */}
                        {generated && !dataUnavailable && chartData.length > 0 && (
                            <div className="mb-6 p-4 bg-[#F8F9FA] rounded-xl border border-[#E4E6EA]">
                                <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wide mb-3">Quick Overview</p>
                                <MiniBarChart data={chartData} valueKey="value" labelKey="label" color="#0F50AA" />
                            </div>
                        )}

                        {/* Body */}
                        {!generated ? (
                            <PlaceholderTable reportType={selectedReport.label} />
                        ) : loading ? (
                            <div className="flex items-center justify-center py-28">
                                <RefreshCw size={38} className="text-[#0F50AA] animate-spin" />
                            </div>
                        ) : dataUnavailable ? (
                            <UnavailableState
                                reason={reportEnvelope?.unavailableReason}
                                reportType={selectedReport.label}
                            />
                        ) : isPaymentReport ? (
                            <PaymentTable
                                data={sorted}
                                onView={setDetailModal}
                                sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                                page={page} setPage={setPage} PAGE_SIZE={PAGE_SIZE}
                            />
                        ) : isSalesReport ? (
                            <SalesTable
                                data={sorted}
                                onView={setDetailModal}
                                sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                                page={page} setPage={setPage} PAGE_SIZE={PAGE_SIZE}
                            />
                        ) : useWastageShape ? (
                            <WastageTable
                                data={sorted}
                                onView={setDetailModal}
                                sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                                page={page} setPage={setPage} PAGE_SIZE={PAGE_SIZE}
                            />
                        ) : (
                            <PlaceholderTable reportType={selectedReport.label} />
                        )}
                    </div>
                </main>
            </div>

            {/* ── Detail Modal ── */}
            {detailModal && (
                <ReportDetailModal
                    row={detailModal}
                    reportType={selectedReport.label}
                    onClose={() => setDetailModal(null)}
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
