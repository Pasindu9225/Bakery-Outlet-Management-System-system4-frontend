import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
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
  Layers,
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

  // MPC Material Requests state
  const [mpcRequests, setMpcRequests] = useState([]);
  const [loadingMpcRequests, setLoadingMpcRequests] = useState(true);
  const [mpcRequestsError, setMpcRequestsError] = useState(null);
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

  // Fetch MPC Material Requests
  useEffect(() => {
    const fetchMpcRequests = async () => {
      try {
        setLoadingMpcRequests(true);
        setMpcRequestsError(null);
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/manager/mpc-material-requests`);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data || []).map(item => ({
            id: item.id,
            requestId: item.requestCode || `MPC-REQ-${item.id}`,
            type: "MPC Material Request",
            requestDate: item.createdAt || new Date().toISOString(),
            supplierName: `MPC: ${item.mpcName || "Outlet Kitchen"} (Outlet: ${item.outletName || "Branch Outlet"})`,
            totalItems: (item.items || []).length,
            status: item.status === "PENDING_MANAGER" ? "Pending" : item.status === "APPROVED_MANAGER" ? "Approved" : item.status || "Pending",
            requestedBy: item.requestedByName || "MPC Worker",
            priority: "High",
            items: item.items || [],
            createdAt: item.createdAt || new Date().toISOString(),
          }));
          setMpcRequests(mapped);
        } else {
          setMpcRequests([]);
        }
      } catch (err) {
        setMpcRequestsError(err.message);
      } finally {
        setLoadingMpcRequests(false);
      }
    };

    fetchMpcRequests();
  }, []);

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
      case "mpcMaterialRequests":
        return {
          data: mpcRequests,
          loading: loadingMpcRequests,
          error: mpcRequestsError,
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
      } else if (activeTab === "mpcMaterialRequests") {
        const actionPath = action === "approve" ? "approve" : "reject";
        endpoint = `${getApiBaseUrl()}/api/v1/manager/mpc-material-requests/${requestId}/${actionPath}`;
        methodOverride = "POST";
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
      } else if (activeTab === "mpcMaterialRequests") {
        setMpcRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: updateStatus } : req
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
        return "bg-[#FFF4E6] text-[#F4A100]";
      case "NOT_APPROVED":
        return "bg-[#FFF4E6] text-[#F4A100]";
      case "Approved":
        return "bg-[#DDFFE0] text-[#199D26]";
      case "Rejected":
        return "bg-[#FEE2E2] text-[#EF4444]";
      default:
        return "bg-[#F0F1F3] text-[#667085]";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-[#FEE2E2] text-[#EF4444]";
      case "Medium":
        return "bg-[#FFF4E6] text-[#F4A100]";
      case "Low":
        return "bg-[#DDFFE0] text-[#199D26]";
      default:
        return "bg-[#F0F1F3] text-[#667085]";
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
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />
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
            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
              Approval Requests
            </h1>
            <p className="text-[14px] text-[#667085]">
              Review and approve storekeeper requests for purchase orders,
              returns, and stock adjustments
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] mb-6">
            <div className="flex flex-wrap border-b border-[#E4E6EA]">
              <button
                onClick={() => setActiveTab("purchaseOrders")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "purchaseOrders"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <FileText size={16} />
                Purchase Orders
              </button>
              <button
                onClick={() => setActiveTab("returnMaterials")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "returnMaterials"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <RotateCcw size={16} />
                Return Materials
              </button>
              <button
                onClick={() => setActiveTab("stockAdjustments")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "stockAdjustments"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <Package size={16} />
                Stock Adjustments
              </button>
              <button
                onClick={() => setActiveTab("outletReturns")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "outletReturns"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <Warehouse size={16} />
                Outlet Returns
              </button>
              <button
                onClick={() => setActiveTab("mpcMaterialRequests")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "mpcMaterialRequests"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <Layers size={16} />
                MPC Material Requests
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by request ID, supplier, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 border border-[#E4E6EA] rounded-md text-[14px] text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent bg-white"
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
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                {activeTab === "purchaseOrders" && "Purchase Order Requests"}
                {activeTab === "returnMaterials" && "Return Material Requests"}
                {activeTab === "stockAdjustments" &&
                  "Stock Adjustment Requests"}
                {activeTab === "outletReturns" && "POS Outlet Return Requests"}
                {activeTab === "mpcMaterialRequests" && "MPC Material Requests"}
              </h3>
              <span className="text-[12px] text-[#667085] mt-2 sm:mt-0">
                Showing {filteredData.length} requests
              </span>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading requests..." />
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle
                  size={48}
                  className="mx-auto text-[#EF4444] mb-4"
                />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  Error loading requests
                </p>
                <p className="text-[14px] text-[#667085] mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No requests found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm || statusFilter !== "All"
                    ? "Try adjusting your search criteria"
                    : "No requests match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Request ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        {activeTab === "purchaseOrders" && "Supplier"}
                        {activeTab === "returnMaterials" && "Supplier"}
                        {activeTab === "stockAdjustments" && "Material"}
                        {activeTab === "outletReturns" && "Branch/Outlet"}
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        {activeTab === "purchaseOrders" && "Items & Cost"}
                        {activeTab === "returnMaterials" && "Items & Cost"}
                        {activeTab === "stockAdjustments" && "Adjustment"}
                        {activeTab === "outletReturns" && "Return Details"}
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Requested By
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Priority
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Status
                      </th>
                      <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[600] text-[#383E49]">
                              {request.requestId}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          {activeTab === "purchaseOrders" ? (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-[#667085]" />
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.supplierName}
                              </p>
                            </div>
                          ) : activeTab === "returnMaterials" ? (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-[#667085]" />
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.supplierName}
                              </p>
                            </div>
                          ) : activeTab === "stockAdjustments" ? (
                            <div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.materialName}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                Code: {request.materialCode}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Building size={16} className="text-[#667085]" />
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.outletName}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          {activeTab === "purchaseOrders" ? (
                            <div>
                              <p className="text-[14px] font-[600] text-[#199D26]">
                                Rs.{request.totalCost.toFixed(2)}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                {request.totalItems} items
                              </p>
                            </div>
                          ) : activeTab === "returnMaterials" ? (
                            <div>
                              <p className="text-[14px] font-[600] text-[#199D26]">
                                Rs.{request.totalCost.toFixed(2)}
                              </p>
                            </div>
                          ) : activeTab === "stockAdjustments" ? (
                            <div>
                              <div className="flex items-center gap-2">
                                {request.adjustmentQty > 0 ? (
                                  <TrendingUp
                                    size={16}
                                    className="text-[#51CC5D]"
                                  />
                                ) : request.adjustmentQty < 0 ? (
                                  <TrendingDown
                                    size={16}
                                    className="text-[#EF4444]"
                                  />
                                ) : (
                                  <Minus size={16} className="text-[#667085]" />
                                )}
                                <span
                                  className={`text-[14px] font-[600] ${
                                    request.adjustmentQty > 0
                                      ? "text-[#51CC5D]"
                                      : request.adjustmentQty < 0
                                      ? "text-[#EF4444]"
                                      : "text-[#667085]"
                                  }`}
                                >
                                  {request.adjustmentQty > 0 ? "+" : ""}
                                  {formatQuantity(request.adjustmentQty)}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#667085]">
                                {request.adjustmentType}
                              </p>
                            </div>
                          ) : (
                            <div>
                               <p className="text-[14px] font-[600] text-[#0F50AA]">
                                  {request.totalItems} Items
                               </p>
                               <p className="text-[12px] text-[#667085]">
                                  Reason: {request.reason}
                               </p>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-[#667085]" />
                            <div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.requestedBy}
                              </p>
                              <p className="text-[12px] text-[#667085]">
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
                              className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
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
                                  className="p-2 text-[#199D26] hover:bg-[#F0FDF4] rounded-lg transition-colors disabled:text-[#94D3A2] disabled:cursor-not-allowed"
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
                                  className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:text-[#FCA5A5] disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-[#E4E6EA] gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  {selectedRequest.type} Details
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  {selectedRequest.requestId} •{" "}
                  {new Date(selectedRequest.requestDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#667085]" />
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
                    ? "bg-[#FFF4E6] border border-[#F4A100]"
                    : selectedRequest.status === "Approved"
                    ? "bg-[#DDFFE0] border border-[#199D26]"
                    : selectedRequest.status === "Rejected"
                    ? "bg-[#FEE2E2] border border-[#EF4444]"
                    : "bg-[#F8F9FA] border border-[#E4E6EA]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {(selectedRequest.status === "Pending" ||
                    selectedRequest.status === "Pending Manager Approval") && (
                    <Clock size={20} className="text-[#F4A100]" />
                  )}
                  {selectedRequest.status === "Approved" && (
                    <CheckCircle2 size={20} className="text-[#199D26]" />
                  )}
                  {selectedRequest.status === "Rejected" && (
                    <AlertTriangle size={20} className="text-[#EF4444]" />
                  )}
                  <span
                    className={`text-[16px] font-[600] ${
                      selectedRequest.status === "Pending" ||
                      selectedRequest.status === "Pending Manager Approval"
                        ? "text-[#F4A100]"
                        : selectedRequest.status === "Approved"
                        ? "text-[#199D26]"
                        : selectedRequest.status === "Rejected"
                        ? "text-[#EF4444]"
                        : "text-[#667085]"
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
                <p className="text-[14px] text-[#667085] mt-1">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Request Type
                  </p>
                  <p className="text-[14px] font-[600] text-[#383E49]">
                    {selectedRequest.type}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Requested By
                  </p>
                  <p className="text-[14px] font-[600] text-[#383E49]">
                    {selectedRequest.requestedBy}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Request Date
                  </p>
                  <p className="text-[14px] font-[600] text-[#383E49]">
                    {new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Purchase Order Details */}
              {activeTab === "purchaseOrders" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building size={20} className="text-[#0F50AA]" />
                      <h4 className="text-[16px] font-[600] text-[#383E49]">
                        Supplier Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EBF8FF] rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Supplier Name
                        </span>
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {selectedRequest.supplierName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Expected Delivery
                        </span>
                        <p className="text-[14px] font-[600] text-[#383E49]">
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
                      <div className="border border-[#E4E6EA] rounded-lg">
                        <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E4E6EA]">
                          <h4 className="text-[16px] font-[600] text-[#383E49]">
                            Order Items ({selectedRequest.items.length})
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#F8F9FA]">
                              <tr>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Material
                                </th>
                                <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Required Qty
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Estimated Cost
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Actual Cost
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E6EA]">
                              {selectedRequest.items.map((item, index) => (
                                <tr key={index} className="hover:bg-[#F8F9FA]">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="text-[14px] font-[500] text-[#383E49]">
                                        {item.rawMaterialName}
                                      </p>
                                      <p className="text-[12px] text-[#667085]">
                                        ID: {item.rawMaterialId}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <p className="text-[14px] font-[600] text-[#383E49]">
                                      {item.requiredQty} {item.unitOfMeasure}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] text-[#383E49]">
                                      Rs.{item.estimatedCost.toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] font-[600] text-[#199D26]">
                                      Rs.{item.actualCost.toFixed(2)}
                                    </p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-[#F8F9FA] px-4 py-3 border-t border-[#E4E6EA]">
                          <div className="flex justify-between items-center">
                            <span className="text-[14px] font-[600] text-[#383E49]">
                              Total Cost:
                            </span>
                            <span className="text-[18px] font-[700] text-[#199D26]">
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
                      <RotateCcw size={20} className="text-[#0F50AA]" />
                      <h4 className="text-[16px] font-[600] text-[#383E49]">
                        Return Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EBF8FF] rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Supplier Name
                        </span>
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {selectedRequest.supplierName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Total Return Value
                        </span>
                        <p className="text-[14px] font-[600] text-[#EF4444]">
                          Rs.{selectedRequest.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.items &&
                    selectedRequest.items.length > 0 && (
                      <div className="border border-[#E4E6EA] rounded-lg">
                        <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E4E6EA]">
                          <h4 className="text-[16px] font-[600] text-[#383E49]">
                            Return Items ({selectedRequest.items.length})
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#F8F9FA]">
                              <tr>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Material
                                </th>
                                <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Quantity
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Unit Price
                                </th>
                                <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Total Price
                                </th>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Reason
                                </th>
                                <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E6EA]">
                              {selectedRequest.items.map((item, index) => (
                                <tr key={index} className="hover:bg-[#F8F9FA]">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="text-[14px] font-[500] text-[#383E49]">
                                        {item.name}
                                      </p>
                                      <p className="text-[12px] text-[#667085]">
                                        ID: {item.rawMaterialId}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <p className="text-[14px] font-[600] text-[#383E49]">
                                      {item.returnQuantity} {item.unit}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] text-[#383E49]">
                                      Rs.{Number(item.unitPrice).toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <p className="text-[14px] font-[600] text-[#EF4444]">
                                      Rs.{Number(item.totalPrice).toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FFF4E6] text-[#F4A100]">
                                      {item.reason}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#F0F1F3] text-[#667085]">
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
                      <Building size={20} className="text-[#0F50AA]" />
                      <h4 className="text-[16px] font-[600] text-[#383E49]">
                        Outlet Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EBF8FF] rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">Outlet Name</span>
                        <p className="text-[14px] font-[600] text-[#383E49]">{selectedRequest.outletName}</p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">Remarks</span>
                        <p className="text-[14px] text-[#383E49]">{selectedRequest.remarks || "No remarks provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#F8F9FA]">
                        <tr>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Product</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Return Qty</th>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E6EA]">
                        {(selectedRequest.items || []).map((item, index) => (
                          <tr key={index} className="hover:bg-[#F8F9FA]">
                            <td className="py-3 px-4">
                              <p className="text-[14px] font-[500] text-[#383E49]">{item.name}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-[14px] font-[600] text-[#383E49]">{item.returnQuantity} {item.unit}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FFF4E6] text-[#F4A100]">
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
                      <Package size={20} className="text-[#0F50AA]" />
                      <h4 className="text-[16px] font-[600] text-[#383E49]">
                        Adjustment Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EBF8FF] rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Material Name
                        </span>
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {selectedRequest.materialName}
                        </p>
                        <p className="text-[12px] text-[#667085]">
                          Code: {selectedRequest.materialCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Adjustment Reason
                        </span>
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {selectedRequest.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] p-4 rounded-lg mb-6">
                    <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                      Adjustment Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          System Quantity
                        </span>
                        <p className="text-[24px] font-[700] text-[#383E49]">
                          {formatQuantity(selectedRequest.systemQty)}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Physical Quantity
                        </span>
                        <p className="text-[24px] font-[700] text-[#383E49]">
                          {formatQuantity(Math.max(0, selectedRequest.physicalQty))}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">
                          Adjustment
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          {selectedRequest.adjustmentQty > 0 ? (
                            <TrendingUp size={20} className="text-[#51CC5D]" />
                          ) : selectedRequest.adjustmentQty < 0 ? (
                            <TrendingDown
                              size={20}
                              className="text-[#EF4444]"
                            />
                          ) : (
                            <Minus size={20} className="text-[#667085]" />
                          )}
                          <span
                            className={`text-[24px] font-[700] ${
                              selectedRequest.adjustmentQty > 0
                                ? "text-[#51CC5D]"
                                : selectedRequest.adjustmentQty < 0
                                ? "text-[#EF4444]"
                                : "text-[#667085]"
                            }`}
                          >
                            {selectedRequest.adjustmentQty > 0 ? "+" : ""}
                            {formatQuantity(selectedRequest.adjustmentQty)}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#667085] mt-1">
                          {selectedRequest.adjustmentType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedRequest.remarks && (
                    <div className="mb-6">
                      <h4 className="text-[16px] font-[600] text-[#383E49] mb-2">
                        Storekeeper Remarks
                      </h4>
                      <div className="bg-[#F8F9FA] p-4 rounded-lg">
                        <p className="text-[14px] text-[#383E49]">
                          {selectedRequest.remarks}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MPC Material Request Details */}
              {activeTab === "mpcMaterialRequests" && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers size={20} className="text-[#0F50AA]" />
                      <h4 className="text-[16px] font-[600] text-[#383E49]">
                        MPC Material Request Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EBF8FF] rounded-lg">
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">Source & Outlet</span>
                        <p className="text-[14px] font-[600] text-[#383E49]">{selectedRequest.supplierName}</p>
                      </div>
                      <div>
                        <span className="text-[12px] font-[500] text-[#667085] uppercase">Total Items</span>
                        <p className="text-[14px] font-[600] text-[#0F50AA]">{selectedRequest.totalItems} Items</p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#F8F9FA]">
                        <tr>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Material Name</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Requested Qty</th>
                          <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Issued Qty</th>
                          <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E6EA]">
                        {(selectedRequest.items || []).map((item, index) => (
                          <tr key={index} className="hover:bg-[#F8F9FA]">
                            <td className="py-3 px-4">
                              <p className="text-[14px] font-[500] text-[#383E49]">{item.rawMaterialName || item.name || "Raw Material"}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-[14px] font-[600] text-[#383E49]">{item.requestedQty} {item.unitOfMeasure}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-[14px] font-[600] text-[#199D26]">{item.issuedQty != null ? item.issuedQty : item.requestedQty} {item.unitOfMeasure}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FFF4E6] text-[#F4A100]">
                                {item.unitOfMeasure || "unit"}
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

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-[#E4E6EA]">
              {selectedRequest.status === "Pending" ||
              selectedRequest.status === "Pending Manager Approval" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("approve", selectedRequest.id)}
                    disabled={
                      processingAction === `approve-${selectedRequest.id}`
                    }
                    className="flex items-center gap-2 px-6 py-3 text-[14px] font-[500] text-white bg-[#199D26] hover:bg-[#15803D] disabled:bg-[#94D3A2] disabled:cursor-not-allowed rounded-md transition-colors"
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
                    className="flex items-center gap-2 px-6 py-3 text-[14px] font-[500] text-white bg-[#EF4444] hover:bg-[#DC2626] disabled:bg-[#FCA5A2] disabled:cursor-not-allowed rounded-md transition-colors"
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
                  <span className="text-[14px] text-[#667085]">
                    {selectedRequest.status === "Approved" &&
                      "This order has been approved"}
                    {selectedRequest.status === "Rejected" &&
                      "This order has been rejected"}
                  </span>
                </div>
              )}

              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] hover:bg-[#F8F9FA] rounded-md transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
