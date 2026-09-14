import React, { useState, useEffect } from "react";
import {
    RefreshCw,
    Search,
    X,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Package,
    Undo2,
    FileText,
    Send,
    Eye,
    XCircle,
    Warehouse,
    RotateCcw,
    Plus,
    Trash2,
} from "lucide-react";

import KitchenWorkerNavBar from "../component/KitchenWorkerNavBar.jsx";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar.jsx";
import Loader from "../component/Loader.jsx";

const API_BASE = process.env.REACT_APP_BASE_URL || "http://localhost:8091";

function getToken() {
    return localStorage.getItem("authToken") || "";
}

function authHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const HIST_STATUS_META = {
    APPROVED: { label: "Approved", color: "text-[#199D26] bg-[#F0FDF4]", icon: <CheckCircle2 size={12} /> },
    PENDING: { label: "Pending", color: "text-[#F4A100] bg-[#FFFBEB]", icon: <Clock size={12} /> },
    REJECTED: { label: "Rejected", color: "text-[#EF4444] bg-[#FEF2F2]", icon: <XCircle size={12} /> },
};

const EMPTY_ITEM = { rawMaterialId: "", quantity: "", reason: "" };

function ViewRNModal({ rn, onClose }) {
    if (!rn) return null;
    const meta = HIST_STATUS_META[rn.status] || HIST_STATUS_META["PENDING"];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-5 border-b border-[#E4E6EA] flex items-start justify-between">
                    <div>
                        <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
                            <FileText size={16} className="text-[#0F50AA]" /> Return Note
                        </h3>
                        <p className="text-[12px] text-[#667085] mt-0.5">{rn.returnNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#F0F1F3] rounded-lg transition-colors">
                        <X size={18} className="text-[#667085]" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E4E6EA] grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[11px] text-[#667085] mb-0.5">Return Note No</p>
                            <p className="text-[13px] font-[600] text-[#0F50AA]">{rn.returnNumber}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#667085] mb-0.5">Status</p>
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2 py-0.5 rounded-full ${meta.color}`}>
                                {meta.icon} {meta.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#667085] mb-0.5">Date & Time</p>
                            <p className="text-[13px] font-[500] text-[#383E49]">
                                {rn.createdAt
                                    ? new Date(rn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}{" "}
                                {rn.createdAt
                                    ? new Date(rn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                    : ""}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#667085] mb-0.5">Destination</p>
                            <p className="text-[13px] font-[500] text-[#383E49] flex items-center gap-1">
                                <Warehouse size={13} className="text-[#0F50AA]" /> Main Store
                            </p>
                        </div>
                    </div>
                    {rn.notes && (
                        <div>
                            <p className="text-[11px] text-[#667085] mb-0.5">Notes</p>
                            <p className="text-[13px] text-[#383E49]">{rn.notes}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-[13px] font-[600] text-[#383E49] mb-2">Returned Items</p>
                        <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Material</th>
                                        <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Qty</th>
                                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(rn.items || []).map((item, i) => (
                                        <tr key={i} className="border-b border-[#E4E6EA] last:border-0">
                                            <td className="py-2.5 px-3">
                                                <p className="text-[13px] text-[#383E49]">
                                                    {item.rawMaterialName || `Material #${item.rawMaterialId}`}
                                                </p>
                                                {item.unit && <p className="text-[11px] text-[#667085]">{item.unit}</p>}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="text-[13px] font-[600] text-[#383E49]">{item.quantity}</span>
                                                {item.unit && <span className="text-[11px] text-[#667085] ml-1">{item.unit}</span>}
                                            </td>
                                            <td className="py-2.5 px-3 text-[12px] text-[#383E49]">{item.reason || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-[#E4E6EA] flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function KitchenReturnToStore() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const activeSection = "Return to Store";

    // Raw materials for dropdown
    const [rawMaterials, setRawMaterials] = useState([]);

    // Form state
    const [formNotes, setFormNotes] = useState("");
    const [formItems, setFormItems] = useState([{ ...EMPTY_ITEM }]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // History
    const [returns, setReturns] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [histError, setHistError] = useState("");

    const [activeTab, setActiveTab] = useState("RETURN");
    const [histSearch, setHistSearch] = useState("");
    const [viewRN, setViewRN] = useState(null);
    const [successBanner, setSuccessBanner] = useState("");

    // Load raw materials (non-critical)
    useEffect(() => {
        fetch(`${API_BASE}/STK/v1/materials/all`, { headers: authHeaders() })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (!data) return;
                const list = Array.isArray(data) ? data : data.rawMaterials ?? data.materials ?? [];
                setRawMaterials(list);
            })
            .catch(() => { /* non-critical */ });
    }, []);

    // Load return history
    const loadHistory = () => {
        setLoadingHistory(true);
        setHistError("");
        fetch(`${API_BASE}/api/v1/worker/kitchen-flow/returns`, { headers: authHeaders() })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => { setReturns(Array.isArray(data) ? data : []); setLoadingHistory(false); })
            .catch((e) => { setHistError(e.message); setLoadingHistory(false); });
    };

    useEffect(() => { loadHistory(); }, []);

    // Form helpers
    const addItem = () => setFormItems((prev) => [...prev, { ...EMPTY_ITEM }]);
    const removeItem = (idx) => setFormItems((prev) => prev.filter((_, i) => i !== idx));
    const updateItem = (idx, field, val) =>
        setFormItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const handleSubmit = async () => {
        setFormError("");
        const validItems = formItems.filter((it) => it.rawMaterialId && Number(it.quantity) > 0);
        if (validItems.length === 0) {
            setFormError("Add at least one item with a material and quantity greater than 0.");
            return;
        }

        const payload = {
            notes: formNotes || null,
            items: validItems.map((it) => ({
                rawMaterialId: Number(it.rawMaterialId),
                quantity: Number(it.quantity),
                reason: it.reason || null,
            })),
        };

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/worker/kitchen-flow/returns`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            const created = await res.json();
            setReturns((prev) => [created, ...prev]);
            setSuccessBanner(`Return Note ${created.returnNumber} submitted. Awaiting store confirmation.`);
            setFormItems([{ ...EMPTY_ITEM }]);
            setFormNotes("");
            setActiveTab("HISTORY");
            setTimeout(() => setSuccessBanner(""), 6000);
        } catch (e) {
            setFormError(e.message || "Failed to submit return.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredHistory = returns.filter((rn) => {
        const q = histSearch.toLowerCase();
        return !q || (rn.returnNumber || "").toLowerCase().includes(q) ||
            (rn.items || []).some((i) => (i.rawMaterialName || "").toLowerCase().includes(q));
    });

    return (
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
            <KitchenWorkerSideBar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <KitchenWorkerNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 overflow-y-auto">

                    {successBanner && (
                        <div className="mb-5 flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#199D26] rounded-lg px-4 py-3 text-[13px] font-[500]">
                            <CheckCircle2 size={16} />
                            {successBanner}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Return to Store</h1>
                            <p className="text-[14px] text-[#667085]">
                                Return unused or excess stock from kitchen to main store
                            </p>
                        </div>
                        <button
                            onClick={loadHistory}
                            className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                        >
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-1 mb-5 w-fit">
                        {[
                            { key: "RETURN", label: "New Return", icon: <Undo2 size={14} /> },
                            { key: "HISTORY", label: "Return History", icon: <FileText size={14} /> },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-[500] transition-colors ${
                                    activeTab === tab.key ? "bg-[#0F50AA] text-white shadow-sm" : "text-[#667085] hover:bg-[#F8F9FA]"
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ RETURN TAB ══ */}
                    {activeTab === "RETURN" && (
                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 space-y-6">
                            <div>
                                <h3 className="text-[15px] font-[600] text-[#383E49] mb-1">New Return</h3>
                                <p className="text-[13px] text-[#667085]">
                                    Submit unused or excess raw materials back to the store.
                                </p>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-[13px]">
                                    <AlertTriangle size={14} /> {formError}
                                </div>
                            )}

                            {/* Items table */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[13px] font-[600] text-[#383E49]">
                                        Items to Return <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <button
                                        onClick={addItem}
                                        className="inline-flex items-center gap-1 text-[12px] text-[#0F50AA] font-[500] hover:underline"
                                    >
                                        <Plus size={13} /> Add Item
                                    </button>
                                </div>
                                <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                                                <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Raw Material</th>
                                                <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Quantity</th>
                                                <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Reason (optional)</th>
                                                <th className="py-2.5 px-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formItems.map((item, idx) => (
                                                <tr key={idx} className="border-b border-[#E4E6EA] last:border-0">
                                                    <td className="py-2 px-3 min-w-[200px]">
                                                        {rawMaterials.length > 0 ? (
                                                            <select
                                                                value={item.rawMaterialId}
                                                                onChange={(e) => updateItem(idx, "rawMaterialId", e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                                            >
                                                                <option value="">— Select material —</option>
                                                                {rawMaterials.map((m) => (
                                                                    <option key={m.id} value={m.id}>
                                                                        {m.materialName || m.name || `Material #${m.id}`}
                                                                        {m.unitOfMeasure ? ` (${m.unitOfMeasure})` : ""}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                placeholder="Material ID"
                                                                value={item.rawMaterialId}
                                                                onChange={(e) => updateItem(idx, "rawMaterialId", e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                                            className="w-24 text-center px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Excess Stock"
                                                            value={item.reason}
                                                            onChange={(e) => updateItem(idx, "reason", e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        {formItems.length > 1 && (
                                                            <button onClick={() => removeItem(idx)} className="p-1 text-[#EF4444] hover:bg-[#FEF2F2] rounded">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rawMaterials.length === 0 && (
                                    <p className="text-[11px] text-[#667085] mt-1 flex items-center gap-1">
                                        <AlertTriangle size={11} className="text-[#F4A100]" />
                                        Could not load materials list — enter the raw material ID manually.
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                                    Notes <span className="text-[#667085]">(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Any additional remarks for this return..."
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2 border-t border-[#E4E6EA]">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><RefreshCw size={14} className="animate-spin" /> Submitting...</>
                                    ) : (
                                        <><RotateCcw size={15} /> Submit Return</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ══ HISTORY TAB ══ */}
                    {activeTab === "HISTORY" && (
                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                                <div>
                                    <h3 className="text-[16px] font-[600] text-[#383E49]">Return History</h3>
                                    <p className="text-[13px] text-[#667085] mt-0.5">All submitted return notes for tracking and auditing</p>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={15} />
                                    <input
                                        type="text"
                                        placeholder="Search RN no. or material..."
                                        className="w-full pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                                        value={histSearch}
                                        onChange={(e) => setHistSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {histError && (
                                <div className="flex items-center gap-2 text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-[13px] mb-4">
                                    <AlertTriangle size={14} /> Failed to load: {histError}
                                </div>
                            )}

                            {loadingHistory ? (
                                <Loader variant="section" text="Loading return notes..." />
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-14">
                                    <FileText size={36} className="mx-auto text-[#C8CDD5] mb-4" />
                                    <p className="text-[14px] font-[500] text-[#383E49]">No return notes found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                                                <th className="text-left py-3 px-3 text-[12px] font-[500] text-[#667085] rounded-tl-lg">RN Number</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Date & Time</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Items</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Status</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085] rounded-tr-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map((rn) => {
                                                const meta = HIST_STATUS_META[rn.status] || HIST_STATUS_META["PENDING"];
                                                return (
                                                    <tr key={rn.id} className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA] transition-colors">
                                                        <td className="py-3.5 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-red-50 rounded-lg">
                                                                    <RotateCcw size={13} className="text-red-500" />
                                                                </div>
                                                                <span className="text-[13px] font-[600] text-[#0F50AA]">{rn.returnNumber}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <p className="text-[12px] font-[500] text-[#383E49]">
                                                                {rn.createdAt
                                                                    ? new Date(rn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                                                    : "—"}
                                                            </p>
                                                            <p className="text-[11px] text-[#667085]">
                                                                {rn.createdAt
                                                                    ? new Date(rn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                                                    : ""}
                                                            </p>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className="text-[13px] font-[600] text-[#383E49]">{(rn.items || []).length}</span>
                                                            <span className="text-[11px] text-[#667085] ml-1">item{(rn.items || []).length !== 1 ? "s" : ""}</span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2.5 py-1 rounded-full ${meta.color}`}>
                                                                {meta.icon} {meta.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <button
                                                                onClick={() => setViewRN(rn)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F1F3] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#E4E6EA] transition-colors"
                                                            >
                                                                <Eye size={13} /> View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {viewRN && <ViewRNModal rn={viewRN} onClose={() => setViewRN(null)} />}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
