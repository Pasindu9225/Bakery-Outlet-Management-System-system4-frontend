import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  RefreshCw,
  ChevronDown,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Hash,
  ClipboardList,
  PlayCircle,
  Plus,
  Minus,
  Layers,
  CheckCircle2,
  History,
  AlertCircle,
  Lock,
} from "lucide-react";

import BakeryWorkerNavBar from "../component/BakeryWorkerNavBar.jsx";
import BakeryWorkerSideBar from "../component/BakeryWorkerSideBar.jsx";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  PENDING: {
    label: "Pending",
    color: "text-fg-secondary bg-app",
    icon: <Clock size={12} />,
  },
  DRAFT: {
    label: "Draft",
    color: "text-fg-secondary bg-app",
    icon: <Clock size={12} />,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "text-warning bg-hover",
    icon: <Clock size={12} />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-success bg-hover",
    icon: <CheckCircle size={12} />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-brand-fg bg-subtle",
    icon: <PlayCircle size={12} />,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-success bg-hover",
    icon: <CheckCircle size={12} />,
  },
  DISTRIBUTED: {
    label: "Distributed",
    color: "text-brand-fg bg-subtle",
    icon: <PlayCircle size={12} />,
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || STATUS_META["PENDING"];

const pct = (produced, required) =>
  required > 0 ? Math.min(100, Math.round((produced / required) * 100)) : 0;

// ─── Batch History Modal ──────────────────────────────────────────────────────

function BatchHistoryModal({ planName, planId, itemId, onClose }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/v1/worker/production-tracking/items/${itemId}/progress`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-[600] text-fg">
              Batch Production History
            </h3>
            <p className="text-[12px] text-fg-secondary mt-0.5 flex items-center gap-1">
              <Hash size={11} /> Item #{itemId} — {planName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-app rounded-lg transition-colors"
          >
            <X size={18} className="text-fg-secondary" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="mx-auto text-fg-muted animate-spin mb-2" />
              <p className="text-[13px] text-fg-secondary">Loading history...</p>
            </div>
          ) : !batches || batches.length === 0 ? (
            <div className="text-center py-12">
              <History size={36} className="mx-auto text-fg-muted mb-3" />
              <p className="text-[14px] font-[500] text-fg">
                No batch history yet
              </p>
              <p className="text-[12px] text-fg-secondary">
                Submit partial production entries to see history here.
              </p>
            </div>
          ) : (
            batches.map((batch, i) => (
              <div
                key={batch.id}
                className="border border-line rounded-xl overflow-hidden"
              >
                <div className="bg-subtle px-4 py-3 flex items-center justify-between border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-[600] text-fg">
                      Batch #{batch.id}
                    </span>
                    <span className="text-[11px] text-fg-secondary bg-surface border border-line px-2 py-0.5 rounded-full">
                      Entry {batches.length - i}
                    </span>
                  </div>
                  <span className="text-[11px] text-fg-secondary">
                    {batch.createdAt
                      ? new Date(batch.createdAt).toLocaleString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="p-4">
                  <table className="w-full mb-3">
                    <thead>
                      <tr className="text-left">
                        <th className="text-[11px] font-[500] text-fg-secondary pb-2">
                          Product
                        </th>
                        <th className="text-center text-[11px] font-[500] text-fg-secondary pb-2">
                          Produced
                        </th>
                        <th className="text-center text-[11px] font-[500] text-fg-secondary pb-2">
                          Wastage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-line">
                        <td className="py-2 text-[13px] text-fg font-[500]">
                          {batch.productName || "—"}
                        </td>
                        <td className="py-2 text-center text-[13px] font-[600] text-success">
                          {batch.producedQty}
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`text-[13px] font-[600] ${
                              (batch.wastageQty || 0) > 0
                                ? "text-error"
                                : "text-fg-secondary"
                            }`}
                          >
                            {batch.wastageQty || 0}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {batch.wastageReason && (
                    <div className="bg-subtle border border-error/30 rounded-lg px-3 py-2 flex items-start gap-2 mb-2">
                      <AlertCircle size={13} className="text-error mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-error">Wastage: {batch.wastageReason}</p>
                    </div>
                  )}
                  {batch.notes && (
                    <div className="bg-hover border border-warning/30 rounded-lg px-3 py-2 flex items-start gap-2">
                      <AlertCircle size={13} className="text-warning mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-warning">{batch.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hierarchical Item Tree Component ──────────────────────────────────────────

function ItemTreeNode({ item, selectedItemId, onSelectItem, isRoot = false }) {
  const isSelected = selectedItemId?.toString() === item.id?.toString();
  const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;

  // Status flags
  const isCompleted = Boolean(item.isCompleted) || (item.producedQuantity != null && item.quantity != null && item.producedQuantity >= item.quantity);
  const isLocalCenter = item.isLocalCenter !== false; // default true if undefined
  const isBlocked = Boolean(item.isBlocked);
  const centerName = item.productionCenterName || "Center";

  // Card background styling based on status
  let cardBorderBg = "border-line bg-surface";
  if (isSelected) {
    cardBorderBg = "border-brand-fg bg-subtle shadow-sm ring-2 ring-brand-fg";
  } else if (isCompleted) {
    cardBorderBg = "border-success/30 bg-hover hover:bg-line";
  } else if (!isLocalCenter) {
    cardBorderBg = "border-line bg-subtle hover:bg-hover";
  } else if (isBlocked) {
    cardBorderBg = "border-warning/30 bg-hover hover:bg-warning/20";
  } else {
    cardBorderBg = "border-line bg-surface hover:bg-subtle";
  }

  return (
    <div className={`transition-all ${isRoot ? "border border-line rounded-xl bg-surface p-4 shadow-sm" : "mt-2.5 ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-line-strong"}`}>
      <button
        type="button"
        onClick={() => onSelectItem(item.id)}
        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBorderBg} cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${
            isCompleted 
              ? "bg-success-solid text-on-brand" 
              : !isLocalCenter 
              ? "bg-plum/10 text-plum" 
              : isRoot 
              ? "bg-warning/10 text-warning" 
              : "bg-brand/10 text-brand-fg"
          }`}>
            {isCompleted ? <CheckCircle2 size={18} /> : !isLocalCenter ? <Lock size={16} /> : isRoot ? <Package size={18} /> : <Layers size={16} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[14px] ${isRoot ? "font-[600] text-fg-strong" : "font-[500] text-fg"} ${isCompleted ? "line-through text-success" : ""}`}>
                {item.productName}
              </span>
              {isRoot ? (
                <span className="text-[10px] uppercase tracking-wider font-[600] px-2 py-0.5 rounded bg-warning/10 text-warning">
                  Parent Product
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-[500] px-2 py-0.5 rounded bg-brand/10 text-brand-fg">
                  Sub-Assembly
                </span>
              )}

              {/* Status Badges */}
              {isCompleted ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-success-solid text-on-brand flex items-center gap-1">
                  <CheckCircle2 size={10} /> Completed ({item.producedQuantity || item.quantity}/{item.quantity})
                </span>
              ) : !isLocalCenter ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-plum/10 text-plum flex items-center gap-1">
                  <Lock size={10} /> Produced in {centerName}
                </span>
              ) : isBlocked ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-1">
                  <AlertTriangle size={10} /> Waiting for Sub-Assemblies
                </span>
              ) : (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-brand/10 text-brand-fg flex items-center gap-1">
                  <Clock size={10} /> Ready to Produce
                </span>
              )}
            </div>

            <div className="text-[11px] text-fg-secondary mt-1 flex items-center gap-2 flex-wrap">
              <span>Planned: <strong className="text-fg">{item.quantity}</strong></span>
              {item.producedQuantity != null && (
                <span>Produced: <strong className={isCompleted ? "text-success" : "text-brand-fg"}>{item.producedQuantity}</strong></span>
              )}
              <span className={`px-2 py-0.5 rounded font-[500] ${!isLocalCenter ? "bg-plum/10 text-plum" : "bg-hover text-fg"}`}>
                📍 {centerName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {isSelected ? (
            <span className="text-[12px] font-[600] text-brand-fg bg-line px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={13} /> Selected
            </span>
          ) : isCompleted ? (
            <span className="text-[11px] text-success bg-hover border border-success/30 px-2.5 py-1 rounded-lg font-[500]">
              Done ✓
            </span>
          ) : (
            <span className="text-[12px] text-brand-fg hover:underline font-[500]">
              Select Item →
            </span>
          )}
        </div>
      </button>

      {/* Render Child Sub-Assemblies inside Parent Box */}
      {hasChildren && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-[600] uppercase tracking-wider text-fg-secondary ml-1 flex items-center gap-1.5">
            <Layers size={12} className="text-brand-fg" />
            Required Sub-Assemblies & Ingredients ({item.children.length})
          </p>
          <div className="space-y-2">
            {item.children.map((child) => (
              <ItemTreeNode
                key={child.id}
                item={child}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
                isRoot={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BakeryPartialProduction() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Partial Production";

  // plans: list of { id (planId), planName, status, items: [{id, productName, quantity, productionCenterId}] }
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Progress for selected item (fetched after submit or on item select)
  const [itemProgress, setItemProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Batch history modal
  const [showHistory, setShowHistory] = useState(false);

  // Form state for single-item batch recording
  const [producedQty, setProducedQty] = useState(0);
  const [wastageQty, setWastageQty] = useState(0);
  const [wastageReason, setWastageReason] = useState("");
  const [batchNotes, setBatchNotes] = useState("");

  // Helper to flatten item tree (top-level items + child items)
  const getAllItems = useCallback((items) => {
    if (!items || !Array.isArray(items)) return [];
    let list = [];
    items.forEach((it) => {
      list.push(it);
      if (it.children && Array.isArray(it.children) && it.children.length > 0) {
        list = list.concat(getAllItems(it.children));
      }
    });
    return list;
  }, []);

  // Load plans on mount
  const fetchPlans = useCallback(() => {
    setLoading(true);
    setSubmitError(null);
    console.log(`[BakeryPartialProduction] Fetching plans from ${BASE_URL}/api/v1/worker/production-requests. Token: ${localStorage.getItem("authToken") ? 'present' : 'MISSING'}`);
    fetch(`${BASE_URL}/api/v1/worker/production-requests`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to fetch plans: ${r.status} ${r.statusText}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log(`[BakeryPartialProduction] Received ${Array.isArray(data) ? data.length : 'non-array'} plans:`, data);
        const list = Array.isArray(data) ? data : [];
        
        // Filter out distributed plans and sort by status (In Progress first)
        const filteredAndSorted = list
          .filter(p => p.status !== "DISTRIBUTED")
          .sort((a, b) => {
            if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
            if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;
            return new Date(b.planDate || b.createdAt) - new Date(a.planDate || a.createdAt);
          });

        setPlans(filteredAndSorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[BakeryPartialProduction] Error fetching plans:", err);
        setSubmitError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Auto-select plan ONLY if URL parameter ?id= is present (e.g. clicked Start from Production Requests tab)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planId = params.get("id");
    if (planId && plans.length > 0) {
      const matchedPlan = plans.find((p) => p.id?.toString() === planId.toString());
      if (matchedPlan) {
        setSelectedPlanId(matchedPlan.id);
        const allItems = getAllItems(matchedPlan.items);
        if (allItems.length > 0) {
          const defaultItem = allItems.find((it) => it.canProduceLocally) 
            || allItems.find((it) => it.isLocalCenter && !it.isBlocked) 
            || allItems.find((it) => it.isLocalCenter) 
            || allItems[0];
          setSelectedItemId(defaultItem.id);
        }
      }
    }
  }, [location.search, plans, getAllItems]);

  // Fetch item progress whenever selectedItemId changes
  const fetchItemProgress = useCallback((itemId) => {
    if (!itemId) { setItemProgress(null); return; }
    setProgressLoading(true);
    fetch(`${BASE_URL}/api/v1/worker/production-tracking/items/${itemId}/progress`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setItemProgress(data);
        setProgressLoading(false);
      })
      .catch(() => setProgressLoading(false));
  }, []);

  // When item is selected, fetch progress and reset form
  useEffect(() => {
    if (!selectedItemId) {
      setItemProgress(null);
      return;
    }
    setItemProgress(null);
    fetchItemProgress(selectedItemId);
    setProducedQty(0);
    setWastageQty(0);
    setWastageReason("");
    setBatchNotes("");
    setSubmitted(false);
    setSubmitError(null);
  }, [selectedItemId, fetchItemProgress]);

  // Computed values
  const selectedPlan = plans.find((p) => p.id?.toString() === selectedPlanId?.toString());
  const allPlanItems = selectedPlan ? getAllItems(selectedPlan.items) : [];
  const selectedItem = allPlanItems.find((it) => it.id?.toString() === selectedItemId?.toString());

  const validProgress = (itemProgress && itemProgress.productionPlanItemId?.toString() === selectedItem?.id?.toString()) 
    ? itemProgress 
    : null;

  const totalProduced = validProgress ? validProgress.producedQty : (selectedItem?.producedQuantity ?? 0);
  const planned = validProgress ? validProgress.plannedQty : (selectedItem?.quantity ?? 1);
  const remaining = validProgress ? validProgress.remainingQty : Math.max(0, planned - totalProduced);
  const productPct = planned > 0 ? Math.min(100, Math.round((totalProduced / planned) * 100)) : 0;

  const isSelectedItemBlocked = Boolean(selectedItem?.isBlocked) || (selectedItem?.uncompletedChildCount > 0);
  const isSelectedItemExternal = selectedItem?.isLocalCenter === false;

  // Validation
  const validationErrors = [];
  if (isSelectedItemExternal) {
    validationErrors.push(`Item '${selectedItem?.productName}' is produced at ${selectedItem?.productionCenterName || 'another center'}. Cannot record batch here.`);
  } else if (isSelectedItemBlocked) {
    validationErrors.push(`Cannot produce '${selectedItem?.productName}': Required child sub-assemblies are not completed yet. Please produce required child items first.`);
  }
  if (producedQty < 1) validationErrors.push("Produced quantity must be at least 1.");
  if (wastageQty < 0) validationErrors.push("Wastage cannot be negative.");
  if (wastageQty > producedQty) validationErrors.push("Wastage cannot exceed produced qty.");
  if (wastageQty > 0 && !wastageReason.trim()) validationErrors.push("Wastage reason is required.");

  const canSubmit = selectedItemId && producedQty >= 1 && validationErrors.length === 0 && !submitted && !isSelectedItemBlocked && !isSelectedItemExternal;

  const handleSubmit = async () => {
    console.log(`[BakeryPartialProduction] Submitting batch to ${BASE_URL}/api/v1/worker/production-tracking/batches. Token: ${localStorage.getItem("authToken") ? 'present' : 'MISSING'}`);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/production-tracking/batches`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          productionPlanItemId: selectedItemId,
          producedQty,
          wastageQty,
          wastageReason: wastageQty > 0 ? wastageReason : null,
          notes: batchNotes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to submit batch");
      }
      // Refresh progress
      await fetchItemProgress(selectedItemId);
      setProducedQty(0);
      setWastageQty(0);
      setWastageReason("");
      setBatchNotes("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <BakeryWorkerSideBar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <BakeryWorkerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg mb-1">
                Partial Production
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Record partial batch production quantities and wastage
              </p>
            </div>
            <button
              onClick={fetchPlans}
              disabled={loading}
              className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Plan Selector */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-5 mb-5">
            <label className="block text-[14px] font-[600] text-fg mb-1.5">
              Select Production Plan
            </label>
            <p className="text-[13px] text-fg-secondary mb-3">
              Choose an active production task to record partial batch output.
            </p>
            <div className="relative">
              <button
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-line rounded-lg bg-surface hover:bg-subtle transition-colors text-left"
              >
                <ClipboardList size={16} className="text-brand-fg flex-shrink-0" />
                <span className="flex-1 text-[14px] text-fg">
                  {selectedPlan
                    ? `${selectedPlan.planName} (#${selectedPlan.id})`
                    : "— Select a production plan —"}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-fg-secondary transition-transform ${planDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {planDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-elevated border border-line rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-3 text-[13px] text-fg-secondary">Loading...</div>
                  ) : plans.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-fg-secondary">No active plans found.</div>
                  ) : (
                    plans.map((plan) => {
                      const meta = getStatusMeta(plan.status);
                      const totalPlanned = plan.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            const itemsForPlan = getAllItems(plan.items);
                            if (itemsForPlan.length > 0) {
                              const defaultItem = itemsForPlan.find((it) => it.canProduceLocally) 
                                || itemsForPlan.find((it) => it.isLocalCenter && !it.isBlocked) 
                                || itemsForPlan.find((it) => it.isLocalCenter) 
                                || itemsForPlan[0];
                              setSelectedItemId(defaultItem.id);
                            } else {
                              setSelectedItemId(null);
                            }
                            setPlanDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[13px] hover:bg-subtle transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between gap-4 ${
                            selectedPlanId?.toString() === plan.id?.toString()
                              ? "text-brand-fg bg-subtle font-[500]"
                              : "text-fg"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-[500] truncate">{plan.planName}</p>
                            <p className="text-[11px] text-fg-secondary flex items-center gap-1 mt-0.5">
                              <Hash size={10} /> #{plan.id}
                              {totalPlanned > 0 && (
                                <span className="ml-2">{plan.items?.length || 0} item(s)</span>
                              )}
                            </p>
                          </div>
                          <span className={`text-[11px] font-[500] px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>
                            {meta.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Hierarchical Item Selector */}
            {selectedPlan && selectedPlan.items && selectedPlan.items.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-[14px] font-[600] text-fg">
                      Select Item to Record
                    </label>
                    <p className="text-[12px] text-fg-secondary">
                      Choose a parent product or a required child sub-assembly to record partial batch output.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedPlan.items.map((rootItem) => (
                    <ItemTreeNode
                      key={rootItem.id}
                      item={rootItem}
                      selectedItemId={selectedItemId}
                      onSelectItem={setSelectedItemId}
                      isRoot={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!selectedPlanId && (
            <div className="bg-surface rounded-lg shadow-sm border border-line py-20 flex flex-col items-center text-center">
              <Layers size={44} className="text-fg-muted mb-4" />
              <p className="text-[15px] font-[500] text-fg mb-1">
                No Production Plan Selected
              </p>
              <p className="text-[13px] text-fg-secondary">
                Select a production plan above to record partial batch output.
              </p>
            </div>
          )}

          {selectedPlanId && !selectedItemId && (
            <div className="bg-surface rounded-lg shadow-sm border border-line py-16 flex flex-col items-center text-center">
              <Package size={36} className="text-fg-muted mb-3" />
              <p className="text-[14px] font-[500] text-fg mb-1">
                No Item Selected
              </p>
              <p className="text-[13px] text-fg-secondary">
                Select an item above to record a batch.
              </p>
            </div>
          )}

          {/* Content when plan + item selected */}
          {selectedPlanId && selectedItemId && selectedItem && (
            <>
              {/* Progress summary card */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-5 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[15px] font-[600] text-fg">
                      {selectedItem.productName}
                    </h3>
                    <p className="text-[12px] text-fg-secondary mt-0.5">Item #{selectedItemId}</p>
                  </div>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-line text-fg-secondary text-[12px] font-[500] rounded-lg hover:bg-subtle transition-colors"
                  >
                    <History size={14} />
                    View History
                    {itemProgress && itemProgress.batches?.length > 0 && (
                      <span className="bg-brand text-on-brand text-[10px] font-[600] px-1.5 py-0.5 rounded-full">
                        {itemProgress.batches.length}
                      </span>
                    )}
                  </button>
                </div>

                {progressLoading ? (
                  <div className="flex items-center gap-2 text-fg-secondary text-[13px]">
                    <RefreshCw size={14} className="animate-spin" /> Loading progress...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px] text-fg-secondary mb-1">
                      <span>Produced: <strong className="text-success">{totalProduced}</strong> / {planned}</span>
                      <span>Remaining: <strong className={remaining === 0 ? "text-success" : "text-warning"}>{remaining}</strong></span>
                    </div>
                    <div className="w-full bg-line rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          productPct === 100 ? "bg-success-solid" : "bg-brand"
                        }`}
                        style={{ width: `${productPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-fg-secondary">
                      <span>{productPct}% complete</span>
                      {validProgress?.wastageQty > 0 && (
                        <span className="text-error">Total wastage: {validProgress.wastageQty}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch recording form */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mb-5">
                <div className="mb-5">
                  <h3 className="text-[16px] font-[600] text-fg">
                    Record Partial Batch
                  </h3>
                  <p className="text-[12px] text-fg-secondary mt-0.5">
                    Enter quantities produced and any wastage for this batch.
                  </p>
                </div>

                {submitted && (
                  <div className="mb-5 bg-hover border border-success/30 rounded-lg px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-success" />
                    <p className="text-[13px] font-[500] text-success">
                      Batch submitted successfully! Progress updated.
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="mb-5 bg-subtle border border-error/30 rounded-lg px-4 py-3 flex items-center gap-3">
                    <AlertCircle size={18} className="text-error" />
                    <p className="text-[13px] font-[500] text-error">{submitError}</p>
                  </div>
                )}

                {selectedPlan?.status?.toUpperCase() === "COMPLETED" || selectedPlan?.status?.toUpperCase() === "DISTRIBUTED" ? (
                  <div className="bg-hover border border-success/30 rounded-lg px-4 py-6 text-center">
                    <CheckCircle size={32} className="mx-auto text-success mb-2" />
                    <p className="text-[14px] font-[600] text-success">Production Completed</p>
                    <p className="text-[12px] text-fg-secondary mt-1">This production plan has been marked as completed. No further production can be recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Produced Qty */}
                      <div>
                        <label className="block text-[12px] font-[600] text-fg mb-1.5">
                          Produced Qty This Batch
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setProducedQty((v) => Math.max(0, v - 1))}
                            className="w-8 h-8 flex items-center justify-center border border-line rounded-lg text-fg-secondary hover:bg-app transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={producedQty}
                            onChange={(e) => setProducedQty(parseInt(e.target.value, 10) || 0)}
                            className="flex-1 text-center px-3 py-2 border border-line rounded-lg text-[14px] font-[600] text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                          />
                          <button
                            onClick={() => setProducedQty((v) => v + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-line rounded-lg text-fg-secondary hover:bg-app transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => setProducedQty(remaining)}
                            className="px-2.5 py-1.5 text-[11px] font-[500] text-brand-fg bg-hover border border-brand/20 rounded-lg hover:bg-line transition-colors whitespace-nowrap"
                          >
                            Target
                          </button>
                        </div>
                        <p className="text-[11px] text-fg-secondary mt-1">
                          Planned remaining: {remaining}
                        </p>
                      </div>

                      {/* Wastage Qty */}
                      <div>
                        <label className="block text-[12px] font-[600] text-fg mb-1.5">
                          Wastage / Defective
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setWastageQty((v) => Math.max(0, v - 1))}
                            className="w-8 h-8 flex items-center justify-center border border-line rounded-lg text-fg-secondary hover:bg-app transition-colors"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={producedQty}
                            step="1"
                            value={wastageQty}
                            onChange={(e) => setWastageQty(parseInt(e.target.value, 10) || 0)}
                            className="flex-1 text-center px-3 py-2 border border-line rounded-lg text-[14px] font-[600] text-fg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
                          />
                          <button
                            onClick={() => setWastageQty((v) => Math.min(producedQty, v + 1))}
                            className="w-8 h-8 flex items-center justify-center border border-line rounded-lg text-fg-secondary hover:bg-app transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] text-fg-secondary mt-1">
                          Max: {producedQty}
                        </p>
                      </div>
                    </div>

                    {/* Wastage Reason */}
                    {wastageQty > 0 && (
                      <div>
                        <label className="block text-[12px] font-[600] text-fg mb-1.5">
                          Wastage Reason <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Over-baked, dropped, equipment issue..."
                          value={wastageReason}
                          onChange={(e) => setWastageReason(e.target.value)}
                          className="w-full px-3 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Batch Notes */}
                    <div>
                      <label className="block text-[13px] font-[600] text-fg mb-1.5">
                        Batch Note{" "}
                        <span className="text-fg-secondary font-[400]">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any observations or notes for this batch..."
                        value={batchNotes}
                        onChange={(e) => setBatchNotes(e.target.value)}
                        className="w-full px-3 py-2.5 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg resize-none"
                      />
                    </div>

                    {/* Validation errors */}
                    {validationErrors.length > 0 && producedQty > 0 && (
                      <div className="space-y-1">
                        {validationErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[12px] text-error">
                            <AlertCircle size={12} />
                            {err}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        {producedQty < 1 ? (
                          <p className="text-[13px] text-fg-secondary">
                            Enter produced quantities above to submit this batch.
                          </p>
                        ) : validationErrors.length > 0 ? (
                          <div className="flex items-center gap-2 text-error">
                            <AlertTriangle size={15} />
                            <span className="text-[13px] font-[500]">
                              Please fix validation errors before submitting.
                            </span>
                          </div>
                        ) : (
                          <p className="text-[13px] text-fg-secondary">
                            Ready to submit batch. Progress will be updated on confirmation.
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            Submit Batch
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Summary Table */}
              {itemProgress && (
                <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                  <h3 className="text-[16px] font-[600] text-fg mb-4">
                    Production Progress Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-subtle border-b border-line">
                          <th className="text-left py-3 px-4 text-[12px] font-[500] text-fg-secondary rounded-tl-lg">Product</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[500] text-fg-secondary">Planned</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[500] text-fg-secondary">Produced</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[500] text-fg-secondary">Wastage</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[500] text-fg-secondary">Remaining</th>
                          <th className="text-left py-3 px-4 text-[12px] font-[500] text-fg-secondary rounded-tr-lg">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-line last:border-0 hover:bg-subtle transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-warning/10 rounded-lg">
                                <Package size={13} className="text-warning" />
                              </div>
                              <span className="text-[13px] font-[500] text-fg">
                                {itemProgress.productName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[13px] font-[600] text-fg">{itemProgress.plannedQty}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[13px] font-[600] text-success">{itemProgress.producedQty}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[13px] font-[600] ${itemProgress.wastageQty > 0 ? "text-error" : "text-fg-secondary"}`}>
                              {itemProgress.wastageQty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-[13px] font-[600] ${itemProgress.remainingQty === 0 ? "text-success" : "text-warning"}`}>
                              {itemProgress.remainingQty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-line rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    productPct === 100 ? "bg-success-solid" : productPct > 0 ? "bg-brand" : "bg-line"
                                  }`}
                                  style={{ width: `${productPct}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-[600] text-fg w-9 text-right">
                                {productPct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Batch History Modal */}
      {showHistory && selectedItemId && (
        <BatchHistoryModal
          planName={selectedPlan?.planName}
          planId={selectedPlanId}
          itemId={selectedItemId}
          onClose={() => setShowHistory(false)}
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
