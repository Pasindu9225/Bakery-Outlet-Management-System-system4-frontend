import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Calendar,
  Hash,
  ClipboardList,
  Truck,
} from "lucide-react";

import BakeryWorkerNavBar from "../component/BakeryWorkerNavBar.jsx";
import BakeryWorkerSideBar from "../component/BakeryWorkerSideBar.jsx";
import Loader from "../component/Loader.jsx";


const STATUS_META = {
  DISTRIBUTED: {
    label: "Distributed",
    color: "text-brand-fg bg-subtle",
    icon: <Truck size={14} />,
    dot: "bg-brand",
  },
  COMPLETED: {
    label: "Produced",
    color: "text-success bg-hover",
    icon: <CheckCircle size={14} />,
    dot: "bg-success-solid",
  }
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || { label: status, color: "text-fg-secondary bg-hover", icon: <Clock size={14} /> };

const progressPercent = (produced, total) =>
  total > 0 ? Math.min(100, Math.round((produced / total) * 100)) : 0;

function TaskDetailModal({ request, onClose }) {
  if (!request) return null;
  const meta = getStatusMeta(request.status);
  const pct = progressPercent(request.producedQty, request.totalQty);

  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-line flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-[600] text-fg">History Details</h3>
            <p className="text-[13px] text-fg-secondary mt-1">ID: {request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app rounded-lg transition-colors">
            <X size={20} className="text-fg-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-subtle to-subtle rounded-xl p-5 border border-line">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[11px] text-fg-secondary mb-1">Plan Name</p>
                <p className="text-[14px] font-[600] text-fg">{request.requestName}</p>
              </div>
              <div>
                <p className="text-[11px] text-fg-secondary mb-1">Date</p>
                <p className="text-[14px] font-[500] text-fg">
                  {new Date(request.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-fg-secondary mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-3 py-1 rounded-full ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-fg mb-3">Products</h4>
            <div className="border border-line rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-subtle border-b border-line">
                  <tr>
                    <th className="text-left py-3 px-4 text-[13px] font-[500]">Product</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500]">Produced</th>
                  </tr>
                </thead>
                <tbody>
                  {request.products.map((product, i) => (
                    <tr key={i} className="border-b border-line last:border-0 hover:bg-subtle">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="p-1.5 bg-warning/10 rounded-lg">
                          <Package size={14} className="text-warning" />
                        </div>
                        <span className="text-[13px] font-[500]">{product.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[13px] font-[600] text-success">{product.produced}</span>
                        <span className="text-[11px] text-fg-secondary ml-1">{product.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 border border-line text-fg-secondary text-[13px] font-[500] rounded-lg hover:bg-subtle">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BakeryProductionHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const token = localStorage.getItem("authToken");
      console.log(`[BakeryProductionHistory] Fetching history from ${baseUrl}/api/v1/worker/production-requests. Token: ${token ? 'present' : 'MISSING'}`);
      const res = await fetch(`${baseUrl}/api/v1/worker/production-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      
      const mapped = (data || [])
        .filter(p => p.status === "DISTRIBUTED")
        .map(p => ({
          id: p.id,
          requestName: p.planName,
          requestDate: p.planDate || p.createdAt,
          status: p.status,
          totalQty: p.totalQuantity,
          producedQty: p.producedQuantity || 0,
          products: (p.items || []).map(it => ({
            name: it.productName,
            produced: it.producedQuantity || 0,
            unit: it.unitOfMeasure || it.unit || "pcs"
          }))
        }));
      setRequests(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.requestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toString().includes(searchTerm)
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <BakeryWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <BakeryWorkerNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Production History" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg">Production History</h1>
            <p className="text-[14px] text-fg-secondary">View all distributed production tasks</p>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={18} />
              <input
                type="text"
                placeholder="Search history by plan name or ID..."
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            {loading ? (
               <Loader variant="section" text="Loading production history..." />
            ) : filteredRequests.length === 0 ? (
               <div className="text-center py-16"><ClipboardList size={40} className="mx-auto text-fg-secondary mb-4" /><p>No history records found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-fg-secondary">Date</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-fg-secondary">Plan Name</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-fg-secondary">Total Qty</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-fg-secondary">Status</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-fg-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-b border-line hover:bg-app cursor-pointer" onClick={() => { setSelectedRequest(r); setShowModal(true); }}>
                        <td className="py-4 px-2 text-[13px]">{new Date(r.requestDate).toLocaleDateString()}</td>
                        <td className="py-4 px-2 text-[13px] font-[600]">{r.requestName} <span className="text-[11px] text-fg-muted">#{r.id}</span></td>
                        <td className="py-4 px-2 text-center text-[13px] font-[700]">{r.totalQty}</td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2 py-0.5 rounded-full ${getStatusMeta(r.status).color}`}>
                            {getStatusMeta(r.status).icon} {getStatusMeta(r.status).label}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button className="p-1.5 bg-app text-fg-secondary rounded-lg hover:bg-line"><Eye size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      {showModal && selectedRequest && <TaskDetailModal request={selectedRequest} onClose={() => setShowModal(false)} />}
    </div>
  );
}
