import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  X,
  ChevronDown,
  Calendar,
  Hash,
  PauseCircle,
  ClipboardList,
  ChefHat,
} from "lucide-react";

import KitchenWorkerNavBar from "../component/KitchenWorkerNavBar.jsx";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar.jsx";
import Loader from "../component/Loader.jsx";

const STATUS_META = {
  PENDING: {
    label: "Pending",
    color: "text-[#667085] bg-[#F0F1F3]",
    icon: <Clock size={14} />,
  },
  SUBMITTED: {
    label: "Pending",
    color: "text-[#667085] bg-[#F0F1F3]",
    icon: <Clock size={14} />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-[#667085] bg-[#F1F9F1]",
    icon: <CheckCircle size={14} className="text-[#199D26]" />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-[#1366D9] bg-[#F0F8FF]",
    icon: <PlayCircle size={14} />,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-[#199D26] bg-[#F0FDF4]",
    icon: <CheckCircle size={14} />,
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] || STATUS_META["PENDING"];

const progressPercent = (produced, total) =>
  total > 0 ? Math.min(100, Math.round((produced / total) * 100)) : 0;

function TaskDetailModal({ request, onClose, onUpdateStatus }) {
  const navigate = useNavigate();
  if (!request) return null;
  const meta = getStatusMeta(request.status);
  const pct = progressPercent(request.producedQty, request.totalQty);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E4E6EA] flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-[600] text-[#383E49]">Task Details</h3>
            <p className="text-[13px] text-[#667085] mt-1">ID: {request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#667085]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Card */}
          <div className="bg-[#F8F9FA] rounded-xl p-5 border border-[#E4E6EA]">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Request Name</p>
                <p className="text-[14px] font-[600] text-[#383E49]">{request.requestName}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Requested Date</p>
                <p className="text-[14px] font-[500] text-[#383E49]">
                  {new Date(request.requestDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-3 py-1 rounded-full ${meta.color}`}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-[#667085] mb-1">Created By</p>
                <p className="text-[14px] font-[500] text-[#383E49]">{request.createdBy || "Manager"}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#667085]">Overall Progress</span>
                <span className="text-[13px] font-[600] text-[#383E49]">
                  {request.producedQty} / {request.totalQty} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-[#E4E6EA] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    pct === 100 ? "bg-[#199D26]" : pct > 0 ? "bg-[#0F50AA]" : "bg-[#E4E6EA]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <h4 className="text-[16px] font-[600] text-[#383E49] mb-3">Products</h4>
            <div className="border border-[#E4E6EA] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                    <th className="text-left py-3 px-4 text-[13px] font-[500] text-[#383E49]">Product</th>
                    <th className="text-left py-3 px-4 text-[13px] font-[500] text-[#383E49]">Category</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500] text-[#383E49]">Required</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500] text-[#383E49]">Prepared</th>
                    <th className="text-center py-3 px-4 text-[13px] font-[500] text-[#383E49]">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {request.products.map((product, i) => {
                    const remaining = Math.max(0, product.quantity - product.produced);
                    const hasChildren = product.children && product.children.length > 0;
                    return (
                      <React.Fragment key={i}>
                        <tr className="border-b border-[#E4E6EA] last:border-0 hover:bg-[#F8F9FA]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-amber-100 rounded-lg">
                                <ChefHat size={14} className="text-amber-600" />
                              </div>
                              <div>
                                <span className="text-[13px] font-[600] text-[#383E49]">
                                  {product.name}
                                </span>
                                {product.isBlocked && (
                                  <span className="ml-2 px-2 py-0.5 text-[10px] font-[600] bg-red-50 text-red-600 border border-red-200 rounded-md">
                                    Blocked ({product.uncompletedChildCount} sub-assemblies pending)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-[#667085] bg-[#F0F1F3] px-2 py-0.5 rounded-full">
                              {product.category || "Kitchen"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[13px] font-[600] text-[#383E49]">
                              {product.quantity}
                            </span>
                            <span className="text-[11px] text-[#667085] ml-1">{product.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[13px] font-[600] text-[#199D26]">
                              {product.produced}
                            </span>
                            <span className="text-[11px] text-[#667085] ml-1">{product.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[13px] font-[600] ${
                                remaining === 0 ? "text-[#199D26]" : "text-[#F4A100]"
                              }`}
                            >
                              {remaining}
                            </span>
                            <span className="text-[11px] text-[#667085] ml-1">{product.unit}</span>
                          </td>
                        </tr>

                        {/* Render Sub-assemblies */}
                        {hasChildren &&
                          product.children.map((child, cIdx) => {
                            const childRemaining = Math.max(0, child.quantity - child.produced);
                            return (
                              <tr key={`kchild-${i}-${cIdx}`} className="bg-amber-50/40 border-b border-[#E4E6EA]">
                                <td className="py-2.5 px-4 pl-10" colSpan={2}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#667085]">↳</span>
                                    <span className="text-[12px] font-[500] text-amber-900">
                                      {child.name}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-[600] bg-amber-100 text-amber-800">
                                      {child.productionCenterName || "Kitchen Center"}
                                    </span>
                                    {child.miniStoreFulfilled || (child.reservedFromMiniStore && child.reservedFromMiniStore > 0) ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-[600] bg-blue-100 text-blue-800 border border-blue-200">
                                        📦 In Mini Store ({child.reservedFromMiniStore} {child.unit} reserved)
                                      </span>
                                    ) : child.isCompleted ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-[600] bg-emerald-100 text-emerald-700">
                                        ✅ Prepared
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-[600] bg-purple-100 text-purple-700">
                                        ⏳ In Progress
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-center text-[12px] text-[#667085]">
                                  {child.quantity} {child.unit || "pcs"}
                                </td>
                                <td className="py-2.5 px-4 text-center text-[12px] font-[600] text-emerald-600">
                                  {child.produced} {child.unit || "pcs"}
                                </td>
                                <td className="py-2.5 px-4 text-center text-[12px] text-[#667085]">
                                  {childRemaining} {child.unit || "pcs"}
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          {request.ingredientsConfirmed === false && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[13px] flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Ingredients Not Accepted:</strong> You must confirm receipt of issued ingredients in the <strong>"Get Ingredients"</strong> tab before starting or processing this task.
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            {["PENDING", "SUBMITTED", "APPROVED", "IN_PROGRESS"].includes(request.status?.toUpperCase()) && pct < 100 && (
              <button
                onClick={() => {
                  if (request.ingredientsConfirmed === false) {
                    alert("Please confirm receipt of required ingredients in 'Get Ingredients' tab first!");
                    return;
                  }
                  if (request.status?.toUpperCase() !== "IN_PROGRESS") {
                    onUpdateStatus(request.id, "IN_PROGRESS");
                  }
                  onClose();
                  navigate(`/kitchenPartialProduction?id=${request.id}`);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 bg-[#1366D9] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors ${
                  request.ingredientsConfirmed === false ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <PlayCircle size={16} />
                {request.status?.toUpperCase() === "IN_PROGRESS" && request.producedQty > 0 ? "Process Task" : "Start Task"}
              </button>
            )}
            {request.status?.toUpperCase() === "IN_PROGRESS" && pct < 100 && (
              <>
                <button
                  onClick={() => { onUpdateStatus(request.id, "PENDING"); onClose(); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#F4A100] text-white text-[13px] font-[500] rounded-lg hover:bg-[#0F50AA] transition-colors"
                >
                  <PauseCircle size={16} />
                  Pause
                </button>
                <button
                  onClick={() => { onUpdateStatus(request.id, "COMPLETED"); onClose(); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#199D26] text-white text-[13px] font-[500] rounded-lg hover:bg-[#157A1E] transition-colors"
                >
                  <CheckCircle size={16} />
                  Mark as Completed
                </button>
              </>
            )}
            {request.status?.toUpperCase() === "COMPLETED" && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#F0FDF4] text-[#199D26] text-[13px] font-[500] rounded-lg border border-[#BBF7D0]">
                <CheckCircle size={16} />
                Task Completed
              </div>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#E4E6EA] text-[#667085] text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KitchenProductionRequests() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = "Production Requests";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const mapRequestData = (data) => {
    return (data || []).map((p) => {
      const total = p.totalQuantity || 0;
      const produced = p.producedQuantity || 0;
      const pct = total > 0 ? Math.min(100, Math.round((produced / total) * 100)) : 0;
      return {
        id: p.id,
        requestId: `KIT-${p.id}`,
        requestName: p.planName,
        requestDate: p.planDate || p.createdAt,
        status: p.status,
        totalQty: total,
        producedQty: produced,
        completed: produced,
        progress: pct,
        productTypes: (p.items || []).length,
        ingredientsConfirmed: p.ingredientsConfirmed,
        ingredientRequestStatus: p.ingredientRequestStatus,
        products: (p.items || []).map((it) => ({
          id: it.id,
          name: it.productName,
          quantity: it.quantity,
          unit: it.unitOfMeasure || it.unit || "pcs",
          produced: it.producedQuantity != null ? it.producedQuantity : 0,
          category: "Kitchen",
          productionCenterId: it.productionCenterId,
          productionCenterName: it.productionCenterName,
          isLocalCenter: it.isLocalCenter,
          isCompleted: it.isCompleted,
          canProduceLocally: it.canProduceLocally,
          isBlocked: it.isBlocked,
          uncompletedChildCount: it.uncompletedChildCount,
          reservedFromMiniStore: it.reservedFromMiniStore,
          miniStoreFulfilled: it.miniStoreFulfilled,
          children: (it.children || []).map((c) => ({
            id: c.id,
            name: c.productName,
            quantity: c.quantity,
            unit: c.unitOfMeasure || c.unit || "pcs",
            produced: c.producedQuantity || 0,
            productionCenterName: c.productionCenterName,
            isLocalCenter: c.isLocalCenter,
            isCompleted: c.isCompleted,
            reservedFromMiniStore: c.reservedFromMiniStore,
            miniStoreFulfilled: c.miniStoreFulfilled,
          })),
        })),
        notes: p.notes || "",
      };
    });
  };

  // Fetch requests from backend
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseUrl}/api/v1/worker/production-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }
      const data = await res.json();
      setRequests(mapRequestData(data));
    } catch (err) {
      console.error("Failed to fetch kitchen production requests:", err);
      setError("Failed to load production requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update status via backend API
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseUrl}/api/v1/worker/production-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error(`Status update failed: ${res.status}`);
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Date helpers
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Filtering
  const filteredRequests = requests.filter((r) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !search ||
      r.requestName.toLowerCase().includes(search) ||
      r.id.toLowerCase().includes(search) ||
      r.products.some((p) => p.name.toLowerCase().includes(search));

    const matchStatus =
      statusFilter === "ALL" || 
      (statusFilter === "PENDING" && ["PENDING", "APPROVED", "SUBMITTED"].includes(r.status?.toUpperCase())) ||
      (statusFilter === "IN_PROGRESS" && r.status?.toUpperCase() === "IN_PROGRESS") ||
      (statusFilter === "COMPLETED" && r.status?.toUpperCase() === "COMPLETED");

    const matchDate =
      dateFilter === "ALL" || (dateFilter === "TODAY" && isToday(r.requestDate));

    return matchSearch && matchStatus && matchDate;
  });

  // Summary stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => ["PENDING", "APPROVED", "SUBMITTED"].includes(r.status?.toUpperCase()) && progressPercent(r.producedQty, r.totalQty) < 100).length,
    inProgress: requests.filter((r) => r.status?.toUpperCase() === "IN_PROGRESS" && progressPercent(r.producedQty, r.totalQty) < 100).length,
    completed: requests.filter((r) => r.status?.toUpperCase() === "COMPLETED" || progressPercent(r.producedQty, r.totalQty) === 100).length,
  };

  const STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const DATE_OPTIONS = [
    { value: "ALL", label: "All Dates" },
    { value: "TODAY", label: "Today" },
  ];

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
                Kitchen Production Requests
              </h1>
              <p className="text-[14px] text-[#667085]">
                Assigned production tasks by Manager / POS (KOT-based)
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] bg-white text-[13px] font-[500] rounded-lg hover:bg-[#F8F9FA] transition-colors"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {[
              {
                label: "Total Requests",
                value: stats.total,
                icon: <ClipboardList size={20} />,
                color: "bg-blue-500",
                hoverColor: "hover:bg-blue-600",
                iconBg: "bg-blue-400/30",
                filterValue: "ALL",
              },
              {
                label: "Pending",
                value: stats.pending,
                icon: <Clock size={20} />,
                color: "bg-amber-500",
                hoverColor: "hover:bg-amber-600",
                iconBg: "bg-amber-400/30",
                filterValue: "PENDING",
              },
              {
                label: "In Progress",
                value: stats.inProgress,
                icon: <PlayCircle size={20} />,
                color: "bg-orange-500",
                hoverColor: "hover:bg-orange-600",
                iconBg: "bg-orange-400/30",
                filterValue: "IN_PROGRESS",
              },
              {
                label: "Completed",
                value: stats.completed,
                icon: <CheckCircle size={20} />,
                color: "bg-green-500",
                hoverColor: "hover:bg-green-600",
                iconBg: "bg-green-400/30",
                filterValue: "COMPLETED",
              },
            ].map((card, i) => (
              <div
                key={i}
                onClick={() => setStatusFilter(card.filterValue)}
                className={`
                  ${card.color} 
                  ${card.hoverColor}
                  rounded-lg
                  p-5
                  text-white
                  shadow-sm
                  transition-all
                  duration-300
                  hover:shadow-lg
                  hover:-translate-y-1
                  cursor-pointer
                  ${statusFilter === card.filterValue ? "ring-4 ring-white/30 scale-105" : ""}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-white/80 mb-2">{card.label}</p>
                    <h2 className="text-[30px] font-bold leading-none">{card.value}</h2>
                  </div>
                  <div className={`${card.iconBg} w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
                <input
                  type="text"
                  placeholder="Search by task name, product, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setDateDropdownOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors min-w-[150px]"
                >
                  <Filter size={15} className="text-[#667085]" />
                  <span className="flex-1 text-left">
                    {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                  </span>
                  <ChevronDown size={14} className="text-[#667085]" />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-[150px]">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setStatusFilter(opt.value); setStatusDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          statusFilter === opt.value ? "text-[#0F50AA] font-[500] bg-[#F0F1F3]" : "text-[#383E49]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div className="relative">
                <button
                  onClick={() => { setDateDropdownOpen(!dateDropdownOpen); setStatusDropdownOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[13px] text-[#383E49] bg-white hover:bg-[#F8F9FA] transition-colors min-w-[130px]"
                >
                  <Calendar size={15} className="text-[#667085]" />
                  <span className="flex-1 text-left">
                    {DATE_OPTIONS.find((o) => o.value === dateFilter)?.label}
                  </span>
                  <ChevronDown size={14} className="text-[#667085]" />
                </button>
                {dateDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-[#E4E6EA] rounded-lg shadow-lg z-50 min-w-[130px]">
                    {DATE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setDateFilter(opt.value); setDateDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FA] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          dateFilter === opt.value ? "text-[#0F50AA] font-[500] bg-[#F0F1F3]" : "text-[#383E49]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setDateFilter("ALL"); }}
                className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors text-[13px]"
              >
                <RefreshCw size={14} />
                Clear
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Assigned Production Tasks
              </h3>
              <span className="text-[12px] text-[#667085]">
                Showing {filteredRequests.length} of {requests.length} tasks
              </span>
            </div>

            {/* Loading State */}
            {loading ? (
              <Loader variant="section" text="Loading kitchen tasks..." />
            ) : error ? (
              /* Error State */
              <div className="text-center py-16">
                <AlertTriangle size={40} className="mx-auto text-[#EF4444] mb-4" />
                <p className="text-[15px] font-[500] text-[#383E49] mb-1">Error loading requests</p>
                <p className="text-[13px] text-[#667085] mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0C4A8A] transition-colors text-[13px]"
                >
                  Try Again
                </button>
              </div>
            ) : filteredRequests.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <ClipboardList size={40} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[15px] font-[500] text-[#383E49] mb-1">No tasks found</p>
                <p className="text-[13px] text-[#667085]">
                  {searchTerm || statusFilter !== "ALL" || dateFilter !== "ALL"
                    ? "Try adjusting your search or filters"
                    : "No kitchen production requests have been assigned yet"}
                </p>
              </div>
            ) : (
              /* Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Request Date</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Task Name & Code</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Products</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Progress</th>
                      <th className="text-left py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Status</th>
                      <th className="text-center py-3.5 px-2 text-[13px] font-[500] text-[#667085]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const meta = getStatusMeta(request.status);
                      const pct = progressPercent(request.producedQty, request.totalQty);
                      return (
                        <tr
                          key={request.id}
                          className="border-b border-[#E4E6EA] hover:bg-[#F0F1F3] transition-colors cursor-pointer"
                          onClick={() => { setSelectedRequest(request); setShowModal(true); }}
                        >
                          {/* Date */}
                          <td className="py-4 px-2">
                            <p className="text-[13px] font-[500] text-[#383E49]">
                              {new Date(request.requestDate).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-[11px] text-[#667085] mt-0.5">
                              {new Date(request.requestDate).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>

                          {/* Task Name & ID */}
                          <td className="py-4 px-2">
                            <p className="text-[13px] font-[600] text-[#383E49]">
                              {request.requestName}
                            </p>
                            <p className="text-[11px] text-[#667085] mt-0.5 flex items-center gap-1">
                              <Hash size={10} />
                              {request.id}
                            </p>
                          </td>

                          {/* Products */}
                          <td className="py-4 px-2">
                            <div className="space-y-1">
                              {request.products.slice(0, 2).map((p, i) => (
                                <p key={i} className="text-[12px] text-[#383E49] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                  {p.name} –{" "}
                                  <span className="font-[600]">
                                    {p.quantity} {p.unit}
                                  </span>
                                </p>
                              ))}
                              {request.products.length > 2 && (
                                <p className="text-[11px] text-[#667085]">
                                  +{request.products.length - 2} more
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Progress Bar */}
                          <td className="py-4 px-2 min-w-[140px]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-[#667085]">
                                {request.producedQty}/{request.totalQty}
                              </span>
                              <span className="text-[11px] font-[600] text-[#383E49]">{pct}%</span>
                            </div>
                            <div className="w-full bg-[#E4E6EA] rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  pct === 100
                                    ? "bg-[#199D26]"
                                    : pct > 0
                                    ? "bg-[#0F50AA]"
                                    : "bg-[#E4E6EA]"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-2">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[12px] font-[500] px-3 py-1 rounded-full ${meta.color}`}
                            >
                              {meta.icon}
                              {meta.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-4 px-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {/* View */}
                              <button
                                onClick={() => { setSelectedRequest(request); setShowModal(true); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F1F3] text-[#667085] text-[12px] font-[500] rounded-lg hover:bg-[#E4E6EA] transition-colors"
                              >
                                <Eye size={13} />
                                View
                              </button>

                              {/* Start / Process Task */}
                              {request.status?.toUpperCase() !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    if (request.status?.toUpperCase() !== "IN_PROGRESS") {
                                      handleUpdateStatus(request.id, "IN_PROGRESS");
                                    }
                                    navigate(`/kitchenPartialProduction?id=${request.id}`);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1366D9] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
                                >
                                  <PlayCircle size={13} />
                                  {request.status?.toUpperCase() === "IN_PROGRESS" && request.producedQty > 0 ? "Process" : "Start"}
                                </button>
                              )}

                              {/* Complete Task */}
                              {request.status?.toUpperCase() !== "COMPLETED" && (
                                <button
                                  onClick={() => handleUpdateStatus(request.id, "COMPLETED")}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#199D26] text-white text-[12px] font-[500] rounded-lg hover:bg-[#157A1E] transition-colors"
                                >
                                  <CheckCircle size={13} />
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Task Detail Modal */}
      {showModal && selectedRequest && (
        <TaskDetailModal
          request={selectedRequest}
          onClose={() => { setSelectedRequest(null); setShowModal(false); }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}