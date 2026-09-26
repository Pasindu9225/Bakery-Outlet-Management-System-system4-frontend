import React, { useState, useEffect } from "react";
import { friendlyError } from "../utils/friendlyError";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Store,
  Save,
  RefreshCw,
  Search,
  Filter,
  X,
  Plus,
  Minus,
  Eye,
  History,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  FileText,
  Download,
  Edit3,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Equal,
  Settings,
  User,
  Warehouse,
} from "lucide-react";

import { formatQuantity } from "../utils/quantityFormatter";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function ManagerStockAdjustments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Stock Adjustments");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [stockData, setStockData] = useState([]);
  const [adjustments, setAdjustments] = useState({});
  const [remarks, setRemarks] = useState({});
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");
  const [selectedAdjustmentHistory, setSelectedAdjustmentHistory] =
    useState(null);

  // API state
  const [miniStores, setMiniStores] = useState([]);
  const [miniStoresLoading, setMiniStoresLoading] = useState(false);
  const [miniStoresError, setMiniStoresError] = useState(null);
  const [stockItemsLoading, setStockItemsLoading] = useState(false);
  const [stockItemsError, setStockItemsError] = useState(null);

  // Fetch mini stores on component mount
  useEffect(() => {
    fetchMiniStores();
  }, []);

  // Fetch mini stores from API
  const fetchMiniStores = async () => {
    setMiniStoresLoading(true);
    setMiniStoresError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/mini-stores`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMiniStores(data);
    } catch (err) {
      console.error("Error fetching mini stores:", err);
      setMiniStoresError(friendlyError(err));
    } finally {
      setMiniStoresLoading(false);
    }
  };

  // Fetch stock items for selected mini store
  const fetchStockItems = async (miniStoreId) => {
    setStockItemsLoading(true);
    setStockItemsError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/mini-stores/${miniStoreId}/items`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error("Error fetching stock items:", err);
      setStockItemsError(friendlyError(err));
    } finally {
      setStockItemsLoading(false);
    }
  };

  // Sample adjustment history
  const [adjustmentHistory] = useState([
    {
      id: "ADJ-001",
      date: "2025-08-25",
      outlet: "Main Branch Kitchen",
      manager: "Manager A",
      totalItems: 7,
      totalVariance: -2.5,
      status: "Completed",
      items: [
        {
          itemName: "Wheat Flour",
          systemQty: 50.0,
          physicalQty: 48.5,
          variance: -1.5,
          remarks: "Minor spillage during transfer",
        },
        {
          itemName: "Sugar",
          systemQty: 25.5,
          physicalQty: 24.5,
          variance: -1.0,
          remarks: "Packaging damage",
        },
      ],
    },
    {
      id: "ADJ-002",
      date: "2025-08-24",
      outlet: "Kandy Road Outlet",
      manager: "Manager B",
      totalItems: 4,
      totalVariance: 1.5,
      status: "Completed",
      items: [
        {
          itemName: "Croissant",
          systemQty: 45.0,
          physicalQty: 47.0,
          variance: 2.0,
          remarks: "Extra production not recorded",
        },
        {
          itemName: "Chocolate Cake",
          systemQty: 8.0,
          physicalQty: 7.5,
          variance: -0.5,
          remarks: "Partial damage",
        },
      ],
    },
  ]);

  // Load stock data when mini store is selected
  useEffect(() => {
    if (selectedOutlet) {
      fetchStockItems(selectedOutlet);
      setAdjustments({});
      setRemarks({});
    } else {
      setStockData([]);
    }
  }, [selectedOutlet]);

  // Get selected mini store details
  const getSelectedOutlet = () => {
    return miniStores.find((store) => store.miniStoreId == selectedOutlet);
  };

  // Handle physical quantity change
  const handlePhysicalQtyChange = (itemId, value) => {
    const numValue = parseFloat(value) || 0;
    setAdjustments((prev) => ({
      ...prev,
      [itemId]: numValue,
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (itemId, value) => {
    setRemarks((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  // Calculate variance
  const calculateVariance = (itemId, systemQty) => {
    const physicalQty = adjustments[itemId] || 0;
    return physicalQty - systemQty;
  };

  // Get variance color and icon
  const getVarianceStyle = (variance) => {
    if (variance > 0) {
      return { color: "text-success", icon: TrendingUp, bg: "bg-hover" };
    } else if (variance < 0) {
      return {
        color: "text-error",
        icon: TrendingDown,
        bg: "bg-subtle",
      };
    } else {
      return { color: "text-fg-secondary", icon: Equal, bg: "bg-subtle" };
    }
  };

  // Check if save is enabled
  const isSaveEnabled = () => {
    return (
      selectedOutlet &&
      Object.keys(adjustments).length > 0 &&
      stockData.some((item) => {
        const itemId = item.id || item.rawMaterialId || item.productId;
        return adjustments[itemId] !== undefined;
      })
    );
  };

  // Handle save adjustment
  const handleSaveAdjustment = async () => {
    if (!isSaveEnabled()) return;

    try {
      // Prepare data for backend PUT request
      const itemsToUpdate = stockData
        .filter((item) => {
          const itemId = item.id || item.rawMaterialId || item.productId;
          return adjustments[itemId] !== undefined;
        })
        .map((item) => {
          const itemId = item.id || item.rawMaterialId || item.productId;
          return {
            name: item.name,
            rawMaterialId: item.rawMaterialId,
            systemQty: item.systemQty,
            physicalQty: adjustments[itemId] || 0,
            outletId: item.outletId,
            productId: item.productId,
          };
        });

      const requestData = {
        items: itemsToUpdate,
      };

      // Log the request body
      console.log("Request Body:", JSON.stringify(requestData, null, 2));

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/mini-stores/${selectedOutlet}/items`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      // Log the response
      console.log("Response Status:", response.status);

      let responseData = null;
      try {
        const responseText = await response.text();
        console.log("Raw Response:", responseText);

        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log(
            "Parsed Response Body:",
            JSON.stringify(responseData, null, 2)
          );
        } else {
          console.log("Empty response body");
        }
      } catch (parseError) {
        console.log("Response is not valid JSON or is empty");
        console.log("Parse error:", parseError);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Reset form
      setAdjustments({});
      setRemarks({});
      setSelectedOutlet("");
      setShowSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error saving stock adjustment:", err);
      toast.error("Failed to save stock adjustment. Please try again.");
    }
  };

  // Filter adjustment history
  const getFilteredHistory = () => {
    if (!historyFilter) return adjustmentHistory;

    return adjustmentHistory.filter(
      (record) =>
        record.outlet.toLowerCase().includes(historyFilter.toLowerCase()) ||
        record.manager.toLowerCase().includes(historyFilter.toLowerCase()) ||
        record.id.toLowerCase().includes(historyFilter.toLowerCase())
    );
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showSaveSuccess) return null;

    return (
      <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-hover rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h3 className="text-[18px] font-[600] text-fg mb-2">
              Stock Adjustment Saved Successfully!
            </h3>
            <p className="text-[14px] text-fg-secondary">
              Your stock adjustment record has been saved for audit and MIS
              reporting purposes.
            </p>
            <button
              onClick={() => setShowSaveSuccess(false)}
              className="mt-6 w-full px-4 py-2 bg-brand text-on-brand text-[14px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  // History Detail Modal Component
  const HistoryDetailModal = ({ record, onClose }) => {
    if (!record) return null;

    return (
      <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-line">
            <div>
              <h3 className="text-[18px] font-[600] text-fg">
                Stock Adjustment Details
              </h3>
              <p className="text-[14px] text-fg-secondary">ID: {record.id}</p>
            </div>
            <button aria-label="Close"
              onClick={onClose}
              className="p-2 hover:bg-subtle rounded-lg transition-colors"
            >
              <X size={20} className="text-fg-secondary" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Record Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-subtle rounded-lg p-3">
                <p className="text-[12px] text-fg-secondary mb-1">Date</p>
                <p className="text-[14px] font-[600] text-fg">
                  {record.date}
                </p>
              </div>
              <div className="bg-subtle rounded-lg p-3">
                <p className="text-[12px] text-fg-secondary mb-1">Outlet</p>
                <p className="text-[14px] font-[600] text-fg">
                  {record.outlet}
                </p>
              </div>
              <div className="bg-subtle rounded-lg p-3">
                <p className="text-[12px] text-fg-secondary mb-1">Manager</p>
                <p className="text-[14px] font-[600] text-fg">
                  {record.manager}
                </p>
              </div>
              <div className="bg-subtle rounded-lg p-3">
                <p className="text-[12px] text-fg-secondary mb-1">
                  Total Variance
                </p>
                <p
                  className={`text-[14px] font-[600] ${
                    record.totalVariance >= 0
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {record.totalVariance >= 0 ? "+" : ""}
                  {formatQuantity(record.totalVariance)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-3 text-[14px] font-[500] text-fg">
                      Item Name
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-fg">
                      System Qty
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-fg">
                      Physical Qty
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-fg">
                      Variance
                    </th>
                    <th className="text-left py-3 text-[14px] font-[500] text-fg">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.items.map((item, index) => {
                    const varianceStyle = getVarianceStyle(item.variance);
                    const VarianceIcon = varianceStyle.icon;

                    return (
                      <tr key={index} className="border-b border-line">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-subtle">
                              <Package size={16} className="text-brand-fg" />
                            </div>
                            <div>
                              <p className="text-[14px] font-[500] text-fg">
                                {item.itemName}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                {item.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-[14px] text-fg">
                            {formatQuantity(item.systemQty)}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-[14px] font-[500] text-fg">
                            {formatQuantity(item.physicalQty)}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <VarianceIcon
                              size={16}
                              className={varianceStyle.color}
                            />
                            <span
                              className={`text-[14px] font-[600] ${varianceStyle.color}`}
                            >
                              {item.variance >= 0 ? "+" : ""}
                              {formatQuantity(item.variance)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-[12px] text-fg-secondary">
                            {item.remarks || "No remarks"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
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
              <h1 className="text-[20px] font-[600] text-fg mb-1">
                Mini Store Stock Adjustment
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Record physical stock counts and compare with system quantities
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-4 sm:mt-0 px-4 py-2 bg-subtle border border-line text-fg text-[14px] font-[500] rounded-lg hover:bg-app transition-colors flex items-center gap-2"
            >
              <History size={16} />
              {showHistory ? "Hide History" : "View History"}
            </button>
          </div>

          {!showHistory ? (
            <>
              {/* Stock Adjustment Form */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-subtle">
                    <Warehouse size={20} className="text-brand-fg" />
                  </div>
                  <h3 className="text-[18px] font-[600] text-fg">
                    Stock Adjustment Entry
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Select Mini Store/Outlet */}
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Select Mini Store / Outlet *
                    </label>
                    <select
                      value={selectedOutlet}
                      onChange={(e) => setSelectedOutlet(e.target.value)}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                    >
                      <option value="">
                        {miniStoresLoading
                          ? "Loading mini stores..."
                          : miniStoresError
                          ? "Error loading stores..."
                          : "Choose mini store to verify stock..."}
                      </option>
                      {!miniStoresLoading &&
                        !miniStoresError &&
                        miniStores.map((store) => (
                          <option
                            key={store.miniStoreId}
                            value={store.miniStoreId}
                          >
                            {store.name} - {store.storeDate}
                          </option>
                        ))}
                    </select>
                    {miniStoresError && (
                      <p className="text-[12px] text-error mt-1">
                        {miniStoresError}
                      </p>
                    )}
                  </div>

                  {/* Adjustment Date */}
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Adjustment Date
                    </label>
                    <input
                      type="date"
                      value={adjustmentDate}
                      onChange={(e) => setAdjustmentDate(e.target.value)}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                    />
                  </div>
                </div>

                {/* Selected Mini Store Info */}
                {selectedOutlet && (
                  <div className="bg-subtle border border-brand/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className="text-brand-fg" />
                      <div>
                        <h4 className="text-[14px] font-[600] text-fg">
                          {getSelectedOutlet()?.name}
                        </h4>
                        <p className="text-[12px] text-fg-secondary">
                          Store Date: {getSelectedOutlet()?.storeDate}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {stockItemsLoading && (
                  <Loader variant="section" text="Loading stock items..." />
                )}

                {/* Error State */}
                {stockItemsError && (
                  <div className="bg-subtle border border-error/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-error" />
                      <p className="text-[14px] text-error">
                        Error loading stock items: {stockItemsError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stock Adjustment Table */}
                {!stockItemsLoading &&
                  !stockItemsError &&
                  stockData.length > 0 && (
                    <div>
                      <h4 className="text-[16px] font-[600] text-fg mb-4">
                        Stock Items
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-line bg-subtle">
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-fg">
                                Item & Brand Details
                              </th>
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-fg">
                                Generic Material
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-fg">
                                System Qty
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-fg">
                                Physical Quantity
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-fg">
                                Variance
                              </th>
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-fg">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockData.map((item, index) => {
                              const itemId =
                                item.id ||
                                item.rawMaterialId ||
                                item.productId ||
                                index;
                              const variance = calculateVariance(
                                itemId,
                                item.systemQty
                              );
                              const varianceStyle = getVarianceStyle(variance);
                              const VarianceIcon = varianceStyle.icon;

                              return (
                                <tr
                                  key={itemId}
                                  className="border-b border-line hover:bg-subtle"
                                >
                                  <td className="py-4 px-3">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-subtle mt-1">
                                        <Package
                                          size={16}
                                          className="text-brand-fg"
                                        />
                                      </div>
                                      <div>
                                        <p className="text-[14px] font-[600] text-fg mb-0.5">
                                          {item.brandName && item.brandName !== "N/A" ? item.brandName : item.name}
                                        </p>
                                        <p className="text-[12px] text-fg-secondary font-[500]">
                                          {item.name}
                                        </p>
                                        <div className="flex flex-col gap-0.5 mt-1 text-[12px] text-fg-muted">
                                          <span>ID: {item.rawMaterialId || item.productId}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className="text-[13px] font-[500] text-fg bg-subtle px-2 py-1 rounded-md border border-line">
                                      {item.genericMaterialName || "N/A"}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-[14px] font-[600] text-fg">
                                        {formatQuantity(item.systemQty)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      placeholder="0.0"
                                      value={adjustments[itemId] || ""}
                                      onChange={(e) =>
                                        handlePhysicalQtyChange(
                                          itemId,
                                          e.target.value
                                        )
                                      }
                                      className="w-20 px-2 py-2 text-center border border-line rounded focus:ring-1 focus:ring-brand-fg text-[14px]"
                                    />
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    {adjustments[itemId] !== undefined ? (
                                      <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${varianceStyle.bg}`}
                                      >
                                        <VarianceIcon
                                          size={14}
                                          className={varianceStyle.color}
                                        />
                                        <span
                                          className={`text-[12px] font-[600] ${varianceStyle.color}`}
                                        >
                                          {variance >= 0 ? "+" : ""}
                                          {formatQuantity(variance)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[12px] text-fg-secondary">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 px-3">
                                    <textarea
                                      placeholder="Optional remarks..."
                                      rows="2"
                                      value={remarks[itemId] || ""}
                                      onChange={(e) =>
                                        handleRemarksChange(
                                          itemId,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-[12px] border border-line rounded focus:ring-1 focus:ring-brand-fg resize-none"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleSaveAdjustment}
                          disabled={!isSaveEnabled()}
                          className={`px-6 py-3 rounded-lg font-[500] text-[14px] flex items-center gap-2 transition-colors ${
                            isSaveEnabled()
                              ? "bg-brand text-on-brand hover:bg-brand-hover"
                              : "bg-line text-fg-secondary cursor-not-allowed"
                          }`}
                        >
                          <Save size={16} />
                          Save Stock Adjustment
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </>
          ) : (
            /* History Section */
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-hover">
                    <History size={20} className="text-warning" />
                  </div>
                  <h3 className="text-[18px] font-[600] text-fg">
                    Adjustment History
                  </h3>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                    />
                    <input
                      type="text"
                      placeholder="Search by outlet, manager, or ID..."
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {getFilteredHistory().map((record) => (
                  <div
                    key={record.id}
                    className="border border-line rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[16px] font-[600] text-fg">
                            {record.id}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-[12px] font-[500] ${
                              record.status === "Completed"
                                ? "bg-hover text-success"
                                : "bg-subtle text-error"
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-fg-secondary">
                          <span>📅 {record.date}</span>
                          <span>🏪 {record.outlet}</span>
                          <span>👤 {record.manager}</span>
                          <span>📦 {record.totalItems} items</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 lg:mt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-fg-secondary">
                            Total Variance:
                          </span>
                          <span
                            className={`text-[14px] font-[600] ${
                              record.totalVariance >= 0
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {record.totalVariance >= 0 ? "+" : ""}
                            {record.totalVariance}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedAdjustmentHistory(record)}
                          className="px-3 py-1 bg-subtle text-brand-fg text-[12px] font-[500] rounded hover:bg-hover transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-subtle rounded p-3">
                      <p className="text-[12px] text-fg-secondary mb-2">
                        Items with variances:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.items
                          .filter((item) => item.variance !== 0)
                          .map((item, index) => {
                            const varianceStyle = getVarianceStyle(
                              item.variance
                            );
                            return (
                              <span
                                key={index}
                                className={`text-[12px] px-2 py-1 rounded border ${varianceStyle.bg}`}
                              >
                                {item.itemName}: {item.variance >= 0 ? "+" : ""}
                                {item.variance}
                              </span>
                            );
                          })}
                        {record.items.filter((item) => item.variance !== 0)
                          .length === 0 && (
                          <span className="text-[12px] text-fg-secondary">
                            No variances recorded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {getFilteredHistory().length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 w-16 h-16 bg-subtle rounded-full flex items-center justify-center">
                      <FileText size={24} className="text-fg-secondary" />
                    </div>
                    <h3 className="text-[16px] font-[600] text-fg mb-2">
                      No adjustment records found
                    </h3>
                    <p className="text-[14px] text-fg-secondary">
                      {historyFilter
                        ? "Try adjusting your search criteria"
                        : "Stock adjustments will appear here once recorded"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Success Modal */}
      <SuccessModal />

      {/* History Detail Modal */}
      {selectedAdjustmentHistory && (
        <HistoryDetailModal
          record={selectedAdjustmentHistory}
          onClose={() => setSelectedAdjustmentHistory(null)}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
