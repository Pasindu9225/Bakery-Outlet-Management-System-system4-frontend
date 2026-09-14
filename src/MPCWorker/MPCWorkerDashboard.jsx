import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  RefreshCw,
  ShoppingBasket,
  FileText,
  Layers,
  Search,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import MPCWorkerSideBar from "../component/MPCWorkerSideBar";
import toast, { Toaster } from "react-hot-toast";

import { getApiBaseUrl } from "../utils/config";

const BASE_URL = getApiBaseUrl();

function statusBadge(status) {
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PENDING_MANAGER: "bg-orange-100 text-orange-800",
    APPROVED_MANAGER: "bg-purple-100 text-purple-800",
    ISSUED: "bg-blue-100 text-blue-800",
    RECEIVED: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export default function MPCWorkerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("requestMaterials"); // 'requestMaterials', 'deliveries', 'storeInventory', 'kots'
  const [me, setMe] = useState(null);
  const token = localStorage.getItem("authToken");

  // Dynamic KOT Recipes loaded from real products & BOM database
  const [kotRecipes, setKotRecipes] = useState([]);

  // State for KOT Material Request
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);
  const [requestNotes, setRequestNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Deliveries & History state
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  // Store Inventory state
  const [mpcStoreInventory, setMpcStoreInventory] = useState([]);

  // KOTs state
  const [kots, setKots] = useState([]);
  const [loadingKots, setLoadingKots] = useState(false);
  const [updatingKot, setUpdatingKot] = useState({});

  // Fetch real products & BOMs from DB (Filter only KOT enabled items)
  useEffect(() => {
    async function loadProductsAndBoms() {
      try {
        const [prodRes, bomRes] = await Promise.all([
          fetch(`${BASE_URL}/api/v1/admin/product/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE_URL}/api/v1/admin/bom/all`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const products = prodRes.ok ? await prodRes.json() : [];
        const boms = bomRes.ok ? await bomRes.json() : [];

        if (Array.isArray(products) && products.length > 0) {
          // Filter products where isKotEnabled is true
          let kotProducts = products.filter(
            (p) => p.isKotEnabled === true || String(p.isKotEnabled).toLowerCase() === "true"
          );

          // If no items have isKotEnabled set to true yet, show active products
          if (kotProducts.length === 0) {
            kotProducts = products.filter((p) => p.isActive !== false);
          }

          const mapped = kotProducts.map((p) => {
            const bomEntry = Array.isArray(boms)
              ? boms.find((b) => (b.parentProduct?.id || b.parentProductId) === p.id)
              : null;
            let items = [];
            const rawChildItems = bomEntry?.childItems || bomEntry?.items;
            if (Array.isArray(rawChildItems) && rawChildItems.length > 0) {
              items = rawChildItems.map((bi) => ({
                rawMaterialId: bi.id || bi.childItemId,
                materialName: bi.name || bi.childItemName || bi.materialName || "Raw Material",
                qtyPerUnit: Number(bi.qty || bi.quantity || 0),
                unit: bi.unit || "kg",
              }));
            }

            return {
              id: p.id,
              name: p.productName,
              code: p.productCode || `PROD-${p.id}`,
              category: p.categoryName || "General",
              isKotEnabled: Boolean(p.isKotEnabled),
              bom: items,
            };
          });

          setKotRecipes(mapped);
          if (mapped.length > 0) {
            setSelectedPlanItems([{ recipeId: mapped[0].id, plannedQty: 10 }]);
          }
        }
      } catch (err) {
        console.error("Failed to load products/BOMs:", err);
      }
    }

    if (token) {
      loadProductsAndBoms();
    }
  }, [token]);

  // Fetch current user & me info
  useEffect(() => {
    fetch(`${BASE_URL}/bmsauth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMe(data);
      })
      .catch(() => setMe(null));
  }, [token]);

  // Fetch KOTs
  const fetchKots = useCallback(async () => {
    setLoadingKots(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/kots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKots(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKots(false);
    }
  }, [token]);

  // Fetch Material Requests
  const fetchMaterialRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterialRequests(data);
      } else {
        setMaterialRequests([]);
      }
    } catch {
      setMaterialRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [token]);

  useEffect(() => {
    fetchKots();
    fetchMaterialRequests();
  }, [fetchKots, fetchMaterialRequests]);

  // Dynamic BOM Aggregation Calculation
  const calculateTotalBOMRequirements = () => {
    const totals = {};
    selectedPlanItems.forEach((planItem) => {
      const recipe = kotRecipes.find((r) => r.id === Number(planItem.recipeId));
      if (!recipe) return;
      const targetQty = Number(planItem.plannedQty || 0);

      recipe.bom.forEach((ingredient) => {
        const requiredAmount = ingredient.qtyPerUnit * targetQty;
        if (!totals[ingredient.rawMaterialId]) {
          totals[ingredient.rawMaterialId] = {
            rawMaterialId: ingredient.rawMaterialId,
            materialName: ingredient.materialName,
            totalQty: 0,
            unit: ingredient.unit,
          };
        }
        totals[ingredient.rawMaterialId].totalQty += requiredAmount;
      });
    });

    return Object.values(totals);
  };

  const calculatedBOM = calculateTotalBOMRequirements();

  // Add Item to Request Form
  const addPlanItem = () => {
    setSelectedPlanItems((prev) => [...prev, { recipeId: kotRecipes[0]?.id || 1, plannedQty: 10 }]);
  };

  const removePlanItem = (idx) => {
    setSelectedPlanItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePlanItem = (idx, field, value) => {
    setSelectedPlanItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  // Submit Material Request for Manager Approval
  const handleSubmitMaterialRequest = async () => {
    if (calculatedBOM.length === 0) {
      toast.error("Please add at least one KOT item to calculate materials.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const payload = {
        outletId: me?.outletId || me?.assignedOutletId || null,
        mpcId: me?.mpcId || me?.assignedMpcId || me?.productionCenterId || null,
        notes: requestNotes,
        items: calculatedBOM.map((mat) => ({
          rawMaterialId: mat.rawMaterialId,
          rawMaterialName: mat.materialName,
          requestedQty: Number(mat.totalQty.toFixed(2)),
          unitOfMeasure: mat.unit,
        })),
      };

      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchMaterialRequests();
        toast.success("Material request submitted for Manager approval!");
        setSelectedPlanItems(kotRecipes.length > 0 ? [{ recipeId: kotRecipes[0].id, plannedQty: 10 }] : []);
        setRequestNotes("");
        setActiveTab("deliveries");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to submit material request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit material request: " + err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Accept Materials from Storekeeper
  const handleAcceptMaterials = async (req) => {
    setAcceptingId(req.id);
    try {
      // Update MPC Store Inventory with accepted items
      setMpcStoreInventory((prev) => {
        const updated = [...prev];
        (req.items || []).forEach((item) => {
          const qty = Number(item.issuedQty ?? item.requestedQty);
          const existing = updated.find((inv) => inv.rawMaterialId === item.rawMaterialId);
          if (existing) {
            existing.quantity = Number((existing.quantity + qty).toFixed(2));
          } else {
            updated.push({
              rawMaterialId: item.rawMaterialId,
              materialName: item.rawMaterialName,
              quantity: qty,
              unit: item.unitOfMeasure,
            });
          }
        });
        return updated;
      });

      // Also dispatch event to update global POS shared inventory state
      const event = new CustomEvent("mpc_stock_updated", {
        detail: {
          items: req.items,
        },
      });
      window.dispatchEvent(event);

      // Update status in list
      setMaterialRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "RECEIVED" } : r))
      );

      toast.success("Materials accepted into MPC Store Inventory!");
    } catch (err) {
      toast.error("Failed to accept materials: " + err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  // Calculate potential servings from current store stock
  const calculatePotentialYield = (recipe) => {
    let maxServings = Infinity;
    recipe.bom.forEach((ingredient) => {
      const storeItem = mpcStoreInventory.find((inv) => inv.rawMaterialId === ingredient.rawMaterialId);
      if (!storeItem || storeItem.quantity <= 0) {
        maxServings = 0;
      } else {
        const possible = Math.floor(storeItem.quantity / ingredient.qtyPerUnit);
        if (possible < maxServings) maxServings = possible;
      }
    });
    return maxServings === Infinity ? 0 : maxServings;
  };

  return (
    <div className="flex min-h-screen bg-[#F0F1F3]">
      <Toaster position="top-right" />
      <MPCWorkerSideBar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        issuedCount={materialRequests.filter((r) => r.status === "ISSUED").length}
        pendingKotCount={kots.filter((k) => k.status === "PENDING").length}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[22px] font-[700] text-[#383E49] mb-1">
              Mini Production Center (MPC) Worker Dashboard
            </h1>
            <p className="text-[14px] text-[#667085]">
              Welcome, <strong className="text-[#383E49]">{me?.firstName || me?.username || "MPC Worker"}</strong> | Assigned to:{" "}
              <strong className="text-[#0F50AA]">{me?.mpcName || "MPC Outlet Center"}</strong> (Outlet: {me?.outletName || "Main Outlet"})
            </p>
          </div>

          {/* TAB 1: KOT Material Request via BOM */}
          {activeTab === "requestMaterials" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                <h3 className="text-[18px] font-[600] text-[#383E49] mb-1">
                  Production Plan: Select KOT Items
                </h3>
                <p className="text-[13px] text-[#667085] mb-4">
                  Select KOT items (e.g. Milk Tea, Plain Tea) to auto-calculate raw material requirements using Bill of Materials (BOM).
                </p>

                {/* KOT Items Form */}
                <div className="space-y-3 mb-6">
                  {selectedPlanItems.map((item, idx) => {
                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-[#F8F9FA] border border-[#E4E6EA] rounded-lg">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[12px] font-[500] text-[#383E49] mb-1">KOT Product</label>
                          <select
                            value={item.recipeId}
                            onChange={(e) => updatePlanItem(idx, "recipeId", e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md text-[13px] bg-white focus:ring-2 focus:ring-[#0F50AA]"
                          >
                            {kotRecipes.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="block text-[12px] font-[500] text-[#383E49] mb-1">Target Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.plannedQty}
                            onChange={(e) => updatePlanItem(idx, "plannedQty", e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md text-[13px] bg-white focus:ring-2 focus:ring-[#0F50AA]"
                          />
                        </div>
                        {selectedPlanItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlanItem(idx)}
                            className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors mt-5"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addPlanItem}
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#0F50AA] font-[500] hover:underline"
                  >
                    <Plus size={15} /> Add Another KOT Item
                  </button>
                </div>

                {/* Auto-Calculated BOM Summary */}
                <div className="border border-[#0F50AA] bg-[#EBF8FF] rounded-lg p-5 mb-6">
                  <h4 className="text-[15px] font-[600] text-[#383E49] mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-[#0F50AA]" />
                    Auto-Calculated BOM Material Requirements
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {calculatedBOM.map((mat) => (
                      <div key={mat.rawMaterialId} className="bg-white border border-[#E4E6EA] rounded-lg p-3">
                        <p className="text-[12px] text-[#667085]">Raw Material</p>
                        <p className="text-[14px] font-[600] text-[#383E49]">{mat.materialName}</p>
                        <p className="text-[16px] font-[700] text-[#0F50AA] mt-1">
                          {mat.totalQty.toFixed(2)} {mat.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes & Submit */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                      Request Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Special instructions for Manager & Storekeeper..."
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md text-[13px] focus:ring-2 focus:ring-[#0F50AA]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitMaterialRequest}
                    disabled={submittingRequest}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-60"
                  >
                    {submittingRequest ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Submit Material Request to Manager
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Material Deliveries & Acceptance */}
          {activeTab === "deliveries" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Material Requests & Storekeeper Deliveries
                </h3>
                <button
                  onClick={fetchMaterialRequests}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E4E6EA] text-[#667085] text-[13px] rounded-lg hover:bg-[#F8F9FA]"
                >
                  <RefreshCw size={14} className={loadingRequests ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {materialRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-[#667085] mb-3" />
                  <p className="text-[16px] font-[500] text-[#383E49]">No material requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materialRequests.map((req) => (
                    <div key={req.id} className="border border-[#E4E6EA] rounded-lg p-5 hover:bg-[#F8F9FA] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-[16px] font-[600] text-[#383E49]">{req.requestCode}</h4>
                            {statusBadge(req.status)}
                          </div>
                          <p className="text-[12px] text-[#667085] mt-1">
                            MPC: {req.mpcName} | Outlet: {req.outletName} | Created: {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {req.status === "ISSUED" && (
                          <button
                            onClick={() => handleAcceptMaterials(req)}
                            disabled={acceptingId === req.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#199D26] text-white text-[13px] font-[500] rounded-lg hover:bg-[#157A1E] transition-colors disabled:opacity-60"
                          >
                            {acceptingId === req.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            Confirm &amp; Accept Materials
                          </button>
                        )}
                      </div>

                      {/* Items table */}
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[#E4E6EA] text-left text-[#667085]">
                            <th className="py-2">Raw Material</th>
                            <th className="py-2 text-center">Requested Qty</th>
                            <th className="py-2 text-center">Issued Qty</th>
                            <th className="py-2 text-center">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(req.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b border-[#E4E6EA] last:border-0">
                              <td className="py-2 font-[500] text-[#383E49]">{item.rawMaterialName}</td>
                              <td className="py-2 text-center">{item.requestedQty}</td>
                              <td className="py-2 text-center font-[600] text-[#0F50AA]">{item.issuedQty ?? item.requestedQty}</td>
                              <td className="py-2 text-center text-[#667085]">{item.unitOfMeasure}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MPC Store Inventory */}
          {activeTab === "storeInventory" && (
            <div className="space-y-6">
              {/* Raw Materials Inventory */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                <h3 className="text-[18px] font-[600] text-[#383E49] mb-4">
                  MPC Raw Material Stock Level
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {mpcStoreInventory.map((item) => (
                    <div key={item.rawMaterialId} className="border border-[#E4E6EA] rounded-lg p-4 bg-[#F8F9FA]">
                      <p className="text-[12px] text-[#667085]">Raw Material</p>
                      <p className="text-[15px] font-[600] text-[#383E49] mb-1">{item.materialName}</p>
                      <p className="text-[20px] font-[700] text-[#199D26]">
                        {item.quantity} <span className="text-[13px] font-[400] text-[#667085]">{item.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Yield Calculator */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                <h3 className="text-[18px] font-[600] text-[#383E49] mb-1">
                  Potential KOT Product Yield (Shared Ingredient Pool)
                </h3>
                <p className="text-[13px] text-[#667085] mb-4">
                  Calculated based on current raw material inventory at this Mini Production Center.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {kotRecipes.map((recipe) => {
                    const potential = calculatePotentialYield(recipe);
                    return (
                      <div key={recipe.id} className="border border-[#0F50AA] bg-[#EBF8FF] rounded-lg p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[16px] font-[600] text-[#383E49]">{recipe.name}</h4>
                          <span className="text-[11px] font-[500] px-2 py-0.5 rounded bg-[#0F50AA] text-white">
                            {recipe.code}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#667085] mb-3">
                          Recipe: {recipe.bom.map((b) => `${b.qtyPerUnit}${b.unit} ${b.materialName}`).join(", ")}
                        </p>
                        <div className="pt-2 border-t border-[#D0E2FF]">
                          <span className="text-[12px] text-[#667085]">Max Available Capacity:</span>
                          <p className="text-[22px] font-[700] text-[#0F50AA]">
                            {potential} <span className="text-[13px] font-[400] text-[#383E49]">cups / portions</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Live KOT Queue */}
          {activeTab === "kots" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-[600] text-[#383E49]">Received KOT Tickets</h3>
                <button
                  onClick={fetchKots}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E4E6EA] text-[#667085] text-[13px] rounded-lg hover:bg-[#F8F9FA]"
                >
                  <RefreshCw size={14} className={loadingKots ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {kots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-[#667085] mb-3" />
                  <p className="text-[16px] font-[500] text-[#383E49]">No KOTs queued at this station</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kots.map((kot) => (
                    <div key={kot.id} className="border border-[#E4E6EA] rounded-lg p-5 hover:bg-[#F8F9FA] transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-mono text-sm font-semibold text-[#0F50AA]">{kot.orderNumber}</span>
                          <span className="ml-3">{statusBadge(kot.status)}</span>
                        </div>
                        <span className="text-xs text-[#667085]">{new Date(kot.orderDate || Date.now()).toLocaleString()}</span>
                      </div>

                      <table className="w-full text-sm mb-4">
                        <thead>
                          <tr className="text-left text-xs text-[#667085] border-b">
                            <th className="pb-1">Item</th>
                            <th className="pb-1 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(kot.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-1.5 font-medium text-[#383E49]">{item.productName}</td>
                              <td className="py-1.5 text-right text-[#383E49]">{item.plannedQuantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
