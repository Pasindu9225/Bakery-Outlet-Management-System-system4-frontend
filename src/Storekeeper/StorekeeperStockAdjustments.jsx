import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Download,
  Printer,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  Archive,
} from "lucide-react";

import { formatQuantity } from "../utils/quantityFormatter";
import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function StorekeeperStockAdjustments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Stock Adjustments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All', 'Pending', 'Approved', 'Rejected'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [markAsAdjustLoading, setMarkAsAdjustLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  // Fetch raw materials from backend
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);

        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw materials fetched:", data);

        // Map API response to match the expected structure
        const mappedProducts = data.map((material) => ({
          id: material.id,
          code: material.code,
          name: material.name,
          brand: material.brand || "",
          unit: material.unit,
          totalQuantity: material.totalQuantity,
          minQty: material.minQty,
          expireDate: material.expireDate,
          unitCost: material.unitCost,
          // For stock adjustments, we'll use totalQuantity as the system quantity
          // since batches array is empty in the API response
          batches: [
            {
              batchNo: `BATCH-${material.id}`,
              quantity: material.totalQuantity,
              expiryDate: material.expireDate,
            },
          ],
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch raw materials:", error);
        setProductsError(error.message);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchRawMaterials();
  }, []);

  // Stock adjustments from backend API
  const [adjustments, setAdjustments] = useState([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(true);
  const [adjustmentsError, setAdjustmentsError] = useState(null);

  // Fetch stock adjustments from backend
  useEffect(() => {
    const fetchStockAdjustments = async () => {
      try {
        setLoadingAdjustments(true);
        setAdjustmentsError(null);

        // Fetch materials lookup map to resolve pack/unit-only names (e.g. "1 kg", "100g Pack")
        let materialsMap = {};
        try {
          const matRes = await fetch(
            `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`
          );
          if (matRes.ok) {
            const matData = await matRes.json();
            (matData || []).forEach((m) => {
              const nameToUse = m.name || m.genericMaterialName || m.materialName;
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

        // Map API response to match the expected frontend structure
        const mappedAdjustments = data.map((adjustment) => {
          const rawName = adjustment.rawMaterialName;
          const fallbackName = materialsMap[adjustment.rawMaterialId];
          const isGenericOrPackOnly =
            !rawName ||
            /^\d+(\.\d+)?\s*(kg|g|l|ml|unit|units|pcs|pack)?$/i.test(rawName.trim()) ||
            /^\d+(kg|g|l|ml|pack)$/i.test(rawName.trim()) ||
            /^(1\s*kg|1kg|100g\s*pack|50kg\s*pack|pack)$/i.test(rawName.trim());
          
          let finalMaterialName = rawName;
          if (isGenericOrPackOnly && fallbackName) {
            finalMaterialName = fallbackName.toLowerCase().includes((rawName || "").toLowerCase())
              ? fallbackName
              : `${fallbackName} - ${rawName}`;
          }

          return {
            id: adjustment.id,
            adjustmentId: `ADJ-${adjustment.id}`,
            date: adjustment.createdAt.split("T")[0],
            productName: finalMaterialName || "Raw Material",
            productCode: `MAT${String(adjustment.rawMaterialId).padStart(
              3,
              "0"
            )}`,
            batchNo: `BATCH-${adjustment.rawMaterialId}`,
            systemQty: adjustment.beforeQuantity,
            physicalQty: adjustment.afterQuantity,
            adjustmentQty: adjustment.changeQuantity,
            adjustmentType:
              adjustment.changeQuantity > 0
                ? "Gain"
                : adjustment.changeQuantity < 0
                ? "Loss"
                : "No Change",
            reason: adjustment.reasonForAdjust,
            status:
              adjustment.status.charAt(0).toUpperCase() +
              adjustment.status.slice(1),
            storekeeperName: adjustment.addedByName || "Unknown",
            remarks: adjustment.remarks || "",
            adminRemarks: adjustment.approvedByName
              ? `Approved by ${adjustment.approvedByName}`
              : "",
            submittedAt: adjustment.createdAt,
            reviewedAt: adjustment.updatedAt,
            reviewedBy: adjustment.approvedByName,
          };
        });

        setAdjustments(mappedAdjustments);
      } catch (error) {
        console.error("Failed to fetch stock adjustments:", error);
        setAdjustmentsError(error.message);
      } finally {
        setLoadingAdjustments(false);
      }
    };

    fetchStockAdjustments();
  }, []);

  // Form state for new adjustment
  const [newAdjustment, setNewAdjustment] = useState({
    date: new Date().toISOString().split("T")[0],
    productId: "",
    batchNo: "",
    physicalQty: "",
    reason: "",
    remarks: "",
  });

  // Get selected product details
  const getSelectedProduct = () => {
    if (!newAdjustment.productId) return null;
    return products.find((p) => p.id === parseInt(newAdjustment.productId));
  };

  // Get selected batch details
  const getSelectedBatch = () => {
    const product = getSelectedProduct();
    if (!product || !newAdjustment.batchNo) return null;
    return product.batches.find((b) => b.batchNo === newAdjustment.batchNo);
  };

  // Calculate adjustment details
  const getAdjustmentDetails = () => {
    const batch = getSelectedBatch();
    const physicalQty = parseFloat(newAdjustment.physicalQty) || 0;

    if (!batch) return { adjustmentQty: 0, adjustmentType: "", systemQty: 0 };

    const systemQty = batch.quantity;
    const rawDiff = physicalQty - systemQty;
    const adjustmentQty = Number(rawDiff.toFixed(4));
    const adjustmentType =
      adjustmentQty > 0 ? "Gain" : adjustmentQty < 0 ? "Loss" : "No Change";

    return { adjustmentQty, adjustmentType, systemQty };
  };

  // Filter adjustments
  const getFilteredAdjustments = () => {
    let filtered = adjustments;

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((adj) => adj.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (adj) =>
          adj.adjustmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adj.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          adj.batchNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleCreateAdjustment = async () => {
    const product = getSelectedProduct();
    const batch = getSelectedBatch();
    const { adjustmentQty, adjustmentType, systemQty } = getAdjustmentDetails();

    if (
      !product ||
      !batch ||
      !newAdjustment.physicalQty ||
      !newAdjustment.reason
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // Get userId from browser storage
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");

      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }

      // Prepare request body according to API structure
      const requestBody = {
        rawMaterialId: parseInt(product.id),
        date: new Date(newAdjustment.date).toISOString(),
        adjustmentQty: adjustmentQty,
        reasonForAdjustment: newAdjustment.reason,
        remarks: newAdjustment.remarks || "",
        userId: userId,
      };

      console.log("Submitting stock adjustment:", requestBody);

      // Make POST request to backend
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/stock-adjustments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("Stock adjustment created successfully:", responseData);

      // Refresh the adjustments list from the backend
      const refreshResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/stock-adjustments`
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const mappedAdjustments = refreshData.map((adjustment) => ({
          id: adjustment.id,
          adjustmentId: `ADJ-${adjustment.id}`,
          date: adjustment.createdAt.split("T")[0],
          productName: adjustment.rawMaterialName,
          productCode: `MAT${String(adjustment.rawMaterialId).padStart(
            3,
            "0"
          )}`,
          batchNo: `BATCH-${adjustment.rawMaterialId}`,
          systemQty: adjustment.beforeQuantity,
          physicalQty: adjustment.afterQuantity,
          adjustmentQty: adjustment.changeQuantity,
          adjustmentType:
            adjustment.changeQuantity > 0
              ? "Gain"
              : adjustment.changeQuantity < 0
                ? "Loss"
                : "No Change",
          reason: adjustment.reasonForAdjust,
          status:
            adjustment.status.charAt(0).toUpperCase() +
            adjustment.status.slice(1),
          storekeeperName: adjustment.addedByName || "Unknown",
          remarks: adjustment.remarks || "",
          adminRemarks: adjustment.approvedByName
            ? `Approved by ${adjustment.approvedByName}`
            : "",
          submittedAt: adjustment.createdAt,
          reviewedAt: adjustment.updatedAt,
          reviewedBy: adjustment.approvedByName,
        }));
        setAdjustments(mappedAdjustments);
      }
      setShowCreateModal(false);
      setNewAdjustment({
        date: new Date().toISOString().split("T")[0],
        productId: "",
        batchNo: "",
        physicalQty: "",
        reason: "",
        remarks: "",
      });

      alert("Stock adjustment submitted for approval successfully!");
    } catch (error) {
      console.error("Failed to create stock adjustment:", error);
      alert(`Failed to submit stock adjustment: ${error.message}`);
    }
  };

  const handleViewDetails = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setShowViewModal(true);
  };

  const handleMarkAsAdjust = async () => {
    if (!selectedAdjustment) return;

    try {
      setMarkAsAdjustLoading(true);

      // Get userId from browser storage
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");

      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }

      // Prepare request body for PUT request
      const requestBody = {
        id: selectedAdjustment.id,
        rawMaterialId: parseInt(
          selectedAdjustment.productCode.replace("MAT", "")
        ), // Extract ID from product code
        rawMaterialName: selectedAdjustment.productName,
        changeQuantity: selectedAdjustment.adjustmentQty,
        beforeQuantity: selectedAdjustment.systemQty,
        afterQuantity: selectedAdjustment.physicalQty,
        reasonForAdjust: selectedAdjustment.reason,
        remarks: selectedAdjustment.remarks,
        status: "approved", // Mark as approved
        approvedBy: userId,
        approvedByName: "Current User", // You might want to get this from user context
        addedBy: selectedAdjustment.storekeeperName, // Original creator
        addedByName: selectedAdjustment.storekeeperName,
      };

      console.log("Marking adjustment as approved:", requestBody);

      // Make PUT request to backend
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/stock-adjustments/${selectedAdjustment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("Adjustment marked as approved successfully:", responseData);

      // Refresh the adjustments list from the backend
      const refreshResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/stock-adjustments`
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const mappedAdjustments = refreshData.map((adjustment) => ({
          id: adjustment.id,
          adjustmentId: `ADJ-${adjustment.id}`,
          date: adjustment.createdAt.split("T")[0],
          productName: adjustment.rawMaterialName,
          productCode: `MAT${String(adjustment.rawMaterialId).padStart(
            3,
            "0"
          )}`,
          batchNo: `BATCH-${adjustment.rawMaterialId}`,
          systemQty: adjustment.beforeQuantity,
          physicalQty: adjustment.afterQuantity,
          adjustmentQty: adjustment.changeQuantity,
          adjustmentType:
            adjustment.changeQuantity > 0
              ? "Gain"
              : adjustment.changeQuantity < 0
                ? "Loss"
                : "No Change",
          reason: adjustment.reasonForAdjust,
          status:
            adjustment.status.charAt(0).toUpperCase() +
            adjustment.status.slice(1),
          storekeeperName: adjustment.addedByName || "Unknown",
          remarks: adjustment.remarks || "",
          adminRemarks: adjustment.approvedByName
            ? `Approved by ${adjustment.approvedByName}`
            : "",
          submittedAt: adjustment.createdAt,
          reviewedAt: adjustment.updatedAt,
          reviewedBy: adjustment.approvedByName,
        }));
        setAdjustments(mappedAdjustments);
      }

      alert("Stock adjustment marked as approved successfully!");
      setShowViewModal(false);
    } catch (error) {
      console.error("Failed to mark adjustment as approved:", error);
      alert(`Failed to mark adjustment as approved: ${error.message}`);
    } finally {
      setMarkAsAdjustLoading(false);
    }
  };

  const filteredAdjustments = getFilteredAdjustments();

  // Count by status
  const statusCounts = {
    pending: adjustments.filter((adj) => adj.status === "Pending").length,
    approved: adjustments.filter((adj) => adj.status === "Approved").length,
    rejected: adjustments.filter((adj) => adj.status === "Rejected").length,
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <StorekeeperSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StorekeeperNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
              Stock Adjustments
            </h1>
            <p className="text-[14px] text-[#667085]">
              Correct inventory discrepancies between system records and
              physical stock
            </p>
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
                  placeholder="Search by adjustment ID, product, or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                />
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 border border-[#E4E6EA] rounded-md text-[14px] text-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Create New Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#1366D9] transition-colors"
              >
                <Plus size={16} />
                New Adjustment
              </button>
            </div>
          </div>

          {/* Adjustments Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Stock Adjustments
              </h3>
              <span className="text-[12px] text-[#667085] mt-2 sm:mt-0">
                Showing {filteredAdjustments.length} adjustments
              </span>
            </div>

             {loadingAdjustments ? (
              <Loader variant="section" text="Loading stock adjustments..." />
            ) : adjustmentsError ? (
              <div className="text-center py-12">
                <AlertTriangle
                  size={48}
                  className="mx-auto text-[#EF4444] mb-4"
                />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  Error loading adjustments
                </p>
                <p className="text-[14px] text-[#667085] mb-4">
                  {adjustmentsError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredAdjustments.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No adjustments found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No adjustments match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Adjustment ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Product & Batch
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        System Qty
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Physical Qty
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Adjustment
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Reason
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
                    {filteredAdjustments.map((adjustment) => (
                      <tr
                        key={adjustment.id}
                        className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[600] text-[#383E49]">
                              {adjustment.adjustmentId}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              {new Date(adjustment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[500] text-[#383E49]">
                              {adjustment.productName}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              Code: {adjustment.productCode}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              Batch: {adjustment.batchNo}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-[#383E49]">
                            {formatQuantity(adjustment.systemQty)}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-[#383E49]">
                            {formatQuantity(adjustment.physicalQty)}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {adjustment.adjustmentQty > 0 ? (
                              <TrendingUp
                                size={16}
                                className="text-[#51CC5D]"
                              />
                            ) : adjustment.adjustmentQty < 0 ? (
                              <TrendingDown
                                size={16}
                                className="text-[#EF4444]"
                              />
                            ) : (
                              <Minus size={16} className="text-[#667085]" />
                            )}
                            <span
                              className={`text-[14px] font-[600] ${adjustment.adjustmentQty > 0
                                  ? "text-[#51CC5D]"
                                  : adjustment.adjustmentQty < 0
                                    ? "text-[#EF4444]"
                                    : "text-[#667085]"
                                }`}
                            >
                              {adjustment.adjustmentQty > 0 ? "+" : ""}
                              {formatQuantity(adjustment.adjustmentQty)}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#667085] mt-1">
                            {adjustment.adjustmentType}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">
                            {adjustment.reason}
                          </p>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${adjustment.status === "Pending"
                                ? "bg-[#FFF4E6] text-[#F4A100]"
                                : adjustment.status === "Approved"
                                  ? "bg-[#DDFFE0] text-[#51CC5D]"
                                  : adjustment.status === "Rejected"
                                    ? "bg-[#FEE2E2] text-[#EF4444]"
                                    : "bg-[#E4E6EA] text-[#667085]"
                              }`}
                          >
                            {adjustment.status === "Pending" && (
                              <Clock size={10} className="mr-1" />
                            )}
                            {adjustment.status === "Approved" && (
                              <CheckCircle2 size={10} className="mr-1" />
                            )}
                            {adjustment.status === "Rejected" && (
                              <AlertTriangle size={10} className="mr-1" />
                            )}
                            {adjustment.status}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleViewDetails(adjustment)}
                            className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
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

      {/* Create Adjustment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <h2 className="text-[20px] font-[600] text-[#383E49]">
                Create Stock Adjustment
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date */}
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Adjustment Date *
                </label>
                <input
                  type="date"
                  value={newAdjustment.date}
                  onChange={(e) =>
                    setNewAdjustment({ ...newAdjustment, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                />
              </div>

              {/* Product Selection (Searchable Combobox) */}
              <div className="relative">
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Raw Material *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      loadingProducts
                        ? "Loading raw materials..."
                        : "Type to search raw material (e.g. Sunflower Oil)..."
                    }
                    value={
                      materialSearchTerm !== ""
                        ? materialSearchTerm
                        : getSelectedProduct()
                        ? `${getSelectedProduct().code} - ${getSelectedProduct().name} ${getSelectedProduct().brand ? `(${getSelectedProduct().brand})` : ""}`
                        : ""
                    }
                    onChange={(e) => {
                      setMaterialSearchTerm(e.target.value);
                      setShowMaterialDropdown(true);
                      if (newAdjustment.productId) {
                        setNewAdjustment({ ...newAdjustment, productId: "", batchNo: "" });
                      }
                    }}
                    onFocus={() => setShowMaterialDropdown(true)}
                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white pr-10"
                    disabled={loadingProducts}
                  />
                  {(materialSearchTerm || newAdjustment.productId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMaterialSearchTerm("");
                        setNewAdjustment({ ...newAdjustment, productId: "", batchNo: "" });
                        setShowMaterialDropdown(true);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[#667085] hover:text-[#383E49]"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {showMaterialDropdown && !loadingProducts && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E4E6EA] rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {products.filter((product) => {
                      if (!materialSearchTerm) return true;
                      const term = materialSearchTerm.toLowerCase();
                      const code = (product.code || "").toLowerCase();
                      const name = (product.name || "").toLowerCase();
                      const brand = (product.brand || "").toLowerCase();
                      return code.includes(term) || name.includes(term) || brand.includes(term);
                    }).length === 0 ? (
                      <div className="px-4 py-3 text-[14px] text-[#667085] italic">
                        No matching raw materials found
                      </div>
                    ) : (
                      products
                        .filter((product) => {
                          if (!materialSearchTerm) return true;
                          const term = materialSearchTerm.toLowerCase();
                          const code = (product.code || "").toLowerCase();
                          const name = (product.name || "").toLowerCase();
                          const brand = (product.brand || "").toLowerCase();
                          return code.includes(term) || name.includes(term) || brand.includes(term);
                        })
                        .map((product) => {
                          const label = `${product.code} - ${product.name} ${product.brand ? `(${product.brand})` : ""}`;
                          return (
                            <div
                              key={product.id}
                              onClick={() => {
                                setNewAdjustment({
                                  ...newAdjustment,
                                  productId: String(product.id),
                                  batchNo: "",
                                });
                                setMaterialSearchTerm(label);
                                setShowMaterialDropdown(false);
                              }}
                              className={`px-4 py-2.5 hover:bg-[#EBF8FF] cursor-pointer text-[14px] border-b border-gray-50 last:border-0 ${
                                String(product.id) === String(newAdjustment.productId)
                                  ? "bg-[#EBF8FF] font-[600] text-[#0F50AA]"
                                  : "text-[#383E49]"
                              }`}
                            >
                              <p className="font-[500]">{product.code} - {product.name}</p>
                              {product.brand && (
                                <p className="text-[12px] text-[#667085]">Brand: {product.brand}</p>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {productsError && (
                  <p className="text-red-500 text-sm mt-1">
                    Error loading materials: {productsError}
                  </p>
                )}
              </div>

              {/* Batch Selection */}
              {newAdjustment.productId && (
                <div>
                  <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                    Batch/Lot Number *
                  </label>
                  <select
                    value={newAdjustment.batchNo}
                    onChange={(e) =>
                      setNewAdjustment({
                        ...newAdjustment,
                        batchNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                  >
                    <option value="">Select Batch/Lot</option>
                    {getSelectedProduct()?.batches.map((batch) => (
                      <option key={batch.batchNo} value={batch.batchNo}>
                        {batch.batchNo} (Qty: {formatQuantity(batch.quantity)}, Exp:{" "}
                        {new Date(batch.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* System Stock Details */}
              {getSelectedBatch() && (
                <div className="bg-[#F8F9FA] p-4 rounded-lg">
                  <h4 className="text-[14px] font-[600] text-[#383E49] mb-2">
                    Current System Stock
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[14px]">
                    <div>
                      <span className="text-[#667085]">System Quantity:</span>
                      <span className="font-[600] text-[#383E49] ml-2">
                        {formatQuantity(getSelectedBatch().quantity)}{" "}
                        {getSelectedProduct().unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#667085]">Expiry Date:</span>
                      <span className="font-[600] text-[#383E49] ml-2">
                        {new Date(
                          getSelectedBatch().expiryDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[14px] mt-2">
                    <div>
                      <span className="text-[#667085]">Min Quantity:</span>
                      <span className="font-[600] text-[#383E49] ml-2">
                        {getSelectedProduct().minQty}{" "}
                        {getSelectedProduct().unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#667085]">Unit Cost:</span>
                      <span className="font-[600] text-[#383E49] ml-2">
                        Rs. {getSelectedProduct().unitCost}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Count */}
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Physical Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter actual counted quantity"
                  value={newAdjustment.physicalQty}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      physicalQty: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                />
              </div>

              {/* Adjustment Summary */}
              {newAdjustment.physicalQty && getSelectedBatch() && (
                <div className="bg-[#EBF8FF] p-4 rounded-lg">
                  <h4 className="text-[14px] font-[600] text-[#383E49] mb-2">
                    Adjustment Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-[14px]">
                    <div>
                      <span className="text-[#667085]">Adjustment Qty:</span>
                      <div
                        className={`font-[600] ${getAdjustmentDetails().adjustmentQty > 0
                            ? "text-[#51CC5D]"
                            : getAdjustmentDetails().adjustmentQty < 0
                              ? "text-[#EF4444]"
                              : "text-[#667085]"
                          }`}
                      >
                        {getAdjustmentDetails().adjustmentQty > 0 ? "+" : ""}
                        {formatQuantity(getAdjustmentDetails().adjustmentQty)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#667085]">Type:</span>
                      <div className="font-[600] text-[#383E49]">
                        {getAdjustmentDetails().adjustmentType}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#667085]">Unit:</span>
                      <div className="font-[600] text-[#383E49]">
                        {getSelectedProduct().unit}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Reason for Adjustment *
                </label>
                <select
                  value={newAdjustment.reason}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                >
                  <option value="">Select Reason</option>
                  <option value="LOSS">Loss</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="COUNTING_ERROR">Counting Error</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Remarks
                </label>
                <textarea
                  placeholder="Additional notes or explanation for the adjustment"
                  value={newAdjustment.remarks}
                  onChange={(e) =>
                    setNewAdjustment({
                      ...newAdjustment,
                      remarks: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center gap-3 p-6 border-t border-[#E4E6EA]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] hover:bg-[#F8F9FA] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdjustment}
                className="px-4 py-2 text-[14px] font-[500] text-white bg-[#0F50AA] hover:bg-[#1366D9] rounded-md transition-colors"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-[#E4E6EA] gap-4">
              {/* Title & Info */}
              <div className="text-center sm:text-left">
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Stock Adjustment Details
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  {selectedAdjustment.adjustmentId}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => alert("Downloading adjustment report...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>

                <button
                  onClick={() => alert("Printing adjustment record...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>

                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#667085]" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-lg mb-6 ${selectedAdjustment.status === "Pending"
                    ? "bg-[#FFF4E6] border border-[#F4A100]"
                    : selectedAdjustment.status === "Approved"
                      ? "bg-[#DDFFE0] border border-[#51CC5D]"
                      : selectedAdjustment.status === "Rejected"
                        ? "bg-[#FEE2E2] border border-[#EF4444]"
                        : "bg-[#F8F9FA] border border-[#E4E6EA]"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {selectedAdjustment.status === "Pending" && (
                    <Clock size={20} className="text-[#F4A100]" />
                  )}
                  {selectedAdjustment.status === "Approved" && (
                    <CheckCircle2 size={20} className="text-[#51CC5D]" />
                  )}
                  {selectedAdjustment.status === "Rejected" && (
                    <AlertTriangle size={20} className="text-[#EF4444]" />
                  )}
                  <span
                    className={`text-[16px] font-[600] ${selectedAdjustment.status === "Pending"
                        ? "text-[#F4A100]"
                        : selectedAdjustment.status === "Approved"
                          ? "text-[#51CC5D]"
                          : selectedAdjustment.status === "Rejected"
                            ? "text-[#EF4444]"
                            : "text-[#667085]"
                      }`}
                  >
                    {selectedAdjustment.status}
                  </span>
                </div>
                {selectedAdjustment.status === "Pending" && (
                  <p className="text-[14px] text-[#667085] mt-1">
                    This adjustment is awaiting admin approval
                  </p>
                )}
                {selectedAdjustment.status === "Approved" &&
                  selectedAdjustment.adminRemarks && (
                    <p className="text-[14px] text-[#667085] mt-1">
                      Admin: {selectedAdjustment.adminRemarks}
                    </p>
                  )}
                {selectedAdjustment.status === "Rejected" &&
                  selectedAdjustment.adminRemarks && (
                    <p className="text-[14px] text-[#667085] mt-1">
                      Rejection reason: {selectedAdjustment.adminRemarks}
                    </p>
                  )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="text-[16px] font-[600] text-[#383E49]">
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[12px] font-[500] text-[#667085] uppercase">
                        Adjustment Date
                      </span>
                      <p className="text-[14px] font-[500] text-[#383E49]">
                        {new Date(selectedAdjustment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-[#667085] uppercase">
                        Submitted By
                      </span>
                      <p className="text-[14px] font-[500] text-[#383E49]">
                        {selectedAdjustment.storekeeperName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-[#667085] uppercase">
                        Submitted At
                      </span>
                      <p className="text-[14px] font-[500] text-[#383E49]">
                        {new Date(
                          selectedAdjustment.submittedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[16px] font-[600] text-[#383E49]">
                    Review Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[12px] font-[500] text-[#667085] uppercase">
                        Reviewed By
                      </span>
                      <p className="text-[14px] font-[500] text-[#383E49]">
                        {selectedAdjustment.reviewedBy || "Pending"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-[#667085] uppercase">
                        Reviewed At
                      </span>
                      <p className="text-[14px] font-[500] text-[#383E49]">
                        {selectedAdjustment.reviewedAt
                          ? new Date(
                            selectedAdjustment.reviewedAt
                          ).toLocaleString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-[#F8F9FA] p-4 rounded-lg mb-6">
                <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                  Product Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      Product
                    </span>
                    <p className="text-[14px] font-[600] text-[#383E49]">
                      {selectedAdjustment.productName}
                    </p>
                    <p className="text-[12px] text-[#667085]">
                      Code: {selectedAdjustment.productCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      Batch/Lot
                    </span>
                    <p className="text-[14px] font-[600] text-[#383E49]">
                      {selectedAdjustment.batchNo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustment Details */}
              <div className="bg-[#EBF8FF] p-4 rounded-lg mb-6">
                <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                  Adjustment Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      System Quantity
                    </span>
                    <p className="text-[18px] font-[700] text-[#383E49]">
                      {selectedAdjustment.systemQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      Physical Quantity
                    </span>
                    <p className="text-[18px] font-[700] text-[#383E49]">
                      {selectedAdjustment.physicalQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      Adjustment
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedAdjustment.adjustmentQty > 0 ? (
                        <TrendingUp size={16} className="text-[#51CC5D]" />
                      ) : selectedAdjustment.adjustmentQty < 0 ? (
                        <TrendingDown size={16} className="text-[#EF4444]" />
                      ) : (
                        <Minus size={16} className="text-[#667085]" />
                      )}
                      <span
                        className={`text-[18px] font-[700] ${selectedAdjustment.adjustmentQty > 0
                            ? "text-[#51CC5D]"
                            : selectedAdjustment.adjustmentQty < 0
                              ? "text-[#EF4444]"
                              : "text-[#667085]"
                          }`}
                      >
                        {selectedAdjustment.adjustmentQty > 0 ? "+" : ""}
                        {selectedAdjustment.adjustmentQty}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#667085]">
                      {selectedAdjustment.adjustmentType}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-[#667085] uppercase">
                      Reason
                    </span>
                    <p className="text-[14px] font-[600] text-[#383E49]">
                      {selectedAdjustment.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedAdjustment.remarks && (
                <div className="mb-6">
                  <h4 className="text-[16px] font-[600] text-[#383E49] mb-2">
                    Storekeeper Remarks
                  </h4>
                  <div className="bg-[#F8F9FA] p-4 rounded-lg">
                    <p className="text-[14px] text-[#383E49]">
                      {selectedAdjustment.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Remarks */}
              {selectedAdjustment.adminRemarks && (
                <div>
                  <h4 className="text-[16px] font-[600] text-[#383E49] mb-2">
                    Admin Remarks
                  </h4>
                  <div className="bg-[#F8F9FA] p-4 rounded-lg">
                    <p className="text-[14px] text-[#383E49]">
                      {selectedAdjustment.adminRemarks}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-[#E4E6EA]">
              {/* Mark As Adjust Button - Only show for approved adjustments */}
              {selectedAdjustment.status === "Approved" && (
                <button
                  onClick={handleMarkAsAdjust}
                  disabled={markAsAdjustLoading}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] font-[500] text-white bg-[#199D26] hover:bg-[#15803D] disabled:bg-[#94D3A2] disabled:cursor-not-allowed rounded-md transition-colors"
                >
                   {markAsAdjustLoading ? (
                    <>
                      <Loader variant="inline" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Mark As Adjust
                    </>
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] hover:bg-[#F8F9FA] rounded-md transition-colors"
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
