import React, { useCallback, useEffect, useState } from "react";
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AdminNavBar from "../component/AdminNavBar";
import AdminSidebar from "../component/AdminSidebar";
import { getApiBaseUrl } from "../utils/config";

const BASE_URL = getApiBaseUrl();

function statusBadge(status) {
  const map = {
    PENDING_ADMIN: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
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

export default function AdminMpcRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const token = localStorage.getItem("authToken");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/mpc-material-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.ok ? await res.json() : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const act = async (id, action) => {
    setActingId(id);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/mpc-material-requests/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(action === "approve" ? "Approved — materials delivered to the MPC store." : "Request rejected.");
        await fetchRequests();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || `Failed to ${action} request.`);
      }
    } catch (err) {
      toast.error(`Failed to ${action} request: ${err.message}`);
    } finally {
      setActingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING_ADMIN");
  const decided = requests.filter((r) => r.status !== "PENDING_ADMIN");

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <Toaster position="top-right" />
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection="MPC Material Requests"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-[600] text-[#383E49] flex items-center gap-2">
                <Layers size={22} className="text-[#0F50AA]" />
                MPC Material Requests
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Approving a request deducts the raw materials from stock and delivers them straight
                into that MPC's store — there is no separate issuing step.
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E4E6EA] text-[#667085] text-[13px] rounded-lg hover:bg-white bg-white"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-6 mb-6">
            <h2 className="text-[16px] font-[600] text-[#383E49] mb-4">
              Awaiting your decision ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="text-center py-10 text-[#667085]">
                <Package size={40} className="mx-auto mb-2" />
                No pending MPC material requests.
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((req) => (
                  <div key={req.id} className="border border-[#E4E6EA] rounded-lg p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-[15px] font-[600] text-[#383E49]">{req.requestCode}</h3>
                          {statusBadge(req.status)}
                        </div>
                        <p className="text-[12px] text-[#667085] mt-1">
                          MPC: {req.mpcName} | Outlet: {req.outletName} | Requested by: {req.requestedByName} |{" "}
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}
                        </p>
                        {req.notes && (
                          <p className="text-[12px] text-[#383E49] mt-1 italic">"{req.notes}"</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(req.id, "approve")}
                          disabled={actingId === req.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#199D26] text-white text-[13px] font-[500] rounded-lg hover:bg-[#157A1E] disabled:opacity-60"
                        >
                          <CheckCircle2 size={15} /> Approve
                        </button>
                        <button
                          onClick={() => act(req.id, "reject")}
                          disabled={actingId === req.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white text-[13px] font-[500] rounded-lg hover:bg-[#DC2626] disabled:opacity-60"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#E4E6EA] text-left text-[#667085]">
                          <th className="py-2">Raw Material</th>
                          <th className="py-2 text-center">Requested</th>
                          <th className="py-2 text-center">In Stock</th>
                          <th className="py-2 text-center">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(req.items || []).map((item) => {
                          const short = item.availableQty != null && item.availableQty < item.requestedQty;
                          return (
                            <tr key={item.id} className="border-b border-[#E4E6EA] last:border-0">
                              <td className="py-2 font-[500] text-[#383E49]">{item.rawMaterialName}</td>
                              <td className="py-2 text-center">{item.requestedQty}</td>
                              <td className={`py-2 text-center font-[600] ${short ? "text-[#EF4444]" : "text-[#199D26]"}`}>
                                {item.availableQty ?? "-"}
                                {short && <AlertTriangle size={12} className="inline ml-1 mb-0.5" />}
                              </td>
                              <td className="py-2 text-center text-[#667085]">{item.unitOfMeasure}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(req.products || []).length > 0 && (
                      <p className="text-[12px] text-[#667085] mt-2">
                        For: {req.products.map((p) => `${p.plates} × ${p.productName}`).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-6">
            <h2 className="text-[16px] font-[600] text-[#383E49] mb-4">History</h2>
            {decided.length === 0 ? (
              <p className="text-[13px] text-[#667085]">No decided requests yet.</p>
            ) : (
              <div className="space-y-2">
                {decided.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between border border-[#E4E6EA] rounded-lg px-4 py-2.5"
                  >
                    <div>
                      <span className="text-[13px] font-[500] text-[#383E49]">{req.requestCode}</span>
                      <span className="text-[12px] text-[#667085] ml-3">
                        {req.mpcName} — {req.outletName}
                      </span>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
