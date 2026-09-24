import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Package,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Printer,
  X,
  ShoppingCart,
  Truck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Archive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import { formatQuantity } from "../utils/quantityFormatter";
import ExpiryTag, { daysUntil } from "../component/ExpiryTag.jsx";
import ReportWastageModal from "../component/ReportWastageModal.jsx";

export default function StorekeeperViewStore() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("View Store");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // 'All', 'Expiry', 'MinimumQty'
  const [expiryDays, setExpiryDays] = useState(30);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBinCardModal, setShowBinCardModal] = useState(false);
  const [binStartDate, setBinStartDate] = useState("");
  const [binEndDate, setBinEndDate] = useState("");
  const [lastEntries, setLastEntries] = useState("All");
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getFilteredBatches = (batches) => {
    let filtered = [...batches];

    if (binStartDate) {
      filtered = filtered.filter((b) => new Date(b.receiveDate) >= new Date(binStartDate));
    }
    if (binEndDate) {
      const end = new Date(binEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((b) => new Date(b.receiveDate) <= end);
    }

    filtered.sort((a, b) => new Date(b.receiveDate) - new Date(a.receiveDate));

    if (lastEntries !== "All") {
      filtered = filtered.slice(0, parseInt(lastEntries));
    }

    return filtered;
  };

  // Inventory data (fetched from backend)
  const [inventory, setInventory] = useState([]);
  const [reportItem, setReportItem] = useState(null);
  const [reportMsg, setReportMsg] = useState("");

  // Fetch inventory from backend and map to UI shape
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`
        );
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        // Map backend materials to existing UI structure
        const today = new Date();
        const todayISO = today.toISOString().slice(0, 10);

        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          brand: item.brand || "N/A",
          unit: item.unit || "unit",
          // Map new backend fields to existing UI expectations
          expiryDate: item.expireDate || null,
          purchasePrice:
            typeof item.unitCost === "number"
              ? item.unitCost
              : parseFloat(item.unitCost) || 0,
          // Create at least one batch to keep UI intact
          batches:
            item.batches && item.batches.length > 0
              ? item.batches.map((b, idx) => ({
                  id: b.id,
                  batchNo: b.batchNo || `${item.code}-B${idx + 1}`,
                  supplier: b.supplier || "-",
                  purchasePrice:
                    b.purchasePrice ??
                    (typeof item.unitCost === "number"
                      ? item.unitCost
                      : parseFloat(item.unitCost) || 0),
                  quantity: b.quantity ?? 0,
                  receivedQuantity: b.receivedQuantity ?? b.quantity ?? 0,
                  issuedQuantity: b.issuedQuantity ?? 0,
                  balance: b.balance ?? b.quantity ?? 0,
                  expiryDate:
                    b.expiryDate || item.expireDate || null,
                  receiveDate: b.receiveDate || todayISO,
                  minQty: item.minQty ?? 0,
                }))
              : [
                  {
                    batchNo: `${item.code}-B1`,
                    supplier: "-",
                    purchasePrice:
                      typeof item.unitCost === "number"
                        ? item.unitCost
                        : parseFloat(item.unitCost) || 0,
                    quantity:
                      typeof item.totalQuantity === "number"
                        ? item.totalQuantity
                        : parseFloat(item.totalQuantity) || 0,
                    receivedQuantity:
                      typeof item.totalQuantity === "number"
                        ? item.totalQuantity
                        : parseFloat(item.totalQuantity) || 0,
                    issuedQuantity: 0,
                    balance:
                      typeof item.totalQuantity === "number"
                        ? item.totalQuantity
                        : parseFloat(item.totalQuantity) || 0,
                    expiryDate: item.expireDate || null,
                    receiveDate: todayISO,
                    minQty: item.minQty ?? 0,
                  },
                ],
          totalQuantity:
            typeof item.totalQuantity === "number"
              ? item.totalQuantity
              : parseFloat(item.totalQuantity) || 0,
          minQty:
            typeof item.minQty === "number"
              ? item.minQty
              : parseFloat(item.minQty) || 0,
        }));

        setInventory(mapped);
      } catch (e) {
        console.error("Failed to load materials:", e);
        setInventory([]);
      }
    };

    fetchMaterials();
  }, []);

  // Auto-expand matching groups when searching
  useEffect(() => {
    if (!searchTerm) {
      setExpandedGroups(new Set());
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const matches = new Set();
    inventory.forEach((item) => {
      const matchName = item.name && item.name.toLowerCase().includes(lowerSearch);
      const matchCode = item.code && item.code.toLowerCase().includes(lowerSearch);
      const matchBatch = item.batches && item.batches.some(b => b.batchNo && b.batchNo.toLowerCase().includes(lowerSearch));
      if (matchName || matchCode || matchBatch) {
        matches.add(item.name);
      }
    });
    setExpandedGroups(matches);
  }, [searchTerm, inventory]);

  // Remove demo transactions; we'll show live batch details in the BIN card

  // Helper functions
  const isExpired = (expiryDate) => {
    const left = daysUntil(expiryDate);
    return left !== null && left < 0;
  };

  const isNearExpiry = (expiryDate, days) => {
    const left = daysUntil(expiryDate);
    return left !== null && left >= 0 && left <= days;
  };

  const isBelowMinimum = (totalQty, minQty) => {
    return totalQty < minQty;
  };

  // Filter inventory based on active filter (one row per material)
  const getFilteredInventory = () => {
    let filtered = inventory.map((item) => {
      const batches = item.batches || [];
      const nearestExpiry = batches.length
        ? batches
            .map((b) => b.expiryDate)
            .filter(Boolean)
            .sort((a, b) => new Date(a) - new Date(b))[0]
        : null;
      const hasExpired = batches.some((b) => isExpired(b.expiryDate));
      const hasNearExpiry = batches.some((b) =>
        isNearExpiry(b.expiryDate, expiryDays)
      );
      return {
        ...item,
        batchCount: batches.length,
        nearestExpiry: nearestExpiry,
        isExpired: hasExpired,
        isNearExpiry: hasNearExpiry,
        isBelowMin: isBelowMinimum(item.totalQuantity, item.minQty),
        firstSupplier: batches[0]?.supplier || "-",
      };
    });

    // Apply filter logic
    if (activeFilter === "Expiry") {
      filtered = filtered.filter((p) => p.isExpired || p.isNearExpiry);
    } else if (activeFilter === "MinimumQty") {
      filtered = filtered.filter((p) => p.isBelowMin);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.code.toLowerCase().includes(lowerSearch) ||
          (item.batches && item.batches.some(b => b.batchNo && b.batchNo.toLowerCase().includes(lowerSearch)))
      );
    }

    // Sort based on filter
    if (activeFilter === "Expiry") {
      filtered.sort(
        (a, b) =>
          new Date(a.nearestExpiry || 8640000000000000) -
          new Date(b.nearestExpiry || 8640000000000000)
      );
    } else if (activeFilter === "MinimumQty") {
      filtered.sort((a, b) => a.totalQuantity - b.totalQuantity);
    }

    return filtered;
  };

  const getGroupedInventory = () => {
    const filtered = getFilteredInventory();
    const grouped = filtered.reduce((acc, item) => {
      const gName = item.name || "Uncategorized";
      if (!acc[gName]) {
        acc[gName] = {
          name: gName,
          category: item.category,
          unit: item.unit,
          totalQuantity: 0,
          minQty: 0,
          items: [],
          isBelowMin: false,
          nearestExpiry: null,
          isExpired: false,
          isNearExpiry: false
        };
      }
      acc[gName].items.push(item);
      acc[gName].totalQuantity += item.totalQuantity;
      acc[gName].minQty = Math.max(acc[gName].minQty, item.minQty);
      if (item.isBelowMin) acc[gName].isBelowMin = true;
      if (item.isExpired) acc[gName].isExpired = true;
      if (item.isNearExpiry) acc[gName].isNearExpiry = true;
      
      if (!acc[gName].nearestExpiry || (item.nearestExpiry && new Date(item.nearestExpiry) < new Date(acc[gName].nearestExpiry))) {
        acc[gName].nearestExpiry = item.nearestExpiry;
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  const groupedInventory = getGroupedInventory();

  const handleViewBinCard = (productId) => {
    setSelectedProduct(productId);
    setShowBinCardModal(true);
  };

  const handleCreatePO = (productCode) => {
    alert(
      `Creating Purchase Order for ${productCode}. This would redirect to PO creation page.`
    );
  };

  const filteredInventory = getFilteredInventory();

  // Count alerts
  const expiredCount = inventory.reduce((count, item) => {
    return (
      count + item.batches.filter((batch) => isExpired(batch.expiryDate)).length
    );
  }, 0);

  const nearExpiryCount = inventory.reduce((count, item) => {
    return (
      count +
      item.batches.filter((batch) => isNearExpiry(batch.expiryDate, expiryDays))
        .length
    );
  }, 0);

  const belowMinCount = inventory.filter((item) =>
    isBelowMinimum(item.totalQuantity, item.minQty)
  ).length;

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
              Inventory Management
            </h1>
            <p className="text-[14px] text-[#667085]">
              Monitor raw materials, track expiry dates, and manage stock levels
              with FIFO principle
            </p>
          </div>

          {/* Alerts & Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    EXPIRED ITEMS
                  </p>
                  <p className="text-[24px] font-[700] text-[#EF4444]">
                    {expiredCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
                  <AlertTriangle size={24} className="text-[#EF4444]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    NEAR EXPIRY
                  </p>
                  <p className="text-[24px] font-[700] text-[#F4A100]">
                    {nearExpiryCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#FFF4E6] rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-[#F4A100]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    BELOW MINIMUM
                  </p>
                  <p className="text-[24px] font-[700] text-[#0369A1]">
                    {belowMinCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#E0F2FE] rounded-lg flex items-center justify-center">
                  <TrendingDown size={24} className="text-[#0369A1]" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
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
                  placeholder="Search by material name, code, or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter("All")}
                  className={`px-4 py-2 text-[14px] font-[500] rounded-md transition-colors ${
                    activeFilter === "All"
                      ? "bg-[#0F50AA] text-white"
                      : "bg-[#F8F9FA] text-[#667085] hover:bg-[#E4E6EA]"
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setActiveFilter("Expiry")}
                  className={`px-4 py-2 text-[14px] font-[500] rounded-md transition-colors ${
                    activeFilter === "Expiry"
                      ? "bg-[#F4A100] text-white"
                      : "bg-[#F8F9FA] text-[#667085] hover:bg-[#E4E6EA]"
                  }`}
                >
                  By Expiry
                </button>
                <button
                  onClick={() => setActiveFilter("MinimumQty")}
                  className={`px-4 py-2 text-[14px] font-[500] rounded-md transition-colors ${
                    activeFilter === "MinimumQty"
                      ? "bg-[#0369A1] text-white"
                      : "bg-[#F8F9FA] text-[#667085] hover:bg-[#E4E6EA]"
                  }`}
                >
                  Min Quantity
                </button>
              </div>

              {/* Expiry Days Filter (only show when Expiry filter is active) */}
              {activeFilter === "Expiry" && (
                <div className="flex items-center gap-2">
                  <label className="text-[14px] font-[500] text-[#383E49]">
                    Days:
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                  >
                    <option value={7}>7 days</option>
                    <option value={15}>15 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                {activeFilter === "All" && "All Raw Materials"}
                {activeFilter === "Expiry" &&
                  `Items Expiring within ${expiryDays} days`}
                {activeFilter === "MinimumQty" &&
                  "Items Below Minimum Quantity"}
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[12px] text-[#667085]">
                  Showing {groupedInventory.length} categories ({filteredInventory.length} brands)
                </span>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No items found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No items match the selected filter"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Code & Name
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Batch Details
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Supplier
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Stock
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Expiry
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Price
                      </th>
                      <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                   <tbody>
                     {groupedInventory.map((group, gIdx) => (
                       <React.Fragment key={group.name}>
                         {/* Generic Material Parent Row */}
                         <tr
                           className="bg-[#F8F9FA] border-b border-[#E4E6EA] cursor-pointer hover:bg-[#F1F3F5]"
                           onClick={() => toggleGroup(group.name)}
                         >
                           <td className="py-4 pl-4">
                             <div className="flex items-center gap-3">
                               {expandedGroups.has(group.name) ? (
                                 <ChevronDown size={18} className="text-[#0F50AA]" />
                               ) : (
                                 <ChevronRight size={18} className="text-[#667085]" />
                               )}
                               <div>
                                 <p className="text-[14px] font-[700] text-[#0F50AA]">
                                   {group.name}
                                 </p>
                                 <p className="text-[12px] text-[#667085]">
                                   {group.category} | {group.items.length} Brands
                                 </p>
                               </div>
                             </div>
                           </td>
                           <td className="py-4">
                             <div className="flex flex-col gap-1">
                               <div className="flex flex-wrap gap-1">
                                 {group.items.slice(0, 3).map(item => (
                                   <span key={item.id} className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-[#E4E6EA] text-[10px] text-[#667085]">
                                     {item.brand}
                                   </span>
                                 ))}
                                 {group.items.length > 3 && (
                                   <span className="text-[10px] text-[#667085]">+{group.items.length - 3} more</span>
                                 )}
                               </div>
                               {searchTerm && (
                                 <div className="flex flex-wrap gap-1 mt-1">
                                   {group.items.map(item => 
                                     item.batches && item.batches.filter(b => b.batchNo && b.batchNo.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                                       <span key={b.batchNo} className="inline-flex items-center px-2 py-0.5 rounded bg-[#EBF8FF] border border-[#0F50AA]/20 text-[10px] text-[#0F50AA]">
                                         Batch: {b.batchNo}
                                       </span>
                                     ))
                                   )}
                                 </div>
                               )}
                             </div>
                           </td>
                           <td className="py-4">
                             <span className="text-[12px] text-[#667085]">—</span>
                           </td>
                           <td className="py-4">
                             <div>
                               <p className={`text-[14px] font-[700] ${group.isBelowMin ? "text-[#EF4444]" : "text-[#383E49]"}`}>
                                 {group.totalQuantity} {group.unit}
                               </p>
                               {group.isBelowMin && (
                                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[600] bg-[#FEE2E2] text-[#EF4444] mt-1">
                                   LOW STOCK
                                 </span>
                               )}
                             </div>
                           </td>
                           <td className="py-4">
                             {group.nearestExpiry && (
                               <div>
                                 <p className={`text-[13px] font-[500] ${group.isExpired ? "text-[#EF4444]" : group.isNearExpiry ? "text-[#F4A100]" : "text-[#383E49]"}`}>
                                   {new Date(group.nearestExpiry).toLocaleDateString()}
                                 </p>
                                 {group.isExpired && <p className="text-[10px] font-[600] text-[#EF4444]">EXPIRED</p>}
                               </div>
                             )}
                           </td>
                           <td className="py-4">
                             <span className="text-[12px] text-[#667085]">—</span>
                           </td>
                           <td className="py-4 text-center">
                             <button className="text-[12px] font-[600] text-[#0F50AA] hover:underline">
                               {expandedGroups.has(group.name) ? "Collapse" : "Expand"}
                             </button>
                           </td>
                         </tr>

                         {/* Individual Brand Rows (Visible when expanded) */}
                         {expandedGroups.has(group.name) && group.items.map((item) => (
                           <tr
                             key={`${item.id}-${item.code}`}
                             className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA] transition-colors"
                           >
                             <td className="py-4 pl-12">
                               <div>
                                 <p className="text-[13px] font-[600] text-[#383E49]">
                                   {item.code}
                                 </p>
                                 <p className="text-[12px] text-[#667085]">
                                   Brand: <span className="font-[600] text-[#383E49]">{item.brand}</span>
                                 </p>
                               </div>
                             </td>
                             <td className="py-4">
                               <div>
                                 <p className="text-[13px] font-[600] text-[#383E49]">
                                   Batches: {item.batchCount}
                                 </p>
                                 <p className="text-[11px] text-[#667085]">
                                   Unit: {item.unit}
                                 </p>
                                 {searchTerm && item.batches && item.batches.filter(b => b.batchNo && b.batchNo.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                                   <p key={b.batchNo} className="text-[11px] text-[#0F50AA] font-[600] mt-1">
                                     Batch: {b.batchNo}
                                   </p>
                                 ))}
                               </div>
                             </td>
                             <td className="py-4">
                               <p className="text-[13px] text-[#383E49]">
                                 {item.firstSupplier}
                               </p>
                             </td>
                              <td className="py-4">
                                <div>
                                  <p className={`text-[13px] font-[600] ${item.isBelowMin ? "text-[#EF4444]" : "text-[#383E49]"}`}>
                                    {formatQuantity(item.totalQuantity)}
                                  </p>
                                 <p className="text-[11px] text-[#667085]">
                                   Min: {item.minQty}
                                 </p>
                               </div>
                             </td>
                             <td className="py-4">
                               <div>
                                 <p className={`text-[13px] ${item.isExpired ? "text-[#EF4444]" : item.isNearExpiry ? "text-[#F4A100]" : "text-[#383E49]"}`}>
                                   {item.nearestExpiry ? new Date(item.nearestExpiry).toLocaleDateString() : "-"}
                                 </p>
                                 <p className="text-[10px]">
                                   {item.isExpired ? "EXPIRED" : item.isNearExpiry ? "SOON" : ""}
                                 </p>
                               </div>
                             </td>
                             <td className="py-4">
                               <p className="text-[13px] font-[600] text-[#383E49]">
                                 Rs.{item.purchasePrice.toFixed(2)}
                               </p>
                             </td>
                             <td className="py-4 text-center">
                               <div className="flex items-center justify-center gap-2">
                                 <button
                                   onClick={(e) => { e.stopPropagation(); handleViewBinCard(item.id); }}
                                   className="p-1.5 text-[#0F50AA] hover:bg-[#EBF8FF] rounded"
                                 >
                                   <Eye size={16} />
                                 </button>
                                 {item.isBelowMin && (
                                   <button
                                     onClick={(e) => { e.stopPropagation(); handleCreatePO(item.code); }}
                                     className="p-1.5 text-[#199D26] hover:bg-[#F0FDF4] rounded"
                                   >
                                     <ShoppingCart size={16} />
                                   </button>
                                 )}
                               </div>
                             </td>
                           </tr>
                         ))}
                       </React.Fragment>
                     ))}
                   </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* BIN Card Modal */}
      {showBinCardModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-[#E4E6EA]">
              {/* Title & Product Info */}
              <div>
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  BIN Card -{" "}
                  {inventory.find((item) => item.id === selectedProduct)?.name}
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  Product Code:{" "}
                  {inventory.find((item) => item.id === selectedProduct)?.code}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => alert("Downloading BIN card report...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => alert("Printing BIN card...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  onClick={() => setShowBinCardModal(false)}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#667085]" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Current Stock
                  </p>
                  <p className="text-[16px] font-[600] text-[#383E49]">
                    {inventory.find((item) => item.id === selectedProduct)
                      ?.totalQuantity || 0}{" "}
                    {
                      inventory.find((item) => item.id === selectedProduct)
                        ?.unit
                    }
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Minimum Quantity
                  </p>
                  <p className="text-[16px] font-[600] text-[#383E49]">
                    {inventory.find((item) => item.id === selectedProduct)
                      ?.minQty || 0}{" "}
                    {
                      inventory.find((item) => item.id === selectedProduct)
                        ?.unit
                    }
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Active Batches
                  </p>
                  <p className="text-[16px] font-[600] text-[#383E49]">
                    {inventory.find((item) => item.id === selectedProduct)
                      ?.batches.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Brand
                  </p>
                  <p className="text-[16px] font-[600] text-[#383E49]">
                    {inventory.find((item) => item.id === selectedProduct)
                      ?.brand || "N/A"}
                  </p>
                </div>
              </div>
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E4E6EA]">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#667085]">Start Date</label>
                  <input 
                    type="date" 
                    value={binStartDate}
                    onChange={(e) => setBinStartDate(e.target.value)}
                    className="px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E24E11]/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#667085]">End Date</label>
                  <input 
                    type="date" 
                    value={binEndDate}
                    onChange={(e) => setBinEndDate(e.target.value)}
                    className="px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E24E11]/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#667085]">Last Entries</label>
                  <select 
                    value={lastEntries}
                    onChange={(e) => setLastEntries(e.target.value)}
                    className="px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E24E11]/20"
                  >
                    <option value="All">All Entries</option>
                    <option value="10">Last 10</option>
                    <option value="20">Last 20</option>
                    <option value="50">Last 50</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setBinStartDate("");
                      setBinEndDate("");
                      setLastEntries("All");
                    }}
                    className="px-4 py-2 text-[14px] font-[500] text-[#667085] hover:text-[#E24E11] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Batches Table */}
              <div className="border border-[#E4E6EA] rounded-lg">
                <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E4E6EA]">
                  <h4 className="text-[16px] font-[600] text-[#383E49]">
                    Batches
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8F9FA]">
                      <tr>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Batch/Lot
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Supplier
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Purchase Price
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Qty Received
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Qty Issued
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Balance
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Receive Date
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Expiry
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Min Qty
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {getFilteredBatches(
                        inventory.find((it) => it.id === selectedProduct)
                          ?.batches || []
                      ).map((b, idx) => (
                        <tr key={idx} className="hover:bg-[#F8F9FA]">
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {b.batchNo || "-"}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {b.supplier || "-"}
                          </td>
                          <td className="py-3 px-4 text-right text-[14px] text-[#383E49]">
                            Rs.{Number(b.purchasePrice || 0).toFixed(2)}
                          </td>
                           <td className="py-3 px-4 text-right text-[14px] text-[#383E49]">
                             {b.receivedQuantity ?? 0}
                           </td>
                           <td className="py-3 px-4 text-right text-[14px] text-[#383E49]">
                             {b.issuedQuantity ?? 0}
                           </td>
                           <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#383E49]">
                             {b.balance ?? b.quantity ?? 0}
                           </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {b.receiveDate
                              ? new Date(b.receiveDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            <div className="flex flex-col items-start gap-1">
                              <span>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "-"}</span>
                              <ExpiryTag expiryDate={b.expiryDate} warnDays={expiryDays} />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {b.minQty ?? 0}
                          </td>
                          <td className="py-3 px-4">
                            {b.id && Number(b.balance ?? b.quantity ?? 0) > 0 && (
                              <button
                                onClick={() => {
                                  const product = inventory.find((it) => it.id === selectedProduct);
                                  setReportItem({
                                    stage: "MAIN_STORE", locationType: "WAREHOUSE", locationName: "Main Store",
                                    itemType: "RAW_MATERIAL", itemId: b.id, itemName: product?.name,
                                    uom: product?.unit, batchRef: b.batchNo, expiryDate: b.expiryDate,
                                    stockRef: `raw_materials:${b.id}`, available: b.balance ?? b.quantity,
                                  });
                                }}
                                className="px-3 py-1 text-[12px] font-[600] text-red-600 border border-red-200 rounded-lg hover:bg-red-50 whitespace-nowrap"
                              >
                                Report wastage
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-6 border-t border-[#E4E6EA]">
              <button
                onClick={() => setShowBinCardModal(false)}
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
      {reportItem && (
        <ReportWastageModal
          item={reportItem}
          onClose={() => setReportItem(null)}
          onDone={(entry) => {
            setReportItem(null);
            setReportMsg(`${entry?.entryNo || "Wastage"} sent to the Admin for review.`);
            setTimeout(() => setReportMsg(""), 4000);
          }}
        />
      )}
      {reportMsg && (
        <div className="fixed top-6 right-6 z-[100001] bg-white border-l-4 border-green-500 rounded-xl shadow-2xl p-4 text-[13px] text-[#344054]">
          {reportMsg}
        </div>
      )}
    </div>
  );
}
