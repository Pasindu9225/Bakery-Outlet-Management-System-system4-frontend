import React, { useState, useEffect, useCallback } from "react";
import { friendlyError } from "../utils/friendlyError";
import {
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  X,
  ShoppingBasket,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Trash2,
} from "lucide-react";

import KitchenWorkerNavBar from "../component/KitchenWorkerNavBar.jsx";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar.jsx";
import Loader from "../component/Loader.jsx";


const BASE_URL = process.env.REACT_APP_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const STATUS_META = {
  PENDING: {
    label: "Pending",
    color: "text-fg-secondary bg-app",
    icon: <Clock size={12} />,
  },
  ISSUED: {
    label: "Issued",
    color: "text-success bg-hover",
    icon: <CheckCircle2 size={12} />,
  },
  RECEIVED: {
    label: "Received",
    color: "text-brand-fg bg-subtle",
    icon: <CheckCircle size={12} />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-error bg-subtle",
    icon: <XCircle size={12} />,
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || STATUS_META["PENDING"];

function ConfirmReceiptModal({ request, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-[600] text-fg">Confirm Receipt</h3>
            <p className="text-[12px] text-fg-secondary mt-0.5">Request #{request.id}</p>
          </div>
          <button aria-label="Close"
            onClick={onClose}
            className="p-1.5 hover:bg-app rounded-lg transition-colors"
          >
            <X size={18} className="text-fg-secondary" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-fg mb-3">
            Confirm that you have received all issued ingredients for this request?
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {request.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-[12px] text-fg-secondary">
                <span>{item.rawMaterialName}</span>
                <span className="font-[500]">
                  {item.issuedQty ?? item.requestedQty} {item.unitOfMeasure}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-line flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-success-solid text-on-brand text-[13px] font-[500] rounded-lg hover:bg-success-solid transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRequestForm({ rawMaterials, onSubmit, submitting }) {
  const [items, setItems] = useState([{ rawMaterialId: "", requestedQty: "" }]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const addItem = () =>
    setItems((prev) => [...prev, { rawMaterialId: "", requestedQty: "" }]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter(
      (it) => it.rawMaterialId && it.requestedQty > 0
    );
    if (validItems.length === 0) {
      setError("Add at least one ingredient with a positive quantity.");
      return;
    }
    setError("");
    onSubmit({
      productionPlanId: null,
      notes: notes.trim() || null,
      items: validItems.map((it) => ({
        rawMaterialId: Number(it.rawMaterialId),
        requestedQty: Number(it.requestedQty),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              className="flex-1 px-3 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
              value={item.rawMaterialId}
              onChange={(e) => updateItem(idx, "rawMaterialId", e.target.value)}
            >
              <option value="">— Select ingredient —</option>
              {rawMaterials.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.materialName} ({rm.unitOfMeasure})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Qty"
              value={item.requestedQty}
              onChange={(e) =>
                updateItem(idx, "requestedQty", e.target.value)
              }
              className="w-24 px-3 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
            />
            {items.length > 1 && (
              <button aria-label="Delete"
                type="button"
                onClick={() => removeItem(idx)}
                className="p-2 text-error hover:bg-subtle rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 text-[12px] text-brand-fg hover:underline"
      >
        <Plus size={13} /> Add another ingredient
      </button>

      <div>
        <label className="block text-[12px] font-[500] text-fg mb-1">
          Notes <span className="text-fg-secondary">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          className="w-full px-3 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-error text-[12px]">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <RefreshCw size={14} className="animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Send size={14} /> Submit Request
          </>
        )}
      </button>
    </form>
  );
}

export default function KitchenGetIngredients() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Get Ingredients";

  const [requests, setRequests] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/ingredient-requests`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load requests (${res.status})`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRawMaterials = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/STK/v1/materials/all`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.rawMaterials ?? data.materials ?? [];
      setRawMaterials(list);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchRawMaterials();
  }, [fetchRequests, fetchRawMaterials]);

  const handleSubmitRequest = async (payload) => {
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/ingredient-requests`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      const created = await res.json();
      setRequests((prev) => [created, ...prev]);
      setShowNewForm(false);
      setSuccessMsg("Ingredient request submitted successfully!");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!confirmRequest) return;
    setConfirmLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/worker/ingredient-requests/${confirmRequest.id}/confirm-receipt`,
        { method: "POST", headers: authHeaders() }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setConfirmRequest(null);
      setSuccessMsg("Receipt confirmed!");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      !searchTerm ||
      String(r.id).includes(searchTerm) ||
      (r.notes ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.status ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <KitchenWorkerSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <KitchenWorkerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg mb-1">
                Get Ingredients
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Request raw materials &amp; semi-finished goods for kitchen tasks
              </p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <button
                onClick={fetchRequests}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => {
                  setShowNewForm((v) => !v);
                  setSuccessMsg("");
                  setError("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
              >
                <Plus size={15} />
                New Request
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-subtle border border-error/30 rounded-lg p-3 text-[13px] text-error">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 bg-hover border border-success/30 rounded-lg p-3 text-[13px] text-success">
              <CheckCircle2 size={14} /> {successMsg}
            </div>
          )}

          {/* New Request Form */}
          {showNewForm && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mb-5">
              <h3 className="text-[15px] font-[600] text-fg mb-4">
                New Ingredient Request
              </h3>
              <NewRequestForm
                rawMaterials={rawMaterials}
                onSubmit={handleSubmitRequest}
                submitting={submitting}
              />
            </div>
          )}

          {/* Requests List */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <h3 className="text-[16px] font-[600] text-fg">
                My Ingredient Requests
              </h3>
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="Search by ID, status, notes..."
                  className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading requests..." />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-14">
                <ShoppingBasket size={44} className="mx-auto text-fg-muted mb-4" />
                <p className="text-[15px] font-[500] text-fg mb-1">
                  No ingredient requests yet
                </p>
                <p className="text-[13px] text-fg-secondary">
                  Click "New Request" above to request ingredients from the store.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => {
                  const meta = getStatusMeta(request.status);
                  return (
                    <div
                      key={request.id}
                      className="border border-line rounded-lg p-4 hover:bg-subtle transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-warning/10 rounded-lg">
                            <Package size={16} className="text-warning" />
                          </div>
                          <div>
                            <p className="text-[14px] font-[600] text-fg">
                              Request #{request.id}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              {request.createdAt
                                ? new Date(request.createdAt).toLocaleString()
                                : "—"}
                              {request.notes && ` · ${request.notes}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-2.5 py-1 rounded-full ${meta.color}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                          {request.status === "ISSUED" && (
                            <button
                              onClick={() => setConfirmRequest(request)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success-solid text-on-brand text-[12px] font-[500] rounded-lg hover:bg-success-solid transition-colors"
                            >
                              <CheckCircle2 size={13} />
                              Confirm Receipt
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items table */}
                      {request.items && request.items.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="border-b border-line">
                                <th className="text-left py-2 px-2 font-[500] text-fg-secondary">
                                  Ingredient
                                </th>
                                <th className="text-center py-2 px-2 font-[500] text-fg-secondary">
                                  Requested
                                </th>
                                <th className="text-center py-2 px-2 font-[500] text-fg-secondary">
                                  Issued
                                </th>
                                <th className="text-center py-2 px-2 font-[500] text-fg-secondary">
                                  Unit
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {request.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-line last:border-0"
                                >
                                  <td className="py-2 px-2 text-fg font-[500]">
                                    {item.rawMaterialName}
                                  </td>
                                  <td className="py-2 px-2 text-center text-fg">
                                    {item.requestedQty}
                                  </td>
                                  <td className="py-2 px-2 text-center text-fg">
                                    {item.issuedQty ?? "—"}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <span className="text-fg-secondary bg-app px-1.5 py-0.5 rounded">
                                      {item.unitOfMeasure}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirm Receipt Modal */}
      {confirmRequest && (
        <ConfirmReceiptModal
          request={confirmRequest}
          onClose={() => setConfirmRequest(null)}
          onConfirm={handleConfirmReceipt}
          loading={confirmLoading}
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
