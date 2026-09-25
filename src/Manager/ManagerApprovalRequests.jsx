import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  FileText,
  Package,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Building,
  Calendar,
  DollarSign,
  User,
  Download,
  Printer,
  Archive,
  Send,
  Warehouse,
} from "lucide-react";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import posService from "../services/posService";
import { getApiBaseUrl } from "../utils/config";
import { formatQuantity } from "../utils/quantityFormatter";


export default function ManagerApprovalRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Approval Requests");
  const [activeTab, setActiveTab] = useState("purchaseOrders"); // 'purchaseOrders', 'returnMaterials', 'stockAdjustments', 'outletReturns'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  // Return Materials state
  const [returnRequests, setReturnRequests] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnsError, setReturnsError] = useState(null);

  // Stock Adjustments state
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(true);
  const [adjustmentsError, setAdjustmentsError] = useState(null);

  // Purchase Orders state
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(true);
  const [purchaseOrdersError, setPurchaseOrdersError] = useState(null);

  // Outlet Returns state
  const [outletReturns, setOutletReturns] = useState([]);
  const [loadingOutletReturns, setLoadingOutletReturns] = useState(true);
  const [outletReturnsError, setOutletReturnsError] = useState(null);

  // Fetch Return Materials
  useEffect(() => {
    const fetchReturnRequests = async () => {
      try {
        setLoadingReturns(true);
        setReturnsError(null);
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/returns`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        const returnList = Array.isArray(data.returns) ? data.returns : [];

        const mappedReturns = returnList
          .map((returnItem) => {
            const items = (returnItem.items || []).map((item) => ({
              id: item.returnItemId,
              rawMaterialId: item.rawMaterialId,
              name: item.rawMaterialName || "Unknown Material",
              returnQuantity: item.returnQuantity || 0,
              reason: item.reason || "Not specified",
              unit: item.unitOfMeasure || "unit",
              unitPrice: item.unitPrice || 0,
              totalPrice: item.totalPrice || 0,
              status: item.status || "RETURNED",
            }));

            const hasNotApproved = items.some(
              (it) => (it.status || "").toUpperCase() === "NOT_APPROVED"
            );

            if (!hasNotApproved) return null; // only keep NOT_APPROVED notes

            return {
              id: returnItem.returnId,
              requestId: `RN-${returnItem.returnId}`,
              type: "Return Materials",
              requestDate: returnItem.returnDate,
              supplierName: returnItem.supplierName || "Unknown Supplier",
              totalItems: returnItem.numberOfItems || items.length,
              totalCost: returnItem.totalCost || 0,
              status: "NOT_APPROVED",
              requestedBy: "Storekeeper",
              priority:
                returnItem.totalCost > 10000
                  ? "High"
                  : returnItem.totalCost > 5000
                  ? "Medium"
                  : "Low",
              items: items,
              createdAt: returnItem.createdAt || new Date().toISOString(),
            };
          })
          .filter(Boolean);

        setReturnRequests(mappedReturns);
      } catch (error) {
        console.error("Failed to fetch return requests:", error);
        setReturnsError(error.message);
      } finally {
        setLoadingReturns(false);
      }
    };

    fetchReturnRequests();
  }, []);

  // Fetch Stock Adjustments
  useEffect(() => {
    const fetchStockAdjustments = async () => {
      try {
        setLoadingAdjustments(true);
        setAdjustmentsError(null);

        // Fetch materials dictionary for fallback name resolution if rawMaterialName is a quantity/unit string
        let materialsMap = {};
        try {
          const matRes = await fetch(
            `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`
          );
          if (matRes.ok) {
            const matData = await matRes.json();
            (matData || []).forEach((m) => {
              const nameToUse = m.name || m.materialName || m.genericMaterialName;
              if (m.id) materialsMap[m.id] = nameToUse;
              if (m.batches) {
                m.batches.forEach((b) => {
                  if (b.id) materialsMap[b.id] = nameToUse;
                });
              }
            });
          }
        } catch (e) {
          console.warn("Could not fetch raw materials map for name enrichment:", e);
        }

        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/stock-adjustments`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Stock adjustments fetched:", data);

        const pendingAdjustments = Array.isArray(data)
          ? data.filter((adj) => (adj.status || "").toUpperCase() === "PENDING")
          : [];

        const mappedAdjustments = pendingAdjustments.map((adjustment) => {
          const rawName = adjustment.rawMaterialName;
          const fallbackName = materialsMap[adjustment.rawMaterialId];
          const isNumericOrUnitOnly =
            !rawName ||
            /^\d+(\.\d+)?\s*(kg|g|l|ml|unit|units|pcs)?$/i.test(rawName.trim());
          const finalMaterialName = !isNumericOrUnitOnly
            ? rawName
            : fallbackName || rawName || "Raw Material";

          return {
            id: adjustment.id,
            requestId: `ADJ-${adjustment.id}`,
            type: "Stock Adjustment",
            requestDate: adjustment.createdAt.split("T")[0],
            materialName: finalMaterialName,
            materialCode: `MAT${String(adjustment.rawMaterialId).padStart(
              3,
              "0"
            )}`,
            systemQty: adjustment.beforeQuantity,
            physicalQty: adjustment.afterQuantity != null 
              ? Math.max(0, Number(adjustment.afterQuantity.toFixed(4))) 
              : Math.max(0, Number(((adjustment.beforeQuantity || 0) + (adjustment.changeQuantity || 0)).toFixed(4))),
            adjustmentQty: adjustment.changeQuantity,
            adjustmentType:
              adjustment.changeQuantity > 0
                ? "Gain"
                : adjustment.changeQuantity < 0
                ? "Loss"
                : "No Change",
            reason: adjustment.reasonForAdjust,
            status: "Pending",
            requestedBy: adjustment.addedByName || "Storekeeper",
            priority:
              Math.abs(adjustment.changeQuantity) > 100
                ? "High"
                : Math.abs(adjustment.changeQuantity) > 50
                ? "Medium"
                : "Low",
            remarks: adjustment.remarks || "",
            createdAt: adjustment.createdAt,
          };
        });

        setStockAdjustments(mappedAdjustments);
      } catch (error) {
        console.error("Failed to fetch stock adjustments:", error);
        setAdjustmentsError(error.message);
      } finally {
        setLoadingAdjustments(false);
      }
    };

    fetchStockAdjustments();
  }, []);

  // Fetch Purchase Orders
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoadingPurchaseOrders(true);
        setPurchaseOrdersError(null);
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Purchase orders fetched:", data);

        const purchaseOrdersList = Array.isArray(data.purchaseorders)
          ? data.purchaseorders
          : Array.isArray(data.purchaseOrders)
          ? data.purchaseOrders
          : [];
        const pendingOrders = purchaseOrdersList.filter(
          (order) => {
            const status = (order.status || "").toUpperCase().replace(/_/g, " ");
            return status === "PENDING" || status === "PENDING MANAGER APPROVAL";
          }
        );

        const mappedOrders = pendingOrders.map((order) => ({
          id: order.poId,
          requestId: `PO-${order.poId}`,
          type: "Purchase Order",
          requestDate: order.estimatedDeliveryDate,
          supplierName: order.supplierName || "Unknown Supplier",
          totalItems: order.numberOfItems || 0,
          totalCost: order.totalCost || 0,
          status: "Pending Manager Approval",
          requestedBy: "Storekeeper",
          priority:
            order.totalCost > 50000
              ? "High"
              : order.totalCost > 25000
              ? "Medium"
              : "Low",
          expectedDelivery: order.estimatedDeliveryDate,
          items: order.items || [],
          createdAt: order.estimatedDeliveryDate,
        }));

        setPurchaseOrders(mappedOrders);
      } catch (error) {
        console.error("Failed to fetch purchase orders:", error);
        setPurchaseOrdersError(error.message);
      } finally {
        setLoadingPurchaseOrders(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  // Fetch Outlet Returns
  const fetchOutletReturns = async () => {
    try {
      setLoadingOutletReturns(true);
      setOutletReturnsError(null);
      const data = await posService.getOutletReturnsByStatus('PENDING');
      
      const outletReturnsList = Array.isArray(data) ? data : [];
      const mappedOutletReturns = outletReturnsList.map(ret => {
        // Normalize status to match frontend expectations
        let status = ret.status;
        if (status === 'PENDING') status = 'Pending';
        if (status === 'APPROVED') status = 'Approved';
        if (status === 'REJECTED') status = 'Rejected';
        if (status === 'RECEIVED') status = 'Received';

        return {
          id: ret.id,
          requestId: ret.returnNoteId || `ORTN-${ret.id}`,
          type: "Outlet Return",
          requestDate: ret.requestDate || new Date().toISOString(),
          outletName: ret.outletName || "Branch Outlet",
          outletId: ret.outletId,
          totalItems: (ret.items || []).length,
          status: status,
          requestedBy: ret.initiatorName || "POS Cashier",
          priority: "Medium",
          items: (ret.items || []).map(item => ({
            ...item,
            name: item.productName || `Prod-${item.productId}`,
            returnQuantity: item.quantity,
            unit: 'units',
            status: item.status || 'PENDING'
          })),
          remarks: ret.remarks,
          createdAt: ret.requestDate || new Date().toISOString()
        };
      });

      setOutletReturns(mappedOutletReturns);
    } catch (error) {
      console.error("Failed to fetch outlet returns:", error);
      setOutletReturnsError(error.message);
    } finally {
      setLoadingOutletReturns(false);
    }
  };

  useEffect(() => {
    fetchOutletReturns();

    // Polling for Outlet Returns
    let interval;
    if (activeTab === 'outletReturns') {
      interval = setInterval(fetchOutletReturns, 30000); // 30s polling
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case "purchaseOrders":
        return {
          data: purchaseOrders,
          loading: loadingPurchaseOrders,
          error: purchaseOrdersError,
        };
      case "returnMaterials":
        return {
          data: returnRequests,
          loading: loadingReturns,
          error: returnsError,
        };
      case "stockAdjustments":
        return {
          data: stockAdjustments,
          loading: loadingAdjustments,
          error: adjustmentsError,
        };
      case "outletReturns":
        return {
          data: outletReturns,
          loading: loadingOutletReturns,
          error: outletReturnsError,
        };
      default:
        return { data: [], loading: false, error: null };
    }
  };

  // Filter data based on search and status
  const getFilteredData = () => {
    const { data } = getCurrentData();
    let filtered = data;

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "Pending") {
          return (
            item.status === "Pending" ||
            item.status === "Pending Manager Approval"
          );
        }
        return item.status === statusFilter;
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.supplierName &&
            item.supplierName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (item.materialName &&
            item.materialName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Handle approval/rejection actions
  const handleAction = async (action, requestId, remarks = "") => {
    setProcessingAction(`${action}-${requestId}`);

    try {
      let endpoint = "";
      let requestBody = {};
      let methodOverride = null;

      if (activeTab === "purchaseOrders") {
        if (action === "approve") {
          endpoint = `${process.env.REACT_APP_BASE_URL}/api/manager/purchase-orders/${requestId}/approve`;
          requestBody = {
            purchaseOrderId: requestId,
            status: "APPROVED",
            approverId: localStorage.getItem("userId") || "1",
            remarks: remarks || "Approved by manager",
          };
          methodOverride = "PUT";
          console.log("Purchase Order Approval PUT body:", requestBody);
        } else {
          endpoint = `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders/${requestId}/reject`;
          requestBody = { reason: remarks };
        }
      } else if (activeTab === "returnMaterials") {
        if (action === "approve") {
          const returnRequest = returnRequests.find((r) => r.id === requestId);
          const items = (returnRequest?.items || []).map((item) => ({
            itemId: item.id,
            status: "APPROVED",
          }));
          endpoint = `${process.env.REACT_APP_BASE_URL}/api/manager/returns/${requestId}/items/status`;
          requestBody = { returnId: requestId, items };
          methodOverride = "PUT";
          console.log("Return Materials Approval PUT body:", requestBody);
        } else {
          const returnRequest = returnRequests.find((r) => r.id === requestId);
          const items = (returnRequest?.items || []).map((item) => ({
            itemId: item.id,
            status: "REJECTED",
          }));
          endpoint = `${process.env.REACT_APP_BASE_URL}/api/manager/returns/${requestId}/items/status`;
          requestBody = { returnId: requestId, items };
          methodOverride = "PUT";
          console.log("Return Materials Rejection PUT body:", requestBody);
        }
      } else if (activeTab === "stockAdjustments") {
        endpoint = `${process.env.REACT_APP_BASE_URL}/api/manager/stock-adjustments/approval`;
        requestBody = {
          stockAdjustmentId: requestId,
          status: action === "approve" ? "APPROVED" : "REJECTED",
          approverId: localStorage.getItem("userId") || "1",
          remarks: remarks || (action === "approve" ? "Verified and approved" : "Rejected by manager"),
        };
        console.log("Stock Adjustment Approval/Rejection body:", requestBody);
      } else if (activeTab === "outletReturns") {
        const approverId = localStorage.getItem("userId");
        if (action === "approve") {
          await posService.approveOutletReturn(requestId, approverId);
        } else {
          await posService.rejectOutletReturn(requestId, approverId);
        }
        // Early return for outlet returns as the logic is handled by posService
        const updateStatus = action === "approve" ? "Approved" : "Rejected";
        setOutletReturns(prev => prev.map(ret => ret.id === requestId ? { ...ret, status: updateStatus } : ret));
        toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully!`);
        setShowDetailsModal(false);
        setProcessingAction(null);
        return;
      }

      const method =
        methodOverride || (activeTab === "stockAdjustments" ? "PUT" : "POST");
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Update local state
      const updateStatus = action === "approve" ? "Approved" : "Rejected";

      if (activeTab === "purchaseOrders") {
        setPurchaseOrders((prev) =>
          prev.map((po) =>
            po.id === requestId ? { ...po, status: updateStatus } : po
          )
        );
      } else if (activeTab === "returnMaterials") {
        setReturnRequests((prev) =>
          prev.map((ret) =>
            ret.id === requestId ? { ...ret, status: updateStatus } : ret
          )
        );
      } else if (activeTab === "stockAdjustments") {
        setStockAdjustments((prev) =>
          prev.map((adj) =>
            adj.id === requestId ? { ...adj, status: updateStatus } : adj
          )
        );
      }

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully!`);
      setShowDetailsModal(false);
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error(`Failed to ${action} request: ${error.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Pending Manager Approval":
        return "bg-hover text-warning";
      case "NOT_APPROVED":
        return "bg-hover text-warning";
      case "Approved":
        return "bg-hover text-success";
      case "Rejected":
        return "bg-hover text-error";
      default:
        return "bg-app text-fg-secondary";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-hover text-error";
      case "Medium":
        return "bg-hover text-warning";
      case "Low":
        return "bg-hover text-success";
      default:
        return "bg-app text-fg-secondary";
    }
  };

  const filteredData = getFilteredData();
  const { loading, error } = getCurrentData();

  // Get counts by status for current tab
  const getStatusCounts = () => {
    const { data } = getCurrentData();
    return {
      pending: data.filter(
        (item) =>
          item.status === "Pending" ||
          item.status === "Pending Manager Approval"
      ).length,
      approved: data.filter((item) => item.status === "Approved").length,
      rejected: data.filter((item) => item.status === "Rejected").length,
      total: data.length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              Approval Requests
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Review and approve storekeeper requests for purchase orders,
              returns, and stock adjustments
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-surface rounded-lg shadow-sm border border-line mb-6">
            <div className="flex flex-wrap border-b border-line">
              <button
                onClick={() => setActiveTab("purchaseOrders")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "purchaseOrders"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <FileText size={16} />
                Purchase Orders
              </button>
              <button
                onClick={() => setActiveTab("returnMaterials")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "returnMaterials"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <RotateCcw size={16} />
                Return Materials
              </button>
              <button
                onClick={() => setActiveTab("stockAdjustments")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "stockAdjustments"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <Package size={16} />
                Stock Adjustments
              </button>
              <button
                onClick={() => setActiveTab("outletReturns")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "outletReturns"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <Warehouse size={16} />
                Outlet Returns
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by request ID, supplier, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 border border-line rounded-md text-[14px] text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent bg-surface"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="NOT_APPROVED">Not Approved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-fg">
                {activeTab === "purchaseOrders" && "Purchase Order Requests"}
                {activeTab === "returnMaterials" && "Return Material Requests"}
                {activeTab === "stockAdjustments" &&
                  "Stock Adjustment Requests"}
                {activeTab === "outletReturns" && "POS Outlet Return Requests"}
              </h3>
              <span className="text-[12px] text-fg-secondary mt-2 sm:mt-0">
                Showing {filteredData.length} requests
              </span>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading requests..." />
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle
                  size={48}
                  className="mx-auto text-error mb-4"
                />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  Error loading requests
                </p>
                <p className="text-[14px] text-fg-secondary mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-fg-secondary mb-4" />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  No requests found
                </p>
                <p className="text-[14px] text-fg-secondary">
                  {searchTerm || statusFilter !== "All"
                    ? "Try adjusting your search criteria"
                    : "No requests match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Request ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        {activeTab === "purchaseOrders" && "Supplier"}
                        {activeTab === "returnMaterials" && "Supplier"}
                        {activeTab === "stockAdjustments" && "Material"}
                        {activeTab === "outletReturns" && "Branch/Outlet"}
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        {activeTab === "purchaseOrders" && "Items & Cost"}
                        {activeTab === "returnMaterials" && "Items & Cost"}
                        {activeTab === "stockAdjustments" && "Adjustment"}
                        {activeTab === "outletReturns" && "Return Details"}
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Requested By
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Priority
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Status
                      </th>
                      <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-line hover:bg-subtle"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[600] text-fg">
                              {request.requestId}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          {activeTab === "purchaseOrders" ? (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-fg-secondary" />
                              <p className="text-[14px] font-[500] text-fg">
                                {request.supplierName}
                              </p>
                            </div>
                          ) : activeTab === "returnMaterials" ? (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-fg-secondary" />
                              <p className="text-[14px] font-[500] text-fg">
                                {request.supplierName}
                              </p>
                            </div>
                          ) : activeTab === "stockAdjustments" ? (
                            <div>
                              <p className="text-[14px] font-[500] text-fg">
                                {request.materialName}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                Code: {request.materialCode}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-fg-secondary" />
                              <p className="text-[14px] font-[500] text-fg">
                                {request.outletName}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          {activeTab === "purchaseOrders" ? (
                            <div>
                              <p className="text-[14px] font-[600] text-success">
                                Rs.{request.totalCost.toFixed(2)}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                {request.totalItems} items
                              </p>
                            </div>
                          ) : activeTab === "returnMaterials" ? (
                            <div>
                              <p className="text-[14px] font-[600] text-success">
                                Rs.{request.totalCost.toFixed(2)}
                              </p>
                            </div>
                          ) : activeTab === "stockAdjustments" ? (
                            <div>
                              <div className="flex items-center gap-2">
                                {request.adjustmentQty > 0 ? (
                                  <TrendingUp
                                    size={16}
                                    className="text-success"
                                  />
                                ) : request.adjustmentQty < 0 ? (
                                  <TrendingDown
                                    size={16}
                                    className="text-error"
                                  />
                                ) : (
                                  <Minus size={16} className="text-fg-secondary" />
                                )}
                                <span
                                  className={`text-[14px] font-[600] ${
                                    request.adjustmentQty > 0
                                      ? "text-success"
                                      : request.adjustmentQty < 0
                                      ? "text-error"
                                      : "text-fg-secondary"
                                  }`}
                                >
                                  {request.adjustmentQty > 0 ? "+" : ""}
                                  {formatQuantity(request.adjustmentQty)}
                                </span>
                              </div>
                              <p className="text-[12px] text-fg-secondary">
                                {request.adjustmentType}
                              </p>
                            </div>
                          ) : (
                            <div>
                               <p className="text-[14px] font-[600] text-brand-fg">
                                  {request.totalItems} Items
                               </p>
                               <p className="text-[12px] text-fg-secondary">
                                  Reason: {request.reason}
                               </p>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-fg-secondary" />
                            <div>
                              <p className="text-[14px] font-[500] text-fg">
                                {request.requestedBy}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {(request.status === "Pending" ||
                              request.status === "Pending Manager Approval") && (
                              <Clock size={10} className="mr-1" />
                            )}
                            {request.status === "Approved" && (
                              <CheckCircle2 size={10} className="mr-1" />
                            )}
                            {request.status === "Rejected" && (
                              <X size={10} className="mr-1" />
                            )}
                            {request.status}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {(request.status === "Pending" ||
                              request.status === "Pending Manager Approval" ||
                              request.status === "NOT_APPROVED") && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction("approve", request.id)
                                  }
                                  disabled={
                                    processingAction === `approve-${request.id}`
                                  }
                                  className="p-2 text-success hover:bg-hover rounded-lg transition-colors disabled:text-success disabled:cursor-not-allowed"
                                  title="Approve"
                                >
                                  {processingAction ===
                                  `approve-${request.id}` ? (
                                    <Clock size={16} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(
                                      "reject",
                                      request.id,
                                      "Rejected by manager"
                                    )
                                  }
                                  disabled={
                                    processingAction === `reject-${request.id}`
                                  }
                                  className="p-2 text-error hover:bg-hover rounded-lg transition-colors disabled:text-error disabled:cursor-not-allowed"
                                  title="Reject"
                                >
                                  {processingAction ===
                                  `reject-${request.id}` ? (
                                    <Clock size={16} className="animate-spin" />
                                  ) : (
                                    <X size={16} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-line gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-[20px] font-[600] text-fg">
                  {selectedRequest.type} Details
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  {selectedRequest.requestId} •{" "}
                  {new Date(selectedRequest.requestDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-subtle rounded-lg transition-colors"
                >
                  <X size={20} className="text-fg-secondary" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-lg mb-6 ${
                  selectedRequest.status === "Pending" ||
                  selectedRequest.status === "Pending Manager Approval"
                    ? "bg-hover border border-warning"
                    : selectedRequest.status === "Approved"
                    ? "bg-hover border border-success"
                    : selectedRequest.status === "Rejected"
                    ? "bg-hover border border-error"
                    : "bg-subtle border border-line"
                }`}
              >
                <div className="flex items-center gap-2">
                  {(selectedRequest.status === "Pending" ||
                    selectedRequest.status === "Pending Manager Approval") && (
                    <Clock size={20} className="text-warning" />
                  )}
                  {selectedRequest.status === "Approved" && (
                    <CheckCircle2 size={20} className="text-success" />
                  )}
                  {selectedRequest.status === "Rejected" && (
                    <AlertTriangle size={20} className="text-error" />
                  )}
                  <span
                    className={`text-[16px] font-[600] ${
                      selectedRequest.status === "Pending" ||
                      selectedRequest.status === "Pending Manager Approval"
                        ? "text-warning"
                        : selectedRequest.status === "Approved"
                        ? "text-success"
                        : selectedRequest.status === "Rejected"
                        ? "text-error"
                        : "text-fg-secondary"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${getPriorityColor(
                      selectedRequest.priority
                    )}`}
                  >
                    {selectedRequest.priority} Priority
                  </span>
                </div>
                <p className="text-[14px] text-fg-secondary mt-1">
                  {(selectedRequest.status === "Pending" ||
                    selectedRequest.status === "Pending Manager Approval") &&
                    "This request is awaiting your approval"}
                  {selectedRequest.status === "Approved" &&
                    "This request has been approved"}
                  {selectedRequest.status === "Rejected" &&
                    "This request has been rejected"}
                </p>
              </div>

              {/* Request Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-subtle rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Request Type
                  </p>
                  <p className="text-[14px] font-[600] text-fg">
                    {selectedRequest.type}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Requested By
                  </p>
                  <p className="text-[14px] font-[600] text-fg">
                    {selectedRequest.requestedBy}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Request Date
                  </p>
                  <p className="text-[14px] font-[600] text-fg">
                    {new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Purchase Order Details */}
              {activeTab === "purchaseOrders" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building size={20} className="text-brand-fg" />
                      <h4 className="text-[16px] font-[600] text-fg">
                        Supplier Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-hover rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Supplier Name
                        </span>
                        <p className="text-[14px] font-[600] text-fg">
                          {selectedRequest.supplierName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Expected Delivery
                        </span>
                        <p className="text-[14px] font-[600] text-fg">
                          {selectedRequest.expectedDelivery
                            ? new Date(
                                selectedRequest.expectedDelivery
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.items &&
                    selectedRequest.items.length > 0 && (
                      <div className="border border-line rounded-lg">
                        <div className="bg-subtle px-4 py-3 border-b border-line">
                          <h4 className="text-[16px] font-[600] text-fg">
                            Order Items ({selectedRequest.items.length})
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-subtle">
                              <tr>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Material
                                </th>
                                <th className="text-center py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Required Qty
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Estimated Cost
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Actual Cost
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {selectedRequest.items.map((item, index) => (
                                <tr key={index} className="hover:bg-subtle">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="text-[14px] font-[500] text-fg">
                                        {item.rawMaterialName}
                                      </p>
                                      <p className="text-[12px] text-fg-secondary">
                                        ID: {item.rawMaterialId}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <p className="text-[14px] font-[600] text-fg">
                                      {item.requiredQty} {item.unitOfMeasure}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] text-fg">
                                      Rs.{item.estimatedCost.toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] font-[600] text-success">
                                      Rs.{item.actualCost.toFixed(2)}
                                    </p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-subtle px-4 py-3 border-t border-line">
                          <div className="flex justify-between items-center">
                            <span className="text-[14px] font-[600] text-fg">
                              Total Cost:
                            </span>
                            <span className="text-[18px] font-[700] text-success">
                              Rs.{selectedRequest.totalCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Return Materials Details */}
              {activeTab === "returnMaterials" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <RotateCcw size={20} className="text-brand-fg" />
                      <h4 className="text-[16px] font-[600] text-fg">
                        Return Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-hover rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Supplier Name
                        </span>
                        <p className="text-[14px] font-[600] text-fg">
                          {selectedRequest.supplierName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Total Return Value
                        </span>
                        <p className="text-[14px] font-[600] text-error">
                          Rs.{selectedRequest.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.items &&
                    selectedRequest.items.length > 0 && (
                      <div className="border border-line rounded-lg">
                        <div className="bg-subtle px-4 py-3 border-b border-line">
                          <h4 className="text-[16px] font-[600] text-fg">
                            Return Items ({selectedRequest.items.length})
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-subtle">
                              <tr>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Material
                                </th>
                                <th className="text-center py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Quantity
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Unit Price
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Total Price
                                </th>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Reason
                                </th>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {selectedRequest.items.map((item, index) => (
                                <tr key={index} className="hover:bg-subtle">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="text-[14px] font-[500] text-fg">
                                        {item.name}
                                      </p>
                                      <p className="text-[12px] text-fg-secondary">
                                        ID: {item.rawMaterialId}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <p className="text-[14px] font-[600] text-fg">
                                      {item.returnQuantity} {item.unit}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] text-fg">
                                      Rs.{Number(item.unitPrice).toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] font-[600] text-error">
                                      Rs.{Number(item.totalPrice).toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-hover text-warning">
                                      {item.reason}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-app text-fg-secondary">
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Outlet Return Details */}
              {activeTab === "outletReturns" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building size={20} className="text-brand-fg" />
                      <h4 className="text-[16px] font-[600] text-fg">
                        Outlet Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-hover rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">Outlet Name</span>
                        <p className="text-[14px] font-[600] text-fg">{selectedRequest.outletName}</p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">Remarks</span>
                        <p className="text-[14px] text-fg">{selectedRequest.remarks || "No remarks provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-line rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-subtle">
                        <tr>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">Product</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[600] text-fg uppercase">Return Qty</th>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {(selectedRequest.items || []).map((item, index) => (
                          <tr key={index} className="hover:bg-subtle">
                            <td className="py-3 px-4">
                              <p className="text-[14px] font-[500] text-fg">{item.name}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-[14px] font-[600] text-fg">{item.returnQuantity} {item.unit}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-hover text-warning">
                                {item.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Stock Adjustment Details */}
              {activeTab === "stockAdjustments" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package size={20} className="text-brand-fg" />
                      <h4 className="text-[16px] font-[600] text-fg">
                        Adjustment Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-hover rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Material Name
                        </span>
                        <p className="text-[14px] font-[600] text-fg">
                          {selectedRequest.materialName}
                        </p>
                        <p className="text-[12px] text-fg-secondary">
                          Code: {selectedRequest.materialCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Adjustment Reason
                        </span>
                        <p className="text-[14px] font-[600] text-fg">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-subtle p-4 rounded-lg mb-6">
                    <h4 className="text-[16px] font-[600] text-fg mb-4">
                      Adjustment Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          System Quantity
                        </span>
                        <p className="text-[24px] font-[700] text-fg">
                          {formatQuantity(selectedRequest.systemQty)}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Physical Quantity
                        </span>
                        <p className="text-[24px] font-[700] text-fg">
                          {formatQuantity(Math.max(0, selectedRequest.physicalQty))}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                          Adjustment
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          {selectedRequest.adjustmentQty > 0 ? (
                            <TrendingUp size={20} className="text-success" />
                          ) : selectedRequest.adjustmentQty < 0 ? (
                            <TrendingDown
                              size={20}
                              className="text-error"
                            />
                          ) : (
                            <Minus size={20} className="text-fg-secondary" />
                          )}
                          <span
                            className={`text-[24px] font-[700] ${
                              selectedRequest.adjustmentQty > 0
                                ? "text-success"
                                : selectedRequest.adjustmentQty < 0
                                ? "text-error"
                                : "text-fg-secondary"
                            }`}
                          >
                            {selectedRequest.adjustmentQty > 0 ? "+" : ""}
                            {formatQuantity(selectedRequest.adjustmentQty)}
                          </span>
                        </div>
                        <p className="text-[12px] text-fg-secondary mt-1">
                          {selectedRequest.adjustmentType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.remarks && (
                    <div className="mb-6">
                      <h4 className="text-[16px] font-[600] text-fg mb-2">
                        Storekeeper Remarks
                      </h4>
                      <div className="bg-subtle p-4 rounded-lg">
                        <p className="text-[14px] text-fg">
                          {selectedRequest.remarks}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-line">
              {selectedRequest.status === "Pending" ||
              selectedRequest.status === "Pending Manager Approval" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("approve", selectedRequest.id)}
                    disabled={
                      processingAction === `approve-${selectedRequest.id}`
                    }
                    className="flex items-center gap-2 px-6 py-3 text-[14px] font-[500] text-on-brand bg-success-solid hover:bg-success-solid disabled:bg-success-solid disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {processingAction === `approve-${selectedRequest.id}` ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Approve Request
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleAction(
                        "reject",
                        selectedRequest.id,
                        "Rejected by manager"
                      )
                    }
                    disabled={
                      processingAction === `reject-${selectedRequest.id}`
                    }
                    className="flex items-center gap-2 px-6 py-3 text-[14px] font-[500] text-on-brand bg-error-solid hover:bg-error-solid disabled:bg-error/20 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    {processingAction === `reject-${selectedRequest.id}` ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Reject Request
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-fg-secondary">
                    {selectedRequest.status === "Approved" &&
                      "This order has been approved"}
                    {selectedRequest.status === "Rejected" &&
                      "This order has been rejected"}
                  </span>
                </div>
              )}

              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
