import React, { useState, useEffect } from "react";
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
      setMiniStoresError(err.message);
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
      setStockItemsError(err.message);
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
      return { color: "text-[#199D26]", icon: TrendingUp, bg: "bg-[#F0FDF4]" };
    } else if (variance < 0) {
      return {
        color: "text-[#EF4444]",
        icon: TrendingDown,
        bg: "bg-[#FEF2F2]",
      };
    } else {
      return { color: "text-[#667085]", icon: Equal, bg: "bg-[#F8F9FA]" };
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
      alert("Failed to save stock adjustment. Please try again.");
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#F0FDF4] rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-[#199D26]" />
            </div>
            <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">
              Stock Adjustment Saved Successfully!
            </h3>
            <p className="text-[14px] text-[#667085]">
              Your stock adjustment record has been saved for audit and MIS
              reporting purposes.
            </p>
            <button
              onClick={() => setShowSaveSuccess(false)}
              className="mt-6 w-full px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
            <div>
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Stock Adjustment Details
              </h3>
              <p className="text-[14px] text-[#667085]">ID: {record.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#667085]" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Record Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#F8F9FA] rounded-lg p-3">
                <p className="text-[12px] text-[#667085] mb-1">Date</p>
                <p className="text-[14px] font-[600] text-[#383E49]">
                  {record.date}
                </p>
              </div>
              <div className="bg-[#F8F9FA] rounded-lg p-3">
                <p className="text-[12px] text-[#667085] mb-1">Outlet</p>
                <p className="text-[14px] font-[600] text-[#383E49]">
                  {record.outlet}
                </p>
              </div>
              <div className="bg-[#F8F9FA] rounded-lg p-3">
                <p className="text-[12px] text-[#667085] mb-1">Manager</p>
                <p className="text-[14px] font-[600] text-[#383E49]">
                  {record.manager}
                </p>
              </div>
              <div className="bg-[#F8F9FA] rounded-lg p-3">
                <p className="text-[12px] text-[#667085] mb-1">
                  Total Variance
                </p>
                <p
                  className={`text-[14px] font-[600] ${
                    record.totalVariance >= 0
                      ? "text-[#199D26]"
                      : "text-[#EF4444]"
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
                  <tr className="border-b border-[#E4E6EA]">
                    <th className="text-left py-3 text-[14px] font-[500] text-[#383E49]">
                      Item Name
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-[#383E49]">
                      System Qty
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-[#383E49]">
                      Physical Qty
                    </th>
                    <th className="text-center py-3 text-[14px] font-[500] text-[#383E49]">
                      Variance
                    </th>
                    <th className="text-left py-3 text-[14px] font-[500] text-[#383E49]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.items.map((item, index) => {
                    const varianceStyle = getVarianceStyle(item.variance);
                    const VarianceIcon = varianceStyle.icon;

                    return (
                      <tr key={index} className="border-b border-[#E4E6EA]">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#F0F8FF]">
                              <Package size={16} className="text-[#0F50AA]" />
                            </div>
                            <div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {item.itemName}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                {item.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-[14px] text-[#383E49]">
                            {formatQuantity(item.systemQty)}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-[14px] font-[500] text-[#383E49]">
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
                          <span className="text-[12px] text-[#667085]">
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
                Mini Store Stock Adjustment
              </h1>
              <p className="text-[14px] text-[#667085]">
                Record physical stock counts and compare with system quantities
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-4 sm:mt-0 px-4 py-2 bg-[#F8F9FA] border border-[#E4E6EA] text-[#383E49] text-[14px] font-[500] rounded-lg hover:bg-[#F0F1F3] transition-colors flex items-center gap-2"
            >
              <History size={16} />
              {showHistory ? "Hide History" : "View History"}
            </button>
          </div>

          {!showHistory ? (
            <>
              {/* Stock Adjustment Form */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#F0F8FF]">
                    <Warehouse size={20} className="text-[#0F50AA]" />
                  </div>
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Stock Adjustment Entry
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Select Mini Store/Outlet */}
                  <div>
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                      Select Mini Store / Outlet *
                    </label>
                    <select
                      value={selectedOutlet}
                      onChange={(e) => setSelectedOutlet(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
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
                      <p className="text-[12px] text-[#EF4444] mt-1">
                        {miniStoresError}
                      </p>
                    )}
                  </div>

                  {/* Adjustment Date */}
                  <div>
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                      Adjustment Date
                    </label>
                    <input
                      type="date"
                      value={adjustmentDate}
                      onChange={(e) => setAdjustmentDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                    />
                  </div>
                </div>

                {/* Selected Mini Store Info */}
                {selectedOutlet && (
                  <div className="bg-[#F0F8FF] border border-[#B3D9FF] rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className="text-[#0F50AA]" />
                      <div>
                        <h4 className="text-[14px] font-[600] text-[#383E49]">
                          {getSelectedOutlet()?.name}
                        </h4>
                        <p className="text-[12px] text-[#667085]">
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
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#EF4444]" />
                      <p className="text-[14px] text-[#EF4444]">
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
                      <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                        Stock Items
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-[#E4E6EA] bg-[#F8F9FA]">
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-[#383E49]">
                                Item & Brand Details
                              </th>
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-[#383E49]">
                                Generic Material
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-[#383E49]">
                                System Qty
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-[#383E49]">
                                Physical Quantity
                              </th>
                              <th className="text-center py-4 px-3 text-[14px] font-[600] text-[#383E49]">
                                Variance
                              </th>
                              <th className="text-left py-4 px-3 text-[14px] font-[600] text-[#383E49]">
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
                                  className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                                >
                                  <td className="py-4 px-3">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-[#F0F8FF] mt-1">
                                        <Package
                                          size={16}
                                          className="text-[#0F50AA]"
                                        />
                                      </div>
                                      <div>
                                        <p className="text-[14px] font-[600] text-[#383E49] mb-0.5">
                                          {item.brandName && item.brandName !== "N/A" ? item.brandName : item.name}
                                        </p>
                                        <p className="text-[12px] text-[#667085] font-[500]">
                                          {item.name}
                                        </p>
                                        <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-[#98A2B3]">
                                          <span>ID: {item.rawMaterialId || item.productId}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3">
                                    <span className="text-[13px] font-[500] text-[#475467] bg-[#F9FAFB] px-2 py-1 rounded-md border border-[#F2F4F7]">
                                      {item.genericMaterialName || "N/A"}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-[14px] font-[600] text-[#383E49]">
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
                                      className="w-20 px-2 py-2 text-center border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA] text-[14px]"
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
                                      <span className="text-[12px] text-[#667085]">
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
                                      className="w-full px-2 py-1 text-[12px] border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA] resize-none"
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
                              ? "bg-[#0F50AA] text-white hover:bg-[#0D4494]"
                              : "bg-[#E4E6EA] text-[#667085] cursor-not-allowed"
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
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FFFBEB]">
                    <History size={20} className="text-[#F4A100]" />
                  </div>
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Adjustment History
                  </h3>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                    />
                    <input
                      type="text"
                      placeholder="Search by outlet, manager, or ID..."
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {getFilteredHistory().map((record) => (
                  <div
                    key={record.id}
                    className="border border-[#E4E6EA] rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[16px] font-[600] text-[#383E49]">
                            {record.id}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-[12px] font-[500] ${
                              record.status === "Completed"
                                ? "bg-[#F0FDF4] text-[#199D26]"
                                : "bg-[#FEF2F2] text-[#EF4444]"
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-[#667085]">
                          <span>📅 {record.date}</span>
                          <span>🏪 {record.outlet}</span>
                          <span>👤 {record.manager}</span>
                          <span>📦 {record.totalItems} items</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 lg:mt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#667085]">
                            Total Variance:
                          </span>
                          <span
                            className={`text-[14px] font-[600] ${
                              record.totalVariance >= 0
                                ? "text-[#199D26]"
                                : "text-[#EF4444]"
                            }`}
                          >
                            {record.totalVariance >= 0 ? "+" : ""}
                            {record.totalVariance}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedAdjustmentHistory(record)}
                          className="px-3 py-1 bg-[#F0F8FF] text-[#0F50AA] text-[12px] font-[500] rounded hover:bg-[#E0F0FF] transition-colors flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="bg-[#F8F9FA] rounded p-3">
                      <p className="text-[12px] text-[#667085] mb-2">
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
                                className={`text-[11px] px-2 py-1 rounded border ${varianceStyle.bg}`}
                              >
                                {item.itemName}: {item.variance >= 0 ? "+" : ""}
                                {item.variance}
                              </span>
                            );
                          })}
                        {record.items.filter((item) => item.variance !== 0)
                          .length === 0 && (
                          <span className="text-[11px] text-[#667085]">
                            No variances recorded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {getFilteredHistory().length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                      <FileText size={24} className="text-[#667085]" />
                    </div>
                    <h3 className="text-[16px] font-[600] text-[#383E49] mb-2">
                      No adjustment records found
                    </h3>
                    <p className="text-[14px] text-[#667085]">
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
