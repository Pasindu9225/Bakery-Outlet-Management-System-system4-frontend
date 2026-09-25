import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  RefreshCw,
  Layers,
  Trash2,
} from "lucide-react";
import MPCWorkerSideBar from "../component/MPCWorkerSideBar";
import toast from "react-hot-toast";

import { getApiBaseUrl } from "../utils/config";

const BASE_URL = getApiBaseUrl();

function statusBadge(status) {
  const map = {
    PENDING: "bg-warning/10 text-warning",
    PENDING_ADMIN: "bg-warning/10 text-warning",
    APPROVED: "bg-success/10 text-success",
    COMPLETED: "bg-success/10 text-success",
    CANCELLED: "bg-error/10 text-error",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        map[status] || "bg-hover text-fg"
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

  // KOT-enabled products, for the "which dish" dropdown on the request form
  const [kotProducts, setKotProducts] = useState([]);

  // Request form state
  const [selectedPlanItems, setSelectedPlanItems] = useState([{ productId: "", plates: 10 }]);
  const [requestNotes, setRequestNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [previewLines, setPreviewLines] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Requests history state
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // MPC store state (real data: stock + BOM-predicted plates)
  const [store, setStore] = useState({ items: [], dishes: [] });
  const [loadingStore, setLoadingStore] = useState(false);

  // KOTs state
  const [kots, setKots] = useState([]);
  const [loadingKots, setLoadingKots] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch current user
  useEffect(() => {
    fetch(`${BASE_URL}/bmsauth/me`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data || null))
      .catch(() => setMe(null));
  }, [token]);

  // Fetch KOT-enabled products for the request form's dropdown
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/v1/admin/product/all`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then((products) => {
        const list = Array.isArray(products) ? products : [];
        const kotOnly = list.filter((p) => p.isKotEnabled === true || p.kotEnabled === true);
        setKotProducts((kotOnly.length > 0 ? kotOnly : list).map((p) => ({
          id: p.id,
          name: p.productName || p.name || `Product ${p.id}`,
          code: p.productCode || p.code || `PROD-${p.id}`,
        })));
      })
      .catch(() => setKotProducts([]));
  }, [token]);

  const fetchKots = useCallback(async () => {
    setLoadingKots(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/kots`, { headers: authHeaders });
      setKots(res.ok ? await res.json() : []);
    } catch {
      setKots([]);
    } finally {
      setLoadingKots(false);
    }
  }, [token]);

  const fetchMaterialRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests`, { headers: authHeaders });
      setMaterialRequests(res.ok ? await res.json() : []);
    } catch {
      setMaterialRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [token]);

  const fetchStore = useCallback(async () => {
    setLoadingStore(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-store`, { headers: authHeaders });
      setStore(res.ok ? await res.json() : { items: [], dishes: [] });
    } catch {
      setStore({ items: [], dishes: [] });
    } finally {
      setLoadingStore(false);
    }
  }, [token]);

  useEffect(() => {
    fetchKots();
    fetchMaterialRequests();
    fetchStore();
  }, [fetchKots, fetchMaterialRequests, fetchStore]);

  // Ask the backend how much raw material the current dish selection actually needs (real BOM
  // traversal, including semi-finished components) — recomputed whenever the selection changes.
  useEffect(() => {
    const products = selectedPlanItems.filter((i) => i.productId && Number(i.plates) > 0);
    if (products.length === 0 || !token) {
      setPreviewLines([]);
      return;
    }
    const controller = new AbortController();
    setPreviewLoading(true);
    fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests/preview`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        products: products.map((p) => ({ productId: Number(p.productId), plates: Number(p.plates) })),
      }),
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((lines) => setPreviewLines(Array.isArray(lines) ? lines : []))
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
    return () => controller.abort();
  }, [JSON.stringify(selectedPlanItems), token]);

  const addPlanItem = () => {
    setSelectedPlanItems((prev) => [...prev, { productId: kotProducts[0]?.id || "", plates: 10 }]);
  };

  const removePlanItem = (idx) => {
    setSelectedPlanItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePlanItem = (idx, field, value) => {
    setSelectedPlanItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const handleSubmitMaterialRequest = async () => {
    const products = selectedPlanItems.filter((i) => i.productId && Number(i.plates) > 0);
    if (products.length === 0) {
      toast.error("Select at least one KOT dish and a quantity.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: requestNotes,
          products: products.map((p) => ({ productId: Number(p.productId), plates: Number(p.plates) })),
        }),
      });

      if (res.ok) {
        await fetchMaterialRequests();
        toast.success("Material request submitted for Admin approval!");
        setSelectedPlanItems([{ productId: kotProducts[0]?.id || "", plates: 10 }]);
        setRequestNotes("");
        setActiveTab("deliveries");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to submit material request.");
      }
    } catch (err) {
      toast.error("Failed to submit material request: " + err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app">
      <MPCWorkerSideBar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingKotCount={kots.filter((k) => k.status === "PENDING").length}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[22px] font-[700] text-fg mb-1">
              Mini Production Center (MPC) Worker Dashboard
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Welcome, <strong className="text-fg">{me?.firstName || me?.username || "MPC Worker"}</strong> | Assigned to:{" "}
              <strong className="text-brand-fg">{me?.mpcName || "MPC Outlet Center"}</strong> (Outlet: {me?.outletName || "Main Outlet"})
            </p>
          </div>

          {/* TAB 1: KOT Material Request via BOM */}
          {activeTab === "requestMaterials" && (
            <div className="space-y-6">
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-1">
                  Request Materials: Select KOT Items
                </h3>
                <p className="text-[13px] text-fg-secondary mb-4">
                  Select dishes on this MPC's menu (e.g. Milk Tea, Plain Tea) — raw material
                  requirements are computed from the Bill of Materials automatically.
                </p>

                <div className="space-y-3 mb-6">
                  {selectedPlanItems.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-subtle border border-line rounded-lg">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[12px] font-[500] text-fg mb-1">KOT Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updatePlanItem(idx, "productId", e.target.value)}
                          className="w-full px-3 py-2 border border-line rounded-md text-[13px] bg-surface focus:ring-2 focus:ring-brand-fg"
                        >
                          <option value="">-- Choose a product --</option>
                          {kotProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-[12px] font-[500] text-fg mb-1">Plates</label>
                        <input
                          type="number"
                          min="1"
                          value={item.plates}
                          onChange={(e) => updatePlanItem(idx, "plates", e.target.value)}
                          className="w-full px-3 py-2 border border-line rounded-md text-[13px] bg-surface focus:ring-2 focus:ring-brand-fg"
                        />
                      </div>
                      {selectedPlanItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlanItem(idx)}
                          className="p-2 text-error hover:bg-hover rounded-lg transition-colors mt-5"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPlanItem}
                    className="inline-flex items-center gap-1.5 text-[13px] text-brand-fg font-[500] hover:underline"
                  >
                    <Plus size={15} /> Add Another KOT Item
                  </button>
                </div>

                <div className="border border-brand-fg bg-hover rounded-lg p-5 mb-6">
                  <h4 className="text-[15px] font-[600] text-fg mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-brand-fg" />
                    Raw Materials This Will Request
                    {previewLoading && <RefreshCw size={14} className="animate-spin text-brand-fg" />}
                  </h4>
                  {previewLines.length === 0 ? (
                    <p className="text-[13px] text-fg-secondary">
                      Choose a product on this MPC's menu to see the materials it needs.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {previewLines.map((mat) => (
                        <div key={mat.materialKey} className="bg-surface border border-line rounded-lg p-3">
                          <p className="text-[12px] text-fg-secondary">Raw Material</p>
                          <p className="text-[14px] font-[600] text-fg">{mat.rawMaterialName}</p>
                          <p className="text-[16px] font-[700] text-brand-fg mt-1">
                            {Number(mat.qty).toFixed(2)} {mat.unitOfMeasure}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1">
                      Request Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Special instructions for Admin..."
                      className="w-full px-3 py-2 border border-line rounded-md text-[13px] focus:ring-2 focus:ring-brand-fg"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitMaterialRequest}
                    disabled={submittingRequest}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-on-brand text-[14px] font-[500] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-60"
                  >
                    {submittingRequest ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Submit Material Request to Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Material Request History */}
          {activeTab === "deliveries" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-[600] text-fg">
                  Material Requests
                </h3>
                <button
                  onClick={fetchMaterialRequests}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-line text-fg-secondary text-[13px] rounded-lg hover:bg-subtle"
                >
                  <RefreshCw size={14} className={loadingRequests ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {materialRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-fg-secondary mb-3" />
                  <p className="text-[16px] font-[500] text-fg">No material requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materialRequests.map((req) => (
                    <div key={req.id} className="border border-line rounded-lg p-5 hover:bg-subtle transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-[16px] font-[600] text-fg">{req.requestCode}</h4>
                            {statusBadge(req.status)}
                          </div>
                          <p className="text-[12px] text-fg-secondary mt-1">
                            MPC: {req.mpcName} | Outlet: {req.outletName} | Created: {req.createdAt ? new Date(req.createdAt).toLocaleString() : "-"}
                          </p>
                          {req.status === "APPROVED" && (
                            <p className="text-[12px] text-success mt-1 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Delivered to your MPC store
                            </p>
                          )}
                        </div>
                      </div>

                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-line text-left text-fg-secondary">
                            <th className="py-2">Raw Material</th>
                            <th className="py-2 text-center">Requested Qty</th>
                            <th className="py-2 text-center">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(req.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b border-line last:border-0">
                              <td className="py-2 font-[500] text-fg">{item.rawMaterialName}</td>
                              <td className="py-2 text-center font-[600] text-brand-fg">{item.requestedQty}</td>
                              <td className="py-2 text-center text-fg-secondary">{item.unitOfMeasure}</td>
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

          {/* TAB 3: MPC Store Inventory (real data) */}
          {activeTab === "storeInventory" && (
            <div className="space-y-6">
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-[600] text-fg">
                    MPC Raw Material Stock Level
                  </h3>
                  <button
                    onClick={fetchStore}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-line text-fg-secondary text-[13px] rounded-lg hover:bg-subtle"
                  >
                    <RefreshCw size={14} className={loadingStore ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
                {store.items.length === 0 ? (
                  <p className="text-[13px] text-fg-secondary">No stock yet — approved material requests arrive here automatically.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {store.items.map((item) => (
                      <div key={item.materialKey} className="border border-line rounded-lg p-4 bg-subtle">
                        <p className="text-[12px] text-fg-secondary">Raw Material</p>
                        <p className="text-[15px] font-[600] text-fg mb-1">{item.rawMaterialName}</p>
                        <p className="text-[20px] font-[700] text-success">
                          {item.qty} <span className="text-[13px] font-[400] text-fg-secondary">{item.unitOfMeasure}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-1">
                  Potential KOT Product Yield
                </h3>
                <p className="text-[13px] text-fg-secondary mb-4">
                  Calculated from this MPC's current raw material stock and the Bill of Materials.
                </p>

                {store.dishes.length === 0 ? (
                  <p className="text-[13px] text-fg-secondary">
                    No dishes assigned to this MPC's menu yet — ask Admin to set it up.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {store.dishes.map((dish) => (
                      <div key={dish.productId} className="border border-brand-fg bg-hover rounded-lg p-5">
                        <h4 className="text-[16px] font-[600] text-fg mb-2">{dish.productName}</h4>
                        {dish.problem ? (
                          <p className="text-[12px] text-error">{dish.problem}</p>
                        ) : (
                          <div className="pt-2 border-t border-brand/20">
                            <span className="text-[12px] text-fg-secondary">Max Available Capacity:</span>
                            <p className="text-[22px] font-[700] text-brand-fg">
                              {dish.plates} <span className="text-[13px] font-[400] text-fg">plates</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Live KOT Queue */}
          {activeTab === "kots" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-[600] text-fg">Received KOT Tickets</h3>
                <button
                  onClick={fetchKots}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-line text-fg-secondary text-[13px] rounded-lg hover:bg-subtle"
                >
                  <RefreshCw size={14} className={loadingKots ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {kots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-fg-secondary mb-3" />
                  <p className="text-[16px] font-[500] text-fg">No KOTs queued at this station</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kots.map((kot) => (
                    <div key={kot.id} className="border border-line rounded-lg p-5 hover:bg-subtle transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-mono text-sm font-semibold text-brand-fg">{kot.orderNumber}</span>
                          <span className="ml-3">{statusBadge(kot.status)}</span>
                        </div>
                        <span className="text-xs text-fg-secondary">{new Date(kot.orderDate || Date.now()).toLocaleString()}</span>
                      </div>

                      <table className="w-full text-sm mb-4">
                        <thead>
                          <tr className="text-left text-xs text-fg-secondary border-b">
                            <th className="pb-1">Item</th>
                            <th className="pb-1 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(kot.items || []).map((item, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-1.5 font-medium text-fg">{item.productName}</td>
                              <td className="py-1.5 text-right text-fg">{item.plannedQuantity}</td>
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
