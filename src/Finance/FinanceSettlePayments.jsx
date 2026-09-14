import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    Hash,
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    Banknote,
    Building2,
    Receipt,
    Filter,
    Eye,
    Send,
    BadgeCheck,
    Wallet,
    TrendingDown,
} from "lucide-react";

import { generatePDF, generateExcel } from "../utils/exportUtils";


import FinanceNavBar from "../component/FinanceNavBar.jsx";
import FinanceSideBar from "../component/FinanceSideBar.jsx";
import Loader from "../component/Loader.jsx";


const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Cheque", "Credit Card", "Online Transfer"];
const STATUS_FILTER_OPTIONS = ["All Status", "Pending", "Cleared"];

const STATUS_STYLE = {
    Overdue: { text: "text-[#EF4444]", bg: "bg-[#FEF2F2]", icon: <AlertTriangle size={11} /> },
    Pending: { text: "text-[#F4A100]", bg: "bg-[#FFFBEB]", icon: <Clock size={11} /> },
    Cleared: { text: "text-[#199D26]", bg: "bg-[#F0FDF4]", icon: <CheckCircle size={11} /> },
};

const METHOD_ICON = {
    "Bank Transfer": <Building2 size={13} />,
    "Cash": <Banknote size={13} />,
    "Cheque": <Receipt size={13} />,
    "Credit Card": <CreditCard size={13} />,
    "Online Transfer": <Send size={13} />,
};


