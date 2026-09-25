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
    APPROVED: { label: "Approved", color: "text-success bg-hover", icon: <CheckCircle2 size={12} /> },
    PENDING: { label: "Pending", color: "text-warning bg-hover", icon: <Clock size={12} /> },
    REJECTED: { label: "Rejected", color: "text-error bg-subtle", icon: <XCircle size={12} /> },
};

const EMPTY_ITEM = { rawMaterialId: "", quantity: "", reason: "" };

function ViewRNModal({ rn, onClose }) {
    if (!rn) return null;
    const meta = HIST_STATUS_META[rn.status] || HIST_STATUS_META["PENDING"];
    return (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
            <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-5 border-b border-line flex items-start justify-between">
                    <div>
                        <h3 className="text-[16px] font-[600] text-fg flex items-center gap-2">
                            <FileText size={16} className="text-brand-fg" /> Return Note
                        </h3>
                        <p className="text-[12px] text-fg-secondary mt-0.5">{rn.returnNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-app rounded-lg transition-colors">
                        <X size={18} className="text-fg-secondary" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-subtle rounded-lg p-4 border border-line grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[11px] text-fg-secondary mb-0.5">Return Note No</p>
                            <p className="text-[13px] font-[600] text-brand-fg">{rn.returnNumber}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-fg-secondary mb-0.5">Status</p>
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2 py-0.5 rounded-full ${meta.color}`}>
                                {meta.icon} {meta.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-[11px] text-fg-secondary mb-0.5">Date & Time</p>
                            <p className="text-[13px] font-[500] text-fg">
                                {rn.createdAt
                                    ? new Date(rn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}{" "}
                                {rn.createdAt
                                    ? new Date(rn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                    : ""}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] text-fg-secondary mb-0.5">Destination</p>
                            <p className="text-[13px] font-[500] text-fg flex items-center gap-1">
                                <Warehouse size={13} className="text-brand-fg" /> Main Store
                            </p>
                        </div>
                    </div>
                    {rn.notes && (
                        <div>
                            <p className="text-[11px] text-fg-secondary mb-0.5">Notes</p>
                            <p className="text-[13px] text-fg">{rn.notes}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-[13px] font-[600] text-fg mb-2">Returned Items</p>
                        <div className="border border-line rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-subtle border-b border-line">
                                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Material</th>
                                        <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Qty</th>
                                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(rn.items || []).map((item, i) => (
                                        <tr key={i} className="border-b border-line last:border-0">
                                            <td className="py-2.5 px-3">
                                                <p className="text-[13px] text-fg">
                                                    {item.rawMaterialName || `Material #${item.rawMaterialId}`}
                                                </p>
                                                {item.unit && <p className="text-[11px] text-fg-secondary">{item.unit}</p>}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span className="text-[13px] font-[600] text-fg">{item.quantity}</span>
                                                {item.unit && <span className="text-[11px] text-fg-secondary ml-1">{item.unit}</span>}
                                            </td>
                                            <td className="py-2.5 px-3 text-[12px] text-fg">{item.reason || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-line flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors">
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
        <div className="flex bg-app h-screen overflow-hidden">
            <KitchenWorkerSideBar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <KitchenWorkerNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-32 overflow-y-auto">

                    {successBanner && (
                        <div className="mb-5 flex items-center gap-3 bg-hover border border-success/30 text-success rounded-lg px-4 py-3 text-[13px] font-[500]">
                            <CheckCircle2 size={16} />
                            {successBanner}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div>
                            <h1 className="text-[20px] font-[600] text-fg mb-1">Return to Store</h1>
                            <p className="text-[14px] text-fg-secondary">
                                Return unused or excess stock from kitchen to main store
                            </p>
                        </div>
                        <button
                            onClick={loadHistory}
                            className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
                        >
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-surface rounded-lg shadow-sm border border-line p-1 mb-5 w-fit">
                        {[
                            { key: "RETURN", label: "New Return", icon: <Undo2 size={14} /> },
                            { key: "HISTORY", label: "Return History", icon: <FileText size={14} /> },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-[500] transition-colors ${
                                    activeTab === tab.key ? "bg-brand text-on-brand shadow-sm" : "text-fg-secondary hover:bg-subtle"
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ RETURN TAB ══ */}
                    {activeTab === "RETURN" && (
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6 space-y-6">
                            <div>
                                <h3 className="text-[15px] font-[600] text-fg mb-1">New Return</h3>
                                <p className="text-[13px] text-fg-secondary">
                                    Submit unused or excess raw materials back to the store.
                                </p>
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 text-error bg-subtle border border-error/30 rounded-lg px-4 py-3 text-[13px]">
                                    <AlertTriangle size={14} /> {formError}
                                </div>
                            )}

                            {/* Items table */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[13px] font-[600] text-fg">
                                        Items to Return <span className="text-error">*</span>
                                    </label>
                                    <button
                                        onClick={addItem}
                                        className="inline-flex items-center gap-1 text-[12px] text-brand-fg font-[500] hover:underline"
                                    >
                                        <Plus size={13} /> Add Item
                                    </button>
                                </div>
                                <div className="border border-line rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-subtle border-b border-line">
                                                <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Raw Material</th>
                                                <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Quantity</th>
                                                <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-fg-secondary">Reason (optional)</th>
                                                <th className="py-2.5 px-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formItems.map((item, idx) => (
                                                <tr key={idx} className="border-b border-line last:border-0">
                                                    <td className="py-2 px-3 min-w-[200px]">
                                                        {rawMaterials.length > 0 ? (
                                                            <select
                                                                value={item.rawMaterialId}
                                                                onChange={(e) => updateItem(idx, "rawMaterialId", e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
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
                                                                className="w-full px-2 py-1.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
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
                                                            className="w-24 text-center px-2 py-1.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Excess Stock"
                                                            value={item.reason}
                                                            onChange={(e) => updateItem(idx, "reason", e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        {formItems.length > 1 && (
                                                            <button onClick={() => removeItem(idx)} className="p-1 text-error hover:bg-subtle rounded">
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
                                    <p className="text-[11px] text-fg-secondary mt-1 flex items-center gap-1">
                                        <AlertTriangle size={11} className="text-warning" />
                                        Could not load materials list — enter the raw material ID manually.
                                    </p>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[13px] font-[500] text-fg mb-1.5">
                                    Notes <span className="text-fg-secondary">(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Any additional remarks for this return..."
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2 border-t border-line">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                                <div>
                                    <h3 className="text-[16px] font-[600] text-fg">Return History</h3>
                                    <p className="text-[13px] text-fg-secondary mt-0.5">All submitted return notes for tracking and auditing</p>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={15} />
                                    <input
                                        type="text"
                                        placeholder="Search RN no. or material..."
                                        className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                                        value={histSearch}
                                        onChange={(e) => setHistSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {histError && (
                                <div className="flex items-center gap-2 text-error bg-subtle border border-error/30 rounded-lg px-4 py-3 text-[13px] mb-4">
                                    <AlertTriangle size={14} /> Failed to load: {histError}
                                </div>
                            )}

                            {loadingHistory ? (
                                <Loader variant="section" text="Loading return notes..." />
                            ) : filteredHistory.length === 0 ? (
                                <div className="text-center py-14">
                                    <FileText size={36} className="mx-auto text-fg-muted mb-4" />
                                    <p className="text-[14px] font-[500] text-fg">No return notes found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-line bg-subtle">
                                                <th className="text-left py-3 px-3 text-[12px] font-[500] text-fg-secondary rounded-tl-lg">RN Number</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-fg-secondary">Date & Time</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-fg-secondary">Items</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-fg-secondary">Status</th>
                                                <th className="text-center py-3 px-3 text-[12px] font-[500] text-fg-secondary rounded-tr-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map((rn) => {
                                                const meta = HIST_STATUS_META[rn.status] || HIST_STATUS_META["PENDING"];
                                                return (
                                                    <tr key={rn.id} className="border-b border-line last:border-0 hover:bg-subtle transition-colors">
                                                        <td className="py-3.5 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-error/10 rounded-lg">
                                                                    <RotateCcw size={13} className="text-error" />
                                                                </div>
                                                                <span className="text-[13px] font-[600] text-brand-fg">{rn.returnNumber}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <p className="text-[12px] font-[500] text-fg">
                                                                {rn.createdAt
                                                                    ? new Date(rn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                                                    : "—"}
                                                            </p>
                                                            <p className="text-[11px] text-fg-secondary">
                                                                {rn.createdAt
                                                                    ? new Date(rn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                                                    : ""}
                                                            </p>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className="text-[13px] font-[600] text-fg">{(rn.items || []).length}</span>
                                                            <span className="text-[11px] text-fg-secondary ml-1">item{(rn.items || []).length !== 1 ? "s" : ""}</span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2.5 py-1 rounded-full ${meta.color}`}>
                                                                {meta.icon} {meta.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center">
                                                            <button
                                                                onClick={() => setViewRN(rn)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-line transition-colors"
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
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
