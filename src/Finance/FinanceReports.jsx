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
    Wallet,
    CreditCard,
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
        color: "bg-brand",
        endpoint: "payments",
        reports: [
            { label: "Daily Payment Summary",   type: "Daily",   period: "Daily" },
            { label: "Monthly Payment Summary", type: "Monthly", period: "Monthly" },
            { label: "Yearly Payment Summary",  type: "Yearly",  period: "Yearly" },
            { label: "Outstanding Balances",    type: "Outstanding", period: "Outstanding" },
        ],
    },
    {
        id: "sales",
        label: "Sales Reports",
        icon: <TrendingUp size={16} />,
        color: "bg-plum-solid",
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
        color: "bg-info-solid",
        endpoint: "wastage",
        reports: [
            { label: "Raw Material Costs",  type: "rawMaterialCosts" },
            // "Production Overheads" is hidden: overheads (labour, power, rent) are not recorded anywhere yet,
            // and it only repeated Wastage by Product. Add it back once overhead costs are captured.
            { label: "Wastage by Product",  type: "byProduct" },
            { label: "Wastage by Outlet",   type: "byOutlet" },
        ],
    },
    {
        id: "profitability",
        label: "Gross Profitability",
        icon: <BarChart2 size={16} />,
        color: "bg-info-solid",
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
        color: "bg-plum-solid",
        endpoint: "staff-meals",
        reports: [
            { label: "Free Meal Issuance",   type: "issuance" },
            { label: "Staff Meal Cost Report", type: "costReport" },
        ],
    },
    {
        id: "stock",
        label: "Stock Movement",
        icon: <Layers size={16} />,
        color: "bg-success-solid",
        endpoint: "stock-movement",
        reports: [
            { label: "Stock Inflow/Outflow", type: "inflowOutflow" },
            { label: "Adjustments Log",      type: "adjustments" },
            { label: "Current Stock Levels", type: "currentStock" },
        ],
    },
    {
        id: "purchase",
        label: "Purchase Price Analysis",
        icon: <Truck size={16} />,
        color: "bg-brand",
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
        color: "bg-plum-solid",
        endpoint: "variance",
        reports: [
            { label: "Price Variance",       type: "priceVariance" },
            { label: "Quantity Variance",    type: "quantityVariance" },
            { label: "Production Comparison", type: "productionComparison" },
        ],
    },
    {
        id: "iou",
        label: "IOU / Cash Advances",
        icon: <Wallet size={16} />,
        color: "bg-success-solid",
        endpoint: "iou",
        reports: [
            { label: "IOU Summary",          type: "summary" },
            { label: "Open IOUs",            type: "open" },
            { label: "IOU Items Purchased",  type: "items" },
        ],
    },
    {
        id: "credit",
        label: "Credit Orders",
        icon: <CreditCard size={16} />,
        color: "bg-brand",
        endpoint: "credit-orders",
        reports: [
            { label: "All Credit Orders",      type: "orders" },
            { label: "Open Credit Orders",     type: "open" },
            { label: "Pay-Later Bills",        type: "creditSales" },
            { label: "Balances by Customer",   type: "byCustomer" },
        ],
    },
];

const PERIOD_OPTIONS = ["Daily", "Monthly", "Yearly", "Custom Range"];
// Outlet list is loaded inside the component from /api/v1/admin/outlet/all.

const STATUS_STYLE = {
    Overdue: { text: "text-error", bg: "bg-subtle", icon: <AlertTriangle size={11} /> },
    Pending: { text: "text-warning", bg: "bg-hover", icon: <Clock size={11} /> },
    Cleared: { text: "text-success", bg: "bg-hover", icon: <CheckCircle size={11} /> },
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
        dueDate: raw.dueDate || "—",
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
        // profitability / standard vs actual (null = not applicable, shown as "—")
        profit: raw.profit != null ? toNumber(raw.profit) : null,
        marginPct: raw.marginPct != null ? toNumber(raw.marginPct) : null,
        targetMarginPct: raw.targetMarginPct != null ? toNumber(raw.targetMarginPct) : null,
        standard: raw.standard != null ? toNumber(raw.standard) : null,
        actual: raw.actual != null ? toNumber(raw.actual) : null,
        variance: raw.variance != null ? toNumber(raw.variance) : null,
        variancePct: raw.variancePct != null ? toNumber(raw.variancePct) : null,
        wasted: raw.wasted != null ? toNumber(raw.wasted) : null,
    };
}

function MiniBarChart({ data, valueKey, labelKey, color = "rgb(var(--brand-fg))" }) {
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
                    <span className="text-[12px] text-fg-secondary truncate w-full text-center">{d[labelKey]}</span>
                </div>
            ))}
        </div>
    );
}

