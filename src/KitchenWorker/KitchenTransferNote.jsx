import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  ChevronDown,
  Hash,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  AlertTriangle,
  ArrowRightLeft,
  ChefHat,
  Warehouse,
  FileText,
  Eye,
  Plus,
  Minus,
  CheckCircle,
  Search,
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

const STATUS_META = {
  SENT: { label: "Sent", color: "text-[#1366D9] bg-[#F0F8FF]", icon: <Send size={12} /> },
  RECEIVED: { label: "Received", color: "text-[#199D26] bg-[#F0FDF4]", icon: <CheckCircle2 size={12} /> },
  DRAFT: { label: "Draft", color: "text-[#667085] bg-[#F0F1F3]", icon: <FileText size={12} /> },
  CANCELLED: { label: "Cancelled", color: "text-[#EF4444] bg-[#FEF2F2]", icon: <XCircle size={12} /> },
};

function TNDetailModal({ tn, onClose, onMarkReceived }) {
  if (!tn) return null;
  const meta = STATUS_META[tn.status] || STATUS_META["SENT"];
  const [marking, setMarking] = useState(false);

  const handleMark = async () => {
    setMarking(true);
    try {
      await onMarkReceived(tn.id);
    } finally {
      setMarking(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-[#E4E6EA] flex items-start justify-between">
          <div>
            <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
              <FileText size={16} className="text-[#0F50AA]" />
              Transfer Note
            </h3>
            <p className="text-[12px] text-[#667085] mt-0.5">{tn.transferNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F0F1F3] rounded-lg transition-colors">
            <X size={18} className="text-[#667085]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#F8F9FA] rounded-lg p-4 border border-[#E4E6EA] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[#667085] mb-0.5">Source PC</p>
              <p className="text-[13px] font-[600] text-[#383E49]">PC-{tn.sourceProductionCenterId}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#667085] mb-0.5">Destination</p>
              <p className="text-[13px] font-[600] text-[#383E49] flex items-center gap-1">
                <Warehouse size={13} className="text-[#0F50AA]" />
                {tn.destinationOutletId ? `Outlet #${tn.destinationOutletId}` : tn.destinationMpcId ? `MPC #${tn.destinationMpcId}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#667085] mb-0.5">Date & Time</p>
              <p className="text-[13px] font-[500] text-[#383E49]">
                {tn.createdAt ? new Date(tn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
              <p className="text-[11px] text-[#667085]">
                {tn.createdAt ? new Date(tn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#667085] mb-0.5">Status</p>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2 py-0.5 rounded-full ${meta.color}`}>
                {meta.icon} {meta.label}
              </span>
            </div>
          </div>

          {tn.notes && (
            <div>
              <p className="text-[11px] text-[#667085] mb-0.5">Notes</p>
              <p className="text-[13px] text-[#383E49]">{tn.notes}</p>
            </div>
          )}

          <div>
            <p className="text-[13px] font-[600] text-[#383E49] mb-2">Transferred Items</p>
            <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                    <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Product</th>
                    <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Qty</th>
                    <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {(tn.items || []).map((p, i) => (
                    <tr key={i} className="border-b border-[#E4E6EA] last:border-0">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-amber-50 rounded">
                            <ChefHat size={12} className="text-amber-500" />
                          </div>
                          <span className="text-[13px] text-[#383E49]">{p.productName || `Product #${p.productId}`}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[13px] font-[600] text-[#383E49]">{p.quantity}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] text-[#667085]">{p.unit || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#E4E6EA] flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors">
            Close
          </button>
          {tn.status === "SENT" && (
            <button
              onClick={handleMark}
              disabled={marking}
              className="px-4 py-2 bg-[#199D26] text-white text-[13px] font-[500] rounded-lg hover:bg-[#157A1E] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {marking ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Mark Received
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const EMPTY_ITEM = { productId: "", productName: "", quantity: 1, unit: "" };

export default function KitchenTransferNote() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Transfer Note";

  // Outlets for destination dropdown
  const [outlets, setOutlets] = useState([]);

  // Form state
  const [destType, setDestType] = useState("outlet"); // "outlet" | "mpc"
  const [destinationOutletId, setDestinationOutletId] = useState("");
  const [destinationMpcId, setDestinationMpcId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState([{ ...EMPTY_ITEM }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // History
  const [transfers, setTransfers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [histError, setHistError] = useState("");

  // Modals
  const [viewModal, setViewModal] = useState(null);
  const [successBanner, setSuccessBanner] = useState("");

  const [activeTab, setActiveTab] = useState("CREATE");
  const [searchHist, setSearchHist] = useState("");

  // Load outlets
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/admin/outlet/all`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setOutlets(Array.isArray(data) ? data : []))
      .catch(() => setOutlets([]));
  }, []);

  // Load transfer history
  const loadHistory = () => {
    setLoadingHistory(true);
    setHistError("");
    fetch(`${API_BASE}/api/v1/worker/kitchen-flow/transfer-notes`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setTransfers(Array.isArray(data) ? data : []); setLoadingHistory(false); })
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
    const destOutlet = destType === "outlet" && destinationOutletId ? Number(destinationOutletId) : null;
    const destMpc = destType === "mpc" && destinationMpcId ? Number(destinationMpcId) : null;

    if (!destOutlet && !destMpc) {
      setFormError("Please select a destination.");
      return;
    }
    const validItems = formItems.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      setFormError("Add at least one item with a product ID and quantity.");
      return;
    }

    const payload = {
      destinationOutletId: destOutlet,
      destinationMpcId: destMpc,
      notes: formNotes || null,
      items: validItems.map((it) => ({
        productId: Number(it.productId),
        productName: it.productName || null,
        quantity: Number(it.quantity),
        unit: it.unit || null,
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/worker/kitchen-flow/transfer-notes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const created = await res.json();
      setTransfers((prev) => [created, ...prev]);
      setSuccessBanner(`Transfer Note ${created.transferNumber} created successfully.`);
      setFormItems([{ ...EMPTY_ITEM }]);
      setDestinationOutletId("");
      setDestinationMpcId("");
      setFormNotes("");
      setActiveTab("HISTORY");
      setTimeout(() => setSuccessBanner(""), 5000);
    } catch (e) {
      setFormError(e.message || "Failed to create transfer note.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReceived = async (id) => {
    const res = await fetch(`${API_BASE}/api/v1/worker/kitchen-flow/transfer-notes/${id}/mark-received`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (res.ok) {
      const updated = await res.json();
      setTransfers((prev) => prev.map((t) => t.id === id ? updated : t));
      if (viewModal && viewModal.id === id) setViewModal(updated);
    }
  };

  const filteredHistory = transfers.filter((tn) => {
    const q = searchHist.toLowerCase();
    return (
      !q ||
      (tn.transferNumber || "").toLowerCase().includes(q) ||
      String(tn.destinationOutletId || "").includes(q) ||
      String(tn.destinationMpcId || "").includes(q)
    );
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">

          {successBanner && (
            <div className="mb-5 flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#199D26] rounded-lg px-4 py-3 text-[13px] font-[500]">
              <CheckCircle2 size={16} />
              {successBanner}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">Transfer Note (TN)</h1>
              <p className="text-[14px] text-[#667085]">
                Record and track transfer of produced goods to store, sub-store, or outlets
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
              { key: "CREATE", label: "New Transfer", icon: <Plus size={14} /> },
              { key: "HISTORY", label: "Recent Transfers", icon: <FileText size={14} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-[500] transition-colors ${
                  activeTab === tab.key ? "bg-[#0F50AA] text-white shadow-sm" : "text-[#667085] hover:bg-[#F8F9FA]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CREATE TAB ── */}
          {activeTab === "CREATE" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 space-y-6">
              <div>
                <h3 className="text-[15px] font-[600] text-[#383E49] mb-1">New Transfer</h3>
                <p className="text-[13px] text-[#667085]">Send finished goods to an outlet or production center.</p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-[13px]">
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}

              {/* Destination type toggle */}
              <div>
                <label className="block text-[13px] font-[600] text-[#383E49] mb-2">
                  Destination Type <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex gap-2">
                  {["outlet", "mpc"].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setDestType(t); setDestinationOutletId(""); setDestinationMpcId(""); }}
                      className={`px-4 py-2 rounded-lg text-[13px] font-[500] border transition-colors ${
                        destType === t ? "bg-[#0F50AA] text-white border-[#0F50AA]" : "bg-white text-[#667085] border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      }`}
                    >
                      {t === "outlet" ? "Outlet" : "Production Center (MPC)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination selection */}
              {destType === "outlet" ? (
                <div>
                  <label className="block text-[13px] font-[600] text-[#383E49] mb-1.5">
                    Destination Outlet <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={destinationOutletId}
                    onChange={(e) => setDestinationOutletId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  >
                    <option value="">— Select outlet —</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>{o.outletName || o.name || `Outlet #${o.id}`}</option>
                    ))}
                  </select>
                  {outlets.length === 0 && (
                    <p className="text-[11px] text-[#667085] mt-1">No outlets loaded. Enter the ID manually if needed.</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[13px] font-[600] text-[#383E49] mb-1.5">
                    Destination MPC ID <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter MPC ID..."
                    value={destinationMpcId}
                    onChange={(e) => setDestinationMpcId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>
              )}

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-[600] text-[#383E49]">
                    Items <span className="text-[#EF4444]">*</span>
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
                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Product ID</th>
                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Product Name</th>
                        <th className="text-center py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Qty</th>
                        <th className="text-left py-2.5 px-3 text-[12px] font-[500] text-[#667085]">Unit</th>
                        <th className="py-2.5 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#E4E6EA] last:border-0">
                          <td className="py-2 px-3">
                            <input
                              type="number" min="1"
                              placeholder="ID"
                              value={item.productId}
                              onChange={(e) => updateItem(idx, "productId", e.target.value)}
                              className="w-20 px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Product name"
                              value={item.productName}
                              onChange={(e) => updateItem(idx, "productName", e.target.value)}
                              className="w-full px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number" min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                              className="w-20 text-center px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="pcs / kg"
                              value={item.unit}
                              onChange={(e) => updateItem(idx, "unit", e.target.value)}
                              className="w-20 px-2 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
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
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                  Notes <span className="text-[#667085]">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Any remarks for this transfer..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] resize-none"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-[#E4E6EA]">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><RefreshCw size={14} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={14} /> Generate Transfer Note</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "HISTORY" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49]">Recent Transfers</h3>
                  <p className="text-[13px] text-[#667085] mt-0.5">All generated transfer notes from your kitchen</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={15} />
                  <input
                    type="text"
                    placeholder="Search TN number or destination..."
                    className="w-full pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                    value={searchHist}
                    onChange={(e) => setSearchHist(e.target.value)}
                  />
                </div>
              </div>

              {histError && (
                <div className="flex items-center gap-2 text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 text-[13px] mb-4">
                  <AlertTriangle size={14} /> Failed to load: {histError}
                </div>
              )}

              {loadingHistory ? (
                <Loader variant="section" text="Loading transfer notes..." />
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-14">
                  <FileText size={36} className="mx-auto text-[#C8CDD5] mb-4" />
                  <p className="text-[14px] font-[500] text-[#383E49]">No transfer notes found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                        <th className="text-left py-3 px-3 text-[12px] font-[500] text-[#667085] rounded-tl-lg">TN Number</th>
                        <th className="text-left py-3 px-3 text-[12px] font-[500] text-[#667085]">Destination</th>
                        <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Items</th>
                        <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Date</th>
                        <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085]">Status</th>
                        <th className="text-center py-3 px-3 text-[12px] font-[500] text-[#667085] rounded-tr-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((tn) => {
                        const meta = STATUS_META[tn.status] || STATUS_META["SENT"];
                        return (
                          <tr key={tn.id} className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA] transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded-lg">
                                  <FileText size={13} className="text-[#0F50AA]" />
                                </div>
                                <span className="text-[13px] font-[600] text-[#0F50AA]">{tn.transferNumber}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-[500] text-[#383E49]">
                                <Warehouse size={13} className="text-[#667085]" />
                                {tn.destinationOutletId ? `Outlet #${tn.destinationOutletId}` : tn.destinationMpcId ? `MPC #${tn.destinationMpcId}` : "—"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="text-[13px] font-[600] text-[#383E49]">{(tn.items || []).length}</span>
                              <span className="text-[11px] text-[#667085] ml-1">item{(tn.items || []).length !== 1 ? "s" : ""}</span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <p className="text-[12px] font-[500] text-[#383E49]">
                                {tn.createdAt ? new Date(tn.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </p>
                              <p className="text-[11px] text-[#667085]">
                                {tn.createdAt ? new Date(tn.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2.5 py-1 rounded-full ${meta.color}`}>
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <button
                                onClick={() => setViewModal(tn)}
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

      {viewModal && (
        <TNDetailModal
          tn={viewModal}
          onClose={() => setViewModal(null)}
          onMarkReceived={handleMarkReceived}
        />
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
