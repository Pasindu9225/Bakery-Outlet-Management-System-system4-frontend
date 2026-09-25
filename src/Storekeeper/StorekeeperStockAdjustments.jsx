import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // Get userId from browser storage
      const userId =
        localStorage.getItem("userId") || sessionStorage.getItem("userId");

      if (!userId) {
        toast.error("User ID not found. Please log in again.");
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

      toast.success("Stock adjustment submitted for approval successfully!");
    } catch (error) {
      console.error("Failed to create stock adjustment:", error);
      toast.error(`Failed to submit stock adjustment: ${error.message}`);
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
        toast.error("User ID not found. Please log in again.");
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

      toast.success("Stock adjustment marked as approved successfully!");
      setShowViewModal(false);
    } catch (error) {
      console.error("Failed to mark adjustment as approved:", error);
      toast.error(`Failed to mark adjustment as approved: ${error.message}`);
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
    <div className="flex bg-app h-screen overflow-hidden">
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
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              Stock Adjustments
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Correct inventory discrepancies between system records and
              physical stock
            </p>
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
                  placeholder="Search by adjustment ID, product, or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                />
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-auto px-4 py-2 border border-line rounded-md text-[14px] text-fg-secondary focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
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
                className="flex items-center gap-2 px-4 py-2 bg-brand text-on-brand text-[14px] font-[500] rounded-md hover:bg-brand-hover transition-colors"
              >
                <Plus size={16} />
                New Adjustment
              </button>
            </div>
          </div>

          {/* Adjustments Table */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-fg">
                Stock Adjustments
              </h3>
              <span className="text-[12px] text-fg-secondary mt-2 sm:mt-0">
                Showing {filteredAdjustments.length} adjustments
              </span>
            </div>

             {loadingAdjustments ? (
              <Loader variant="section" text="Loading stock adjustments..." />
            ) : adjustmentsError ? (
              <div className="text-center py-12">
                <AlertTriangle
                  size={48}
                  className="mx-auto text-error mb-4"
                />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  Error loading adjustments
                </p>
                <p className="text-[14px] text-fg-secondary mb-4">
                  {adjustmentsError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredAdjustments.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-fg-secondary mb-4" />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  No adjustments found
                </p>
                <p className="text-[14px] text-fg-secondary">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No adjustments match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Adjustment ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Product & Batch
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        System Qty
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Physical Qty
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Adjustment
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Reason
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
                    {filteredAdjustments.map((adjustment) => (
                      <tr
                        key={adjustment.id}
                        className="border-b border-line hover:bg-subtle"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[600] text-fg">
                              {adjustment.adjustmentId}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              {new Date(adjustment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[500] text-fg">
                              {adjustment.productName}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              Code: {adjustment.productCode}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              Batch: {adjustment.batchNo}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-fg">
                            {formatQuantity(adjustment.systemQty)}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-fg">
                            {formatQuantity(adjustment.physicalQty)}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {adjustment.adjustmentQty > 0 ? (
                              <TrendingUp
                                size={16}
                                className="text-success"
                              />
                            ) : adjustment.adjustmentQty < 0 ? (
                              <TrendingDown
                                size={16}
                                className="text-error"
                              />
                            ) : (
                              <Minus size={16} className="text-fg-secondary" />
                            )}
                            <span
                              className={`text-[14px] font-[600] ${adjustment.adjustmentQty > 0
                                  ? "text-success"
                                  : adjustment.adjustmentQty < 0
                                    ? "text-error"
                                    : "text-fg-secondary"
                                }`}
                            >
                              {adjustment.adjustmentQty > 0 ? "+" : ""}
                              {formatQuantity(adjustment.adjustmentQty)}
                            </span>
                          </div>
                          <p className="text-[10px] text-fg-secondary mt-1">
                            {adjustment.adjustmentType}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-fg">
                            {adjustment.reason}
                          </p>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${adjustment.status === "Pending"
                                ? "bg-hover text-warning"
                                : adjustment.status === "Approved"
                                  ? "bg-hover text-success"
                                  : adjustment.status === "Rejected"
                                    ? "bg-hover text-error"
                                    : "bg-line text-fg-secondary"
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
                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="text-[20px] font-[600] text-fg">
                Create Stock Adjustment
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-subtle rounded-lg transition-colors"
              >
                <X size={20} className="text-fg-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Date */}
              <div>
                <label className="block text-[14px] font-[500] text-fg mb-2">
                  Adjustment Date *
                </label>
                <input
                  type="date"
                  value={newAdjustment.date}
                  onChange={(e) =>
                    setNewAdjustment({ ...newAdjustment, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                />
              </div>

              {/* Product Selection (Searchable Combobox) */}
              <div className="relative">
                <label className="block text-[14px] font-[500] text-fg mb-2">
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
                    className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface pr-10"
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
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-fg-secondary hover:text-fg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {showMaterialDropdown && !loadingProducts && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-elevated border border-line rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {products.filter((product) => {
                      if (!materialSearchTerm) return true;
                      const term = materialSearchTerm.toLowerCase();
                      const code = (product.code || "").toLowerCase();
                      const name = (product.name || "").toLowerCase();
                      const brand = (product.brand || "").toLowerCase();
                      return code.includes(term) || name.includes(term) || brand.includes(term);
                    }).length === 0 ? (
                      <div className="px-4 py-3 text-[14px] text-fg-secondary italic">
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
                              className={`px-4 py-2.5 hover:bg-hover cursor-pointer text-[14px] border-b border-line last:border-0 ${
                                String(product.id) === String(newAdjustment.productId)
                                  ? "bg-hover font-[600] text-brand-fg"
                                  : "text-fg"
                              }`}
                            >
                              <p className="font-[500]">{product.code} - {product.name}</p>
                              {product.brand && (
                                <p className="text-[12px] text-fg-secondary">Brand: {product.brand}</p>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {productsError && (
                  <p className="text-error text-sm mt-1">
                    Error loading materials: {productsError}
                  </p>
                )}
              </div>

              {/* Batch Selection */}
              {newAdjustment.productId && (
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-2">
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
                    className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
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
                <div className="bg-subtle p-4 rounded-lg">
                  <h4 className="text-[14px] font-[600] text-fg mb-2">
                    Current System Stock
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[14px]">
                    <div>
                      <span className="text-fg-secondary">System Quantity:</span>
                      <span className="font-[600] text-fg ml-2">
                        {formatQuantity(getSelectedBatch().quantity)}{" "}
                        {getSelectedProduct().unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-fg-secondary">Expiry Date:</span>
                      <span className="font-[600] text-fg ml-2">
                        {new Date(
                          getSelectedBatch().expiryDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[14px] mt-2">
                    <div>
                      <span className="text-fg-secondary">Min Quantity:</span>
                      <span className="font-[600] text-fg ml-2">
                        {getSelectedProduct().minQty}{" "}
                        {getSelectedProduct().unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-fg-secondary">Unit Cost:</span>
                      <span className="font-[600] text-fg ml-2">
                        Rs. {getSelectedProduct().unitCost}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Count */}
              <div>
                <label className="block text-[14px] font-[500] text-fg mb-2">
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
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                />
              </div>

              {/* Adjustment Summary */}
              {newAdjustment.physicalQty && getSelectedBatch() && (
                <div className="bg-hover p-4 rounded-lg">
                  <h4 className="text-[14px] font-[600] text-fg mb-2">
                    Adjustment Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-[14px]">
                    <div>
                      <span className="text-fg-secondary">Adjustment Qty:</span>
                      <div
                        className={`font-[600] ${getAdjustmentDetails().adjustmentQty > 0
                            ? "text-success"
                            : getAdjustmentDetails().adjustmentQty < 0
                              ? "text-error"
                              : "text-fg-secondary"
                          }`}
                      >
                        {getAdjustmentDetails().adjustmentQty > 0 ? "+" : ""}
                        {formatQuantity(getAdjustmentDetails().adjustmentQty)}
                      </div>
                    </div>
                    <div>
                      <span className="text-fg-secondary">Type:</span>
                      <div className="font-[600] text-fg">
                        {getAdjustmentDetails().adjustmentType}
                      </div>
                    </div>
                    <div>
                      <span className="text-fg-secondary">Unit:</span>
                      <div className="font-[600] text-fg">
                        {getSelectedProduct().unit}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-[14px] font-[500] text-fg mb-2">
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
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
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
                <label className="block text-[14px] font-[500] text-fg mb-2">
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
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center gap-3 p-6 border-t border-line">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdjustment}
                className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-brand hover:bg-brand-hover rounded-md transition-colors"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-line gap-4">
              {/* Title & Info */}
              <div className="text-center sm:text-left">
                <h2 className="text-[20px] font-[600] text-fg">
                  Stock Adjustment Details
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  {selectedAdjustment.adjustmentId}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => toast("Downloading adjustment report...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-brand-fg bg-hover hover:bg-line rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>

                <button
                  onClick={() => toast("Printing adjustment record...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-brand-fg bg-hover hover:bg-line rounded-lg transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>

                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-subtle rounded-lg transition-colors"
                >
                  <X size={20} className="text-fg-secondary" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-lg mb-6 ${selectedAdjustment.status === "Pending"
                    ? "bg-hover border border-warning"
                    : selectedAdjustment.status === "Approved"
                      ? "bg-hover border border-success"
                      : selectedAdjustment.status === "Rejected"
                        ? "bg-hover border border-error"
                        : "bg-subtle border border-line"
                  }`}
              >
                <div className="flex items-center gap-2">
                  {selectedAdjustment.status === "Pending" && (
                    <Clock size={20} className="text-warning" />
                  )}
                  {selectedAdjustment.status === "Approved" && (
                    <CheckCircle2 size={20} className="text-success" />
                  )}
                  {selectedAdjustment.status === "Rejected" && (
                    <AlertTriangle size={20} className="text-error" />
                  )}
                  <span
                    className={`text-[16px] font-[600] ${selectedAdjustment.status === "Pending"
                        ? "text-warning"
                        : selectedAdjustment.status === "Approved"
                          ? "text-success"
                          : selectedAdjustment.status === "Rejected"
                            ? "text-error"
                            : "text-fg-secondary"
                      }`}
                  >
                    {selectedAdjustment.status}
                  </span>
                </div>
                {selectedAdjustment.status === "Pending" && (
                  <p className="text-[14px] text-fg-secondary mt-1">
                    This adjustment is awaiting admin approval
                  </p>
                )}
                {selectedAdjustment.status === "Approved" &&
                  selectedAdjustment.adminRemarks && (
                    <p className="text-[14px] text-fg-secondary mt-1">
                      Admin: {selectedAdjustment.adminRemarks}
                    </p>
                  )}
                {selectedAdjustment.status === "Rejected" &&
                  selectedAdjustment.adminRemarks && (
                    <p className="text-[14px] text-fg-secondary mt-1">
                      Rejection reason: {selectedAdjustment.adminRemarks}
                    </p>
                  )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="text-[16px] font-[600] text-fg">
                    Basic Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                        Adjustment Date
                      </span>
                      <p className="text-[14px] font-[500] text-fg">
                        {new Date(selectedAdjustment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                        Submitted By
                      </span>
                      <p className="text-[14px] font-[500] text-fg">
                        {selectedAdjustment.storekeeperName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                        Submitted At
                      </span>
                      <p className="text-[14px] font-[500] text-fg">
                        {new Date(
                          selectedAdjustment.submittedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[16px] font-[600] text-fg">
                    Review Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                        Reviewed By
                      </span>
                      <p className="text-[14px] font-[500] text-fg">
                        {selectedAdjustment.reviewedBy || "Pending"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                        Reviewed At
                      </span>
                      <p className="text-[14px] font-[500] text-fg">
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
              <div className="bg-subtle p-4 rounded-lg mb-6">
                <h4 className="text-[16px] font-[600] text-fg mb-4">
                  Product Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      Product
                    </span>
                    <p className="text-[14px] font-[600] text-fg">
                      {selectedAdjustment.productName}
                    </p>
                    <p className="text-[12px] text-fg-secondary">
                      Code: {selectedAdjustment.productCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      Batch/Lot
                    </span>
                    <p className="text-[14px] font-[600] text-fg">
                      {selectedAdjustment.batchNo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustment Details */}
              <div className="bg-hover p-4 rounded-lg mb-6">
                <h4 className="text-[16px] font-[600] text-fg mb-4">
                  Adjustment Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      System Quantity
                    </span>
                    <p className="text-[18px] font-[700] text-fg">
                      {selectedAdjustment.systemQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      Physical Quantity
                    </span>
                    <p className="text-[18px] font-[700] text-fg">
                      {selectedAdjustment.physicalQty}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      Adjustment
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedAdjustment.adjustmentQty > 0 ? (
                        <TrendingUp size={16} className="text-success" />
                      ) : selectedAdjustment.adjustmentQty < 0 ? (
                        <TrendingDown size={16} className="text-error" />
                      ) : (
                        <Minus size={16} className="text-fg-secondary" />
                      )}
                      <span
                        className={`text-[18px] font-[700] ${selectedAdjustment.adjustmentQty > 0
                            ? "text-success"
                            : selectedAdjustment.adjustmentQty < 0
                              ? "text-error"
                              : "text-fg-secondary"
                          }`}
                      >
                        {selectedAdjustment.adjustmentQty > 0 ? "+" : ""}
                        {selectedAdjustment.adjustmentQty}
                      </span>
                    </div>
                    <p className="text-[12px] text-fg-secondary">
                      {selectedAdjustment.adjustmentType}
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] font-[500] text-fg-secondary uppercase">
                      Reason
                    </span>
                    <p className="text-[14px] font-[600] text-fg">
                      {selectedAdjustment.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedAdjustment.remarks && (
                <div className="mb-6">
                  <h4 className="text-[16px] font-[600] text-fg mb-2">
                    Storekeeper Remarks
                  </h4>
                  <div className="bg-subtle p-4 rounded-lg">
                    <p className="text-[14px] text-fg">
                      {selectedAdjustment.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Remarks */}
              {selectedAdjustment.adminRemarks && (
                <div>
                  <h4 className="text-[16px] font-[600] text-fg mb-2">
                    Admin Remarks
                  </h4>
                  <div className="bg-subtle p-4 rounded-lg">
                    <p className="text-[14px] text-fg">
                      {selectedAdjustment.adminRemarks}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-line">
              {/* Mark As Adjust Button - Only show for approved adjustments */}
              {selectedAdjustment.status === "Approved" && (
                <button
                  onClick={handleMarkAsAdjust}
                  disabled={markAsAdjustLoading}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] font-[500] text-on-brand bg-success-solid hover:bg-success-solid disabled:bg-success-solid disabled:cursor-not-allowed rounded-md transition-colors"
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
                className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
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
