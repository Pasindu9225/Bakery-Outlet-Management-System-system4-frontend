import React, { useState, useEffect } from "react";
import { onEnterClick } from "../utils/a11y";
import { friendlyError } from "../utils/friendlyError";
import {
  Search,
  Plus,
  Eye,
  FileText,
  Download,
  Printer,
  X,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
  User,
  Building2,
  Hash,
  Clock,
  Minus,
} from "lucide-react";

// Report printing
import GRNReport from "../component/report/GRNReport";
import { printReactReport } from "../component/report/PrintHelper";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader.jsx";
import toast from "react-hot-toast";

export default function StorekeeperGRN() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("GRN Management");
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'history'

  // Form states
  const [selectedPO, setSelectedPO] = useState(null);
  const [poItemsLoading, setPoItemsLoading] = useState(false);
  const [poItemsError, setPoItemsError] = useState(null);
  const [grnData, setGrnData] = useState({
    grnNumber: `GRN-${Date.now()}`,
    grnDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    storekeeperSignature: null,
  });
  const [grnItems, setGrnItems] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [searchPO, setSearchPO] = useState("");
  const [showGRNDetails, setShowGRNDetails] = useState(false);
  const [selectedGRNForView, setSelectedGRNForView] = useState(null);

  // GRN Data from API
  const [grnHistory, setGrnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Purchase Orders Data from API
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPoLoading] = useState(true);
  const [poError, setPoError] = useState(null);

  // Fetch GRN data from API
  const fetchGRNData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[REQUEST] GET /STK/v1/grns");
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/grns`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          // Empty or initial state on new server
          setGrnHistory([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[RESPONSE] GET /STK/v1/grns:", data);
      // Transform API data to match UI structure
      const transformedGRNs = (data.grns || []).map((grn) => ({
        id: grn.grnId,
        grnId: grn.grnId,
        poId: grn.poId,
        grnNumber: `GRN-${grn.grnId}`,
        poNumber: `PO-${grn.poReference || grn.poId}`,
        supplier: grn.supplierName,
        invoiceNumber: grn.invoiceNumber,
        grnDate:
          grn.receivedDate ||
          grn.createdAt ||
          new Date().toISOString().split("T")[0],
        totalItems: grn.numberOfItems,
        totalAmount: grn.total,
        status:
          grn.grnStatus === "PARTIAL"
            ? "Partial"
            : grn.grnStatus === "RECEIVED" || grn.isReceived
            ? "Received"
            : grn.grnStatus || "Pending",
        storekeeperName: "Current User", // Would come from auth context
        isReceived: !!grn.isReceived,
        createdAt: grn.createdAt,
        materialNames: grn.materialNames || "",
        signature: grn.storekeeperSignature ? { url: grn.storekeeperSignature } : null,
      }));

      setGrnHistory(transformedGRNs);
    } catch (error) {
      console.error("Failed to fetch GRN data:", error);
      setError("Failed to load GRN data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Purchase Orders data from API
  const fetchPurchaseOrders = async () => {
    try {
      setPoLoading(true);
      setPoError(null);

      console.log("[REQUEST] GET /STK/v1/purchase-orders");
      const token = localStorage.getItem("authToken");
      let poList = [];

      // Primary endpoint for POs
      const poResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (poResponse.ok) {
        const data = await poResponse.json();
        console.log("[RESPONSE] GET /STK/v1/purchase-orders:", data);
        poList = Array.isArray(data.purchaseOrders)
          ? data.purchaseOrders
          : Array.isArray(data.purchaseorders)
          ? data.purchaseorders
          : Array.isArray(data)
          ? data
          : [];
      } else {
        // Fallback to /STK/v1/grns if /purchase-orders returns non-200
        console.log("[FALLBACK] GET /STK/v1/grns (derive POs)");
        const grnResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/grns`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (grnResponse.ok) {
          const data = await grnResponse.json();
          poList = data.grns || [];
        }
      }

      // Transform API data to PO structure for Step 1 list
      const transformedPOs = poList.map((po) => {
        const poId = po.poId || po.id || po.grnId;
        const supplierName = po.supplierName || (po.supplier && po.supplier.name) || "Unknown Supplier";
        const poStatus = (po.status || po.grnStatus || "APPROVED").toUpperCase();

        return {
          id: poId,
          grnId: po.grnId || poId,
          poId: poId,
          poNumber: `PO-${po.poReference || poId}`,
          poDate:
            po.createdAt ||
            po.estimatedDeliveryDate ||
            po.receivedDate ||
            new Date().toISOString().split("T")[0],
          supplier: {
            name: supplierName,
            contact: "N/A",
            address: "N/A",
          },
          expectedDelivery:
            po.estimatedDeliveryDate ||
            po.receivedDate ||
            po.createdAt ||
            new Date().toISOString().split("T")[0],
          status: po.status || po.grnStatus || "Approved",
          totalAmount: po.totalCost || po.total || 0,
          itemCount: po.numberOfItems || (po.items ? po.items.length : 0),
          items: po.items || [],
          materialNames: po.materialNames || (po.items ? po.items.map(i => i.rawMaterialName || i.name).filter(Boolean).join(", ") : ""),
          isReceived: po.isReceived || poStatus === "RECEIVED" || poStatus === "COMPLETED",
        };
      });

      setPurchaseOrders(transformedPOs);
    } catch (error) {
      console.error("Failed to fetch Purchase Orders data:", error);
      setPoError("Failed to load Purchase Orders. Please try again.");
    } finally {
      setPoLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNData();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // No fallback POs; rely solely on API data

  // Handle PO selection: fetch raw materials for the selected PO and populate items
  const handleSelectPO = async (po) => {
    setSelectedPO(po);
    setPoItemsLoading(true);
    setPoItemsError(null);

    try {
      const url = `${process.env.REACT_APP_BASE_URL}/STK/v1/purchase-orders/${po.id}/raw-materials`;
      console.log("[REQUEST] GET", url);
      const token = localStorage.getItem("authToken");
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      console.log("[RESPONSE] GET", url, data);

      // Update selected PO details from API response
      setSelectedPO((prev) => ({
        ...(prev || {}),
        id: data.purchaseOrderId ?? prev?.id,
        poNumber:
          prev?.poNumber ||
          (data.purchaseOrderId ? `PO-${data.purchaseOrderId}` : ""),
        supplier: {
          name: data.supplierName || prev?.supplier?.name || "Unknown Supplier",
          contact: prev?.supplier?.contact || "N/A",
          address: prev?.supplier?.address || "N/A",
        },
        expectedDelivery: data.estimatedDeliveryDate || prev?.expectedDelivery,
        status: prev?.status || "PENDING",
        totalAmount: data.totalCost ?? prev?.totalAmount,
      }));

      // Map raw materials to GRN items structure used by the form
      const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const initialItems = (data.rawMaterials || []).map((rm, idx) => {
        const requiredQty = rm.requiredQty || 0;
        const receivedQty = 0; // initialize to 0 so user can input remaining qty
        const estimatedCost = rm.estimatedCost || 0;
        const actualCost =
          rm.actualCost != null ? rm.actualCost : estimatedCost;
        const actualTotal = (actualCost || 0) * (receivedQty || 0);

        const matCode = rm.materialCode || `RM${rm.rawMaterialId}`;
        const seqStr = String(idx + 1).padStart(2, "0");
        const defaultBatchNo = rm.batchNo || `BAT-${todayStr}-${matCode}-${seqStr}`;

        return {
          id: rm.grnItemId || rm.rawMaterialId, // use GRN item id as primary id
          grnItemId: rm.grnItemId || null,
          rawMaterialId: rm.rawMaterialId || null,
          materialCode: matCode,
          materialName: rm.rawMaterialName,
          brand: "",
          unit: rm.unitOfMeasure,
          orderedQty: requiredQty,
          invoiceQty: requiredQty,
          unitPrice: estimatedCost,
          totalPrice: estimatedCost * requiredQty,
          receivedQty: receivedQty,
          invoicePrice: actualCost,
          actualCost: actualCost,
          batchNo: defaultBatchNo,
          expiryDate: "",
          accepted: true,
          variance: requiredQty - (receivedQty || 0),
          actualTotal: actualTotal,
        };
      });

      setGrnItems(initialItems);
    } catch (error) {
      console.error("Failed to fetch PO raw materials:", error);
      setPoItemsError("Failed to load PO items. Please try again.");
      setGrnItems([]);
    } finally {
      setPoItemsLoading(false);
    }
  };

  // Handle GRN item updates
  const updateGRNItem = (itemId, field, value) => {
    setGrnItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Calculate variance and total
          if (field === "receivedQty" || field === "invoiceQty") {
            const actQ = parseFloat(updatedItem.receivedQty || 0);
            updatedItem.variance = updatedItem.orderedQty - actQ;
          }

          if (
            field === "actualCost" ||
            field === "invoicePrice" ||
            field === "receivedQty" ||
            field === "invoiceQty"
          ) {
            const price = parseFloat(
              updatedItem.invoicePrice !== undefined && updatedItem.invoicePrice !== ""
                ? updatedItem.invoicePrice
                : updatedItem.actualCost || 0
            );
            const qty = parseFloat(updatedItem.receivedQty || 0);
            updatedItem.actualTotal = price * qty;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Handle file upload for signature
  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGrnData((prev) => ({
          ...prev,
          storekeeperSignature: {
            file: file,
            url: e.target.result,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle GRN submission
  const handleSubmitGRN = async () => {
    if (!selectedPO) {
      toast.error("Please select a Purchase Order first");
      return;
    }

    if (!grnData.invoiceNumber || grnData.invoiceNumber.trim() === "") {
      toast.error("Please enter the Supplier Invoice Number");
      return;
    }

    // Strict matching check for Invoice Qty vs Actual Qty & Invoice Price vs Actual Price
    for (const item of grnItems) {
      if (item.accepted && parseFloat(item.receivedQty || 0) > 0) {
        const invQty = parseFloat(item.invoiceQty !== undefined && item.invoiceQty !== "" ? item.invoiceQty : item.receivedQty || 0);
        const actQty = parseFloat(item.receivedQty || 0);
        const invPrice = parseFloat(item.invoicePrice !== undefined && item.invoicePrice !== "" ? item.invoicePrice : item.actualCost || 0);
        const actPrice = parseFloat(item.actualCost || 0);

        if (invQty !== actQty) {
          toast.error(`Invoice Quantity (${invQty}) does not match Actual Quantity (${actQty}) for "${item.materialName}". They must match to complete GRN.`);
          return;
        }

        if (invPrice !== actPrice) {
          toast.error(`Invoice Price (Rs.${invPrice}) does not match Actual Price (Rs.${actPrice}) for "${item.materialName}". They must match to complete GRN.`);
          return;
        }

        if (!item.expiryDate) {
          toast.error(`Enter the expiry date for "${item.materialName}".`);
          return;
        }
        if (item.expiryDate < new Date().toLocaleDateString("en-CA")) {
          toast.error(`"${item.materialName}" is already expired (${item.expiryDate}). Expired stock cannot be received.`);
          return;
        }
      }
    }

    const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const receivedItems = grnItems.map((item, idx) => {
      const matCode = item.materialCode || `RM${item.rawMaterialId || item.id}`;
      const seqStr = String(idx + 1).padStart(2, "0");
      const autoBatch = `BAT-${todayStr}-${matCode}-${seqStr}`;
      const actQty = parseFloat(item.receivedQty || 0);
      const invQty = item.invoiceQty !== undefined && item.invoiceQty !== "" ? parseFloat(item.invoiceQty) : actQty;
      const actPrice = parseFloat(item.actualCost || 0);
      const invPrice = item.invoicePrice !== undefined && item.invoicePrice !== "" ? parseFloat(item.invoicePrice) : actPrice;

      return {
        grnItemId: item.grnItemId ?? item.id,
        receivedQuantity: actQty,
        actualQuantity: actQty,
        invoiceQuantity: invQty,
        actualPrice: actPrice,
        invoicePrice: invPrice,
        batchNo:
          item.batchNo !== undefined &&
          item.batchNo !== null &&
          String(item.batchNo).trim() !== ""
            ? String(item.batchNo).trim()
            : autoBatch,
        expireDate: item.expiryDate || null,
      };
    });

    console.log(
      "GRN Items with batch numbers:",
      grnItems.map((item) => ({
        id: item.id,
        materialName: item.materialName,
        batchNo: item.batchNo,
        receivedQty: item.receivedQty,
      }))
    );

    console.log("Received items for API:", receivedItems);

    if (receivedItems.every((i) => i.receivedQuantity === 0)) {
      toast.error("Please enter received quantities for at least one item");
      return;
    }

    // Determine GRN status: PARTIAL if any receivedQty is > 0 and < orderedQty; RECEIVED if all receivedQty === orderedQty
    const hasPartial = grnItems.some((item) => {
      const ordered = Number(item.orderedQty || 0);
      const received = Number(item.receivedQty || 0);
      return received > 0 && received < ordered;
    });
    const allFullyReceived = grnItems.every(
      (item) => Number(item.receivedQty || 0) >= Number(item.orderedQty || 0)
    );
    const computedStatus = hasPartial
      ? "PARTIAL"
      : allFullyReceived
      ? "RECEIVED"
      : "RECEIVED";

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        grnStatus: computedStatus,
        invoiceNumber: grnData.invoiceNumber,
        items: receivedItems,
        storekeeperSignature: grnData.storekeeperSignature ? grnData.storekeeperSignature.url : null,
      };
      const postUrl = `${process.env.REACT_APP_BASE_URL}/STK/v1/grn/${
        selectedPO.grnId || selectedPO.id
      }/receive`;
      console.log("[REQUEST] POST", postUrl, payload);
      const token = localStorage.getItem("authToken");
      const response = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

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
      const resBody = await response.json().catch(() => null);
      console.log("[RESPONSE] POST", postUrl, resBody ?? "[no body]");

      setSubmitSuccess("GRN received successfully.");
      toast.success("GRN received successfully.");

      // Refresh GRN history and Purchase Orders list in real-time
      fetchGRNData();
      fetchPurchaseOrders();

      // Reset form
      setSelectedPO(null);
      setGrnItems([]);
      setGrnData({
        grnNumber: `GRN-${Date.now()}`,
        grnDate: new Date().toISOString().split("T")[0],
        invoiceNumber: "",
        storekeeperSignature: null,
      });
    } catch (error) {
      console.error("Failed to submit GRN receive:", error);
      setSubmitError(friendlyError(error, { fallback: "Failed to submit GRN. Please try again." }));
      toast.error(friendlyError(error, { fallback: "Failed to submit GRN. Please try again." }));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter POs based on search (API only) and show pending, approved, and partial POs
  const filteredPOs = purchaseOrders
    .filter((po) => {
      const status = (po.status || "").toUpperCase();
      return (
        status === "PENDING" ||
        status === "APPROVED" ||
        status.includes("APPROVED") ||
        status === "PARTIAL" ||
        status === "SUBMITTED" ||
        po.isReceived === false
      );
    })
    .filter(
      (po) =>
        po.poNumber.toLowerCase().includes(searchPO.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchPO.toLowerCase()) ||
        (po.materialNames && po.materialNames.toLowerCase().includes(searchPO.toLowerCase()))
    );

  const handlePrint = () => {
    if (!selectedGRNForView) {
      toast.error("No GRN selected for printing.");
      return;
    }

    // Map actual GRN items to the format expected by GRNReport component
    const grnItems = (selectedGRNForView.items || []).map((item) => ({
      code: `RM${item.rawMaterialId || item.id}` || "N/A",
      description: item.materialName || item.name || "Unknown Material",
      brand: item.brand || "-",
      unit: item.unit || item.unitOfMeasure || "pcs",
      qtyOrdered: item.orderedQty || item.quantity || 0,
      qtyReceived: item.receivedQty || item.quantity || 0,
      remarks: selectedGRNForView.status || "Unknown",
    }));

    const report = (
      <GRNReport
        companyName="Bakery Outlet Management System"
        grnNo={selectedGRNForView.grnNumber}
        date={new Date(selectedGRNForView.grnDate).toLocaleDateString()}
        supplier={selectedGRNForView.supplier}
        poRefNo={selectedGRNForView.poNumber}
        data={grnItems}
      />
    );

    printReactReport(
      report,
      `Goods Received Note - ${selectedGRNForView.grnNumber}`
    );
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

        {/* Storekeeper Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              Goods Received Note (GRN)
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Record and verify incoming goods delivered against purchase orders
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-surface rounded-lg shadow-sm border border-line mb-6">
            <div className="flex border-b border-line">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "create"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <Plus size={16} className="inline mr-2" />
                Create GRN
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-brand-fg text-brand-fg bg-hover"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                GRN History
              </button>
            </div>
          </div>

          {/* Create GRN Tab */}
          {activeTab === "create" && (
            <div className="space-y-6">
              {/* Step 1: PO Selection */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-4">
                  Step 1: Select Purchase Order
                </h3>

                {/* Search PO */}
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search by PO number or supplier..."
                      value={searchPO}
                      onChange={(e) => setSearchPO(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                    />
                  </div>
                </div>

                {/* PO List */}
                {!selectedPO ? (
                  <div className="space-y-3">
                    {poLoading ? (
                      <Loader variant="section" text="Loading purchase orders..." />
                    ) : poError ? (
                      <div className="text-center py-8">
                        <FileText
                          size={48}
                          className="mx-auto text-error mb-4"
                        />
                        <p className="text-[16px] font-[500] text-fg mb-2">
                          Error loading purchase orders
                        </p>
                        <p className="text-[14px] text-fg-secondary mb-4">
                          {poError}
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <>
                        {filteredPOs.map((po) => (
                          <div
                            key={po.id}
                            className="border border-line rounded-lg p-4 hover:border-brand-fg hover:bg-hover cursor-pointer transition-colors"
                            role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => handleSelectPO(po)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-[16px] font-[600] text-fg">
                                    {po.poNumber}
                                  </h4>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] bg-hover text-success">
                                    {po.status}
                                  </span>
                                </div>
                                <p className="text-[14px] text-fg mb-1">
                                  <Building2
                                    size={14}
                                    className="inline mr-2"
                                  />
                                  {po.supplier.name}
                                </p>
                                {po.materialNames && (
                                  <p className="text-[13px] text-fg-secondary mb-2 font-[500]">
                                    <Package size={14} className="inline mr-2 text-brand-fg" />
                                    {po.materialNames}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-[12px] text-fg-secondary">
                                  <span>
                                    <Calendar
                                      size={12}
                                      className="inline mr-1"
                                    />
                                    PO Date:{" "}
                                    {new Date(po.poDate).toLocaleDateString()}
                                  </span>
                                  <span>
                                    <Truck size={12} className="inline mr-1" />
                                    Expected:{" "}
                                    {new Date(
                                      po.expectedDelivery
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>
                                    <Package
                                      size={12}
                                      className="inline mr-1"
                                    />
                                    {po.itemCount} items
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[16px] font-[700] text-fg">
                                  Rs.{po.totalAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {filteredPOs.length === 0 && (
                          <div className="text-center py-8">
                            <FileText
                              size={48}
                              className="mx-auto text-fg-secondary mb-4"
                            />
                            <p className="text-[16px] font-[500] text-fg mb-2">
                              No purchase orders found
                            </p>
                            <p className="text-[14px] text-fg-secondary">
                              Try adjusting your search criteria
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* Selected PO Details */
                  <div className="border border-brand-fg rounded-lg p-4 bg-hover">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-[16px] font-[600] text-fg">
                          Selected PO: {selectedPO.poNumber}
                        </h4>
                        <p className="text-[14px] text-fg-secondary">
                          {selectedPO.supplier.name}
                        </p>
                      </div>
                      <button aria-label="Close"
                        onClick={() => setSelectedPO(null)}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                      >
                        <X size={16} className="text-fg-secondary" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                      <div>
                        <span className="font-[500] text-fg">
                          PO Date:{" "}
                        </span>
                        <span className="text-fg-secondary">
                          {selectedPO.poDate
                            ? new Date(selectedPO.poDate).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="font-[500] text-fg">
                          Expected Delivery:{" "}
                        </span>
                        <span className="text-fg-secondary">
                          {selectedPO.expectedDelivery
                            ? new Date(
                                selectedPO.expectedDelivery
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="font-[500] text-fg">
                          Total Amount:{" "}
                        </span>
                        <span className="text-fg-secondary">
                          Rs.{(selectedPO.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {poItemsLoading && (
                      <div className="flex items-center gap-2 text-[12px] text-fg-secondary mt-3">
                        <Loader variant="inline" />
                        <span>Loading PO items...</span>
                      </div>
                    )}
                    {poItemsError && (
                      <div className="text-[12px] text-error mt-3">
                        {poItemsError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: GRN Details */}
              {selectedPO && (
                <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                  <h3 className="text-[18px] font-[600] text-fg mb-4">
                    Step 2: GRN Header Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[14px] font-[500] text-fg mb-2">
                        GRN Number
                      </label>
                      <input
                        type="text"
                        value={grnData.grnNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-line rounded-md bg-subtle text-[14px] text-fg-secondary cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-[500] text-fg mb-2">
                        GRN Date
                      </label>
                      <input
                        type="date"
                        value={grnData.grnDate}
                        onChange={(e) =>
                          setGrnData((prev) => ({
                            ...prev,
                            grnDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[14px] font-[500] text-fg mb-2">
                        Supplier Invoice Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={grnData.invoiceNumber}
                        onChange={(e) =>
                          setGrnData((prev) => ({
                            ...prev,
                            invoiceNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                        placeholder="Enter physical invoice number provided by supplier"
                      />
                    </div>
                  </div>

                  {/* Signature Upload */}
                  <div className="mt-6">
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Storekeeper Signature
                    </label>
                    <div className="border-2 border-dashed border-line rounded-lg p-4">
                      {grnData.storekeeperSignature ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={grnData.storekeeperSignature.url}
                            alt="Signature"
                            className="h-16 w-32 object-contain border border-line rounded"
                          />
                          <div className="flex-1">
                            <p className="text-[14px] font-[500] text-fg">
                              Signature uploaded
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              {grnData.storekeeperSignature.file.name}
                            </p>
                          </div>
                          <button aria-label="Close"
                            onClick={() =>
                              setGrnData((prev) => ({
                                ...prev,
                                storekeeperSignature: null,
                              }))
                            }
                            className="p-2 text-error hover:bg-hover rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload
                            size={32}
                            className="mx-auto text-fg-secondary mb-2"
                          />
                          <p className="text-[14px] text-fg mb-1">
                            Upload your signature
                          </p>
                          <p className="text-[12px] text-fg-secondary mb-4">
                            PNG, JPG up to 2MB
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id="signature-upload"
                          />
                          <label
                            htmlFor="signature-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-brand text-[14px] font-[500] rounded-md hover:bg-brand-hover cursor-pointer transition-colors"
                          >
                            <Upload size={16} />
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Items Receipt */}
              {selectedPO && grnItems.length > 0 && (
                <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                  <h3 className="text-[18px] font-[600] text-fg mb-4">
                    Step 3: Record Received Items
                  </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="border-b border-line">
                            <th className="text-left py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Material
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Ordered
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Invoice Qty *
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Actual Qty *
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Invoice Price *
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Actual Price *
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Match
                            </th>
                            <th className="text-left py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Batch/Lot
                            </th>
                            <th className="text-left py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Expiry
                            </th>
                            <th className="text-center py-3 px-2 text-[12px] font-[600] text-fg uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {grnItems.map((item, index) => {
                            const invQ = parseFloat(item.invoiceQty !== undefined && item.invoiceQty !== "" ? item.invoiceQty : item.receivedQty || 0);
                            const actQ = parseFloat(item.receivedQty || 0);
                            const invP = parseFloat(item.invoicePrice !== undefined && item.invoicePrice !== "" ? item.invoicePrice : item.actualCost || 0);
                            const actP = parseFloat(item.actualCost || 0);
                            const isMatched = invQ === actQ && invP === actP;

                            return (
                              <tr
                                key={item.id}
                                className="border-b border-line"
                              >
                                <td className="py-4 px-2">
                                  <div>
                                    <p className="text-[14px] font-[600] text-fg">
                                      {item.materialCode}
                                    </p>
                                    <p className="text-[14px] text-fg">
                                      {item.materialName}
                                    </p>
                                    {item.brand && (
                                      <p className="text-[12px] text-fg-secondary">
                                        Brand: {item.brand}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <span className="text-[14px] font-[600] text-fg">
                                    {item.orderedQty} {item.unit}
                                  </span>
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.invoiceQty !== undefined ? item.invoiceQty : item.orderedQty}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "invoiceQty",
                                        e.target.value
                                      )
                                    }
                                    className="w-20 px-2 py-1 border border-line rounded text-center text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    disabled={!item.accepted}
                                  />
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.receivedQty}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "receivedQty",
                                        e.target.value
                                      )
                                    }
                                    className="w-20 px-2 py-1 border border-line rounded text-center text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    disabled={!item.accepted}
                                  />
                                  {item.variance > 0 && (
                                    <p className="text-[12px] text-error mt-1">
                                      Short: {item.variance}
                                    </p>
                                  )}
                                  {item.variance < 0 && (
                                    <p className="text-[12px] text-warning mt-1">
                                      Excess: {Math.abs(item.variance)}
                                    </p>
                                  )}
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.invoicePrice !== undefined ? item.invoicePrice : item.actualCost}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "invoicePrice",
                                        e.target.value
                                      )
                                    }
                                    className="w-24 px-2 py-1 border border-line rounded text-center text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    disabled={!item.accepted}
                                  />
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.actualCost}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "actualCost",
                                        e.target.value
                                      )
                                    }
                                    className="w-24 px-2 py-1 border border-line rounded text-center text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    disabled={!item.accepted}
                                  />
                                  {item.actualTotal > 0 && (
                                    <p className="text-[12px] text-fg-secondary mt-1">
                                      Total: Rs.{item.actualTotal.toFixed(2)}
                                    </p>
                                  )}
                                </td>
                                <td className="py-4 px-2 text-center">
                                  {isMatched ? (
                                    <span className="px-2 py-1 bg-hover text-success rounded text-[12px] font-[600] inline-flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Match
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-hover text-error rounded text-[12px] font-[600] inline-flex items-center gap-1" title="Invoice Qty & Price must match Actual Qty & Price">
                                      <AlertCircle size={12} /> Mismatch
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-2">
                                  <input
                                    type="text"
                                    value={item.batchNo}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "batchNo",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Auto Batch/Lot"
                                    className="w-40 px-2 py-1 border border-line rounded text-[13px] font-mono bg-subtle text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg focus:bg-surface"
                                    disabled={
                                      !item.accepted || item.receivedQty === 0
                                    }
                                  />
                                </td>
                                <td className="py-4 px-2">
                                  <input
                                    type="date"
                                    required
                                    min={new Date().toLocaleDateString("en-CA")}
                                    value={item.expiryDate}
                                    onChange={(e) =>
                                      updateGRNItem(
                                        item.id,
                                        "expiryDate",
                                        e.target.value
                                      )
                                    }
                                    className="w-32 px-2 py-1 border border-line rounded text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    disabled={
                                      !item.accepted || item.receivedQty === 0
                                    }
                                  />
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.accepted}
                                        onChange={(e) =>
                                          updateGRNItem(
                                            item.id,
                                            "accepted",
                                            e.target.checked
                                          )
                                        }
                                        className="sr-only peer"
                                      />
                                      <div className="w-10 h-5 bg-line-strong peer-checked:bg-success-solid rounded-full peer transition-colors"></div>
                                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-surface rounded-full shadow transform peer-checked:translate-x-5 transition-transform"></div>
                                    </label>
                                    <span className="text-[12px] text-fg">
                                      {item.accepted ? "Accept" : "Reject"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-subtle rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[12px] text-fg-secondary">
                            Total Items
                          </p>
                          <p className="text-[16px] font-[600] text-fg">
                            {
                              grnItems.filter((item) => item.receivedQty > 0)
                                .length
                            }
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] text-fg-secondary">
                            Accepted Items
                          </p>
                          <p className="text-[16px] font-[600] text-success">
                            {
                              grnItems.filter(
                                (item) => item.accepted && item.receivedQty > 0
                              ).length
                            }
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[12px] text-fg-secondary">
                            Total Amount
                          </p>
                          <p className="text-[16px] font-[600] text-fg">
                            Rs.
                            {grnItems
                              .reduce(
                                (sum, item) => sum + (item.actualTotal || 0),
                                0
                              )
                              .toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitGRN}
                        className="flex items-center gap-2 px-6 py-2 bg-brand text-on-brand text-[14px] font-[500] rounded-md hover:bg-brand-hover transition-colors"
                      >
                        <Save size={16} />
                        Confirm & Submit GRN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GRN History Tab */}
          {activeTab === "history" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-[18px] font-[600] text-fg">
                  GRN History
                </h3>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <span className="text-[12px] text-fg-secondary">
                    Showing {grnHistory.length} records
                  </span>
                </div>
              </div>

              {loading ? (
                <Loader variant="section" text="Loading GRN records..." />
              ) : error ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-error mb-4" />
                  <p className="text-[16px] font-[500] text-fg mb-2">
                    Error loading GRN records
                  </p>
                  <p className="text-[14px] text-fg-secondary mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : grnHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-fg-secondary mb-4" />
                  <p className="text-[16px] font-[500] text-fg mb-2">
                    No GRN records found
                  </p>
                  <p className="text-[14px] text-fg-secondary">
                    GRN records will appear here once you start receiving goods
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          GRN Details
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          PO & Supplier
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          Date
                        </th>
                        <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">
                          Status
                        </th>
                        {/* <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">Items</th> */}
                        {/* <th className="text-right py-3 text-[12px] font-[600] text-fg uppercase">Amount</th> */}
                        <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnHistory.map((grn) => (
                        <tr
                          key={grn.id}
                          className="border-b border-line hover:bg-subtle"
                        >
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-[600] text-fg">
                                {grn.grnNumber}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                <User size={12} className="inline mr-1" />
                                {grn.storekeeperName}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-[500] text-fg">
                                {grn.poNumber}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                {grn.supplier}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="text-[14px] text-fg">
                              {new Date(grn.grnDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] ${
                                grn.status === "Completed"
                                  ? "bg-hover text-success"
                                  : grn.status === "Pending"
                                  ? "bg-hover text-warning"
                                  : grn.status === "Cancelled"
                                  ? "bg-hover text-error"
                                  : grn.status === "Partial"
                                  ? "bg-hover text-brand-fg"
                                  : "bg-hover text-success"
                              }`}
                            >
                              <CheckCircle2 size={10} className="mr-1" />
                              {grn.status}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    // Fetch PO raw materials for this GRN's PO
                                    const detailsUrl = `${
                                      process.env.REACT_APP_BASE_URL
                                    }/STK/v1/purchase-orders/${
                                      grn.poId || grn.id
                                    }/raw-materials`;
                                    console.log("[REQUEST] GET", detailsUrl);
                                    const response = await fetch(detailsUrl);
                                    if (!response.ok) {
                                      throw new Error(
                                        `Server error: ${response.status}`
                                      );
                                    }
                                    const data = await response.json();
                                    console.log(
                                      "[RESPONSE] GET",
                                      detailsUrl,
                                      data
                                    );
                                    const items = (data.rawMaterials || []).map(
                                      (rm) => ({
                                        materialName: rm.rawMaterialName,
                                        batchNo: rm.batchNo || "-",
                                        quantity: rm.receivedQty !== undefined && rm.receivedQty !== null ? rm.receivedQty : (rm.requiredQty || 0),
                                        unit: rm.unitOfMeasure,
                                        unitCost: rm.actualCost || rm.estimatedCost || 0,
                                        total:
                                          (rm.actualCost || rm.estimatedCost || 0) *
                                          (rm.receivedQty !== undefined && rm.receivedQty !== null ? rm.receivedQty : (rm.requiredQty || 0)),
                                        expiryDate: rm.grnExpireDate || rm.expireDate || "-",
                                      })
                                    );
                                    setSelectedGRNForView({ ...grn, items });
                                    setShowGRNDetails(true);
                                  } catch (e) {
                                    setSelectedGRNForView({
                                      ...grn,
                                      items: [],
                                    });
                                    setShowGRNDetails(true);
                                  }
                                }}
                                className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {/* <button
                                                                onClick={() => toast(`Downloading GRN ${grn.grnNumber}...`)}
                                                                className="p-2 text-success hover:bg-hover rounded-lg transition-colors"
                                                                title="Download"
                                                            >
                                                                <Download size={16} />
                                                            </button> */}
                              <button
                                onClick={handlePrint}
                                // onClick={() => alert(`Printing GRN ${grn.grnNumber}...`)}
                                className="p-2 text-warning hover:bg-hover rounded-lg transition-colors"
                                title="Print"
                              >
                                <Printer size={16} />
                              </button>
                            </div>
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

      {/* GRN Details Modal */}
      {showGRNDetails && selectedGRNForView && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div>
                <h2 className="text-[20px] font-[600] text-fg">
                  GRN Details - {selectedGRNForView.grnNumber}
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  Purchase Order: {selectedGRNForView.poNumber}
                </p>
              </div>
              <button aria-label="Close"
                onClick={() => setShowGRNDetails(false)}
                className="p-2 hover:bg-subtle rounded-lg transition-colors"
              >
                <X size={20} className="text-fg-secondary" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* GRN Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      GRN NUMBER
                    </label>
                    <p className="text-[14px] font-[600] text-fg">
                      {selectedGRNForView.grnNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      INVOICE NUMBER
                    </label>
                    <p className="text-[14px] font-[600] text-fg">
                      {selectedGRNForView.invoiceNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      SUPPLIER
                    </label>
                    <p className="text-[14px] text-fg">
                      {selectedGRNForView.supplier}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      STOREKEEPER
                    </label>
                    <p className="text-[14px] text-fg">
                      {selectedGRNForView.storekeeperName}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      GRN DATE
                    </label>
                    <p className="text-[14px] text-fg">
                      {new Date(
                        selectedGRNForView.grnDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      TOTAL AMOUNT
                    </label>
                    <p className="text-[16px] font-[700] text-fg">
                      Rs.{selectedGRNForView.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                      STATUS
                    </label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] bg-hover text-success">
                      <CheckCircle2 size={10} className="mr-1" />
                      {selectedGRNForView.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mb-6 p-4 border border-line rounded-lg bg-subtle">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Storekeeper */}
                  <div className="w-full">
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-2">
                      STOREKEEPER SIGNATURE
                    </label>
                    {selectedGRNForView.signature ? (
                      <img
                        src={selectedGRNForView.signature.url}
                        alt="Storekeeper Signature"
                        className="h-24 w-full object-contain border border-line rounded bg-surface"
                      />
                    ) : (
                      <div className="h-24 w-full border-2 border-dashed border-line rounded flex items-center justify-center bg-surface">
                        <span className="text-[12px] text-fg-secondary">
                          No signature
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Supplier */}
                  <div className="w-full">
                    <label className="block text-[12px] font-[500] text-fg-secondary mb-2">
                      SUPPLIER SIGNATURE
                    </label>
                    <div className="h-24 w-full border-2 border-dashed border-line rounded flex items-center justify-center bg-surface">
                      <span className="text-[12px] text-fg-secondary"></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-line rounded-lg">
                <div className="bg-subtle px-4 py-3 border-b border-line">
                  <h4 className="text-[16px] font-[600] text-fg">
                    Received Items
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
                          Batch
                        </th>
                        <th className="text-center py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Quantity
                        </th>
                        <th className="text-center py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Unit Cost
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Total
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Expiry
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {(selectedGRNForView?.items || []).length === 0 ? (
                        <tr>
                          <td
                            className="py-6 px-4 text-center text-[14px] text-fg-secondary"
                            colSpan={6}
                          >
                            No items available for this GRN
                          </td>
                        </tr>
                      ) : (
                        selectedGRNForView.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-[14px] font-[500] text-fg">
                                  {item.materialName || item.name}
                                </p>
                                {item.brand && (
                                  <p className="text-[12px] text-fg-secondary">
                                    {item.brand}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-[14px] text-fg">
                              {item.batchNo || "-"}
                            </td>
                            <td className="py-3 px-4 text-center text-[14px] font-[500] text-fg">
                              {item.quantity || 0} {item.unit || ""}
                            </td>
                            <td className="py-3 px-4 text-center text-[14px] text-fg">
                              {item.unitCost ? `Rs.${item.unitCost}` : "-"}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-[600] text-fg">
                              {item.total ? `Rs.${item.total}` : "-"}
                            </td>
                            <td className="py-3 px-4 text-[14px] text-fg">
                              {item.expiryDate || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-6 border-t border-line">
              {/* Left: GRN Date */}
              <div className="text-[14px] text-fg-secondary text-center md:text-left">
                GRN created on{" "}
                {new Date(selectedGRNForView.grnDate).toLocaleDateString()}
              </div>

              {/* Right: Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                {/* <button
                                    onClick={() =>
                                        toast(`Downloading GRN ${selectedGRNForView.grnNumber}...`)
                                    }
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-[500] text-success bg-hover hover:bg-line rounded-md transition-colors w-full sm:w-auto"
                                >
                                    <Download size={16} />
                                    Download
                                </button> */}

                <button
                  onClick={handlePrint}
                  // onClick={() =>
                  //     alert(`Printing GRN ${selectedGRNForView.grnNumber}...`)
                  // }
                  className="flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-[500] text-warning bg-hover hover:bg-warning/20 rounded-md transition-colors w-full sm:w-auto"
                >
                  <Printer size={16} />
                  Print
                </button>

                <button
                  onClick={() => setShowGRNDetails(false)}
                  className="flex items-center justify-center px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors w-full sm:w-auto"
                >
                  Close
                </button>
              </div>
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
