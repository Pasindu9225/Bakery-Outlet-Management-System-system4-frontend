import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  ShoppingCart,
  Package,
  TrendingDown,
  Building,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";

// Report printing
import PurchaseOrder from "../component/report/PurchaseOrder.js";
import { printReactReport } from "../component/report/PrintHelper";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader.jsx";
import toast from "react-hot-toast";

export default function StorekeeperCreatePO() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Create PO");
  const [activeTab, setActiveTab] = useState("lowStock"); // 'lowStock', 'createPO', 'poHistory'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showPOForm, setShowPOForm] = useState(false);
  const [showPODetails, setShowPODetails] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Low stock items from backend
  const [lowStockItems, setLowStockItems] = useState([]);

  // Real suppliers from backend
  const [suppliers, setSuppliers] = useState([]);

  // Loading state for materials
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Fetch low stock items on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingMaterials(true);
        // 1. Fetch real suppliers
        const supRes = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers`
        );
        let allSuppliers = [];
        if (supRes.ok) {
          const supPayload = await supRes.json();
          allSuppliers = Array.isArray(supPayload.suppliers) ? supPayload.suppliers : [];
          setSuppliers(allSuppliers);
        }

        const fallbackSupplier = allSuppliers.length > 0 
          ? { supplierId: allSuppliers[0].supplierId, name: allSuppliers[0].name } 
          : { supplierId: 1, name: "Default Supplier" };

        // 2. Fetch low stock materials
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/get-low-stock`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = await res.json();
        const materials = Array.isArray(payload.lowStockMaterials)
          ? payload.lowStockMaterials
          : [];

        // Map backend to UI shape expected by the component
        const mapped = materials.map((m) => {
          const currentStock =
            typeof m.currentStock === "number"
              ? m.currentStock
              : parseFloat(m.currentStock) || 0;
          const minStockLevel =
            typeof m.minimumStockLevel === "number"
              ? m.minimumStockLevel
              : parseFloat(m.minimumStockLevel) || 0;
          const maxStockLevel =
            typeof m.maxStockLevel === "number"
              ? m.maxStockLevel
              : parseFloat(m.maxStockLevel) || 0;
          const stockDeficit =
            typeof m.stockDeficit === "number"
              ? m.stockDeficit
              : parseFloat(m.stockDeficit) || 0;
          const unitCost =
            typeof m.unitCost === "number"
              ? m.unitCost
              : parseFloat(m.unitCost) || 0;

          return {
            id: m.materialId,
            code: m.materialCode,
            name: m.materialName,
            genericMaterialName: m.genericMaterialName,
            currentStock,
            minStockLevel,
            maxStockLevel,
            reorderLevel: minStockLevel, // for backward compatibility in some logic
            unit: m.unitOfMeasure || "unit",
            // The maximum they should probably order to fill to max
            maxOrderQty: Math.max(0, maxStockLevel - currentStock),
            // Use brand and suppliers from backend response
            brands: [
              {
                brand: m.brand || "Default",
                lastPrice: unitCost,
                suppliers:
                  m.suppliers && m.suppliers.length > 0
                    ? m.suppliers.map((s) =>
                        typeof s === "object"
                          ? s
                          : (allSuppliers.find(sup => sup.supplierId === s) || fallbackSupplier)
                      )
                    : (allSuppliers.length > 0 ? allSuppliers : [fallbackSupplier]), // fallback to all suppliers if empty
              },
            ],
            alreadyPOCreated: !!m.isPoCreated,
          };
        });

        setLowStockItems(mapped);
      } catch (e) {
        console.error("Failed to fetch initial data:", e);
        setLowStockItems([]);
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchInitialData();
  }, []);

  // PO Form state
  const [poForm, setPOForm] = useState({
    poNumber: `PO-${Date.now()}`,
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    items: [],
  });

  // PO History (from backend)
  const [poHistory, setPOHistory] = useState([]);
  const [poHistoryLoading, setPOHistoryLoading] = useState(true);
  const [poHistoryError, setPOHistoryError] = useState(null);

  useEffect(() => {
    const fetchPOHistory = async () => {
      try {
        setPOHistoryLoading(true);
        setPOHistoryError(null);
        console.log("[REQUEST] GET /STK/v1/purchase-orders");
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = await res.json();
        console.log("[RESPONSE] GET /STK/v1/purchase-orders:", payload);

        const list = Array.isArray(payload.purchaseOrders)
          ? payload.purchaseOrders
          : [];

        // Map backend response to UI shape
        const mapped = list.map((p) => {
          const expectedDelivery = p.estimatedDeliveryDate;
          const date =
            expectedDelivery || new Date().toISOString().split("T")[0];
          const items = (p.items || []).map((it) => ({
            // Fields used by the modal UI
            id: it.poiId,
            name: it.rawMaterialName,
            code: String(it.rawMaterialId),
            unit: it.unitOfMeasure,
            quantity: it.requiredQty || 0,
            unitPrice: it.estimatedCost || 0,
            totalPrice: (it.estimatedCost || 0) * (it.requiredQty || 0),
            selectedBrand: { brand: "N/A" },
            selectedSupplier: p.supplierName || "Supplier",
          }));

          // Map backend status to UI status label
          const backendStatus = (p.status || "").toUpperCase();
          let status = "Pending";
          switch (backendStatus) {
            case "RECEIVED":
              status = "Received";
              break;
            case "APPROVED":
              status = "Approved";
              break;
            case "COMPLETED":
              status = "Completed";
              break;
            case "PENDING":
              status = "Pending";
              break;
            default:
              status = backendStatus || "Pending";
          }

          return {
            id: p.poId,
            poNumber: `PO-${p.poId}`,
            date,
            supplier: p.supplierName || "Supplier",
            status,
            totalCost: p.totalCost || 0,
            itemCount: p.numberOfItems || items.length,
            expectedDelivery: expectedDelivery || date,
            items,
          };
        });

        setPOHistory(mapped);
      } catch (e) {
        console.error("Failed to fetch PO history:", e);
        setPOHistoryError("Failed to load purchase orders. Please try again.");
        setPOHistory([]);
      } finally {
        setPOHistoryLoading(false);
      }
    };

    fetchPOHistory();
  }, []);

  // Filter low stock items
  const filteredLowStock = lowStockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.genericMaterialName && item.genericMaterialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brands && item.brands.some(b => b.brand && b.brand.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddToPO = (item) => {
    if (!selectedItems.find((selected) => selected.id === item.id)) {
      const newItem = {
        ...item,
        selectedBrand: item.brands[0],
        selectedSupplier: item.brands[0].suppliers[0],
        quantity: Math.max(item.reorderLevel - item.currentStock, 1),
        unitPrice: item.brands[0].lastPrice,
        totalPrice: 0,
      };
      newItem.totalPrice = newItem.quantity * newItem.unitPrice;
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const handleRemoveFromPO = (itemId) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));
  };

  const handleItemChange = (itemId, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };

          // Update related fields when brand changes
          if (field === "selectedBrand") {
            const brand = item.brands.find((b) => b.brand === value);
            updated.selectedBrand = brand;
            updated.selectedSupplier = brand.suppliers[0];
            updated.unitPrice = brand.lastPrice;
          }

          // Update related fields when supplier changes
          if (field === "selectedSupplier") {
            const supplier = item.selectedBrand.suppliers.find(
              (s) => String(s.supplierId) === String(value)
            );
            updated.selectedSupplier = supplier;
          }

          // Update total price when quantity or unit price changes
          if (field === "quantity" || field === "unitPrice") {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }

          return updated;
        }
        return item;
      })
    );
  };

  const handleCreatePO = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to create PO");
      return;
    }

    setPOForm({
      ...poForm,
      items: selectedItems,
    });
    setShowPOForm(true);
  };

  const handleSubmitPO = async () => {
    // Validate form
    if (!poForm.expectedDeliveryDate) {
      toast.error("Please select expected delivery date");
      return;
    }

    // Removed local manager approval pop-up warning logic since it is strictly database-driven now.

    try {
      // Group items by supplierId to create multiple POs if needed
      const groupedItems = poForm.items.reduce((acc, item) => {
        const sId = item.selectedSupplier?.supplierId || 1;
        if (!acc[sId]) {
          acc[sId] = [];
        }
        acc[sId].push(item);
        return acc;
      }, {});

      // Prepare request body for backend with multiple purchase orders
      const requestBody = {
        purchaseOrders: Object.keys(groupedItems).map((sId) => ({
          supplierId: parseInt(sId),
          estimatedDeliveryDate: poForm.expectedDeliveryDate,
          status: "Pending",
          items: groupedItems[sId].map((item) => ({
            rawMaterialId: item.id,
            requiredQty: item.quantity,
            unitOfMeasure: item.unit,
            actualCost: item.unitPrice,
          })),
        })),
      };

      console.log("Request body:", requestBody);

      // Send POST request to backend
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = await response.json();
          console.error("Backend error response:", errorData);

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error("Backend error response (text):", errorText);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Backend response:", responseData);

      // Add to PO history - handle multiple POs if created in one request
      const newPOs = Object.keys(groupedItems).map((sId, index) => {
        const itemsForSupplier = groupedItems[sId];
        const supplierName =
          itemsForSupplier[0]?.selectedSupplier?.name || "Supplier";

        // Try to get actual response properties for the PO
        const responsePO = responseData.createdPurchaseOrders?.[index] || responseData;
        const poIdFromResponse = responsePO.poId || (index === 0 ? responseData.poId : null);
        const finalPoId = poIdFromResponse || poHistory.length + 1 + index;
        
        // Use true backend status if provided, else generic fallback
        let realStatus = responsePO.status || "Submitted";
        if (realStatus === "PENDING") realStatus = "Pending Approval";
        if (realStatus === "APPROVED") realStatus = "Approved";

        return {
          id: finalPoId,
          poNumber: `PO-${finalPoId}`,
          date: poForm.poDate,
          supplier: supplierName,
          status: realStatus,
          totalCost: itemsForSupplier.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          ),
          itemCount: itemsForSupplier.length,
          expectedDelivery: poForm.expectedDeliveryDate,
          items: itemsForSupplier,
        };
      });

      setPOHistory([...newPOs, ...poHistory]);

      // Mark items as having PO created
      setLowStockItems((prev) =>
        prev.map((item) => {
          if (selectedItems.find((selected) => selected.id === item.id)) {
            return { ...item, alreadyPOCreated: true };
          }
          return item;
        })
      );

      // Reset form
      setSelectedItems([]);
      setShowPOForm(false);
      setPOForm({
        poNumber: `PO-${Date.now()}`,
        poDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        items: [],
      });

      toast.success("Purchase Order created successfully!");
      setActiveTab("poHistory");
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast.error(`Error creating purchase order: ${error.message}`);
    }
  };

  const handleViewPODetails = (po) => {
    setSelectedPO(po);
    setShowPODetails(true);
  };

  const getTotalPOValue = () => {
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handlePrint = () => {
    if (!selectedPO) {
      toast.error("No purchase order selected for printing.");
      return;
    }

    // Map actual PO items to the format expected by PurchaseOrder component
    const poItems = (selectedPO.items || []).map((item) => ({
      code: item.code || `RM${item.id}` || "N/A",
      description: item.name || "Unknown Material",
      brand: item.selectedBrand?.brand || "N/A",
      qty: item.quantity || 0,
      unit: item.unit || "pcs",
      unitPrice: `Rs.${(item.unitPrice || 0).toFixed(2)}`,
      totalPrice: `Rs.${(item.totalPrice || 0).toFixed(2)}`,
    }));

    const report = (
      <PurchaseOrder
        companyName="Bakery Outlet Management System"
        address="Warehouse Address, City"
        telephone="+94 XX XXX XXXX"
        poNo={selectedPO.poNumber}
        date={new Date(selectedPO.date).toLocaleDateString()}
        supplierName={selectedPO.supplier.name || selectedPO.supplier}
        supplierAddress="Supplier Address"
        supplierContact="Supplier Contact"
        deliveryAddress="Bakery Outlet Warehouse"
        expectedDate={new Date(
          selectedPO.expectedDelivery
        ).toLocaleDateString()}
        paymentTerms="Credit (30 Days)"
        totalAmount={`Rs.${(selectedPO.totalCost || 0).toFixed(2)}`}
        data={poItems}
      />
    );

    printReactReport(report, `Purchase Order - ${selectedPO.poNumber}`);
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
              Purchase Order Management
            </h1>
            <p className="text-[14px] text-[#667085]">
              Create purchase orders for inventory items and manage procurement
              process
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] mb-6">
            <div className="flex flex-wrap border-b border-[#E4E6EA]">
              <button
                onClick={() => setActiveTab("lowStock")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${activeTab === "lowStock"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                <TrendingDown size={16} />
                Material Portfolio
              </button>
              <button
                onClick={() => setActiveTab("createPO")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${activeTab === "createPO"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                <ShoppingCart size={16} />
                Create PO ({selectedItems.length})
              </button>
              <button
                onClick={() => setActiveTab("poHistory")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-[14px] font-[500] border-b-2 transition-colors ${activeTab === "poHistory"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                  }`}
              >
                <FileText size={16} />
                PO History
              </button>
            </div>
          </div>

          {/* Low Stock Items Tab */}
          {activeTab === "lowStock" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by material name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent text-[14px]"
                  />
                </div>
              </div>

              {/* Low Stock Dashboard */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    Full Material Portfolio
                  </h3>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className="text-[12px] text-[#667085]">
                      Showing {filteredLowStock.length} of{" "}
                      {lowStockItems.length} items
                    </span>
                  </div>
                </div>

                {loadingMaterials ? (
                  <Loader variant="section" text="Loading Material Portfolio..." />
                ) : filteredLowStock.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2
                      size={48}
                      className="mx-auto text-[#199D26] mb-4"
                    />
                    <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                      All items are adequately stocked
                    </p>
                    <p className="text-[14px] text-[#667085]">
                      No items are currently below their reorder levels
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E4E6EA]">
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Material
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Stock Status
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Brands Available
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            PO Status
                          </th>
                          <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLowStock.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                          >
                            <td className="py-4 min-w-[150px]">
                              <div>
                                <p className="text-[14px] font-[600] text-[#383E49]">
                                  {item.code}
                                </p>
                                <p className="text-[14px] font-[500] text-[#383E49]">
                                  {item.name}
                                </p>
                                {item.genericMaterialName && item.genericMaterialName !== item.name && (
                                  <p className="text-[12px] text-[#0F50AA] font-[500]">
                                    Generic: {item.genericMaterialName}
                                  </p>
                                )}
                                <p className="text-[12px] text-[#667085]">
                                  Unit: {item.unit}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 min-w-[150px]">
                              <div>
                                <p className="text-[14px] font-[600] text-[#EF4444]">
                                  {item.currentStock} {item.unit}
                                </p>
                                <p className="text-[12px] text-[#667085]">
                                  Stock: {item.minStockLevel} (Min) - {item.maxStockLevel} (Max)
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FEE2E2] text-[#EF4444] mt-1">
                                  <TrendingDown size={10} className="mr-1" />
                                  LOW STOCK
                                </span>
                              </div>
                            </td>
                            <td className="py-4 min-w-[150px]">
                              <div>
                                {item.brands.map((brand, index) => (
                                  <div key={index} className="mb-2 last:mb-0">
                                    <p className="text-[14px] font-[500] text-[#383E49]">
                                      {brand.brand}
                                    </p>
                                    <p className="text-[12px] text-[#667085]">
                                      Rs.{brand.lastPrice.toFixed(2)} |{" "}
                                      {brand.suppliers
                                        .map((s) => s.name)
                                        .join(", ")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 min-w-[100px]">
                              {item.alreadyPOCreated ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#DDFFE0] text-[#199D26]">
                                  <CheckCircle2 size={10} className="mr-1" />
                                  PO CREATED
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FFF4E6] text-[#F4A100]">
                                  <Clock size={10} className="mr-1" />
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-center min-w-[150px]">
                              <button
                                onClick={() => handleAddToPO(item)}
                                disabled={selectedItems.find(
                                  (selected) => selected.id === item.id
                                )}
                                className={`inline-flex items-center gap-2 px-3 py-2 text-[12px] font-[500] rounded-lg transition-colors ${selectedItems.find(
                                  (selected) => selected.id === item.id
                                )
                                    ? "bg-[#F8F9FA] text-[#667085] cursor-not-allowed"
                                    : "bg-[#0F50AA] text-white hover:bg-[#0D4494]"
                                  }`}
                              >
                                <Plus size={14} />
                                {selectedItems.find(
                                  (selected) => selected.id === item.id
                                )
                                  ? "Added"
                                  : "Add to PO"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create PO Tab */}
          {activeTab === "createPO" && (
            <div className="space-y-6">
              {selectedItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-12">
                  <div className="text-center">
                    <ShoppingCart
                      size={48}
                      className="mx-auto text-[#667085] mb-4"
                    />
                    <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                      No items selected for PO
                    </p>
                    <p className="text-[14px] text-[#667085] mb-4">
                      Go to Low Stock Items tab and add materials to create a
                      purchase order
                    </p>
                    <button
                      onClick={() => setActiveTab("lowStock")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
                    >
                      <TrendingDown size={16} />
                      View Low Stock Items
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <h3 className="text-[18px] font-[600] text-[#383E49]">
                      Purchase Order Items
                    </h3>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <div className="text-right">
                        <p className="text-[12px] text-[#667085]">
                          Total Value
                        </p>
                        <p className="text-[18px] font-[700] text-[#199D26]">
                          Rs.{getTotalPOValue().toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={handleCreatePO}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494] transition-colors"
                      >
                        <FileText size={16} />
                        Create PO
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E4E6EA]">
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Material
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Brand
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Supplier
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Quantity
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Unit Price
                          </th>
                          <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Total
                          </th>
                          <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                          >
                            <td className="py-4 min-w-[100px]">
                              <div>
                                <p className="text-[14px] font-[600] text-[#383E49]">
                                  {item.name}
                                </p>
                                <p className="text-[12px] text-[#667085]">
                                  {item.code} | {item.unit}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 min-w-[100px]">
                              <select
                                value={item.selectedBrand.brand}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "selectedBrand",
                                    e.target.value
                                  )
                                }
                                className="w-[95%] p-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                              >
                                {item.brands.map((brand, index) => (
                                  <option key={index} value={brand.brand}>
                                    {brand.brand}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4 min-w-[100px]">
                              <select
                                value={item.selectedSupplier.supplierId}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "selectedSupplier",
                                    e.target.value
                                  )
                                }
                                className="w-[95%] p-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                              >
                                {item.selectedBrand.suppliers.map(
                                  (supplier, index) => (
                                    <option
                                      key={index}
                                      value={supplier.supplierId}
                                    >
                                      {supplier.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>
                            <td className="py-4 min-w-[100px]">
                              <div className="flex flex-col items-start gap-1">
                                {/* Input + Warning */}
                                <div className="relative flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        item.id,
                                        "quantity",
                                        parseFloat(e.target.value) || 0.01
                                      )
                                    }
                                    min="0.01"
                                    step="0.01"
                                    className={`w-24 p-2 border rounded-md focus:outline-none focus:ring-2 text-[14px] text-center transition ${item.quantity > item.maxOrderQty
                                        ? "border-[#F4A100] focus:ring-[#F4A100]"
                                        : "border-[#E4E6EA] focus:ring-[#0F50AA]"
                                      }`}
                                  />
                                  {item.quantity > item.maxOrderQty && (
                                    <AlertTriangle
                                      size={16}
                                      className="text-[#F4A100]"
                                      title="Exceeds maximum stock level - requires manager approval"
                                    />
                                  )}
                                </div>

                                {/* Helper text showing Stock Thresholds */}
                                <div className="flex flex-col text-[10px] text-[#667085] mt-1">
                                  <span>Min Stock: {item.minStockLevel}</span>
                                  <span>Max Stock: {item.maxStockLevel}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 min-w-[100px]">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.id,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                min="0"
                                step="0.01"
                                className="w-24 p-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                              />
                            </td>
                            <td className="py-4 min-w-[100px]">
                              <p className="text-[14px] font-[600] text-[#199D26]">
                                Rs.{item.totalPrice.toFixed(2)}
                              </p>
                            </td>
                            <td className="py-4 text-center">
                              <button
                                onClick={() => handleRemoveFromPO(item.id)}
                                className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                                title="Remove from PO"
                              >
                                <Trash2 size={16} />
                              </button>
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

          {/* PO History Tab */}
          {activeTab === "poHistory" && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Purchase Order History
                </h3>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <span className="text-[12px] text-[#667085]">
                    Total: {poHistory.length} POs
                  </span>
                </div>
              </div>

              {poHistoryLoading ? (
                <Loader variant="section" text="Loading purchase orders..." />
              ) : poHistoryError ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-[#EF4444] mb-4" />
                  <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                    Error loading purchase orders
                  </p>
                  <p className="text-[14px] text-[#667085] mb-4">
                    {poHistoryError}
                  </p>
                </div>
              ) : poHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-[#667085] mb-4" />
                  <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                    No purchase orders created
                  </p>
                  <p className="text-[14px] text-[#667085]">
                    Purchase orders will appear here once created
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E6EA]">
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          PO Details
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Supplier
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Items
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Total Cost
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Status
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Delivery
                        </th>
                        <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {poHistory.map((po) => (
                        <tr
                          key={po.id}
                          className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                        >
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-[600] text-[#383E49]">
                                {po.poNumber}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                {new Date(po.date).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#F0F1F3] rounded-full flex items-center justify-center">
                                <Building
                                  size={14}
                                  className="text-[#667085]"
                                />
                              </div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {po.supplier}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="text-[14px] font-[600] text-[#383E49]">
                              {po.itemCount} items
                            </p>
                          </td>
                          <td className="py-4">
                            <p className="text-[14px] font-[600] text-[#199D26]">
                              Rs.{po.totalCost.toFixed(2)}
                            </p>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${po.status === "Pending"
                                  ? "bg-[#FFF4E6] text-[#F4A100]"
                                  : po.status === "Approved"
                                    ? "bg-[#EBF8FF] text-[#0F50AA]"
                                    : po.status === "Completed"
                                      ? "bg-[#DDFFE0] text-[#199D26]"
                                      : po.status === "Pending Approval"
                                        ? "bg-[#FEE2E2] text-[#EF4444]"
                                        : "bg-[#F8F9FA] text-[#667085]"
                                }`}
                            >
                              {po.status === "Pending" && (
                                <Clock size={10} className="mr-1" />
                              )}
                              {po.status === "Approved" && (
                                <CheckCircle2 size={10} className="mr-1" />
                              )}
                              {po.status === "Completed" && (
                                <CheckCircle2 size={10} className="mr-1" />
                              )}
                              {po.status === "Pending Approval" && (
                                <AlertTriangle size={10} className="mr-1" />
                              )}
                              {po.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#667085]" />
                              <p className="text-[14px] text-[#383E49]">
                                {new Date(
                                  po.expectedDelivery
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleViewPODetails(po)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] text-[12px] font-[500] rounded-lg transition-colors"
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
          )}
        </main>
      </div>

      {/* PO Creation Form Modal */}
      {showPOForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <div>
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Create Purchase Order
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  PO Number: {poForm.poNumber}
                </p>
              </div>
              <button
                onClick={() => setShowPOForm(false)}
                className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* PO Header Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                <div>
                  <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={poForm.poNumber}
                    readOnly
                    className="w-full p-2 border border-[#E4E6EA] rounded-md bg-[#F8F9FA] text-[14px] font-[600] text-[#383E49]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={poForm.poDate}
                    onChange={(e) =>
                      setPOForm({ ...poForm, poDate: e.target.value })
                    }
                    className="w-full p-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                    Expected Delivery *
                  </label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) =>
                      setPOForm({
                        ...poForm,
                        expectedDeliveryDate: e.target.value,
                      })
                    }
                    min={poForm.poDate}
                    className="w-full p-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                    required
                  />
                </div>
              </div>

              {/* Items Summary */}
              <div className="mb-6">
                <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                  Order Summary
                </h4>
                <div className="border border-[#E4E6EA] rounded-lg">
                  <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E4E6EA] grid grid-cols-12 gap-2">
                    <div className="col-span-4 text-[12px] font-[600] text-[#383E49] uppercase">
                      Item
                    </div>
                    <div className="col-span-2 text-[12px] font-[600] text-[#383E49] uppercase">
                      Supplier
                    </div>
                    <div className="col-span-2 text-[12px] font-[600] text-[#383E49] uppercase text-center">
                      Quantity
                    </div>
                    <div className="col-span-2 text-[12px] font-[600] text-[#383E49] uppercase text-right">
                      Unit Price
                    </div>
                    <div className="col-span-2 text-[12px] font-[600] text-[#383E49] uppercase text-right">
                      Total
                    </div>
                  </div>
                  {poForm.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-b border-[#E4E6EA] last:border-b-0 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-4">
                        <p className="text-[14px] font-[500] text-[#383E49]">
                          {item.name}
                        </p>
                        <p className="text-[12px] text-[#667085]">
                          {item.selectedBrand.brand} | {item.code}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[14px] text-[#383E49]">
                          {item.selectedSupplier.name}
                        </p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {item.quantity} {item.unit}
                        </p>
                        {item.quantity > item.maxOrderQty && (
                          <p className="text-[10px] text-[#F4A100] flex items-center justify-center gap-1 mt-1">
                            <AlertTriangle size={10} />
                            Needs Approval
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[14px] text-[#383E49]">
                          Rs.{item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[14px] font-[600] text-[#199D26]">
                          Rs.{item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-[#F8F9FA] grid grid-cols-12 gap-2">
                    <div className="col-span-8"></div>
                    <div className="col-span-2 text-right">
                      <p className="text-[14px] font-[600] text-[#383E49]">
                        Grand Total:
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-[18px] font-[700] text-[#199D26]">
                        Rs.{getTotalPOValue().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Warnings */}
              {poForm.items.some(
                (item) => item.quantity > item.maxOrderQty
              ) && (
                  <div className="mb-6 p-4 bg-[#FFF4E6] border border-[#F4A100] rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={20}
                        className="text-[#F4A100] mt-0.5"
                      />
                      <div>
                        <p className="text-[14px] font-[600] text-[#F4A100] mb-1">
                          Manager Approval Required
                        </p>
                        <p className="text-[14px] text-[#383E49]">
                          Some items exceed maximum stock level limits. This PO
                          will require manager approval before processing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-[#E4E6EA]">
              <div className="text-[14px] text-[#667085]">
                <p>
                  Total Items: {poForm.items.length} | Total Value: Rs.
                  {getTotalPOValue().toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPOForm(false)}
                  className="px-4 py-2 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] hover:bg-[#F8F9FA] rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPO}
                  className="flex items-center gap-2 px-4 py-2 text-[14px] font-[500] text-white bg-[#0F50AA] hover:bg-[#0D4694] rounded-md transition-colors"
                >
                  <Save size={16} />
                  Submit PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Details View Modal */}
      {showPODetails && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <div>
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Purchase Order Details
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  {selectedPO.poNumber} |{" "}
                  {new Date(selectedPO.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowPODetails(false)}
                className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* PO Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Supplier
                  </p>
                  <p className="text-[14px] font-[600] text-[#383E49]">
                    {selectedPO.supplier}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Total Cost
                  </p>
                  <p className="text-[14px] font-[600] text-[#199D26]">
                    Rs.{selectedPO.totalCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] ${selectedPO.status === "Pending"
                        ? "bg-[#FFF4E6] text-[#F4A100]"
                        : selectedPO.status === "Approved"
                          ? "bg-[#EBF8FF] text-[#0F50AA]"
                          : selectedPO.status === "Completed"
                            ? "bg-[#DDFFE0] text-[#199D26]"
                            : "bg-[#F8F9FA] text-[#667085]"
                      }`}
                  >
                    {selectedPO.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Expected Delivery
                  </p>
                  <p className="text-[14px] font-[600] text-[#383E49]">
                    {new Date(selectedPO.expectedDelivery).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
                  Ordered Items
                </h4>
                <div className="border border-[#E4E6EA] rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8F9FA]">
                      <tr>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Item
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Brand
                        </th>
                        <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Quantity
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Unit Price
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {(selectedPO.items &&
                        selectedPO.items.map((item, index) => (
                          <tr key={index} className="hover:bg-[#F8F9FA]">
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-[14px] font-[500] text-[#383E49]">
                                  {item.name}
                                </p>
                                <p className="text-[12px] text-[#667085]">
                                  {item.code}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-[14px] text-[#383E49]">
                                {item.selectedBrand?.brand || "N/A"}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-[14px] font-[600] text-[#383E49]">
                                {item.quantity} {item.unit}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-[14px] text-[#383E49]">
                                Rs.{item.unitPrice.toFixed(2)}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-[14px] font-[600] text-[#199D26]">
                                Rs.{item.totalPrice.toFixed(2)}
                              </p>
                            </td>
                          </tr>
                        ))) || (
                          <tr>
                            <td
                              colSpan="5"
                              className="py-8 text-center text-[#667085]"
                            >
                              No item details available
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-[#E4E6EA]">
              <button
                onClick={handlePrint}
                className="mr-3 flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
              >
                Print
              </button>

              <button
                onClick={() => setShowPODetails(false)}
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
