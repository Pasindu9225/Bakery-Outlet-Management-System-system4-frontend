import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Check,
  AlertCircle,
  Search,
  Filter,
  Save,
  CheckCircle,
  Clock,
  Truck,
  ChefHat,
  Store,
  Edit3,
  Trash2,
  User,
  Target,
} from "lucide-react";
import { toast } from "react-hot-toast";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function POSGoodsEntry() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Goods Entry");
  const [activeTab, setActiveTab] = useState("expected"); // 'expected' or 'manual'
  const [entries, setEntries] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");

  // Expected deliveries from backend (mapped from GTNs)
  const [expectedDeliveries, setExpectedDeliveries] = useState([]);
  const [loadingExpected, setLoadingExpected] = useState(false);
  const [expectedError, setExpectedError] = useState(null);

  // Transfers state
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [transferError, setTransferError] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveQuantity, setApproveQuantity] = useState("");
  const [approveError, setApproveError] = useState(null);

  // Fetch GTN products and map to expected deliveries
  const fetchGtnProducts = async () => {
    try {
      setLoadingExpected(true);
      setExpectedError(null);

      const outletId = localStorage.getItem("outletId");
      console.log("[DEBUG] Current Cashier Outlet ID from LocalStorage:", outletId);
      let url = `${process.env.REACT_APP_BASE_URL}/api/pos/v1/gtn/products`;
      if (outletId) {
        url += `?outletId=${outletId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      console.log("[RESPONSE] GET /api/pos/v1/gtn/products:", data);

      // Safeguards
      const gtns = Array.isArray(data.gtns) ? data.gtns : [];

      // Helpers
      const normalizeSource = (src) => {
        switch ((src || "").toUpperCase()) {
          case "BACKERY":
          case "BAKERY":
            return "Bakery";
          case "PRODUCTION":
            return "Production";
          case "STORE":
            return "Store";
          case "KITCHEN":
            return "Kitchen";
          default:
            return "Store";
        }
      };
      const normalizeUnit = (unit) => {
        switch ((unit || "").toUpperCase()) {
          case "PIECES":
            return "pieces";
          case "KG":
            return "kg";
          case "LITERS":
            return "liters";
          case "BOXES":
            return "boxes";
          case "PACKETS":
            return "packets";
          default:
            return (unit || "").toLowerCase() || "pieces";
        }
      };

      // Map all GTNs and their items (preserving all fields, excluding remarks)
      console.log("[DEBUG] Total GTNs from backend:", gtns.length);
      const items = gtns.flatMap((gtn) => {
        const source = normalizeSource(gtn.source);
        const gItems = Array.isArray(gtn.gtnItems) ? gtn.gtnItems : [];
        console.log(`[DEBUG] GTN ${gtn.gtnId} has ${gItems.length} items`);

        // Filter items based on status: only NOT_RECEIVED or PARTIALLY_RECEIVED
        const filteredItems = gItems.filter((item) => {
          if (!item.status) {
            console.log(`[DEBUG] Item in GTN ${gtn.gtnId} has NO status!`, item);
            return false;
          }
          // Normalize status: "not received" -> "NOT_RECEIVED"
          const normalizedStatus = item.status.toUpperCase().replace(/ /g, "_");
          const isMatch =
            normalizedStatus === "NOT_RECEIVED" ||
            normalizedStatus === "PARTIALLY_RECEIVED" ||
            normalizedStatus === "PARTIALY_RECEIVED";
          
          if (!isMatch) {
            console.log(`[DEBUG] GTN ${gtn.gtnId} Item status '${item.status}' (normalized: '${normalizedStatus}') did NOT match.`);
          }
          return isMatch;
        });

        console.log(`[DEBUG] GTN ${gtn.gtnId}: ${filteredItems.length} items passed filter.`);

        return filteredItems.map((item) => ({
          // Composite ID
          id: `GTN-${gtn.gtnId}-ITEM-${item.gtnItemId}`,

          // GTN-level fields
          gtnId: gtn.gtnId,
          gtnDate: gtn.date,
          gtnStatus: gtn.status,
          source: source,
          addedBy: gtn.addedBy,
          approvedBy: gtn.approvedBy,

          // Item-level fields
          gtnItemId: item.gtnItemId,
          productId: item.productId,
          productName: item.productName,
          productCode: `PRD-${item.productId}`,
          expectedQty: item.expectedQty,
          alreadyReceivedQty: item.receivedQty ?? 0,
          receivedQty: "",
          itemStatus: item.status,
          expiryDate: item.expiryDate,
          unit: normalizeUnit(item.unit),
          // entryStatus: item.entryStatus,

          // UI state
          batchNo: `GTN-${gtn.gtnId}`,
          status: "pending",
        }));
      });

      setExpectedDeliveries(items);
    } catch (err) {
      setExpectedError(err.message || "Failed to load expected deliveries");
    } finally {
      setLoadingExpected(false);
    }
  };

  const fetchPendingTransfers = async () => {
    try {
      setLoadingTransfers(true);
      setTransferError(null);
      const outletId = localStorage.getItem("outletId");
      if (!outletId) return;

      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/pos/transfers/pending?outletId=${outletId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to load transfers");
      const data = await response.json();
      setPendingTransfers(data);
    } catch (err) {
      setTransferError(err.message);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    fetchGtnProducts();
    fetchPendingTransfers();
  }, []);

  // Manual entry form state
  const [manualEntry, setManualEntry] = useState({
    productId: "",
    productName: "",
    productCode: "",
    quantity: "",
    source: "Store",
    unit: "pieces",
    batchNo: "",
    remarks: "",
  });

  const sources = [
    {
      value: "Store",
      icon: <Store size={16} />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "Bakery",
      icon: <ChefHat size={16} />,
      color: "bg-green-100 text-green-800",
    },
    {
      value: "Production",
      icon: <Package size={16} />,
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "Kitchen",
      icon: <ChefHat size={16} />,
      color: "bg-orange-100 text-orange-800",
    },
  ];

  const units = ["pieces", "kg", "liters", "boxes", "packets"];

  // Handle quantity input for expected deliveries
  const handleQuantityChange = (id, quantity) => {
    if (quantity < 0) return;

    setExpectedDeliveries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            receivedQty: quantity === "" ? "" : (parseFloat(quantity) || 0),
            status: parseFloat(quantity) > 0 ? "received" : "pending",
          }
          : item
      )
    );
  };

  // Handle manual entry form
  const handleManualEntryChange = (field, value) => {
    setManualEntry((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addManualEntry = () => {
    if (
      !manualEntry.productId ||
      !manualEntry.productName ||
      !manualEntry.quantity ||
      manualEntry.quantity <= 0
    ) {
      toast.error("Please fill all required fields with valid quantities");
      return;
    }

    const newEntry = {
      id: `ME-${Date.now()}`,
      ...manualEntry,
      productId: parseInt(manualEntry.productId),
      quantity: parseFloat(manualEntry.quantity),
      status: "manual",
      timestamp: new Date().toLocaleTimeString(),
    };

    setEntries((prev) => [...prev, newEntry]);

    // Reset form
    setManualEntry({
      productId: "",
      productName: "",
      productCode: "",
      quantity: "",
      source: "Store",
      unit: "pieces",
      batchNo: "",
      remarks: "",
    });
  };

  const removeManualEntry = (id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // Confirm morning entry
  const confirmMorningEntry = async () => {
    const receivedExpectedItems = expectedDeliveries.filter(
      (item) => parseFloat(item.receivedQty) > 0
    );

    if (receivedExpectedItems.length === 0 && entries.length === 0) {
      toast.error("Please enter at least one product before confirming");
      return;
    }

    try {
      // Group expected items by gtnId for the API request
      const groupedByGtn = receivedExpectedItems.reduce((acc, item) => {
        if (!acc[item.gtnId]) {
          acc[item.gtnId] = [];
        }
        acc[item.gtnId].push({
          gtnItemId: item.gtnItemId,
          receivedQty: parseFloat(item.receivedQty) || 0,
        });
        return acc;
      }, {});

      // Prepare all POST requests for GTN items
      const gtnRequests = Object.entries(groupedByGtn).map(([gtnId, items]) => {
        const payload = {
          gtnId: parseInt(gtnId),
          receivedItems: items,
        };

        return fetch(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/gtn/receive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `Server error for GTN ${gtnId}`);
          }
          return res.json();
        });
      });

      // Prepare manual entry requests
      const currentOutletId = localStorage.getItem("outletId") ? parseInt(localStorage.getItem("outletId")) : 1;
      const currentUserId = localStorage.getItem("userId") || "35000000-0000-0000-0000-000000000000";

      const manualRequests = entries.map((entry) => {
        const payload = {
          productId: entry.productId,
          quantity: entry.quantity,
          unit: (entry.unit || "").toUpperCase(),
          remarks: entry.remarks,
          source: (entry.source || "").toUpperCase(),
          userId: currentUserId,
          outletId: currentOutletId,
        };

        return fetch(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/manual-entry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Manual entry failed");
          }
          return res.json();
        });
      });

      // Execute all requests
      const allRequests = [...gtnRequests, ...manualRequests];
      if (allRequests.length > 0) {
        await Promise.all(allRequests);
        console.log("Successfully confirmed all items");
      }

      setIsConfirmed(true);
      setEntries([]); // Clear manual entries after confirmation
      // Re-fetch expected deliveries to update UI list
      await fetchGtnProducts();
      toast.success(
        "Goods entry confirmed successfully! Stock levels have been updated."
      );
      setTimeout(() => setIsConfirmed(false), 3000);
    } catch (err) {
      console.error("Error confirming goods entry:", err);
      toast.error(`Failed to confirm goods entry: ${err.message}`);
    }
  };

  // Filter functions
  const filteredExpectedDeliveries = expectedDeliveries.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterSource === "all" || item.source === filterSource;
    return matchesSearch && matchesFilter;
  });

  const getSourceIcon = (source) => {
    const sourceData = sources.find((s) => s.value === source);
    return sourceData ? sourceData.icon : <Package size={16} />;
  };

  const getSourceColor = (source) => {
    const sourceData = sources.find((s) => s.value === source);
    return sourceData ? sourceData.color : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <POSSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <POSNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            {/* Tabs */}
            <div className="flex border-b border-[#E4E6EA]">
              <button
                onClick={() => setActiveTab("expected")}
                className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "expected"
                  ? "border-[#0F50AA] text-[#0F50AA] font-[500]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                Incoming GTNs
              </button>
              <button
                onClick={() => setActiveTab("transfers")}
                className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "transfers"
                  ? "border-[#0F50AA] text-[#0F50AA] font-[500]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                Outgoing Transfers
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "manual"
                  ? "border-[#0F50AA] text-[#0F50AA] font-[500]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                Manual Entry
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <span
                className={`px-3 py-1 rounded-full text-[12px] font-[500] ${isConfirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
                  }`}
              >
                {isConfirmed ? "Entry Confirmed" : "Entry Pending"}
              </span>
            </div>
          </div>

          {/* Expected Deliveries Tab */}
          {activeTab === "expected" && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-[#E4E6EA]">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-[#667085]"
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                  />
                </div>
                <div className="relative">
                  <Filter
                    size={16}
                    className="absolute left-3 top-3 text-[#667085]"
                  />
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                  >
                    <option value="all">All Sources</option>
                    {sources.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expected Deliveries List */}
              <div className="bg-white rounded-lg border border-[#E4E6EA]">
                <div className="p-4 border-b border-[#E4E6EA]">
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Expected Deliveries
                  </h3>
                  <p className="text-[14px] text-[#667085]">
                    {
                      filteredExpectedDeliveries.filter(
                        (item) => item.status === "received"
                      ).length
                    }{" "}
                    of {filteredExpectedDeliveries.length} items received
                  </p>
                </div>

                {loadingExpected ? (
                  <Loader variant="section" text="Loading expected deliveries..." />
                ) : expectedError ? (
                  <div className="p-6 flex items-center gap-3 text-red-600">
                    <AlertCircle size={18} />
                    <span className="text-[14px]">{expectedError}</span>
                  </div>
                ) : filteredExpectedDeliveries.length === 0 ? (
                  <div className="p-6 text-center text-[14px] text-[#667085]">
                    No expected deliveries found.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E4E6EA]">
                    {filteredExpectedDeliveries.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-[#F8F9FA] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Source badge + item status badge */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <div
                                className={`px-2 py-1 rounded-full text-[12px] font-[500] ${getSourceColor(
                                  item.source
                                )}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getSourceIcon(item.source)}
                                  {item.source}
                                </div>
                              </div>


                              {/* Entry status badge */}
                              {/* {item.entryStatus && (
                                <span className="px-2 py-1 rounded-full text-[11px] font-[500] bg-blue-50 text-blue-700">
                                  {item.entryStatus}
                                </span>
                              )} */}
                              <div className="flex items-center gap-2">
                                {item.itemStatus && (() => {
                                  const s = item.itemStatus.toUpperCase().replace(/ /g, "_");
                                  return (
                                    <span
                                      className={`px-2 py-1 rounded-full text-[11px] font-[500] ${
                                        s === "OVER_RECEIVED"
                                          ? "bg-red-100 text-red-700"
                                          : s === "PARTIALLY_RECEIVED" || s === "PARTIALY_RECEIVED"
                                          ? "bg-orange-100 text-orange-700"
                                          : s === "RECEIVED"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {item.itemStatus}
                                    </span>
                                  );
                                })()}

                              </div>

                              {item.status === "received" && (
                                <CheckCircle size={16} className="text-green-600" />
                              )}
                            </div>

                            {/* Product name with item status badge */}
                            <div className="flex items-center gap-2">
                              <h4 className="text-[16px] font-[500] text-[#383E49]">
                                {item.productName}
                              </h4>
                            </div>

                            {/* Product code | GTN batch */}
                            <p className="text-[14px] text-[#667085]">
                              GTN ID: {item.gtnId} &nbsp;|&nbsp; Code: {item.productCode} &nbsp;|&nbsp; Batch: {item.batchNo}
                            </p>

                            {/* GTN ID | GTN Item ID | Product ID */}
                            {/* <p className="text-[12px] text-[#667085] mt-1">
                              GTN ID: {item.gtnId}
                            </p> */}

                            {/* GTN date | Expiry date */}
                            <p className="text-[12px] text-[#667085] mt-1">
                              {item.gtnDate && (
                                <>GTN Date: {new Date(item.gtnDate).toLocaleString()}</>
                              )}
                              {item.expiryDate && (
                                <>
                                  {" "}&nbsp;|&nbsp; Expiry:{" "}
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                </>
                              )}
                            </p>

                            {/* Added by | Approved by */}
                            {/* <p className="text-[12px] text-[#667085] mt-1">
                              Added By: {item.addedBy} &nbsp;|&nbsp; Approved By: {item.approvedBy}
                            </p> */}

                            {/* Expected & received quantities */}
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <span className="text-[14px] text-[#667085]">
                                Expected: <strong>{item.expectedQty}</strong> {item.unit}
                              </span>
                              <span className="text-[14px] text-[#667085]">
                                Received (API): <strong>{item.alreadyReceivedQty}</strong> {item.unit}
                              </span>
                              {item.expectedQty - item.alreadyReceivedQty > 0 && (
                                <span className="text-[14px] text-amber-600 font-[500]">
                                  Remaining: <strong>{item.expectedQty - item.alreadyReceivedQty}</strong> {item.unit}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Received qty input */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <label className="block text-[12px] text-[#667085] mb-1">
                                Received Qty
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={item.receivedQty}
                                  onChange={(e) =>
                                    handleQuantityChange(item.id, e.target.value)
                                  }
                                  className="w-24 px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA] text-center"
                                  placeholder="0"
                                  disabled={isConfirmed}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const remaining = Math.max(0, item.expectedQty - item.alreadyReceivedQty);
                                    handleQuantityChange(item.id, remaining.toString());
                                  }}
                                  disabled={isConfirmed}
                                  title="Fill remaining quantity"
                                  className="px-3 py-2 border border-blue-200 text-[#0F50AA] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[13px] font-[500]"
                                >
                                  Target
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Outgoing Transfers Tab */}
          {activeTab === "transfers" && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-[#E4E6EA]">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-[#667085]"
                  />
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E4E6EA]">
                <div className="p-4 border-b border-[#E4E6EA]">
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Pending Transfers
                  </h3>
                  <p className="text-[14px] text-[#667085]">
                    {pendingTransfers.length} pending transfer(s)
                  </p>
                </div>

                <div className="p-4 sm:p-6">
                  {loadingTransfers ? (
                    <div className="text-center py-8">
                      <p className="text-[#667085]">Loading transfers...</p>
                    </div>
                  ) : transferError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">{transferError}</p>
                    </div>
                  ) : pendingTransfers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#667085]">No pending transfers found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E4E6EA]">
                      {pendingTransfers
                        .filter(t => !searchTerm || (t.productName && t.productName.toLowerCase().includes(searchTerm.toLowerCase())))
                        .map((t) => (
                        <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-[500] text-[16px] text-[#383E49]">{t.productName || "Unknown Product"}</p>
                            <p className="text-[14px] text-[#667085] mt-1">
                              From: {t.sourceOutletName || "Unknown Source"} &bull; Requested: {t.requestedQuantity}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setApproveQuantity(t.requestedQuantity?.toString() || "");
                              setIsApproveModalOpen(true);
                            }}
                            className="px-6 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] text-[14px] font-[500] transition-colors whitespace-nowrap"
                          >
                            Approve Transfer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === "manual" && (
            <div className="space-y-6">
              {/* Manual Entry Form */}
              <div className="bg-white rounded-lg border border-[#E4E6EA] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User size={20} className="text-[#0F50AA]" />
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Add Manual Entry
                  </h3>
                  {/* <span className="text-[12px] bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Manager Only
                  </span> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Product ID *
                    </label>
                    <input
                      type="number"
                      value={manualEntry.productId}
                      onChange={(e) =>
                        handleManualEntryChange("productId", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      placeholder="Enter product ID"
                      disabled={isConfirmed}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={manualEntry.productName}
                      onChange={(e) =>
                        handleManualEntryChange("productName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      placeholder="Enter product name"
                      disabled={isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Product Code
                    </label>
                    <input
                      type="text"
                      value={manualEntry.productCode}
                      onChange={(e) =>
                        handleManualEntryChange("productCode", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      placeholder="Enter product code"
                      disabled={isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Source *
                    </label>
                    <select
                      value={manualEntry.source}
                      onChange={(e) =>
                        handleManualEntryChange("source", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      disabled={isConfirmed}
                    >
                      {sources.map((source) => (
                        <option key={source.value} value={source.value}>
                          {source.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={manualEntry.quantity}
                      onChange={(e) =>
                        handleManualEntryChange("quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      placeholder="0"
                      disabled={isConfirmed}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Unit
                    </label>
                    <select
                      value={manualEntry.unit}
                      onChange={(e) =>
                        handleManualEntryChange("unit", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      disabled={isConfirmed}
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                      Batch No.
                    </label>
                    <input
                      type="text"
                      value={manualEntry.batchNo}
                      onChange={(e) =>
                        handleManualEntryChange("batchNo", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                      placeholder="Enter batch number"
                      disabled={isConfirmed}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={manualEntry.remarks}
                    onChange={(e) =>
                      handleManualEntryChange("remarks", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA]"
                    rows="3"
                    placeholder="Add any additional notes..."
                    disabled={isConfirmed}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={addManualEntry}
                    disabled={isConfirmed}
                    className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Entry
                  </button>
                </div>
              </div>

              {/* Manual Entries List */}
              {entries.length > 0 && (
                <div className="bg-white rounded-lg border border-[#E4E6EA]">
                  <div className="p-4 border-b border-[#E4E6EA]">
                    <h3 className="text-[18px] font-[600] text-[#383E49]">
                      Manual Entries
                    </h3>
                  </div>

                  <div className="divide-y divide-[#E4E6EA]">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-[12px] font-[500] ${getSourceColor(
                                entry.source
                              )}`}
                            >
                              <div className="flex items-center gap-1">
                                {getSourceIcon(entry.source)}
                                {entry.source}
                              </div>
                            </span>
                            <span className="text-[12px] text-[#667085]">
                              {entry.timestamp}
                            </span>
                          </div>

                          <h4 className="text-[16px] font-[500] text-[#383E49]">
                            {entry.productName}
                          </h4>
                          {entry.productCode && (
                            <p className="text-[14px] text-[#667085]">
                              Code: {entry.productCode}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[14px] font-[500] text-[#383E49]">
                              Quantity: {entry.quantity} {entry.unit}
                            </span>
                            {entry.batchNo && (
                              <span className="text-[14px] text-[#667085]">
                                Batch: {entry.batchNo}
                              </span>
                            )}
                          </div>

                          {entry.remarks && (
                            <p className="text-[12px] text-[#667085] mt-1">
                              Note: {entry.remarks}
                            </p>
                          )}
                        </div>

                        {!isConfirmed && (
                          <button
                            onClick={() => removeManualEntry(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Entry Button */}
          {(activeTab === "expected" || (activeTab === "manual" && entries.length > 0)) && (
            <div className="flex justify-center pt-6">
              <button
                onClick={confirmMorningEntry}
                disabled={isConfirmed}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-[500]"
              >
                <CheckCircle size={20} />
                {isConfirmed ? "Entry Confirmed" : activeTab === "manual" ? "Confirm & Update Manual Stock" : "Confirm Entry"}
              </button>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Approve Transfer Modal */}
      {isApproveModalOpen && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
            <h3 className="font-semibold text-lg mb-4 text-[#383E49]">Approve Transfer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Approving this transfer will deduct stock from this outlet and generate a GTN for the destination outlet.
            </p>
            {approveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{approveError}</span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedTransfer.requestedQuantity}
                value={approveQuantity}
                onChange={(e) => {
                  setApproveQuantity(e.target.value);
                  setApproveError(null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setSelectedTransfer(null);
                  setApproveError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setApproveError(null);
                  const qty = parseInt(approveQuantity);
                  if (!qty || qty <= 0) {
                    setApproveError("Please enter a valid quantity greater than 0.");
                    return;
                  }
                  try {
                    const token = localStorage.getItem("authToken");
                    const userId = localStorage.getItem("userId");
                    const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/pos/transfers/${selectedTransfer.id}/approve?approverId=${userId}`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ approvedQuantity: qty })
                    });
                    if (!res.ok) {
                      const text = await res.text();
                      let msg = text;
                      try {
                        const json = JSON.parse(text);
                        msg = json.message || json.error || text;
                      } catch (e) {
                      }
                      throw new Error(msg || "Failed to approve transfer");
                    }
                    setIsApproveModalOpen(false);
                    setSelectedTransfer(null);
                    fetchPendingTransfers();
                  } catch (err) {
                    setApproveError(err.message);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
