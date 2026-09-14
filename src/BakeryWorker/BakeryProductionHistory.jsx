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
    color: "text-[#0F50AA] bg-[#F0F8FF]",
    icon: <Truck size={14} />,
    dot: "bg-[#0F50AA]",
  },
  COMPLETED: {
    label: "Produced",
    color: "text-[#199D26] bg-[#F0FDF4]",
    icon: <CheckCircle size={14} />,
    dot: "bg-[#199D26]",
  }
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || { label: status, color: "text-gray-600 bg-gray-100", icon: <Clock size={14} /> };

const progressPercent = (produced, total) =>
  total > 0 ? Math.min(100, Math.round((produced / total) * 100)) : 0;

function TaskDetailModal({ request, onClose }) {
  if (!request) return null;
  const meta = getStatusMeta(request.status);
  const pct = progressPercent(request.producedQty, request.totalQty);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E4E6EA] flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-[600] text-[#383E49]">History Details</h3>
            <p className="text-[13px] text-[#667085] mt-1">ID: {request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors">
            <X size={20} className="text-[#667085]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-[#F8F9FA] to-[#F8F9FA] rounded-xl p-5 border border-[#E4E6EA]">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Plan Name</p>
                <p className="text-[14px] font-[600] text-[#383E49]">{request.requestName}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Date</p>
                <p className="text-[14px] font-[500] text-[#383E49]">
                  {new Date(request.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-3 py-1 rounded-full ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-[#383E49] mb-3">Products</h4>
            <div className="border border-[#E4E6EA] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                  <tr>
                    <th className="text-left py-3 px-4 text-[13px] font-[500]">Product</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500]">Produced</th>
                  </tr>
                </thead>
                <tbody>
                  {request.products.map((product, i) => (
                    <tr key={i} className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA]">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="p-1.5 bg-orange-100 rounded-lg">
                          <Package size={14} className="text-orange-600" />
                        </div>
                        <span className="text-[13px] font-[500]">{product.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[13px] font-[600] text-[#199D26]">{product.produced}</span>
                        <span className="text-[11px] text-[#667085] ml-1">{product.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA]">
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
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <BakeryWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <BakeryWorkerNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Production History" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-[#383E49]">Production History</h1>
            <p className="text-[14px] text-[#667085]">View all distributed production tasks</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
              <input
                type="text"
                placeholder="Search history by plan name or ID..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            {loading ? (
               <Loader variant="section" text="Loading production history..." />
            ) : filteredRequests.length === 0 ? (
               <div className="text-center py-16"><ClipboardList size={40} className="mx-auto text-[#667085] mb-4" /><p>No history records found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Date</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Plan Name</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Total Qty</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Status</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-b border-[#E4E6EA] hover:bg-[#F0F1F3] cursor-pointer" onClick={() => { setSelectedRequest(r); setShowModal(true); }}>
                        <td className="py-4 px-2 text-[13px]">{new Date(r.requestDate).toLocaleDateString()}</td>
                        <td className="py-4 px-2 text-[13px] font-[600]">{r.requestName} <span className="text-[11px] text-gray-400">#{r.id}</span></td>
                        <td className="py-4 px-2 text-center text-[13px] font-[700]">{r.totalQty}</td>
                        <td className="py-4 px-2 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-[500] px-2 py-0.5 rounded-full ${getStatusMeta(r.status).color}`}>
                            {getStatusMeta(r.status).icon} {getStatusMeta(r.status).label}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button className="p-1.5 bg-[#F0F1F3] text-[#667085] rounded-lg hover:bg-[#E4E6EA]"><Eye size={14} /></button>
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
