import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  X,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Hash,
  Layers,
  Building2,
  Lock,
  Plus,
  Minus,
  AlertCircle,
  History,
  CheckCircle2,
} from "lucide-react";

import KitchenWorkerNavBar from "../component/KitchenWorkerNavBar.jsx";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar.jsx";
const BASE_URL = process.env.REACT_APP_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const STATUS_META = {
  PENDING: { label: "Pending", color: "text-[#667085] bg-[#F0F1F3]", icon: <Clock size={14} /> },
  IN_PROGRESS: { label: "In Progress", color: "text-[#1366D9] bg-[#F0F8FF]", icon: <PlayCircle size={14} /> },
  COMPLETED: { label: "Completed", color: "text-[#199D26] bg-[#F0FDF4]", icon: <CheckCircle size={14} /> },
};

const getStatusMeta = (status) => STATUS_META[status?.toUpperCase()] || STATUS_META["PENDING"];

// ─── Batch History Modal ──────────────────────────────────────────────────────

function BatchHistoryModal({ planName, planId, itemId, onClose }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/v1/worker/production-tracking/items/${itemId}/progress`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-[#E4E6EA] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-[600] text-[#383E49]">
              Batch Production History
            </h3>
            <p className="text-[12px] text-[#667085] mt-0.5 flex items-center gap-1">
              <Hash size={11} /> Item #{itemId} — {planName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F0F1F3] rounded-lg transition-colors"
          >
            <X size={18} className="text-[#667085]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw size={24} className="mx-auto text-[#C8CDD5] animate-spin mb-2" />
              <p className="text-[13px] text-[#667085]">Loading history...</p>
            </div>
          ) : !batches || batches.length === 0 ? (
            <div className="text-center py-12">
              <History size={36} className="mx-auto text-[#C8CDD5] mb-3" />
              <p className="text-[14px] font-[500] text-[#383E49]">
                No batch history yet
              </p>
              <p className="text-[12px] text-[#667085]">
                Submit partial production entries to see history here.
              </p>
            </div>
          ) : (
            batches.map((batch, i) => (
              <div
                key={batch.id}
                className="border border-[#E4E6EA] rounded-xl overflow-hidden"
              >
                <div className="bg-[#F8F9FA] px-4 py-3 flex items-center justify-between border-b border-[#E4E6EA]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-[600] text-[#383E49]">
                      Batch #{batch.id}
                    </span>
                    <span className="text-[11px] text-[#667085] bg-white border border-[#E4E6EA] px-2 py-0.5 rounded-full">
                      Entry {batches.length - i}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#667085]">
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
                        <th className="text-[11px] font-[500] text-[#667085] pb-2">
                          Product
                        </th>
                        <th className="text-center text-[11px] font-[500] text-[#667085] pb-2">
                          Produced
                        </th>
                        <th className="text-center text-[11px] font-[500] text-[#667085] pb-2">
                          Wastage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#F0F1F3]">
                        <td className="py-2 text-[13px] text-[#383E49] font-[500]">
                          {batch.productName || "—"}
                        </td>
                        <td className="py-2 text-center text-[13px] font-[600] text-[#199D26]">
                          {batch.producedQty}
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`text-[13px] font-[600] ${
                              (batch.wastageQty || 0) > 0
                                ? "text-[#EF4444]"
                                : "text-[#667085]"
                            }`}
                          >
                            {batch.wastageQty || 0}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {batch.wastageReason && (
                    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 flex items-start gap-2 mb-2">
                      <AlertCircle size={13} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-[#EF4444]">Wastage: {batch.wastageReason}</p>
                    </div>
                  )}
                  {batch.notes && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 flex items-start gap-2">
                      <AlertCircle size={13} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
                      <p className="text-[12px] text-[#92400E]">{batch.notes}</p>
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
  const centerName = item.productionCenterName || "Kitchen";

  // Card background styling based on status
  let cardBorderBg = "border-[#E4E6EA] bg-white";
  if (isSelected) {
    cardBorderBg = "border-[#0F50AA] bg-[#F0F8FF] shadow-sm ring-2 ring-[#0F50AA]";
  } else if (isCompleted) {
    cardBorderBg = "border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#DCFCE7]";
  } else if (!isLocalCenter) {
    cardBorderBg = "border-[#E9D5FF] bg-[#FAF5FF] hover:bg-[#F3E8FF]";
  } else if (isBlocked) {
    cardBorderBg = "border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7]";
  } else {
    cardBorderBg = "border-[#E4E6EA] bg-white hover:bg-[#F8F9FA]";
  }

  return (
    <div className={`transition-all ${isRoot ? "border border-[#E4E6EA] rounded-xl bg-white p-4 shadow-sm" : "mt-2.5 ml-3 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-[#D0D5DD]"}`}>
      <button
        type="button"
        onClick={() => onSelectItem(item.id)}
        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBorderBg} cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${
            isCompleted 
              ? "bg-[#199D26] text-white" 
              : !isLocalCenter 
              ? "bg-purple-100 text-purple-700" 
              : isRoot 
              ? "bg-orange-50 text-orange-600" 
              : "bg-blue-50 text-blue-600"
          }`}>
            {isCompleted ? <CheckCircle2 size={18} /> : !isLocalCenter ? <Lock size={16} /> : isRoot ? <Package size={18} /> : <Layers size={16} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[14px] ${isRoot ? "font-[600] text-[#1D2939]" : "font-[500] text-[#344054]"} ${isCompleted ? "line-through text-[#15803D]" : ""}`}>
                {item.productName}
              </span>
              {isRoot ? (
                <span className="text-[10px] uppercase tracking-wider font-[600] px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                  Parent Product
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-[500] px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  Sub-Assembly
                </span>
              )}

              {/* Status Badges */}
              {isCompleted ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-[#199D26] text-white flex items-center gap-1">
                  <CheckCircle2 size={10} /> Completed ({item.producedQuantity || item.quantity}/{item.quantity})
                </span>
              ) : !isLocalCenter ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                  <Lock size={10} /> Produced in {centerName}
                </span>
              ) : isBlocked ? (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertTriangle size={10} /> Waiting for Sub-Assemblies
                </span>
              ) : (
                <span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Clock size={10} /> Ready to Produce
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#667085] mt-1 flex items-center gap-2 flex-wrap">
              <span>Planned: <strong className="text-[#344054]">{item.quantity}</strong></span>
              {item.producedQuantity != null && (
                <span>Produced: <strong className={isCompleted ? "text-[#199D26]" : "text-[#0F50AA]"}>{item.producedQuantity}</strong></span>
              )}
              <span className={`px-2 py-0.5 rounded font-[500] ${!isLocalCenter ? "bg-purple-100 text-purple-700" : "bg-[#F2F4F7] text-[#475467]"}`}>
                📍 {centerName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {isSelected ? (
            <span className="text-[12px] font-[600] text-[#0F50AA] bg-[#DBEAFE] px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={13} /> Selected
            </span>
          ) : isCompleted ? (
            <span className="text-[11px] text-[#199D26] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-lg font-[500]">
              Done ✓
            </span>
          ) : (
            <span className="text-[12px] text-[#0F50AA] hover:underline font-[500]">
              Select Item →
            </span>
          )}
        </div>
      </button>

      {/* Render Child Sub-Assemblies inside Parent Box */}
      {hasChildren && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-[600] uppercase tracking-wider text-[#667085] ml-1 flex items-center gap-1.5">
            <Layers size={12} className="text-[#0F50AA]" />
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

export default function KitchenPartialProduction() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Partial Production";

  const location = useLocation();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  const [itemProgress, setItemProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const [producedQty, setProducedQty] = useState(0);
  const [wastageQty, setWastageQty] = useState(0);
  const [wastageReason, setWastageReason] = useState("");
  const [batchNotes, setBatchNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const getAllItems = useCallback((items) => {
    let result = [];
    if (!items) return result;
    for (const item of items) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        result = result.concat(getAllItems(item.children));
      }
    }
    return result;
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/api/v1/worker/production-requests`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load plans: ${res.status}`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load active production plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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

  const fetchItemProgress = useCallback((itemId) => {
    if (!itemId) { setItemProgress(null); return; }
    setProgressLoading(true);
    fetch(`${BASE_URL}/api/v1/worker/production-tracking/items/${itemId}/progress`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setItemProgress(data);
        setProgressLoading(false);
      })
      .catch(() => setProgressLoading(false));
  }, []);

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
    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch(`${BASE_URL}/api/v1/worker/production-tracking/batches`, {
        method: "POST",
        headers: getAuthHeaders(),
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
      await fetchItemProgress(selectedItemId);
      await fetchPlans();
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
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                Partial Production
              </h1>
              <p className="text-[14px] text-[#667085]">
                Record partial batch production quantities and wastage for Kitchen items
              </p>
            </div>
            <button
              onClick={() => { fetchPlans(); if (selectedItemId) fetchItemProgress(selectedItemId); }}
              className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {/* Plan Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-5 mb-5">
            <label className="block text-[14px] font-[600] text-[#383E49] mb-1.5">
              Select Production Plan
            </label>
            <p className="text-[13px] text-[#667085] mb-3">
              Choose an active production task to record partial batch output.
            </p>
            <div className="relative">
              <button
                onClick={() => setPlanDropdownOpen(!planDropdownOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-[#E4E6EA] rounded-lg bg-white hover:bg-[#F8F9FA] transition-colors text-left"
              >
                <ClipboardList size={16} className="text-[#0F50AA] flex-shrink-0" />
                <span className="flex-1 text-[14px] text-[#383E49]">
                  {selectedPlan
                    ? `${selectedPlan.planName} (#${selectedPlan.id})`
                    : "— Select a production plan —"}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-[#667085] transition-transform ${planDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {planDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {plans.length === 0 ? (
                    <div className="p-4 text-center text-[#667085] text-[13px]">
                      No active production plans found
                    </div>
                  ) : (
                    plans.map((plan) => {
                      const meta = getStatusMeta(plan.status);
                      const totalPlanned = plan.totalQuantity || 0;
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
                          className={`w-full text-left px-4 py-3 text-[13px] hover:bg-[#F8F9FA] transition-colors flex items-center justify-between gap-4 ${
                            selectedPlanId?.toString() === plan.id?.toString()
                              ? "text-[#0F50AA] bg-[#F0F8FF] font-[500]"
                              : "text-[#383E49]"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-[500] truncate">{plan.planName}</p>
                            <p className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
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

            {/* Placeholder when no plan selected */}
            {!selectedPlan && (
              <div className="mt-4 p-8 border border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC] text-center text-[#64748B]">
                <ClipboardList size={36} className="mx-auto mb-2 text-[#94A3B8]" />
                <p className="text-[14px] font-[500] text-[#334155]">No Production Plan Selected</p>
                <p className="text-[12px] text-[#64748B] mt-0.5">Please select an active production plan from the dropdown above to view items and record batch output.</p>
              </div>
            )}

            {/* Hierarchical Item Selector */}
            {selectedPlan && selectedPlan.items && selectedPlan.items.length > 0 && (
              <div className="mt-5 border-t border-[#E4E6EA] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-[14px] font-[600] text-[#383E49]">
                      Select Item to Record
                    </label>
                    <p className="text-[12px] text-[#667085]">
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
                      onSelectItem={(it) => setSelectedItemId(typeof it === 'object' ? it.id : it)}
                      isRoot={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Item Detail & Batch Recording Form */}
          {selectedItem && (
            <div>
              {/* Item Overview & Progress Card */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-[600] text-[#383E49]">
                        {selectedItem.productName}
                      </h2>
                      <span className="text-[11px] font-[600] bg-[#F0F1F3] text-[#667085] px-2 py-0.5 rounded">
                        Item #{selectedItem.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-[#E4E6EA] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                  >
                    <History size={14} />
                    View History
                    {itemProgress && itemProgress.batches?.length > 0 && (
                      <span className="bg-[#0F50AA] text-white text-[10px] font-[600] px-1.5 py-0.5 rounded-full">
                        {itemProgress.batches.length}
                      </span>
                    )}
                  </button>
                </div>

                {progressLoading ? (
                  <div className="flex items-center gap-2 text-[#667085] text-[13px]">
                    <RefreshCw size={14} className="animate-spin" /> Loading progress...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px] text-[#667085] mb-1">
                      <span>Produced: <strong className="text-[#199D26]">{totalProduced}</strong> / {planned}</span>
                      <span>Remaining: <strong className={remaining === 0 ? "text-[#199D26]" : "text-[#F4A100]"}>{remaining}</strong></span>
                    </div>
                    <div className="w-full bg-[#E4E6EA] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          productPct === 100 ? "bg-[#199D26]" : "bg-[#0F50AA]"
                        }`}
                        style={{ width: `${productPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#667085]">
                      <span>{productPct}% complete</span>
                      {validProgress?.wastageQty > 0 && (
                        <span className="text-[#EF4444]">Total wastage: {validProgress.wastageQty}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch recording form */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-5">
                <div className="mb-5">
                  <h3 className="text-[16px] font-[600] text-[#383E49]">
                    Record Partial Batch
                  </h3>
                  <p className="text-[12px] text-[#667085] mt-0.5">
                    Enter quantities produced and any wastage for this batch.
                  </p>
                </div>

                {/* Validation Warnings */}
                {validationErrors.length > 0 && (
                  <div className="mb-5 p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg space-y-1">
                    {validationErrors.map((err, i) => (
                      <p key={i} className="text-[13px] text-[#991B1B] flex items-center gap-2">
                        <AlertCircle size={15} className="flex-shrink-0 text-[#DC2626]" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {submitted && (
                  <div className="mb-5 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-[13px] text-[#166534] flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#166534]" />
                    Batch recorded successfully! Output quantity added to store inventory.
                  </div>
                )}

                {submitError && (
                  <div className="mb-5 p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-[13px] text-[#991B1B] flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#DC2626]" />
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  {/* Produced Qty */}
                  <div>
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                      Produced Qty This Batch
                    </label>
                    <div className="flex items-center border border-[#E4E6EA] rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setProducedQty((q) => Math.max(0, q - 1))}
                        disabled={producedQty <= 0}
                        className="px-3 py-2.5 bg-[#F8F9FA] border-r border-[#E4E6EA] text-[#667085] hover:bg-[#E4E6EA] disabled:opacity-50 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={producedQty}
                        onChange={(e) => setProducedQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center py-2 text-[14px] font-[600] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setProducedQty((q) => q + 1)}
                        className="px-3 py-2.5 bg-[#F8F9FA] border-l border-[#E4E6EA] text-[#667085] hover:bg-[#E4E6EA] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setProducedQty(remaining)}
                          className="px-3 py-2.5 bg-[#F0F8FF] text-[#0F50AA] text-[12px] font-[600] border-l border-[#E4E6EA] hover:bg-[#DBEAFE] transition-colors flex-shrink-0"
                        >
                          Target ({remaining})
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1">Planned remaining: {remaining}</p>
                  </div>

                  {/* Wastage Qty */}
                  <div>
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                      Wastage / Defective
                    </label>
                    <div className="flex items-center border border-[#E4E6EA] rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setWastageQty((q) => Math.max(0, q - 1))}
                        disabled={wastageQty <= 0}
                        className="px-3 py-2.5 bg-[#F8F9FA] border-r border-[#E4E6EA] text-[#667085] hover:bg-[#E4E6EA] disabled:opacity-50 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={wastageQty}
                        onChange={(e) => setWastageQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center py-2 text-[14px] font-[600] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setWastageQty((q) => q + 1)}
                        className="px-3 py-2.5 bg-[#F8F9FA] border-l border-[#E4E6EA] text-[#667085] hover:bg-[#E4E6EA] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wastage reason */}
                {wastageQty > 0 && (
                  <div className="mb-5">
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                      Wastage Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Overcooked, spilled batter, defective shape..."
                      value={wastageReason}
                      onChange={(e) => setWastageReason(e.target.value)}
                      className="w-full px-3.5 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                    />
                  </div>
                )}

                {/* Batch notes */}
                <div className="mb-6">
                  <label className="block text-[13px] font-[500] text-[#383E49] mb-1.5">
                    Batch Note <span className="text-[#667085] font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any observations or notes for this batch..."
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E4E6EA]">
                  <p className="text-[12px] text-[#667085]">
                    {canSubmit
                      ? "Enter produced quantities above to submit this batch."
                      : "Please fix validation errors before submitting."}
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="px-6 py-2.5 bg-[#0F50AA] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0C4A8A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting && <RefreshCw size={14} className="animate-spin" />}
                    Submit Batch
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showHistory && selectedItem && (
        <BatchHistoryModal
          planName={selectedPlan?.planName}
          planId={selectedPlanId}
          itemId={selectedItemId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
