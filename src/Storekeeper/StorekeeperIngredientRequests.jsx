import React, { useState, useEffect, useCallback } from "react";
import { friendlyError } from "../utils/friendlyError";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  X,
  ChevronDown,
  Hash,
  ClipboardList,
  Truck,
  Send,
  MoreHorizontal,
} from "lucide-react";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
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
    icon: <Truck size={12} />,
  },
  RECEIVED: {
    label: "Received",
    color: "text-brand-fg bg-subtle",
    icon: <CheckCircle size={12} />,
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || STATUS_META["PENDING"];

function IssueIngredientsModal({ request, onClose, onIssue, loading }) {
  const [issuedQtys, setIssuedQtys] = useState({});

  useEffect(() => {
    if (request?.items) {
      const initial = {};
      request.items.forEach((it) => {
        initial[it.id] = it.requestedQty;
      });
      setIssuedQtys(initial);
    }
  }, [request]);

  const handleQtyChange = (itemId, val) => {
    setIssuedQtys((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleIssue = () => {
    const items = Object.entries(issuedQtys).map(([id, qty]) => ({
      itemId: Number(id),
      issuedQty: Number(qty),
    }));
    onIssue(request.id, { items });
  };

  const isInvalid = request.items.some(it => issuedQtys[it.id] > it.availableQty);

  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-line flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-[600] text-fg">Issue Ingredients</h3>
            <p className="text-[13px] text-fg-secondary mt-1">Request ID: {request.id}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-app rounded-lg transition-colors">
            <X size={20} className="text-fg-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-subtle rounded-xl p-5 border border-line">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] text-fg-secondary mb-1">Production Center ID</p>
                  <p className="text-[14px] font-[600] text-fg">{request.productionCenterId}</p>
                </div>
                <div>
                  <p className="text-[12px] text-fg-secondary mb-1">Requested On</p>
                  <p className="text-[14px] font-[500] text-fg">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
             </div>
             {request.notes && (
               <div className="mt-4 pt-4 border-t border-line">
                 <p className="text-[12px] text-fg-secondary mb-1">Worker Notes</p>
                 <p className="text-[13px] text-fg italic">"{request.notes}"</p>
               </div>
             )}
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-fg mb-3">Requested Items</h4>
            <div className="border border-line rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-subtle border-b border-line">
                  <tr>
                    <th className="text-left py-3 px-4 text-[13px] font-[500]">Material</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500]">Available</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500]">Requested</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500]">Issue Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0 hover:bg-subtle">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="p-1.5 bg-brand/10 rounded-lg">
                          <Package size={14} className="text-brand-fg" />
                        </div>
                        <span className="text-[13px] font-[500]">{item.rawMaterialName}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[13px] font-[600] ${item.availableQty < item.requestedQty ? 'text-error' : 'text-success'}`}>
                          {item.availableQty} {item.unitOfMeasure}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-[13px] font-[600] text-fg">
                        {item.requestedQty} {item.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                           <input
                            type="number"
                            max={item.availableQty}
                            className={`w-24 px-2 py-1 border rounded text-center text-[13px] ${
                              (issuedQtys[item.id] > item.availableQty) ? 'border-error bg-error/10' : 'border-line'
                            }`}
                            value={issuedQtys[item.id] || ""}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                           />
                           {issuedQtys[item.id] > item.availableQty && (
                             <span className="text-[12px] text-error font-[500]">Exceeds Stock!</span>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle"
            >
              Cancel
            </button>
            <button
              onClick={handleIssue}
              disabled={loading || isInvalid}
              className="flex items-center gap-2 px-5 py-2.5 bg-success-solid text-on-brand text-[13px] font-[500] rounded-lg hover:bg-success-solid transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Confirm and Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorekeeperIngredientRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/storekeeper/ingredient-requests/pending`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load worker requests");
      const data = await res.json();
      setRequests(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleIssue = async (id, payload) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/storekeeper/ingredient-requests/${id}/issue`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errMessage = "Failed to issue ingredients";
        try {
          const errData = await res.json();
          errMessage = errData.message || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }
      toast.success("Ingredients issued successfully!");
      setShowIssueModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.id.toString().includes(searchTerm) ||
    (r.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <StorekeeperSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StorekeeperNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Worker Requests" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg">Worker Ingredient Requests</h1>
              <p className="text-[14px] text-fg-secondary">Process ingredient requests from Production Centers</p>
            </div>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-line text-fg-secondary rounded-lg hover:bg-subtle"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by Request ID or notes..."
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            {loading ? (
              <Loader variant="section" text="Loading ingredient requests..." />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList size={40} className="mx-auto text-fg-secondary mb-4" />
                <p className="text-[15px] font-[500] text-fg">No pending requests</p>
                <p className="text-[13px] text-fg-secondary">All worker ingredient requests have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((r) => {
                  const meta = getStatusMeta(r.status);
                  return (
                    <div key={r.id} className="border border-line rounded-xl p-5 hover:bg-subtle transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-brand/10 rounded-xl">
                            <ClipboardList size={24} className="text-brand-fg" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[16px] font-[600] text-fg">
                                  {r.notes && r.notes.startsWith("Auto-generated for Production Plan: ") 
                                    ? r.notes.replace("Auto-generated for Production Plan: ", "") 
                                    : `Request #${r.id}`}
                                </h4>
                                <span className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-2.5 py-1 rounded-full ${meta.color}`}>
                                  {meta.icon} {meta.label}
                                </span>
                            </div>
                            <p className="text-[13px] text-fg-secondary">
                              Production Center ID: {r.productionCenterId} • {new Date(r.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                             onClick={() => { setSelectedRequest(r); setShowIssueModal(true); }}
                             className="flex items-center gap-2 px-4 py-2 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover"
                           >
                             <Truck size={15} />
                             Issue Materials
                           </button>
                        </div>
                      </div>
                      {r.notes && (
                        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-[13px] text-warning italic">
                          "{r.notes}"
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {r.items.slice(0, 4).map((item, i) => (
                           <div key={i} className="text-[12px]">
                              <p className="text-fg-secondary truncate">{item.rawMaterialName}</p>
                              <p className="font-[600] text-fg">{item.requestedQty} {item.unitOfMeasure}</p>
                           </div>
                         ))}
                         {r.items.length > 4 && (
                           <div className="flex items-center text-[12px] text-fg-secondary">
                             <MoreHorizontal size={14} className="mr-1" /> +{r.items.length - 4} more
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {showIssueModal && selectedRequest && (
        <IssueIngredientsModal
          request={selectedRequest}
          onClose={() => setShowIssueModal(false)}
          onIssue={handleIssue}
          loading={submitting}
        />
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