function SupplierDropdown({ suppliers, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

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
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors"
            >
                {selected ? (
                    <div className="w-6 h-6 bg-[#0F50AA] rounded-md flex items-center justify-center text-white text-[10px] font-[700] flex-shrink-0">
                        {selected.code}
                    </div>
                ) : (
                    <Wallet size={14} className="text-[#667085] flex-shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{selected ? selected.name : "Select Supplier"}</span>
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
                                    placeholder="Search supplier..."
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

function SelectDropdown({ open, setOpen, value, options, onChange, placeholder }) {
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors"
            >
                <span className="flex-1 text-left truncate">{value || placeholder}</span>
                <ChevronDown size={13} className="text-[#667085] flex-shrink-0" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-full">
                        {options.map((o) => (
                            <button
                                key={o}
                                onClick={() => { onChange(o); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] first:rounded-t-lg last:rounded-b-lg ${value === o ? "text-[#0F50AA] font-[500] bg-[#EEF3FB]" : "text-[#383E49]"}`}
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

/* ── Payment Entry Modal ── */
function PaymentModal({ supplier, invoices, onClose, onSubmit, submitting, submitError }) {
    const [selectedInvoices, setSelectedInvoices] = useState({});
    const [paymentMethod, setPaymentMethod] = useState("");
    const [methodOpen, setMethodOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [errors, setErrors] = useState({});

    const pendingInvoices = invoices.filter((inv) => inv.outstanding > 0);

    const toggleInvoice = (grnId) => {
        setSelectedInvoices((prev) => {
            if (prev[grnId] !== undefined) {
                const next = { ...prev };
                delete next[grnId];
                return next;
            }
            const inv = invoices.find((i) => i.grnId === grnId);
            return { ...prev, [grnId]: inv.outstanding };
        });
    };

    const handleAmountChange = (grnId, val) => {
        const inv = invoices.find((i) => i.grnId === grnId);
        const num = parseFloat(val) || 0;
        setSelectedInvoices((prev) => ({ ...prev, [grnId]: Math.min(num, inv.outstanding) }));
    };

    const totalPayment = Object.values(selectedInvoices).reduce((s, v) => s + (parseFloat(v) || 0), 0);

    const validate = () => {
        const e = {};
        if (Object.keys(selectedInvoices).length === 0) e.invoices = "Select at least one invoice.";
        if (!paymentMethod) e.method = "Payment method is required.";
        if (!paymentDate) e.date = "Payment date is required.";
        if (totalPayment <= 0) e.amount = "Total payment must be greater than zero.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        // Convert selectedInvoices map (grnId → amount) to allocations array.
        const allocations = Object.entries(selectedInvoices).map(([grnId, allocatedAmount]) => ({
            grnId: Number(grnId),
            allocatedAmount: Number(allocatedAmount),
        }));
        onSubmit({ allocations, paymentMethod, paymentDate, remarks, totalPayment });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-[#E4E6EA] flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-[16px] font-[600] text-[#383E49]">Settle Payment</h3>
                        <p className="text-[12px] text-[#667085] mt-0.5">{supplier?.name} · {supplier?.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg">
                        <X size={16} className="text-[#667085]" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">

                    {/* Server-side error */}
                    {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3">
                            {submitError}
                        </div>
                    )}

                    {/* Invoice Selection */}
                    <div>
                        <p className="text-[12px] font-[600] text-[#383E49] mb-2 uppercase tracking-wide">
                            Select Invoices to Settle
                        </p>
                        {errors.invoices && <p className="text-[11px] text-[#EF4444] mb-2">{errors.invoices}</p>}
                        {pendingInvoices.length === 0 ? (
                            <div className="text-center py-8 bg-[#F8F9FA] rounded-lg border border-[#E4E6EA]">
                                <BadgeCheck size={32} className="mx-auto text-[#199D26] mb-2" />
                                <p className="text-[13px] font-[500] text-[#383E49]">No outstanding invoices</p>
                                <p className="text-[12px] text-[#667085]">This supplier is fully settled.</p>
                            </div>
                        ) : (
                            <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-left w-8"></th>
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-left">Reference</th>
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-left">Due Date</th>
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-right">Outstanding</th>
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-right">Pay Amount</th>
                                            <th className="py-2.5 px-3 text-[11px] font-[500] text-[#667085] text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingInvoices.map((inv) => {
                                            const isSelected = selectedInvoices[inv.grnId] !== undefined;
                                            const ss = STATUS_STYLE[inv.status] || {};
                                            return (
                                                <tr
                                                    key={inv.grnId}
                                                    className={`border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA] transition-colors ${isSelected ? "bg-[#EEF3FB]" : inv.status === "Overdue" ? "bg-red-50/30" : ""}`}
                                                >
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleInvoice(inv.grnId)}
                                                            className="w-4 h-4 accent-[#0F50AA] cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className="text-[12px] font-[600] text-[#0F50AA] flex items-center gap-1">
                                                            <Hash size={9} />{inv.ref}
                                                        </p>
                                                        <p className="text-[10px] text-[#667085] truncate max-w-[140px]" title={inv.description}>{inv.description}</p>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className={`text-[12px] font-[500] ${inv.status === "Overdue" ? "text-[#EF4444]" : "text-[#383E49]"}`}>{inv.dueDate}</p>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <p className="text-[13px] font-[700] text-[#EF4444]">Rs. {inv.outstanding.toLocaleString()}</p>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        {isSelected ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={inv.outstanding}
                                                                value={selectedInvoices[inv.grnId]}
                                                                onChange={(e) => handleAmountChange(inv.grnId, e.target.value)}
                                                                className="w-24 px-2 py-1 border border-[#0F50AA] rounded-lg text-[12px] text-right focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                                            />
                                                        ) : (
                                                            <span className="text-[12px] text-[#C8CDD5]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-[500] px-2 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
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
                        {errors.amount && <p className="text-[11px] text-[#EF4444] mt-1">{errors.amount}</p>}
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Payment Method */}
                        <div>
                            <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase tracking-wide">Payment Method</label>
                            <SelectDropdown
                                open={methodOpen} setOpen={setMethodOpen}
                                value={paymentMethod} options={PAYMENT_METHODS}
                                onChange={setPaymentMethod}
                                placeholder="Select method"
                            />
                            {errors.method && <p className="text-[11px] text-[#EF4444] mt-1">{errors.method}</p>}
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase tracking-wide">Payment Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={13} />
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                />
                            </div>
                            {errors.date && <p className="text-[11px] text-[#EF4444] mt-1">{errors.date}</p>}
                        </div>

                        {/* Remarks */}
                        <div className="col-span-2">
                            <label className="block text-[11px] font-[600] text-[#667085] mb-1.5 uppercase tracking-wide">Remarks</label>
                            <textarea
                                rows={2}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add payment notes or references..."
                                className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] resize-none"
                            />
                        </div>
                    </div>

                    {/* Total Summary Bar */}
                    {totalPayment > 0 && (
                        <div className="bg-[#EEF3FB] border border-[#0F50AA]/20 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#0F50AA]">
                                <Banknote size={16} />
                                <span className="text-[13px] font-[600]">Total Payment Amount</span>
                            </div>
                            <span className="text-[20px] font-[700] text-[#0F50AA]">Rs. {totalPayment.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#E4E6EA] flex justify-end gap-2 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={pendingInvoices.length === 0 || submitting}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? <Loader variant="inline" /> : <BadgeCheck size={15} />}
                        {submitting ? "Saving..." : "Confirm Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Payment Detail View Modal ── */
function PaymentDetailModal({ payment, onClose }) {
    const ss = STATUS_STYLE[payment.status] || {};
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-5 border-b border-[#E4E6EA] flex items-center justify-between">
                    <div>
                        <h3 className="text-[16px] font-[600] text-[#383E49]">Payment Details</h3>
                        <p className="text-[12px] text-[#667085] mt-0.5 flex items-center gap-1">
                            <Hash size={11} />{payment.id}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg">
                        <X size={16} className="text-[#667085]" />
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    {[
                        { label: "Payment Ref", value: payment.id },
                        { label: "Date", value: payment.date },
                        { label: "Supplier", value: payment.supplier },
                        { label: "Invoice Ref", value: payment.ref },
                        { label: "Amount", value: `Rs. ${payment.amount.toLocaleString()}` },
                        { label: "Method", value: payment.method },
                        { label: "Remarks", value: payment.remarks || "—" },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between py-2 border-b border-[#F0F1F3] last:border-0">
                            <p className="text-[12px] text-[#667085]">{label}</p>
                            <p className="text-[13px] font-[500] text-[#383E49] text-right max-w-[200px]">{value}</p>
                        </div>
                    ))}
                    <div className="flex items-center justify-between py-2">
                        <p className="text-[12px] text-[#667085]">Status</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-[500] px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>
                            {ss.icon}{payment.status}
                        </span>
                    </div>
                </div>
                <div className="p-4 border-t border-[#E4E6EA] flex justify-end gap-2">
                    <button
                        onClick={() => {
                            generatePDF({
                                title: "Payment Voucher",
                                subtitle: `Reference: ${payment.id}`,
                                headers: ["Description", "Value"],
                                data: [
                                    ["Payment ID", payment.id],
                                    ["Date", payment.date],
                                    ["Supplier", payment.supplier],
                                    ["Invoice Reference", payment.ref],
                                    ["Amount", `Rs. ${payment.amount.toLocaleString()}`],
                                    ["Method", payment.method],
                                    ["Status", payment.status],
                                    ["Remarks", payment.remarks || "—"]
                                ],
                                fileName: `Payment_Voucher_${payment.id}`
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

/* ── Success Toast ── */
function SuccessToast({ message, onClose }) {
    return (
        <div className="fixed top-6 right-6 z-[99999999] bg-white border border-[#199D26]/30 rounded-xl shadow-xl p-4 flex items-start gap-3 min-w-[280px] max-w-sm animate-bounce-in">
            <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-[#199D26]" />
            </div>
            <div className="flex-1">
                <p className="text-[13px] font-[600] text-[#383E49]">Payment Recorded</p>
                <p className="text-[12px] text-[#667085] mt-0.5">{message}</p>
            </div>
            <button onClick={onClose} className="text-[#667085] hover:text-[#383E49]">
                <X size={14} />
            </button>
        </div>
    );
}


// Convert backend PaymentResponseDto to the row shape used by the existing table.
function toHistoryRow(p) {
    const refs = (p.allocations || []).map((a) => a.grnRef).filter(Boolean).join(", ");
    return {
        id: p.paymentRef,
        paymentId: p.paymentId,
        date: p.paymentDate,
        supplier: p.supplierName || "Unknown",
        supplierId: p.supplierId,
        ref: refs || "—",
        amount: Number(p.amount || 0),
        method: p.paymentMethod || "—",
        status: p.status || "Pending",
        remarks: p.remarks || "",
    };
}

// Convert backend OutstandingGrnDto to the invoice shape used by the modal.
function toInvoiceRow(g) {
    return {
        grnId: g.grnId,
        ref: g.ref,
        description: g.description,
        date: g.date,
        dueDate: g.dueDate,
        amount: Number(g.amount || 0),
        paid: Number(g.paid || 0),
        outstanding: Number(g.outstanding || 0),
        status: g.status,
    };
}


export default function FinanceSettlePayments() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const activeSection = "Settle Payments";

    // Live data
    const [suppliers, setSuppliers] = useState([]);
    const [history, setHistory] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);

    // Loading / error
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Payment form state
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [paymentModal, setPaymentModal] = useState(false);
    const [detailModal, setDetailModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [printData, setPrintData] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [statusOpen, setStatusOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Table
    const [sortCol, setSortCol] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;

    const supplier = suppliers.find((s) => s.id === selectedSupplier);

    const baseUrl = process.env.REACT_APP_BASE_URL;

    const authHeaders = () => {
        const token = localStorage.getItem("authToken");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // ── Load suppliers on mount ──
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setSuppliersLoading(true);
                setPageError(null);
                const res = await fetch(`${baseUrl}/api/v1/finance/suppliers`, {
                    headers: authHeaders(),
                });
                if (!res.ok) throw new Error(`Failed to load suppliers: ${res.status}`);
                const data = await res.json();
                setSuppliers(data || []);
            } catch (e) {
                console.error("Failed to fetch suppliers:", e);
                setPageError("Failed to load suppliers. Please try again.");
            } finally {
                setSuppliersLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    // ── Load payment history (initial + after each create) ──
    const fetchHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            setPageError(null);
            const res = await fetch(`${baseUrl}/api/v1/finance/payments`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Failed to load payments: ${res.status}`);
            const data = await res.json();
            setHistory((data || []).map(toHistoryRow));
        } catch (e) {
            console.error("Failed to fetch payments:", e);
            setPageError("Failed to load payment history. Please try again.");
        } finally {
            setHistoryLoading(false);
        }
    }, [baseUrl]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // ── Load outstanding GRNs when supplier changes ──
    useEffect(() => {
        if (!selectedSupplier || !supplier) {
            setInvoiceList([]);
            return;
        }
        const fetchOutstanding = async () => {
            try {
                setInvoicesLoading(true);
                setPageError(null);
                const res = await fetch(
                    `${baseUrl}/api/v1/finance/suppliers/${supplier.supplierId}/outstanding-grns`,
                    { headers: authHeaders() }
                );
                if (!res.ok) throw new Error(`Failed to load outstanding GRNs: ${res.status}`);
                const data = await res.json();
                setInvoiceList((data || []).map(toInvoiceRow));
            } catch (e) {
                console.error("Failed to fetch outstanding GRNs:", e);
                setPageError("Failed to load outstanding invoices. Please try again.");
                setInvoiceList([]);
            } finally {
                setInvoicesLoading(false);
            }
        };
        fetchOutstanding();
    }, [selectedSupplier, baseUrl]);

    // Summary metrics
    const totalPaid = history.filter((h) => h.status === "Cleared").reduce((s, h) => s + h.amount, 0);
    const totalPending = history.filter((h) => h.status === "Pending").reduce((s, h) => s + h.amount, 0);
    const pendingCount = history.filter((h) => h.status === "Pending").length;
    const totalOutstanding = invoiceList
        .filter((inv) => inv.outstanding > 0)
        .reduce((s, inv) => s + inv.outstanding, 0);

    // Filtered history
    const filtered = useMemo(() => {
        return history.filter((h) => {
            if (statusFilter !== "All Status" && h.status !== statusFilter) return false;
            if (startDate && h.date < startDate) return false;
            if (endDate && h.date > endDate) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                if (
                    !h.supplier.toLowerCase().includes(q) &&
                    !h.id.toLowerCase().includes(q) &&
                    !h.ref.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [history, statusFilter, startDate, endDate, searchTerm]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (sortCol === "amount") { av = +av; bv = +bv; }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filtered, sortCol, sortDir]);

    const handleExportHistoryPDF = () => {
        if (sorted.length === 0) return;
        generatePDF({
            title: "Payment Settlement History",
            orientation: "l",
            summary: [
                { label: "Total Paid", value: `Rs. ${totalPaid.toLocaleString()}` },
                { label: "Total Pending", value: `Rs. ${totalPending.toLocaleString()}` },
                { label: "Pending Count", value: pendingCount.toString() }
            ],
            headers: ["ID", "Date", "Supplier", "Invoice Refs", "Amount (Rs.)", "Method", "Status"],
            data: sorted.map(r => [
                r.id,
                r.date,
                r.supplier,
                r.ref,
                r.amount.toLocaleString(),
                r.method,
                r.status
            ]),
            fileName: "Payment_Settlement_History"
        });
    };

    const handleExportHistoryExcel = () => {
        if (sorted.length === 0) return;
        generateExcel({
            headers: ["ID", "Date", "Supplier", "Invoice Refs", "Amount", "Method", "Status"],
            data: sorted.map(r => [
                r.id,
                r.date,
                r.supplier,
                r.ref,
                r.amount,
                r.method,
                r.status
            ]),
            fileName: "Payment_Settlement_History"
        });
    };

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    const SortIcon = ({ col }) => {
        if (sortCol !== col) return <ArrowUpDown size={12} className="text-[#C8CDD5]" />;
        return sortDir === "asc"
            ? <ArrowUp size={12} className="text-[#0F50AA]" />
            : <ArrowDown size={12} className="text-[#0F50AA]" />;
    };

    const handlePaymentSubmit = async ({ allocations, paymentMethod, paymentDate, remarks, totalPayment }) => {
        if (!supplier) return;
        try {
            setSubmitting(true);
            setSubmitError(null);
            const body = {
                supplierId: supplier.supplierId,
                paymentDate,
                paymentMethod,
                remarks: remarks || null,
                allocations,
            };
            const res = await fetch(`${baseUrl}/api/v1/finance/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                let msg = `Request failed: ${res.status}`;
                try {
                    const err = await res.json();
                    msg = err.message || msg;
                } catch (_e) { /* ignore parse errors */ }
                throw new Error(msg);
            }

            const paymentRes = await res.json();

            // Reset modal state and refresh history + outstanding lists.
            setPaymentModal(false);
            await fetchHistory();

            // Re-fetch outstanding GRNs so balances update.
            let updatedInvoices = [];
            try {
                const r = await fetch(
                    `${baseUrl}/api/v1/finance/suppliers/${supplier.supplierId}/outstanding-grns`,
                    { headers: authHeaders() }
                );
                if (r.ok) {
                    const data = await r.json();
                    updatedInvoices = (data || []).map(toInvoiceRow);
                    setInvoiceList(updatedInvoices);
                }
            } catch (_e) { /* non-fatal */ }

            // Prepare print data
            setPrintData({
                payment: paymentRes,
                supplier: supplier,
                remainingInvoices: (updatedInvoices.length > 0 ? updatedInvoices : invoiceList).filter((inv) => inv.outstanding > 0),
            });

            setToast(`Rs. ${totalPayment.toLocaleString()} recorded for ${supplier.name}`);
            setTimeout(() => setToast(null), 4000);
        } catch (e) {
            console.error("Failed to record payment:", e);
            setSubmitError(e.message || "Failed to record payment.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (printData) {
            const timer = setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [printData]);

    const handleReset = () => {
        setSearchTerm(""); setStatusFilter("All Status");
        setStartDate(""); setEndDate(""); setPage(1);
    };

    const handleOpenModal = () => {
        setSubmitError(null);
        setPaymentModal(true);
    };

    const loading = suppliersLoading || historyLoading;

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
                            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Settle Payments</h1>
                            <p className="text-[14px] text-[#667085]">Record and manage supplier payment settlements</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <button
                                onClick={fetchHistory}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                            >
                                <RefreshCw size={15} className={historyLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                            <button
                                onClick={handleExportHistoryPDF}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                            >
                                <FileText size={15} /> PDF
                            </button>
                            <button
                                onClick={handleExportHistoryExcel}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
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

                    {/* ── Summary Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        {[
                            { label: "Total Paid (Cleared)", value: `Rs. ${totalPaid.toLocaleString()}`, icon: <BadgeCheck size={20} />, color: "bg-blue-500", hoverColor: "hover:bg-blue-600", iconBg: "bg-blue-400/30" },
                            { label: "Pending Payments", value: `Rs. ${totalPending.toLocaleString()}`, icon: <Clock size={20} />, color: "bg-indigo-500", hoverColor: "hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
                            { label: "Total Outstanding", value: `Rs. ${totalOutstanding.toLocaleString()}`, icon: <TrendingDown size={20} />, color: "bg-cyan-500", hoverColor: "hover:bg-cyan-600", iconBg: "bg-cyan-400/30" },
                            { label: "Awaiting Approval", value: pendingCount, icon: <Receipt size={20} />, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", iconBg: "bg-sky-400/30" },
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

                    {/* ── New Payment Entry Panel ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E4E6EA] p-4 sm:p-5 mb-6">
                        <div className="flex flex-col xl:flex-row gap-5">

                            {/* Left Section */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-[600] text-[#383E49] mb-1">
                                    New Payment Entry
                                </h3>

                                <p className="text-[12px] text-[#667085] mb-4">
                                    Select a supplier to view outstanding invoices and record a payment.
                                </p>

                                {/* Form Area */}
                                <div className="flex flex-col lg:flex-row lg:items-end gap-4">

                                    {/* Supplier Dropdown */}
                                    <div className="w-full lg:flex-1 lg:max-w-sm">
                                        <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">
                                            Supplier
                                        </label>

                                        <SupplierDropdown
                                            suppliers={suppliers}
                                            value={selectedSupplier}
                                            onChange={setSelectedSupplier}
                                        />
                                    </div>

                                    {/* Right Actions */}
                                    {selectedSupplier && (
                                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

                                            {/* Outstanding / Status Card */}
                                            {(() => {
                                                const total = invoiceList.reduce((s, inv) => s + inv.outstanding, 0);

                                                if (invoicesLoading) {
                                                    return (
                                                        <div className="w-full sm:w-auto min-w-[180px] px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[11px] text-[#667085]">Outstanding</p>
                                                                <p className="text-[13px] font-[600] text-[#667085]">Loading...</p>
                                                            </div>
                                                            <Loader variant="inline" />
                                                        </div>
                                                    );
                                                }

                                                return total > 0 ? (
                                                    <div className="w-full sm:w-auto min-w-[180px] px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                                                        <p className="text-[11px] text-[#667085]">
                                                            Outstanding
                                                        </p>
                                                        <p className="text-[15px] font-[700] text-[#EF4444]">
                                                            Rs. {total.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="w-full sm:w-auto min-w-[180px] px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                                                        <p className="text-[11px] text-[#667085]">
                                                            Status
                                                        </p>
                                                        <p className="text-[13px] font-[600] text-[#199D26] flex items-center gap-1">
                                                            <CheckCircle size={14} />
                                                            Fully Settled
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            {/* Button */}
                                            <button
                                                onClick={handleOpenModal}
                                                disabled={
                                                    invoicesLoading ||
                                                    !invoiceList.some((inv) => inv.outstanding > 0)
                                                }
                                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-xl hover:bg-[#0D4494] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <CreditCard size={15} />
                                                Record Payment
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side Open Invoice List */}
                            {selectedSupplier && !invoicesLoading &&
                                invoiceList.filter((i) => i.outstanding > 0).length > 0 && (
                                    <div className="w-full xl:w-[320px] bg-[#F8F9FA] rounded-2xl border border-[#E4E6EA] p-4 flex-shrink-0">

                                        <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wide mb-3">
                                            Open Invoices
                                        </p>

                                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                            {invoiceList
                                                .filter((i) => i.outstanding > 0)
                                                .map((inv) => {
                                                    const ss = STATUS_STYLE[inv.status] || {};

                                                    return (
                                                        <div
                                                            key={inv.grnId}
                                                            className="flex items-center justify-between gap-3"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-[500] px-2 py-1 rounded-full whitespace-nowrap ${ss.bg} ${ss.text}`}
                                                                >
                                                                    {ss.icon}
                                                                </span>

                                                                <p className="text-[12px] font-[500] text-[#383E49] truncate">
                                                                    {inv.ref}
                                                                </p>
                                                            </div>

                                                            <p className="text-[12px] font-[700] text-[#EF4444] whitespace-nowrap">
                                                                Rs. {inv.outstanding.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* ── Payment History Table ── */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">

                        {/* Table Header + Filters */}
                        <div className="flex flex-col gap-4 mb-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-[18px] font-[600] text-[#383E49]">Payment History</h3>
                                    <p className="text-[12px] text-[#667085] mt-0.5">Showing {paginated.length} of {sorted.length} records</p>
                                </div>
                            </div>

                            {/* Filter Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                                {/* Search */}
                                <div className="lg:col-span-4 relative">
                                    <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">Search</label>
                                    <Search className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 text-[#667085]" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search supplier, ref, or ID..."
                                        className="w-full pl-9 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    />
                                </div>

                                {/* Status */}
                                <div className="lg:col-span-2">
                                    <label className="block text-[11px] font-[500] text-[#667085] mb-1.5 uppercase tracking-wide">Status</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setStatusOpen(!statusOpen)}
                                            className="w-full flex items-center gap-2 px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA]"
                                        >
                                            <Filter size={13} className="text-[#667085]" />
                                            <span className="flex-1 text-left">{statusFilter}</span>
                                            <ChevronDown size={13} className="text-[#667085]" />
                                        </button>
                                        {statusOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                                                <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-full">
                                                    {STATUS_FILTER_OPTIONS.map((o) => (
                                                        <button
                                                            key={o}
                                                            onClick={() => { setStatusFilter(o); setStatusOpen(false); setPage(1); }}
                                                            className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] first:rounded-t-lg last:rounded-b-lg ${statusFilter === o ? "text-[#0F50AA] font-[500] bg-[#EEF3FB]" : "text-[#383E49]"}`}
                                                        >
                                                            {o}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* From Date */}
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

                                {/* To Date */}
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

                                {/* Reset */}
                                <div className="lg:col-span-2 pt-5">
                                    <button
                                        onClick={handleReset}
                                        className="w-full flex items-center justify-center gap-1 px-3 py-2.5 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                                    >
                                        <RefreshCw size={11} /> Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <Loader variant="section" text="Loading payment records..." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                                            {[
                                                { key: "id", label: "Payment Ref" },
                                                { key: "date", label: "Date" },
                                                { key: "supplier", label: "Supplier" },
                                                { key: "ref", label: "Invoice Ref" },
                                                { key: "amount", label: "Amount (Rs.)" },
                                                { key: "method", label: "Method" },
                                                { key: "status", label: "Status" },
                                                { key: "actions", label: "Action", noSort: true },
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
                                                <td colSpan={8} className="py-16 text-center">
                                                    <Receipt size={36} className="mx-auto text-[#C8CDD5] mb-3" />
                                                    <p className="text-[14px] font-[500] text-[#383E49]">No payment records found</p>
                                                    <p className="text-[12px] text-[#667085]">Try adjusting your filters</p>
                                                </td>
                                            </tr>
                                        ) : paginated.map((row) => {
                                            const ss = STATUS_STYLE[row.status] || { text: "text-[#667085]", bg: "bg-[#F0F1F3]", icon: null };
                                            const supplierCode = suppliers.find((s) => s.supplierId === row.supplierId)?.code || "??";
                                            return (
                                                <tr key={row.paymentId} className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors">

                                                    {/* Payment Ref */}
                                                    <td className="py-3.5 px-4">
                                                        <p className="text-[13px] font-[600] text-[#0F50AA] flex items-center gap-1 whitespace-nowrap">
                                                            <Hash size={10} />{row.id}
                                                        </p>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="py-3.5 px-4">
                                                        <p className="text-[13px] font-[500] text-[#383E49] whitespace-nowrap">{row.date}</p>
                                                    </td>

                                                    {/* Supplier */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-[#0F50AA] rounded-md flex items-center justify-center text-white text-[9px] font-[700] flex-shrink-0">
                                                                {supplierCode}
                                                            </div>
                                                            <p className="text-[13px] font-[500] text-[#383E49] whitespace-nowrap">{row.supplier}</p>
                                                        </div>
                                                    </td>

                                                    {/* Invoice Ref */}
                                                    <td className="py-3.5 px-4">
                                                        <p className="text-[12px] text-[#667085] max-w-[150px] truncate" title={row.ref}>{row.ref}</p>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="text-[13px] font-[700] text-[#383E49]">
                                                            Rs. {row.amount.toLocaleString()}
                                                        </span>
                                                    </td>

                                                    {/* Method */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-[500] text-[#383E49]">
                                                            <span className="text-[#0F50AA]">{METHOD_ICON[row.method]}</span>
                                                            {row.method}
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-[500] px-2.5 py-1 rounded-full ${ss.bg} ${ss.text}`}>
                                                            {ss.icon}{row.status}
                                                        </span>
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-3.5 px-4">
                                                        <button
                                                            onClick={() => setDetailModal(row)}
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
                        )}

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E4E6EA]">
                                <p className="text-[12px] text-[#667085]">
                                    Page {page} of {totalPages} · {sorted.length} records
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
                    </div>
                </main>
            </div>

            {/* ── Modals ── */}
            {paymentModal && supplier && (
                <PaymentModal
                    supplier={supplier}
                    invoices={invoiceList}
                    onClose={() => setPaymentModal(false)}
                    onSubmit={handlePaymentSubmit}
                    submitting={submitting}
                    submitError={submitError}
                />
            )}

            {detailModal && (
                <PaymentDetailModal
                    payment={detailModal}
                    onClose={() => setDetailModal(null)}
                />
            )}

            {/* Bill Print Layout */}
            {printData && (
                <div id="print-settlement" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans w-[210mm] min-h-screen">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #print-settlement, #print-settlement * {
                                visibility: visible;
                            }
                            #print-settlement {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                background: white !important;
                                color: black !important;
                            }
                        }
                    `}} />

                    {/* Header / Branding */}
                    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">Bakery Outlet Management System</h1>
                            <p className="text-sm text-gray-500 mt-1">Payment Settlement Receipt / Voucher</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">Receipt Ref: <span className="font-bold text-black">{printData.payment.paymentRef}</span></p>
                            <p className="text-sm text-gray-500 mt-1">Print Date: {new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Supplier & Payment Summary columns */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Supplier Info */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supplier Details</h3>
                            <p className="text-base font-bold text-gray-900">{printData.supplier.name}</p>
                            <p className="text-sm text-gray-600 mt-1">Code: {printData.supplier.id}</p>
                        </div>

                        {/* Payment Details */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Details</h3>
                            <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <span className="text-gray-500">Payment Ref:</span>
                                <span className="font-semibold text-gray-900">{printData.payment.paymentRef}</span>

                                <span className="text-gray-500">Payment Date:</span>
                                <span className="font-semibold text-gray-900">{printData.payment.paymentDate}</span>

                                <span className="text-gray-500">Payment Method:</span>
                                <span className="font-semibold text-gray-900">{printData.payment.paymentMethod}</span>

                                <span className="text-gray-500">Status:</span>
                                <span className="font-semibold text-gray-900">{printData.payment.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Remarks Section */}
                    {printData.payment.remarks && (
                        <div className="border border-gray-200 rounded-lg p-4 mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks / Notes</h3>
                            <p className="text-sm text-gray-800">{printData.payment.remarks}</p>
                        </div>
                    )}

                    {/* Table 1: Invoices Settled in this payment */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Settled Invoices</span>
                            <span className="text-xs text-gray-500 font-normal">Allocated amounts</span>
                        </h3>
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <th className="py-2.5 px-3">Invoice / GRN Reference</th>
                                    <th className="py-2.5 px-3 text-right">Settled Amount (Rs.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printData.payment.allocations && printData.payment.allocations.length > 0 ? (
                                    printData.payment.allocations.map((alloc) => (
                                        <tr key={alloc.allocationId || alloc.grnId} className="border-b border-gray-200 text-sm text-gray-800 last:border-0 hover:bg-gray-50">
                                            <td className="py-2.5 px-3 font-semibold text-blue-900">{alloc.grnRef || `GRN-${alloc.grnId}`}</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-gray-900">Rs. {Number(alloc.allocatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 text-center">
                                        <td colSpan="2" className="py-4">No allocations recorded</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-50 font-bold border-t-2 border-gray-800 text-sm">
                                    <td className="py-3 px-3 text-right uppercase tracking-wider text-gray-700">Total Settled Amount:</td>
                                    <td className="py-3 px-3 text-right text-base text-gray-900">Rs. {Number(printData.payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Table 2: Pending Outstanding Invoices */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Pending Invoices (Remaining Balance)</span>
                            <span className="text-xs text-gray-500 font-normal">Awaiting settlement</span>
                        </h3>
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <th className="py-2.5 px-3">Invoice / GRN Reference</th>
                                    <th className="py-2.5 px-3">Due Date</th>
                                    <th className="py-2.5 px-3 text-right">Outstanding Amount (Rs.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printData.remainingInvoices && printData.remainingInvoices.length > 0 ? (
                                    printData.remainingInvoices.map((inv) => (
                                        <tr key={inv.grnId} className="border-b border-gray-200 text-sm text-gray-800 last:border-0 hover:bg-gray-50">
                                            <td className="py-2.5 px-3 font-semibold text-gray-700">{inv.ref}</td>
                                            <td className="py-2.5 px-3 text-gray-600">{inv.dueDate}</td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-red-600">Rs. {Number(inv.outstanding).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="border-b border-gray-200 text-sm text-gray-500 text-center">
                                        <td colSpan="3" className="py-4">No remaining outstanding invoices. Supplier is fully settled!</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-50 font-bold border-t-2 border-gray-800 text-sm">
                                    <td colSpan="2" className="py-3 px-3 text-right uppercase tracking-wider text-gray-700">Total Pending Balance:</td>
                                    <td className="py-3 px-3 text-right text-base text-red-600">
                                        Rs. {printData.remainingInvoices.reduce((sum, inv) => sum + (Number(inv.outstanding) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Signature lines: Prepared By, Checked By, Authorized By, Received By */}
                    <div className="mt-16 grid grid-cols-4 gap-4 text-center pt-8 border-t border-dashed border-gray-300">
                        <div>
                            <div className="border-b border-black h-8 mx-auto w-3/4 mb-1"></div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Prepared By</p>
                        </div>
                        <div>
                            <div className="border-b border-black h-8 mx-auto w-3/4 mb-1"></div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Checked By</p>
                        </div>
                        <div>
                            <div className="border-b border-black h-8 mx-auto w-3/4 mb-1"></div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Authorized By</p>
                        </div>
                        <div>
                            <div className="border-b border-black h-8 mx-auto w-3/4 mb-1"></div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Received By</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}

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