function FilterDropdown({ open, setOpen, value, options, onChange, icon, label, getLabel }) {
    const display = (o) => (getLabel ? getLabel(o) : o);
    return (
        <div className="relative">
            {label && <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">{label}</label>}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2.5 border border-line rounded-lg text-[13px] text-fg bg-surface hover:bg-subtle transition-colors min-w-[150px] w-full"
            >
                {icon && <span className="text-fg-secondary">{icon}</span>}
                <span className="flex-1 text-left truncate">{display(value)}</span>
                <ChevronDown size={13} className="text-fg-secondary" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 bg-elevated border border-line rounded-lg shadow-lg z-50 min-w-full">
                        {options.map((o) => {
                            const lbl = display(o);
                            const isSelected = display(value) === lbl;
                            return (
                                <button
                                    key={lbl}
                                    onClick={() => { onChange(o); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-subtle transition-colors first:rounded-t-lg last:rounded-b-lg ${isSelected ? "text-brand-fg font-[500] bg-hover" : "text-fg"}`}
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

function ReportDetailModal({ row, reportType, columns, onClose }) {
    const detailFields = (columns || DETAIL_COLUMNS.production).map(([key, label, fmt]) => [label.replace(" (Rs.)", ""), detailValue(row, key, fmt) ?? "—"]);
    const isPayment = reportType && ["Daily Payment Summary", "Monthly Payment Summary", "Yearly Payment Summary", "Outstanding Balances"].includes(reportType);
    const isSales = reportType && ["Sales by Product", "Sales by Time Interval", "Discounts & Returns"].includes(reportType);

    return (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-5 border-b border-line flex items-center justify-between">
                    <div>
                        <h3 className="text-[16px] font-[600] text-fg">Record Details</h3>
                        <p className="text-[12px] text-fg-secondary mt-0.5">{row.ref || row.product || row.id}</p>
                    </div>
                    <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-app rounded-lg">
                        <X size={16} className="text-fg-secondary" />
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
                        <div key={label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                            <p className="text-[12px] text-fg-secondary">{label}</p>
                            <p className="text-[13px] font-[500] text-fg">{value}</p>
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
                        <div key={label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                            <p className="text-[12px] text-fg-secondary">{label}</p>
                            <p className="text-[13px] font-[500] text-fg">{value}</p>
                        </div>
                    ))}
                    {!isPayment && !isSales && detailFields.map(([label, value]) => ({ label, value })).map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                            <p className="text-[12px] text-fg-secondary">{label}</p>
                            <p className="text-[13px] font-[500] text-fg">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-line flex justify-end gap-2">
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
                            ] : detailFields;

                            generatePDF({
                                title: "Record Details",
                                subtitle: `Reference: ${row.ref || row.product || row.id}`,
                                headers: ["Field", "Value"],
                                data: fields,
                                fileName: `Record_${row.ref || row.id}`
                            });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle"
                    >
                        <FileText size={13} /> Export PDF
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-brand text-on-brand text-[12px] font-[500] rounded-lg hover:bg-brand-hover">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function PaymentTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE }) {
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-brand-fg" /> : <ArrowDown size={12} className="text-brand-fg" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-line bg-subtle">
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
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-fg-secondary whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={8} className="py-16 text-center">
                                <BarChart2 size={36} className="mx-auto text-fg-muted mb-3" />
                                <p className="text-[14px] font-[500] text-fg">No data for selected filters</p>
                                <p className="text-[12px] text-fg-secondary">Try adjusting your report parameters</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const ss = STATUS_STYLE[row.status] || { text: "text-fg-secondary", bg: "bg-app", icon: null };
                            return (
                                <tr key={row.id} className={`border-b border-line hover:bg-subtle transition-colors ${row.status === "Overdue" ? "bg-error/10" : ""}`}>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[500] text-fg whitespace-nowrap">{row.date}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[500] text-fg">{row.supplier}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[12px] text-brand-fg font-[600]">{row.ref}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[600] text-fg">Rs. {row.totalInvoiced.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[600] text-success">Rs. {row.paid.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className={`text-[13px] font-[700] ${row.outstanding > 0 ? "text-error" : "text-success"}`}>Rs. {row.outstanding.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center gap-1 text-[12px] font-[500] px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>{ss.icon}{row.status}</span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hover text-brand-fg text-[12px] font-[500] rounded-lg hover:bg-brand-hover hover:text-on-brand transition-colors">
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
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                    <p className="text-[12px] text-fg-secondary">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button aria-label="Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-fg-secondary" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}>{p}</button>
                        ))}
                        <button aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-fg-secondary" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function SalesTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE }) {
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-brand-fg" /> : <ArrowDown size={12} className="text-brand-fg" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-line bg-subtle">
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
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-fg-secondary whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={11} className="py-16 text-center">
                                <TrendingUp size={36} className="mx-auto text-fg-muted mb-3" />
                                <p className="text-[14px] font-[500] text-fg">No sales data found</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const gp = row.net - row.totalCost;
                            return (
                                <tr key={row.id} className="border-b border-line hover:bg-subtle transition-colors">
                                    <td className="py-3.5 px-4"><p className="text-[13px] text-fg whitespace-nowrap">{row.date}</p></td>
                                    <td className="py-3.5 px-4"><p className="text-[13px] font-[600] text-fg">{row.product}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[12px] font-[500] px-2 py-0.5 rounded-full bg-hover text-brand-fg">{row.category}</span></td>
                                    <td className="py-3.5 px-4"><p className="text-[12px] text-fg-secondary">{row.outlet}</p></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-fg">Rs. {row.sales.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[12px] text-warning font-[600]">{row.discounts > 0 ? `-Rs. ${row.discounts.toLocaleString()}` : "—"}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[12px] text-error font-[600]">{row.returns > 0 ? `-Rs. ${row.returns.toLocaleString()}` : "—"}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-success">Rs. {row.net.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className="text-[13px] font-[700] text-plum">Rs. {row.totalCost.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4"><span className={`text-[13px] font-[700] ${gp >= 0 ? "text-success" : "text-error"}`}>Rs. {gp.toLocaleString()}</span></td>
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hover text-brand-fg text-[12px] font-[500] rounded-lg hover:bg-brand-hover hover:text-on-brand transition-colors">
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
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                    <p className="text-[12px] text-fg-secondary">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button aria-label="Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-fg-secondary" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}>{p}</button>
                        ))}
                        <button aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-fg-secondary" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// Columns of the shared detail table, per report category: each report shows its own fields
// (a purchase report needs the supplier and price change, a staff-meal report the staff member).
const DETAIL_COLUMNS = {
    production: [["date", "Date"], ["product", "Product"], ["category", "Category"], ["outlet", "Outlet"], ["qty", "Qty"],
        ["costPerUnit", "Cost/Unit (Rs.)"], ["totalCost", "Total Cost (Rs.)"], ["reason", "Reason"]],
    purchase: [["date", "Date"], ["supplier", "Supplier"], ["product", "Material"], ["qty", "Qty"],
        ["costPerUnit", "Price/Unit (Rs.)"], ["totalCost", "Total (Rs.)"], ["change", "Change vs last price"]],
    staff: [["date", "Date"], ["employee", "Staff"], ["product", "Item"], ["totalCost", "Value (Rs.)"], ["reason", "Reason"]],
    stock: [["date", "Date"], ["product", "Item"], ["supplier", "From / To"], ["ref", "Ref"], ["qty", "Qty"],
        ["costPerUnit", "Cost/Unit (Rs.)"], ["totalCost", "Total (Rs.)"], ["reason", "Movement"]],
};
const EMPTY_TEXT = {
    production: "No wastage records found",
    purchase: "No goods received from suppliers in this period",
    staff: "No staff meals in this period",
    stock: "No stock movements in this period",
};
const PROFIT_COLS = [["qty", "Sold"], ["net", "Net sales (Rs.)", "rs"], ["totalCost", "Recipe cost (Rs.)", "rs"],
    ["profit", "Profit (Rs.)", "rs"], ["marginPct", "Margin", "pct"]];
const IOU_COLS = [["date", "Date"], ["ref", "IOU"], ["employee", "Requested by"], ["supplier", "Given to"], ["product", "Purpose"],
    ["standard", "Cash issued (Rs.)", "rs"], ["actual", "Spent (Rs.)", "rs"], ["variance", "Over / under (Rs.)", "rs"], ["reason", "Status"]];
const CREDIT_ORDER_COLS = [["date", "Ordered"], ["ref", "Order"], ["supplier", "Customer"], ["outlet", "Outlet"], ["dueDate", "Delivery"],
    ["product", "Items"], ["totalInvoiced", "Order total (Rs.)", "rs"], ["paid", "Paid (Rs.)", "rs"], ["outstanding", "Balance (Rs.)", "rs"],
    ["reason", "Status"]];
Object.assign(DETAIL_COLUMNS, {
    "credit:orders": CREDIT_ORDER_COLS,
    "credit:open": CREDIT_ORDER_COLS,
    "credit:creditSales": [["date", "Date"], ["ref", "Bill"], ["supplier", "Customer"], ["outlet", "Outlet"], ["employee", "Cashier"],
        ["totalInvoiced", "Bill total (Rs.)", "rs"], ["outstanding", "Unpaid (Rs.)", "rs"], ["reason", "Payment"]],
    "credit:byCustomer": [["supplier", "Customer"], ["ref", "Activity"], ["totalInvoiced", "Orders + bills (Rs.)", "rs"],
        ["paid", "Paid (Rs.)", "rs"], ["outstanding", "Owed (Rs.)", "rs"], ["reason", "Status"]],
    "iou:summary": IOU_COLS,
    "iou:open": IOU_COLS,
    "iou:items": [["date", "Date"], ["ref", "IOU"], ["product", "Item"], ["category", "Type"], ["supplier", "Bought from"], ["qty", "Qty"],
        ["costPerUnit", "Price/Unit (Rs.)"], ["totalCost", "Total (Rs.)"], ["standard", "Estimated (Rs.)", "rs"],
        ["variance", "Over / under (Rs.)", "rs"], ["reason", "Stock"]],
    "staff:costReport": [["employee", "Staff"], ["qty", "Meals", "num"], ["sales", "Selling value (Rs.)", "rs"],
        ["totalCost", "Recipe cost (Rs.)", "rs"]],
    "profitability:byProduct": [["product", "Product"], ["category", "Category"], ...PROFIT_COLS, ["reason", "Note"]],
    "profitability:byCategory": [["category", "Category"], ...PROFIT_COLS],
    "profitability:byOutlet": [["outlet", "Outlet"], ...PROFIT_COLS],
    "profitability:lowMargin": [["product", "Product"], ["category", "Category"], ...PROFIT_COLS,
        ["targetMarginPct", "Target", "pct"], ["reason", "Note"]],
    "variance:priceVariance": [["date", "Date"], ["supplier", "Supplier"], ["product", "Material"], ["qty", "Qty"],
        ["standard", "PO price (Rs.)", "rs"], ["actual", "Paid (Rs.)", "rs"], ["variance", "Difference (Rs.)", "rs"],
        ["variancePct", "Diff", "pct"], ["reason", "Result"]],
    "variance:quantityVariance": [["date", "Date"], ["ref", "Plan"], ["product", "Material"], ["standard", "Recipe needs", "unit"],
        ["actual", "Issued", "unit"], ["variance", "Difference", "unit"], ["variancePct", "Diff", "pct"],
        ["totalCost", "Cost effect (Rs.)", "rs"], ["reason", "Result"]],
    "variance:productionComparison": [["date", "Date"], ["ref", "Plan"], ["product", "Product"], ["standard", "Planned", "num"],
        ["actual", "Produced", "num"], ["variance", "Difference", "num"], ["variancePct", "Diff", "pct"],
        ["wasted", "Wasted", "num"], ["reason", "Result"]],
});
Object.assign(EMPTY_TEXT, {
    profitability: "No paid sales in this period",
    "profitability:lowMargin": "No product is below its target margin in this period",
    variance: "Nothing to compare in this period",
    iou: "No IOUs in this period",
    "iou:open": "No IOU cash is waiting to be settled",
    "iou:items": "No settled IOU purchases in this period",
    credit: "No credit orders in this period",
    "credit:open": "No credit orders are waiting for payment or closing",
    "credit:creditSales": "No pay-later bills in this period",
    "credit:byCustomer": "No credit orders or pay-later bills in this period",
});
const detailColumns = (categoryId, type) =>
    DETAIL_COLUMNS[`${categoryId}:${type}`] || DETAIL_COLUMNS[categoryId] || DETAIL_COLUMNS.production;
const signed = (n, text) => `${n > 0 ? "+" : ""}${text}`;
/** A cell as text; Excel gets plain numbers (asNumber). Formats: rs, pct, unit (qty + unit), num, or plain. */
const detailValue = (row, key, fmt, asNumber = false) => {
    const v = row[key];
    if (key === "qty") return `${row.qty ?? ""} ${row.unit}`.trim();
    if (key === "change") return v == null ? "" : `${signed(v, v)}%`;
    if (!fmt) return v;
    if (v == null) return asNumber ? "" : "—";
    if (asNumber) return v;
    const isDiff = key === "variance" || key === "variancePct";
    const text = fmt === "rs" ? `Rs. ${v.toLocaleString()}`
        : fmt === "pct" ? `${v}%`
            : fmt === "unit" ? `${v.toLocaleString()} ${row.unit}`.trim()
                : v.toLocaleString();
    return isDiff ? signed(v, text) : text;
};

function WastageTable({ data, onView, sortCol, sortDir, onSort, page, setPage, PAGE_SIZE, categoryId = "production", reportType }) {
    const columns = detailColumns(categoryId, reportType);
    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-fg-muted" />;
        return sortDir === "asc" ? <ArrowUp size={12} className="text-brand-fg" /> : <ArrowDown size={12} className="text-brand-fg" />;
    };
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const REASON_STYLE = {
        Expired: { text: "text-error", bg: "bg-subtle" },
        Spoilage: { text: "text-warning", bg: "bg-hover" },
        Overproduction: { text: "text-plum", bg: "bg-subtle" },
        "Cooking Loss": { text: "text-brand-fg", bg: "bg-hover" },
        Spillage: { text: "text-success", bg: "bg-hover" },
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-line bg-subtle">
                            {[
                                ...columns.map(([key, label]) => ({ key, label })),
                                { key: "actions", label: "Action", noSort: true },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => !col.noSort && onSort(col.key)}
                                    className={`text-left py-3.5 px-4 text-[12px] font-[500] text-fg-secondary whitespace-nowrap ${col.noSort ? "" : "cursor-pointer hover:text-fg"}`}
                                >
                                    <div className="flex items-center gap-1">{col.label}{!col.noSort && <SortIcon col={col.key} />}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="py-16 text-center">
                                <Package size={36} className="mx-auto text-fg-muted mb-3" />
                                <p className="text-[14px] font-[500] text-fg">{EMPTY_TEXT[`${categoryId}:${reportType}`] || EMPTY_TEXT[categoryId] || "No records found"}</p>
                            </td></tr>
                        ) : paginated.map((row) => {
                            const rs = REASON_STYLE[row.reason] || { text: "text-fg-secondary", bg: "bg-app" };
                            return (
                                <tr key={row.id} className="border-b border-line hover:bg-subtle transition-colors">
                                    {columns.map(([key, , fmt]) => (
                                        <td key={key} className="py-3.5 px-4">
                                            {fmt ? (
                                                <span className={`text-[13px] whitespace-nowrap ${key === "profit" || key === "net" ? "font-[700] text-fg"
                                                    : (key === "variance" || key === "variancePct") && row[key] ? (row[key] > 0 ? "font-[600] text-warning" : "font-[600] text-info") : "text-fg"}`}>
                                                    {detailValue(row, key, fmt)}
                                                </span>
                                            )
                                            : key === "date" ? <p className="text-[13px] text-fg whitespace-nowrap">{row.date}</p>
                                            : key === "product" || key === "supplier" || key === "employee" ? <p className="text-[13px] font-[600] text-fg">{row[key]}</p>
                                            : key === "category" ? <span className="text-[12px] font-[500] px-2 py-0.5 rounded-full bg-hover text-brand-fg">{row.category}</span>
                                            : key === "qty" ? <p className="text-[13px] font-[600] text-fg">{row.qty ?? "—"} {row.unit}</p>
                                            : key === "costPerUnit" ? <span className="text-[13px] text-fg">Rs. {row.costPerUnit.toLocaleString()}</span>
                                            : key === "totalCost" ? <span className={`text-[13px] font-[700] ${categoryId === "production" ? "text-error" : "text-fg"}`}>Rs. {row.totalCost.toLocaleString()}</span>
                                            : key === "reason" ? <span className={`inline-flex items-center text-[12px] font-[500] px-2.5 py-1 rounded-full ${rs.bg} ${rs.text}`}>{row.reason}</span>
                                            : key === "change" ? <span className={`text-[13px] font-[600] ${row.change > 0 ? "text-error" : row.change < 0 ? "text-success" : "text-fg-secondary"}`}>{detailValue(row, "change") || "—"}</span>
                                            : <p className="text-[12px] text-fg-secondary">{row[key]}</p>}
                                        </td>
                                    ))}
                                    <td className="py-3.5 px-4">
                                        <button onClick={() => onView(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-hover text-brand-fg text-[12px] font-[500] rounded-lg hover:bg-brand-hover hover:text-on-brand transition-colors">
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
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                    <p className="text-[12px] text-fg-secondary">Page {page} of {totalPages} · {data.length} records</p>
                    <div className="flex items-center gap-2">
                        <button aria-label="Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} className="text-fg-secondary" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-[13px] font-[500] transition-colors ${page === p ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-app"}`}>{p}</button>
                        ))}
                        <button aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-line rounded-lg hover:bg-subtle disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={15} className="text-fg-secondary" />
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
            <div className="w-16 h-16 rounded-2xl bg-hover flex items-center justify-center mb-4">
                <Activity size={28} className="text-brand-fg" />
            </div>
            <p className="text-[15px] font-[600] text-fg mb-1">{reportType}</p>
            <p className="text-[13px] text-fg-secondary max-w-xs">
                Select filters above and click <span className="font-[600] text-brand-fg">Generate Report</span> to load this report.
            </p>
        </div>
    );
}

function UnavailableState({ reason, reportType }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-hover flex items-center justify-center mb-4">
                <Info size={28} className="text-warning" />
            </div>
            <p className="text-[15px] font-[600] text-fg mb-1">{reportType}</p>
            <p className="text-[13px] text-fg-secondary max-w-md">
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
    const [outletList, setOutletList] = useState([]);
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
                const list = Array.isArray(data)
                    ? data.filter((o) => o?.name).map((o) => ({ id: o.outletId ?? o.id, name: o.name, location: o.location }))
                    : [];
                // two outlets can share a name, so the dropdown label adds the location when it does
                list.forEach((o) => {
                    const twin = list.filter((x) => x.name === o.name).length > 1;
                    o.label = twin ? `${o.name} (${o.location || `#${o.id}`})` : o.name;
                });
                setOutletList(list);
                setOutletOptions(["All Outlets", ...list.map((o) => o.label)]);
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

    const outletServerSide = selectedCategory.id === "sales"
        || (selectedCategory.id === "production" && selectedReport.type !== "rawMaterialCosts");
    const outletApplies = outletServerSide
        || (selectedCategory.id === "profitability" && selectedReport.type === "byOutlet");

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
            // sales and wastage filter by outlet id on the server
            const outletId = outletList.find((o) => o.label === outlet)?.id;
            if (outletServerSide && outletId != null) params.set("outlet", outletId);

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
    }, [baseUrl, selectedCategory, selectedReport, period, startDate, endDate, outletServerSide, outletList, outlet]);

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
                        detailColumns(selectedCategory.id, selectedReport.type).map(([, label]) => label);
        
        const data = sorted.map(r => isPaymentReport ? [
            r.date, r.supplier, r.ref, r.totalInvoiced.toLocaleString(), r.paid.toLocaleString(), r.outstanding.toLocaleString(), r.status
        ] : isSalesReport ? [
            r.date, r.product, r.category, r.outlet, r.sales.toLocaleString(), r.net.toLocaleString(), r.totalCost.toLocaleString(), (r.net - r.totalCost).toLocaleString()
        ] : detailColumns(selectedCategory.id, selectedReport.type).map(([key, , fmt]) => {
            const v = detailValue(r, key, fmt);
            return typeof v === "number" ? v.toLocaleString() : v;
        }));

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
                        detailColumns(selectedCategory.id, selectedReport.type).map(([, label]) => label.replace(" (Rs.)", ""));
        
        const rows = sorted.map(r => isPaymentReport ? [
            r.date, r.supplier, r.ref, r.totalInvoiced, r.paid, r.outstanding, r.status
        ] : isSalesReport ? [
            r.date, r.product, r.category, r.outlet, r.sales, r.net, r.totalCost, (r.net - r.totalCost)
        ] : detailColumns(selectedCategory.id, selectedReport.type).map(([key, , fmt]) => detailValue(r, key, fmt, true)));

        generateExcel({
            headers: headers,
            data: rows,
            fileName: selectedReport.label.replace(/\s+/g, '_')
        });
    };

    // Filter & sort (client-side, after server returns the report).
    const filtered = useMemo(() => {
        return rawData.filter((r) => {
            if (outletApplies && !outletServerSide && outlet !== "All Outlets"
                && r.outlet !== outletList.find((o) => o.label === outlet)?.name) return false;
            if (selectedReport.label === "Sales by Product" && selectedProduct !== "All Products" &&
                r.product?.trim().toLowerCase() !== selectedProduct?.trim().toLowerCase()) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
            }
            return true;
        });
    }, [rawData, outlet, outletList, outletApplies, outletServerSide, searchTerm, selectedReport, selectedProduct]);

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
    const isProfitReport = selectedCategory.id === "profitability";
    const isVarianceReport = selectedCategory.id === "variance";
    const isIouReport = selectedCategory.id === "iou";
    const isCreditReport = selectedCategory.id === "credit";
    const useWastageShape = isWastageReport || isStaffReport || isStockReport || isPurchaseReport || isProfitReport || isVarianceReport
        || isIouReport || isCreditReport;

    const summaryCards = useMemo(() => {
        if (isPaymentReport) {
            const totalPaid = filtered.reduce((s, r) => s + (r.paid || 0), 0);
            const totalOutstanding = filtered.reduce((s, r) => s + (r.outstanding || 0), 0);
            const overdueCount = filtered.filter((r) => r.status === "Overdue").length;
            return [
                { label: "Total Invoiced", value: `Rs. ${filtered.reduce((s, r) => s + (r.totalInvoiced || 0), 0).toLocaleString()}`, icon: <Banknote size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                { label: "Total Paid", value: `Rs. ${totalPaid.toLocaleString()}`, icon: <CheckCircle size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                { label: "Total Outstanding", value: `Rs. ${totalOutstanding.toLocaleString()}`, icon: <TrendingDown size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                { label: "Overdue Entries", value: overdueCount, icon: <AlertTriangle size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            ];
        }
        if (isSalesReport) {
            return [
                { label: "Gross Sales", value: `Rs. ${filtered.reduce((s, r) => s + (r.sales || 0), 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                { label: "Net Sales", value: `Rs. ${filtered.reduce((s, r) => s + (r.net || 0), 0).toLocaleString()}`, icon: <Banknote size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                { label: "Total Discounts", value: `Rs. ${filtered.reduce((s, r) => s + (r.discounts || 0), 0).toLocaleString()}`, icon: <TrendingDown size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                { label: "Total Returns", value: `Rs. ${filtered.reduce((s, r) => s + (r.returns || 0), 0).toLocaleString()}`, icon: <Repeat size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            ];
        }
        const sum = (key) => filtered.reduce((s, r) => s + (r[key] || 0), 0);
        const money = (n) => `Rs. ${Math.round(n * 100) / 100 === 0 ? 0 : (Math.round(n * 100) / 100).toLocaleString()}`;
        if (isProfitReport) {
            const net = sum("net");
            return [
                { label: "Net Sales", value: money(net), icon: <Banknote size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                { label: "Recipe Cost", value: money(sum("totalCost")), icon: <Package size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                { label: "Gross Profit", value: money(sum("profit")), icon: <TrendingUp size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                { label: "Margin", value: net > 0 ? `${(Math.round(sum("profit") / net * 10000) / 100)}%` : "—", icon: <PieChart size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            ];
        }
        if (isVarianceReport) {
            const type = selectedReport.type;
            const over = filtered.filter((r) => (r.variance || 0) > 0).length;
            const under = filtered.filter((r) => (r.variance || 0) < 0).length;
            const first = type === "priceVariance" ? { label: "Paid vs PO prices", value: money(sum("variance")) }
                : type === "quantityVariance" ? { label: "Cost of extra material", value: money(sum("totalCost")) }
                    : { label: "Planned / Produced", value: `${sum("standard").toLocaleString()} / ${sum("actual").toLocaleString()}` };
            return [
                { ...first, icon: <Banknote size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                { label: "Lines", value: filtered.length, icon: <Layers size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                { label: type === "productionComparison" ? "Over plan" : "Above standard", value: over, icon: <TrendingUp size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                { label: type === "productionComparison" ? "Under plan" : "Below standard", value: under, icon: <TrendingDown size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            ];
        }
        if (isCreditReport) {
            const bills = selectedReport.type === "creditSales";
            return [
                { label: bills ? "Billed on Credit" : "Total Value", value: money(sum("totalInvoiced")) },
                { label: "Paid", value: money(sum("paid")) },
                { label: bills ? "Unpaid" : "Balance Owed", value: money(sum("outstanding")) },
                { label: selectedReport.type === "byCustomer" ? "Customers" : bills ? "Bills" : "Orders", value: filtered.length },
            ].map((c, i) => ({ ...c, icon: [<CreditCard size={20} />, <CheckCircle size={20} />, <AlertTriangle size={20} />, <Layers size={20} />][i],
                color: i === 0 ? "bg-brand" : i === 1 ? "bg-plum-solid" : "bg-info-solid",
                hoverColor: i === 0 ? "hover:bg-brand-hover" : i === 1 ? "hover:bg-plum-solid" : "hover:bg-info-solid",
                iconBg: i === 0 ? "bg-brand/30" : i === 1 ? "bg-plum/30" : "bg-info/30" }));
        }
        if (isIouReport) {
            const items = selectedReport.type === "items";
            const spent = sum(items ? "totalCost" : "actual");
            return [
                items ? { label: "Estimated", value: money(sum("standard")) } : { label: "Cash Issued", value: money(sum("standard")) },
                { label: "Spent", value: money(spent) },
                items ? { label: "Added to Stock", value: filtered.filter((r) => r.reason === "Added to stock").length }
                    : { label: "Over / Under", value: money(sum("variance")) },
                { label: items ? "Items" : "IOUs", value: filtered.length },
            ].map((c, i) => ({ ...c, icon: [<Wallet size={20} />, <Banknote size={20} />, <Repeat size={20} />, <Layers size={20} />][i],
                color: i === 0 ? "bg-brand" : i === 1 ? "bg-plum-solid" : "bg-info-solid",
                hoverColor: i === 0 ? "hover:bg-brand-hover" : i === 1 ? "hover:bg-plum-solid" : "hover:bg-info-solid",
                iconBg: i === 0 ? "bg-brand/30" : i === 1 ? "bg-plum/30" : "bg-info/30" }));
        }
        if (useWastageShape) {
            return [
                { label: "Total Cost", value: `Rs. ${filtered.reduce((s, r) => s + (r.totalCost || 0), 0).toLocaleString()}`, icon: <AlertTriangle size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
                { label: "Total Items", value: filtered.length, icon: <Package size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
                { label: "Top Reason", value: filtered.length > 0 ? (filtered[0].reason || "—") : "—", icon: <Clock size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
                { label: "Outlets/Suppliers", value: [...new Set(filtered.map((r) => r.outlet || r.supplier))].filter(Boolean).length, icon: <Layers size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            ];
        }
        return [
            { label: "Total Records", value: filtered.length, icon: <BarChart2 size={20} />, color: "bg-brand", hoverColor: "hover:bg-brand-hover", iconBg: "bg-brand/30" },
            { label: "Date Range", value: period, icon: <Calendar size={20} />, color: "bg-plum-solid", hoverColor: "hover:bg-plum-solid", iconBg: "bg-plum/30" },
            { label: "Report Type", value: selectedCategory.label.split(" ")[0], icon: <PieChart size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
            { label: "Filters Active", value: [startDate, endDate, outletApplies && outlet !== "All Outlets"].filter(Boolean).length, icon: <Sliders size={20} />, color: "bg-info-solid", hoverColor: "hover:bg-info-solid", iconBg: "bg-info/30" },
        ];
    }, [filtered, isPaymentReport, isSalesReport, isProfitReport, isVarianceReport, isIouReport, isCreditReport, useWastageShape, period, selectedCategory, selectedReport, outlet, outletApplies, startDate, endDate]);

    // Chart data for mini charts
    const chartData = useMemo(() => {
        if (isPaymentReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.supplier || r.ref || "").split(" ")[0], value: r.totalInvoiced }));
        }
        if (isSalesReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.product || "").split(" ")[0], value: r.net }));
        }
        if (isProfitReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.product || r.category || r.outlet || "").split(" ")[0] || "—", value: Math.max(0, r.profit || 0) }));
        }
        if (isCreditReport) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.supplier || "").split(" ")[0] || "—", value: r.outstanding }));
        }
        if (isVarianceReport || isIouReport) return [];   // differences can be negative; the table shows them
        if (useWastageShape) {
            return filtered.slice(0, 6).map((r) => ({ label: (r.product || "").split(" ")[0] || "—", value: r.totalCost }));
        }
        return [];
    }, [filtered, isPaymentReport, isSalesReport, isProfitReport, isVarianceReport, isIouReport, isCreditReport, useWastageShape]);

    const dataUnavailable = !!reportEnvelope?.dataUnavailable;

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
                            <h1 className="text-[20px] font-[600] text-fg mb-1">Financial Reports</h1>
                            <p className="text-[14px] text-fg-secondary">Generate, analyze, and export comprehensive financial reports</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <button 
                                onClick={handleExportPDF}
                                disabled={!generated || sorted.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors disabled:opacity-50"
                            >
                                <FileText size={15} /> PDF
                            </button>
                            <button 
                                onClick={handleExportExcel}
                                disabled={!generated || sorted.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
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

                    {/* ── Report Category Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-6">
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
                                        ? "border-brand-fg bg-hover shadow-sm"
                                        : "border-line bg-surface hover:border-brand-fg/30 hover:bg-subtle"}`}
                            >
                                <div className={`w-9 h-9 rounded-lg ${cat.color} flex items-center justify-center text-on-brand`}>
                                    {cat.icon}
                                </div>
                                <p className={`text-[12px] font-[600] leading-tight ${selectedCategory.id === cat.id ? "text-brand-fg" : "text-fg-secondary"}`}>
                                    {cat.label}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* ── Filter Panel ── */}
                    <div className="bg-surface rounded-2xl shadow-sm border border-line p-4 sm:p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sliders size={15} className="text-brand-fg" />
                            <h3 className="text-[14px] font-[600] text-fg">Report Parameters</h3>
                            <span className="ml-auto text-[12px] text-fg-secondary bg-subtle px-2 py-0.5 rounded-full border border-line">
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
                                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                                    <input
                                        type="date" value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    />
                                </div>
                            </div>

                            {/* To Date */}
                            <div className="lg:col-span-2">
                                <label className="block text-[12px] font-[500] text-fg-secondary mb-1.5 uppercase tracking-wide">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={13} />
                                    <input
                                        type="date" value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-[13px] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    />
                                </div>
                            </div>

                            {/* Outlet (only for reports that can be narrowed to one outlet) */}
                            <div className={selectedReport.label === "Sales by Product" ? "lg:col-span-1" : "lg:col-span-2"}>
                                {outletApplies && (
                                    <FilterDropdown
                                        label="Outlet"
                                        open={outletOpen} setOpen={setOutletOpen}
                                        value={outlet} options={outletOptions}
                                        onChange={setOutlet}
                                    />
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="lg:col-span-1 flex flex-col gap-1.5 pt-5">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full px-3 py-2.5 bg-brand text-on-brand text-[12px] font-[600] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-60"
                                >
                                    {loading ? "Loading…" : "Generate"}
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

                    {/* ── Summary Cards (only when generated and data available) ── */}
                    {generated && !dataUnavailable && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            {summaryCards.map((card, i) => (
                                <div
                                    key={i}
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
                    )}

                    {/* ── Chart + Table Section ── */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                            <div>
                                <h3 className="text-[18px] font-[600] text-fg">{selectedReport.label}</h3>
                                <p className="text-[12px] text-fg-secondary mt-0.5">
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
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search records..."
                                            className="pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent w-52"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mini Chart Row (when generated, data available, and we have rows) */}
                        {generated && !dataUnavailable && chartData.length > 0 && (
                            <div className="mb-6 p-4 bg-subtle rounded-xl border border-line">
                                <p className="text-[12px] font-[600] text-fg-secondary uppercase tracking-wide mb-3">Quick Overview</p>
                                <MiniBarChart data={chartData} valueKey="value" labelKey="label" />
                            </div>
                        )}

                        {/* Body */}
                        {!generated ? (
                            <PlaceholderTable reportType={selectedReport.label} />
                        ) : loading ? (
                            <div className="flex items-center justify-center py-28">
                                <RefreshCw size={38} className="text-brand-fg animate-spin" />
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
                                categoryId={selectedCategory.id}
                                reportType={selectedReport.type}
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
                    columns={detailColumns(selectedCategory.id, selectedReport.type)}
                    onClose={() => setDetailModal(null)}
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
