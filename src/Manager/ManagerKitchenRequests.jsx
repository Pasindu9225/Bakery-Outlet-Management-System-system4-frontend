import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  ChefHat,
  Send,
  Eye,
  Edit3,
  Save,
  RefreshCw,
  Download,
  FileText,
  Printer,
  Search,
  Filter,
  X,
  Plus,
  Minus,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  History,
  PlayCircle,
  PauseCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Truck,
  Store,
  User,
  Bell,
  Utensils,
  Receipt,
  ShoppingCart,
} from "lucide-react";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";


export default function ManagerKitchenRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Kitchen Requests");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [kitchenRequests, setKitchenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch kitchen requests from backend
  useEffect(() => {
    const fetchKitchenRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get all production plans
        const plansResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/production-plans`
        );
        if (!plansResponse.ok) {
          throw new Error(`Server error: ${plansResponse.status}`);
        }
        const plans = await plansResponse.json();

        // Fetch kitchen materials for each plan in parallel
        const fetchMaterialsPromises = plans.map(async (plan) => {
          try {
            const materialsResponse = await fetch(
              `${process.env.REACT_APP_BASE_URL}/api/manager/production-plan/${plan.id}/materials/kitchen`
            );
            if (materialsResponse.ok) {
              const materialsData = await materialsResponse.json();
              if (
                materialsData.rawMaterials &&
                materialsData.rawMaterials.length > 0
              ) {
                return materialsData;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch materials for plan ${plan.id}:`, err);
          }
          return null;
        });

        const materialsResults = await Promise.all(fetchMaterialsPromises);
        const kitchenRequestsData = materialsResults.filter(Boolean);

        setKitchenRequests(kitchenRequestsData);
      } catch (error) {
        console.error("Failed to fetch kitchen requests:", error);
        setError("Failed to load kitchen requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenRequests();
  }, []);

  // Filter requests based on search term
  const getFilteredRequests = () => {
    if (!searchTerm.trim()) return kitchenRequests;

    return kitchenRequests.filter((request) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.requestName.toLowerCase().includes(searchLower) ||
        request.id.toLowerCase().includes(searchLower) ||
        request.requestDate.includes(searchTerm) ||
        new Date(request.requestDate).toLocaleDateString().includes(searchTerm) ||
        request.products.some((product) =>
          product.name.toLowerCase().includes(searchLower)
        ) ||
        request.createdBy.toLowerCase().includes(searchLower)
      );
    });
  };

  // Ensure we do not show requests where rawMaterials array is empty
  const filteredRequests = getFilteredRequests().filter(
    (r) => Array.isArray(r.rawMaterials) && r.rawMaterials.length > 0
  );

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return "text-[#F4A100] bg-[#FFFBEB]";
      case "SUBMITTED":
        return "text-[#1366D9] bg-[#F0F8FF]";
      case "APPROVED":
        return "text-[#199D26] bg-[#F0FDF4]";
      case "REJECTED":
        return "text-[#EF4444] bg-[#FEF2F2]";
      case "IN_PROGRESS":
        return "text-[#1366D9] bg-[#F0F8FF]";
      case "COMPLETED":
        return "text-[#199D26] bg-[#F0FDF4]";
      case "CANCELLED":
        return "text-[#EF4444] bg-[#FEF2F2]";
      default:
        return "text-[#667085] bg-[#F8F9FA]";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return <Clock size={16} />;
      case "SUBMITTED":
        return <PlayCircle size={16} />;
      case "APPROVED":
        return <CheckCircle size={16} />;
      case "REJECTED":
        return <XCircle size={16} />;
      case "IN_PROGRESS":
        return <PlayCircle size={16} />;
      case "COMPLETED":
        return <CheckCircle size={16} />;
      case "CANCELLED":
        return <XCircle size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const total = kitchenRequests.length;
    const draft = kitchenRequests.filter(
      (r) => r.status?.toUpperCase() === "DRAFT"
    ).length;
    const submitted = kitchenRequests.filter(
      (r) => r.status?.toUpperCase() === "SUBMITTED"
    ).length;
    const approved = kitchenRequests.filter(
      (r) => r.status?.toUpperCase() === "APPROVED"
    ).length;
    const rejected = kitchenRequests.filter(
      (r) => r.status?.toUpperCase() === "REJECTED"
    ).length;
    const totalKots = kitchenRequests.reduce(
      (sum, r) => sum + (r.kotCount || 0),
      0
    );

    return { total, draft, submitted, approved, rejected, totalKots };
  };

  const summaryStats = getSummaryStats();

  // View Request Modal Component
  const ViewRequestModal = () => {
    if (!selectedRequest) return null;

    const totalProducts = selectedRequest.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-[#E4E6EA]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-[600] text-[#383E49]">
                  Kitchen Request Details
                </h3>
                <p className="text-[14px] text-[#667085] mt-1">
                  Request ID: {selectedRequest.id}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Request Header Information */}
            <div className="bg-gradient-to-r from-[#F8F9FA] to-[#F0F1F3] rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">
                    Request Name
                  </p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedRequest.requestName}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">
                    Request Date
                  </p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {new Date(selectedRequest.requestDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[12px] px-3 py-1 rounded-full font-[500] flex items-center gap-1 ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">KOT Count</p>
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-[#0F50AA]" />
                    <p className="text-[14px] font-[600] text-[#383E49]">
                      {selectedRequest.kotCount}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">Created By</p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedRequest.createdBy}
                  </p>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-[600] text-[#383E49]">
                  Products
                </h4>
                <span className="text-[12px] bg-[#F0F8FF] text-[#1366D9] px-3 py-1 rounded-full font-[500]">
                  {selectedRequest.products.length} Items • {totalProducts}{" "}
                  Total Qty
                </span>
              </div>
              <div className="bg-white border border-[#E4E6EA] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                        <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Product Name
                        </th>
                        <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Requested Quantity
                        </th>
                        <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.products.map((product, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-100">
                                <ChefHat size={16} className="text-green-600" />
                              </div>
                              <span className="text-[14px] font-[500] text-[#383E49]">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[14px] font-[600] text-[#383E49]">
                              {product.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[12px] text-[#667085] bg-[#F0F1F3] px-2 py-1 rounded">
                              {product.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Raw Materials Required */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[18px] font-[600] text-[#383E49]">
                  Raw Materials Required
                </h4>
                <span className="text-[12px] bg-[#FFFBEB] text-[#F4A100] px-3 py-1 rounded-full font-[500]">
                  {selectedRequest.rawMaterials.length} Materials
                </span>
              </div>
              <div className="bg-white border border-[#E4E6EA] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                        <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Raw Material Name
                        </th>
                        <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Quantity Needed
                        </th>
                        <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.rawMaterials.map((material, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-100">
                                <Package
                                  size={16}
                                  className="text-purple-600"
                                />
                              </div>
                              <span className="text-[14px] font-[500] text-[#383E49]">
                                {material.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[14px] font-[600] text-[#383E49]">
                              {material.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[12px] text-[#667085] bg-[#F0F1F3] px-2 py-1 rounded">
                              {material.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Created Info */}
            <div className="mt-6 pt-6 border-t border-[#E4E6EA]">
              <div className="flex items-center gap-4 text-[12px] text-[#667085]">
                <span>
                  Created on{" "}
                  {new Date(selectedRequest.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>Created by {selectedRequest.createdBy}</span>
                <span>•</span>
                <span>
                  Last updated{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                Kitchen Requests
              </h1>
              <p className="text-[14px] text-[#667085]">
                View and monitor all kitchen production requests
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <ChefHat size={18} className="text-[#0F50AA]" />
                <span className="text-[12px] text-[#199D26] bg-[#F0FDF4] px-2 py-1 rounded">
                  Total
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">All Requests</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.total}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock size={18} className="text-[#F4A100]" />
                <span className="text-[12px] text-[#F4A100] bg-[#FFFBEB] px-2 py-1 rounded">
                  {summaryStats.draft}
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">Draft</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.draft}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <PlayCircle size={18} className="text-[#1366D9]" />
                <span className="text-[12px] text-[#1366D9] bg-[#F0F8FF] px-2 py-1 rounded">
                  {summaryStats.submitted}
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">Submitted</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.submitted}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={18} className="text-[#199D26]" />
                <span className="text-[12px] text-[#199D26] bg-[#F0FDF4] px-2 py-1 rounded">
                  {summaryStats.approved}
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">Approved</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.approved}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle size={18} className="text-[#EF4444]" />
                <span className="text-[12px] text-[#EF4444] bg-[#FEF2F2] px-2 py-1 rounded">
                  {summaryStats.rejected}
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">Rejected</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.rejected}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between mb-2">
                <Receipt size={18} className="text-[#B3A5FF]" />
                <span className="text-[12px] text-[#B3A5FF] bg-[#F5F3FF] px-2 py-1 rounded">
                  KOTs
                </span>
              </div>
              <p className="text-[12px] text-[#667085] mb-1">Total KOTs</p>
              <p className="text-[20px] font-[600] text-[#383E49]">
                {summaryStats.totalKots}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by request name, product, date, or creator..."
                  className="w-full pl-10 pr-4 py-3 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Kitchen Requests List
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[12px] text-[#667085]">
                  Showing {filteredRequests.length} of {kitchenRequests.length}{" "}
                  requests
                </span>
              </div>
            </div>

            {loading ? (
              <Loader variant="section" text="Loading kitchen requests..." />
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
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No requests found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No kitchen requests available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        Request Date
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        Request Name
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        Products (Full Quantity)
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        Status
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        KOTs
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                        Created By
                      </th>
                      <th className="text-center py-4 text-[14px] font-[500] text-[#383E49]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[500] text-[#383E49]">
                              {new Date(
                                request.requestDate
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              ID: {request.id}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">
                            {request.requestName}
                          </p>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[500] text-[#383E49]">
                              {request.products.reduce(
                                (sum, p) => sum + p.quantity,
                                0
                              )}{" "}
                              total items
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              {request.products.length} product types
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`text-[12px] px-3 py-1 rounded-full font-[500] flex items-center gap-1 w-fit ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            {request.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Receipt size={16} className="text-[#0F50AA]" />
                            <span className="text-[14px] font-[600] text-[#383E49]">
                              {request.kotCount}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#F0F1F3] rounded-full flex items-center justify-center">
                              <User size={14} className="text-[#667085]" />
                            </div>
                            <div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {request.createdBy}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowViewModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </button>
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

      {/* View Modal */}
      {showViewModal && <ViewRequestModal />}

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
