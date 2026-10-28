import React, { useCallback, useEffect, useState } from "react";
import { Check, ClipboardCheck, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import axiosInstance from "../services/api";
import { friendlyError } from "../utils/friendlyError";
import { EntryTable, ConfirmModal, DismissModal } from "../Admin/AdminWastage.jsx";

const WASTAGE_API = "/api/v1/wastage/manager";
const isPending = (a) => String(a.status || "").toUpperCase() === "PENDING";
const num = (v) => (v === null || v === undefined ? "—" : Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 }));
const REASONS = { DAMAGE: "Damage", LOSS: "Loss", COUNTING_ERROR: "Counting error", EXPIRED: "Expired", OTHER: "Other" };

/**
 * Manager > Approvals: stock adjustments from the storekeeper (main store and the kitchen/bakery/MPC stores) and
 * wastage in the stores. POS and production wastage stay with the Admin.
 */
export default function ManagerApprovals() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState("adjustments");
  const [adjustments, setAdjustments] = useState([]);
  const [wastage, setWastage] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [dismissEntry, setDismissEntry] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [adj, wst] = await Promise.all([
        axiosInstance.get("/STK/v1/stock-adjustments"),
        axiosInstance.get(`${WASTAGE_API}/entries`, { params: { status: "PENDING" } }),
      ]);
      setAdjustments((adj.data || []).filter(isPending));
      setWastage(wst.data || []);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Could not load the approvals." }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    axiosInstance.get("/api/v1/wastage/reasons").then((r) => setReasons(r.data || [])).catch(() => setReasons([]));
  }, [refresh]);

  const decide = async (adj, approve) => {
    setBusyId(adj.id);
    try {
      await axiosInstance.put("/api/manager/stock-adjustments/approval", {
        stockAdjustmentId: adj.id,
        status: approve ? "APPROVED" : "REJECTED",
        approverId: localStorage.getItem("userId"),
        remarks: approve ? "Approved by the Manager" : "Rejected by the Manager",
      });
      toast.success(`${adj.rawMaterialName}: adjustment ${approve ? "approved" : "rejected"}`);
      refresh();
    } catch (err) {
      toast.error(friendlyError(err, { fallback: "Could not save it." }));
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: "adjustments", label: "Stock Adjustments", icon: ClipboardCheck, count: adjustments.length },
    { id: "wastage", label: "Store Wastage", icon: Trash2, count: wastage.length },
  ];

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Approvals" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">Approvals</h1>
            <p className="text-[14px] text-fg-secondary">
              Stock adjustments and wastage from the stores (main, kitchen, bakery and MPC stores). Stock only changes once you approve.
            </p>
          </div>

          <div className="flex gap-4 border-b border-line mb-6" role="tablist">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  tab === id ? "border-brand-fg text-brand-fg" : "border-transparent text-fg-secondary hover:text-fg"}`}>
                <Icon size={16} /> {label}{count > 0 ? ` (${count})` : ""}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader variant="section" text="Loading approvals..." />
          ) : error ? (
            <div className="bg-surface rounded-xl border border-line p-8 text-center">
              <p className="text-[14px] text-error mb-3">{error}</p>
              <button onClick={() => { setLoading(true); refresh(); }}
                className="px-4 py-2 rounded-lg bg-brand text-on-brand text-[13px] font-[600] hover:bg-brand-hover">Retry</button>
            </div>
          ) : tab === "adjustments" ? (
            adjustments.length === 0 ? (
              <div className="bg-surface rounded-xl border border-line p-10 text-center text-[14px] text-fg-secondary">No stock adjustments waiting.</div>
            ) : (
              <div className="bg-surface rounded-xl border border-line shadow-sm overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="border-b border-line bg-subtle">
                      {["Item (store)", "In stock", "Change", "After", "Reason", "Requested by", ""].map((h, i) => (
                        <th key={i} className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map((a) => (
                      <tr key={a.id} className="border-b border-line align-top">
                        <td className="py-3 px-4">
                          <p className="text-[13px] font-[600] text-fg-strong">{a.rawMaterialName}</p>
                          <p className="text-[12px] text-fg-muted">#{a.id} · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</p>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-fg">{num(a.beforeQuantity)}</td>
                        <td className={`py-3 px-4 text-[13px] font-[700] ${Number(a.changeQuantity) < 0 ? "text-error" : "text-success"}`}>
                          {Number(a.changeQuantity) > 0 ? "+" : ""}{num(a.changeQuantity)}
                        </td>
                        <td className="py-3 px-4 text-[13px] text-fg">{num(Number(a.beforeQuantity || 0) + Number(a.changeQuantity || 0))}</td>
                        <td className="py-3 px-4">
                          <p className="text-[13px] text-fg">{REASONS[a.reasonForAdjust] || a.reasonForAdjust}</p>
                          {a.remarks && <p className="text-[12px] text-fg-muted max-w-[240px]">{a.remarks}</p>}
                        </td>
                        <td className="py-3 px-4 text-[13px] text-fg">{String(a.addedByName || "").replace(/s*null$/, "")}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button onClick={() => decide(a, true)} disabled={busyId === a.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-success-solid text-on-brand rounded-lg text-[13px] font-[600] disabled:opacity-50">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => decide(a, false)} disabled={busyId === a.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-surface border border-line-strong text-fg rounded-lg text-[13px] font-[600] hover:bg-subtle disabled:opacity-50">
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <EntryTable rows={wastage} empty="No store wastage waiting." pending onConfirm={setConfirmEntry} onDismiss={setDismissEntry} />
          )}

          {confirmEntry && (
            <ConfirmModal entry={confirmEntry} reasons={reasons} api={WASTAGE_API}
              onClose={() => setConfirmEntry(null)}
              onDone={(msg) => { setConfirmEntry(null); toast.success(msg); refresh(); }}
              onError={(msg) => toast.error(msg)} />
          )}
          {dismissEntry && (
            <DismissModal entry={dismissEntry} api={WASTAGE_API}
              onClose={() => setDismissEntry(null)}
              onDone={(msg) => { setDismissEntry(null); toast.success(msg); refresh(); }}
              onError={(msg) => toast.error(msg)} />
          )}
        </main>
      </div>
    </div>
  );
}
