import React, { useState, useEffect } from "react";
import { friendlyError } from "../utils/friendlyError";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  DollarSign,
  Calendar,
  Package,
  User,
  Phone,
  MapPin,
  Eye,
  Download,
  Printer,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingCart,
  Receipt,
  Edit3,
} from "lucide-react";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function StorekeeperIOUPurchase() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("IOU Purchase");
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'pending', 'approved', 'history'

  // IOU Request Creation State
  const [iouRequest, setIouRequest] = useState({
    id: "",
    date: new Date().toISOString().split("T")[0],
    justification: "",
    supplierName: "",
    supplierContact: "",
    items: [
      {
        id: 1,
        materialId: "",
        materialName: "",
        quantity: "",
        estimatedPrice: "",
        estimatedTotal: 0,
      },
    ],
    totalAmount: 0,
    status: "Draft",
  });

  // GRN Entry State (for approved IOUs)
  const [grnEntry, setGrnEntry] = useState({
    iouId: "",
    grnDate: new Date().toISOString().split("T")[0],
    vendorName: "",
    vendorContact: "",
    vendorAddress: "",
    items: [],
    totalAmount: 0,
  });

  // Modal States
  const [showIOUDetails, setShowIOUDetails] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [selectedIOU, setSelectedIOU] = useState(null);

  // Raw materials from backend API
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [materialsError, setMaterialsError] = useState(null);

  // Essential purchases from backend API
  const [essentialPurchases, setEssentialPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [purchasesError, setPurchasesError] = useState(null);

  // Fetch raw materials from backend
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        setLoadingMaterials(true);
        setMaterialsError(null);

        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw materials fetched:", data);

        // Map API response to match the expected structure
        const mappedMaterials = data.map((material) => ({
          id: material.id,
          code: material.code,
          name: material.name,
          brand: material.brand || "",
          unit: material.unit,
          totalQuantity: material.totalQuantity,
          minQty: material.minQty,
          expireDate: material.expireDate,
          unitCost: material.unitCost,
        }));

        setRawMaterials(mappedMaterials);
      } catch (error) {
        console.error("Failed to fetch raw materials:", error);
        setMaterialsError(friendlyError(error));
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchRawMaterials();
  }, []);

  // Fetch essential purchases from backend
  useEffect(() => {
    const fetchEssentialPurchases = async () => {
      try {
        setLoadingPurchases(true);
        setPurchasesError(null);

        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/essential-purchases`
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Essential purchases fetched:", data);

        // Map API response to match the expected structure
        const mappedPurchases = data.essentialPurchases.map((purchase) => ({
          id: `IOU${String(purchase.id).padStart(3, "0")}`,
          date: purchase.createdAt.split("T")[0],
          justification: `Essential purchase for ${purchase.supplierName}`,
          supplierName: purchase.supplierName,
          supplierContact: purchase.supplierContact,
          estimatedAmount: purchase.essentialPurchaseItems.reduce(
            (sum, item) => sum + (item.totalEstimatedPrice || 0),
            0
          ),
          approvedAmount:
            purchase.status === "approved"
              ? purchase.essentialPurchaseItems.reduce(
                  (sum, item) => sum + (item.totalEstimatedPrice || 0),
                  0
                )
              : 0,
          actualAmount: purchase.essentialPurchaseItems.reduce(
            (sum, item) => sum + (item.totalActualPrice || 0),
            0
          ),
          status:
            purchase.status === "pending"
              ? "Pending"
              : purchase.status === "approved"
              ? "Approved"
              : purchase.status === "rejected"
              ? "Rejected"
              : "Settled",
          financeOfficer: purchase.approvedByName || null,
          approvalDate:
            purchase.updatedAt && purchase.status === "approved"
              ? purchase.updatedAt.split("T")[0]
              : null,
          grnLinked: purchase.grnId
            ? `GRN${String(purchase.grnId).padStart(3, "0")}`
            : null,
          items: purchase.essentialPurchaseItems.map((item) => ({
            materialName: item.rawMaterialName,
            quantity: item.quantity,
            estimatedPrice: item.estimatedUnitPrice,
            actualPrice: item.actualUnitPrice,
          })),
          rawMaterialIds: purchase.essentialPurchaseItems.map(
            (item) => item.rawMaterialId
          ),
        }));

        setEssentialPurchases(mappedPurchases);
      } catch (error) {
        console.error("Failed to fetch essential purchases:", error);
        setPurchasesError(friendlyError(error));
      } finally {
        setLoadingPurchases(false);
      }
    };

    fetchEssentialPurchases();
  }, []);

  // Calculate total for IOU request
  const calculateIOUTotal = () => {
    const total = iouRequest.items.reduce(
      (sum, item) => sum + (item.estimatedTotal || 0),
      0
    );
    setIouRequest((prev) => ({ ...prev, totalAmount: total }));
  };

  // Add new item to IOU request
  const addIOUItem = () => {
    const newItem = {
      id: Date.now(),
      materialId: "",
      materialName: "",
      quantity: "",
      estimatedPrice: "",
      estimatedTotal: 0,
    };
    setIouRequest((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // Remove item from IOU request
  const removeIOUItem = (itemId) => {
    setIouRequest((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
    setTimeout(calculateIOUTotal, 100);
  };

  // Update IOU item
  const updateIOUItem = (itemId, field, value) => {
    setIouRequest((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Handle material selection
          if (field === "materialId") {
            const selectedMaterial = rawMaterials.find(
              (m) => m.id === parseInt(value)
            );
            updatedItem.materialName = selectedMaterial
              ? selectedMaterial.name
              : "";
          }

          // Calculate estimated total
          if (field === "quantity" || field === "estimatedPrice") {
            const quantity =
              field === "quantity"
                ? parseFloat(value) || 0
                : parseFloat(item.quantity) || 0;
            const price =
              field === "estimatedPrice"
                ? parseFloat(value) || 0
                : parseFloat(item.estimatedPrice) || 0;
            updatedItem.estimatedTotal = quantity * price;
          }

          return updatedItem;
        }
        return item;
      }),
    }));
    setTimeout(calculateIOUTotal, 100);
  };

  // Submit IOU Request
  const submitIOURequest = async () => {
    // Validate form
    if (!iouRequest.justification.trim()) {
      toast.error("Please provide justification for the IOU request");
      return;
    }

    if (!iouRequest.supplierName.trim()) {
      toast.error("Please provide supplier name");
      return;
    }

    if (!iouRequest.supplierContact.trim()) {
      toast.error("Please provide supplier contact");
      return;
    }

    if (
      iouRequest.items.some(
        (item) => !item.materialId || !item.quantity || !item.estimatedPrice
      )
    ) {
      toast.error("Please complete all item details");
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

      // Prepare request body for essential_purchase table
      const essentialPurchaseData = {
        supplierName: iouRequest.supplierName,
        supplierContact: iouRequest.supplierContact,
        status: "pending",
        addedBy: userId,
      };

      // Prepare request body for essential_purchase_items table
      const essentialPurchaseItems = iouRequest.items.map((item) => ({
        rawMaterialId: parseInt(item.materialId),
        quantity: parseFloat(item.quantity),
        estimatedUnitPrice: parseFloat(item.estimatedPrice),
        actual_unit_price: 0, // Will be updated when GRN is created
      }));

      // Complete request body
      const requestBody = {
        essentialPurchase: essentialPurchaseData,
        essentialPurchaseItems: essentialPurchaseItems,
      };

      console.log("IOU Purchase Request Body:", requestBody);

      // Make POST request to backend
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/essential-purchases`,
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
      console.log("IOU Purchase created successfully:", responseData);

      // Generate IOU ID for display
      const newIOUId = `IOU${String(essentialPurchases.length + 1).padStart(
        3,
        "0"
      )}`;

      const newIOU = {
        ...iouRequest,
        id: newIOUId,
        status: "Pending",
        estimatedAmount: iouRequest.totalAmount,
        approvedAmount: 0,
        actualAmount: 0,
        financeOfficer: null,
        approvalDate: null,
        grnLinked: null,
        items: iouRequest.items.map((item) => ({
          materialName: item.materialName,
          quantity: parseFloat(item.quantity),
          estimatedPrice: parseFloat(item.estimatedPrice),
          actualPrice: 0,
        })),
      };

      // Add to local state for immediate UI update (optional)
      setEssentialPurchases((prev) => [newIOU, ...prev]);

      // Refresh essential purchases data
      const refreshPurchases = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/STK/v1/essential-purchases`
          );
          if (response.ok) {
            const data = await response.json();
            const mappedPurchases = data.essentialPurchases.map((purchase) => ({
              id: `IOU${String(purchase.id).padStart(3, "0")}`,
              date: purchase.createdAt.split("T")[0],
              justification: `Essential purchase for ${purchase.supplierName}`,
              supplierName: purchase.supplierName,
              supplierContact: purchase.supplierContact,
              estimatedAmount: purchase.essentialPurchaseItems.reduce(
                (sum, item) => sum + (item.totalEstimatedPrice || 0),
                0
              ),
              approvedAmount:
                purchase.status === "approved"
                  ? purchase.essentialPurchaseItems.reduce(
                      (sum, item) => sum + (item.totalEstimatedPrice || 0),
                      0
                    )
                  : 0,
              actualAmount: purchase.essentialPurchaseItems.reduce(
                (sum, item) => sum + (item.totalActualPrice || 0),
                0
              ),
              status:
                purchase.status === "pending"
                  ? "Pending"
                  : purchase.status === "approved"
                  ? "Approved"
                  : purchase.status === "rejected"
                  ? "Rejected"
                  : "Settled",
              financeOfficer: purchase.approvedByName || null,
              approvalDate:
                purchase.updatedAt && purchase.status === "approved"
                  ? purchase.updatedAt.split("T")[0]
                  : null,
              grnLinked: purchase.grnId
                ? `GRN${String(purchase.grnId).padStart(3, "0")}`
                : null,
              items: purchase.essentialPurchaseItems.map((item) => ({
                materialName: item.rawMaterialName,
                quantity: item.quantity,
                estimatedPrice: item.estimatedUnitPrice,
                actualPrice: item.actualUnitPrice,
              })),
            }));
            setEssentialPurchases(mappedPurchases);
          }
        } catch (error) {
          console.error("Failed to refresh essential purchases:", error);
        }
      };

      await refreshPurchases();

      // Reset form
      setIouRequest({
        id: "",
        date: new Date().toISOString().split("T")[0],
        justification: "",
        supplierName: "",
        supplierContact: "",
        items: [
          {
            id: 1,
            materialId: "",
            materialName: "",
            quantity: "",
            estimatedPrice: "",
            estimatedTotal: 0,
          },
        ],
        totalAmount: 0,
        status: "Draft",
      });

      toast.success(`IOU Request ${newIOUId} submitted successfully!`);
      setActiveTab("pending");
    } catch (error) {
      console.error("Failed to submit IOU request:", error);
      toast.error(friendlyError(error, "Failed to submit IOU request"));
    }
  };

  // Handle GRN Entry
  const handleGRNEntry = (iou) => {
    setSelectedIOU(iou);

    // Map items and calculate initial total
    const mappedItems = iou.items.map((item, index) => ({
      ...item,
      rawMaterialId: iou.rawMaterialIds ? iou.rawMaterialIds[index] : 0,
      batchNo: "",
      expiryDate: "",
      receivedQty: item.quantity,
      actualPrice: item.estimatedPrice,
      actualTotal: item.estimatedTotal,
    }));

    // Calculate initial total amount
    const initialTotalAmount = mappedItems.reduce(
      (sum, item) => sum + (item.actualTotal || 0),
      0
    );

    setGrnEntry({
      iouId: iou.id,
      grnDate: new Date().toISOString().split("T")[0],
      vendorName: iou.supplierName || "",
      vendorContact: iou.supplierContact || "",
      vendorAddress: "",
      items: mappedItems,
      totalAmount: initialTotalAmount,
    });
    setShowGRNModal(true);
  };

  // Update GRN Item
  const updateGRNItem = (itemIndex, field, value) => {
    setGrnEntry((prev) => {
      const updatedItems = prev.items.map((item, index) => {
        if (index === itemIndex) {
          const updatedItem = { ...item, [field]: value };

          // Calculate actual total
          if (field === "receivedQty" || field === "actualPrice") {
            const quantity =
              field === "receivedQty"
                ? parseFloat(value) || 0
                : parseFloat(item.receivedQty) || 0;
            const price =
              field === "actualPrice"
                ? parseFloat(value) || 0
                : parseFloat(item.actualPrice) || 0;
            updatedItem.actualTotal = quantity * price;
          }

          return updatedItem;
        }
        return item;
      });

      // Calculate total amount from all items
      const totalAmount = updatedItems.reduce(
        (sum, item) => sum + (item.actualTotal || 0),
        0
      );

      return {
        ...prev,
        items: updatedItems,
        totalAmount: totalAmount,
      };
    });
  };

  // Submit GRN
  const submitGRN = async () => {
    if (!grnEntry.vendorName.trim()) {
      toast.error("Please enter vendor name");
      return;
    }

    // Validate all items have required data
    const hasInvalidItems = grnEntry.items.some(
      (item) =>
        !item.batchNo.trim() ||
        !item.expiryDate ||
        !item.receivedQty ||
        !item.actualPrice
    );

    if (hasInvalidItems) {
      toast.error(
        "Please complete all item details (batch number, expiry date, received quantity, and actual price)"
      );
      return;
    }

    try {
      // Get the original essential purchase ID from the selected IOU
      const essentialPurchaseId = selectedIOU.id.replace("IOU", "");

      // Prepare GRN request body
      const grnRequestBody = {
        essentialPurchaseId: parseInt(essentialPurchaseId),
        grnDate: grnEntry.grnDate,
        vendorName: grnEntry.vendorName,
        vendorContact: grnEntry.vendorContact,
        vendorAddress: grnEntry.vendorAddress,
        totalAmount: grnEntry.totalAmount,
        grnItems: grnEntry.items.map((item, index) => ({
          rawMaterialId: selectedIOU.rawMaterialIds
            ? selectedIOU.rawMaterialIds[index]
            : 0,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          receivedQuantity: parseFloat(item.receivedQty),
          actualUnitPrice: parseFloat(item.actualPrice),
          totalActualPrice: parseFloat(item.actualTotal),
        })),
      };

      console.log("GRN Request Body:", grnRequestBody);

      // Make PUT request to backend
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/essential-purchases/${essentialPurchaseId}/grn`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(grnRequestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("GRN submitted successfully:", responseData);

      // Update essential purchases with GRN data
      setEssentialPurchases((prev) =>
        prev.map((iou) => {
          if (iou.id === selectedIOU.id) {
            return {
              ...iou,
              status: "Settled",
              actualAmount: grnEntry.totalAmount,
              grnLinked: `GRN${String(Date.now()).slice(-3)}`,
            };
          }
          return iou;
        })
      );

      toast.success("GRN submitted successfully! Inventory updated.");
      setShowGRNModal(false);
      setSelectedIOU(null);

      // Refresh essential purchases data
      const refreshPurchases = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/STK/v1/essential-purchases`
          );
          if (response.ok) {
            const data = await response.json();
            const mappedPurchases = data.essentialPurchases.map((purchase) => ({
              id: `IOU${String(purchase.id).padStart(3, "0")}`,
              date: purchase.createdAt.split("T")[0],
              justification: `Essential purchase for ${purchase.supplierName}`,
              supplierName: purchase.supplierName,
              supplierContact: purchase.supplierContact,
              estimatedAmount: purchase.essentialPurchaseItems.reduce(
                (sum, item) => sum + (item.totalEstimatedPrice || 0),
                0
              ),
              approvedAmount:
                purchase.status === "approved"
                  ? purchase.essentialPurchaseItems.reduce(
                      (sum, item) => sum + (item.totalEstimatedPrice || 0),
                      0
                    )
                  : 0,
              actualAmount: purchase.essentialPurchaseItems.reduce(
                (sum, item) => sum + (item.totalActualPrice || 0),
                0
              ),
              status:
                purchase.status === "pending"
                  ? "Pending"
                  : purchase.status === "approved"
                  ? "Approved"
                  : purchase.status === "rejected"
                  ? "Rejected"
                  : "Settled",
              financeOfficer: purchase.approvedByName || null,
              approvalDate:
                purchase.updatedAt && purchase.status === "approved"
                  ? purchase.updatedAt.split("T")[0]
                  : null,
              grnLinked: purchase.grnId
                ? `GRN${String(purchase.grnId).padStart(3, "0")}`
                : null,
              items: purchase.essentialPurchaseItems.map((item) => ({
                materialName: item.rawMaterialName,
                quantity: item.quantity,
                estimatedPrice: item.estimatedUnitPrice,
                actualPrice: item.actualUnitPrice,
              })),
              rawMaterialIds: purchase.essentialPurchaseItems.map(
                (item) => item.rawMaterialId
              ),
            }));
            setEssentialPurchases(mappedPurchases);
          }
        } catch (error) {
          console.error("Failed to refresh essential purchases:", error);
        }
      };

      await refreshPurchases();
    } catch (error) {
      console.error("Failed to submit GRN:", error);
      toast.error(friendlyError(error, "Failed to submit GRN"));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-hover text-warning";
      case "Approved":
        return "bg-hover text-info";
      case "Settled":
        return "bg-hover text-success";
      case "Rejected":
        return "bg-hover text-error";
      default:
        return "bg-subtle text-fg-secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={12} />;
      case "Approved":
        return <CheckCircle2 size={12} />;
      case "Settled":
        return <Receipt size={12} />;
      case "Rejected":
        return <AlertCircle size={12} />;
      default:
        return <FileText size={12} />;
    }
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
              IOU Purchase Management
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Manage emergency purchases from non-registered suppliers with IOU
              process
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-surface rounded-lg shadow-sm border border-line mb-6">
            <div className="flex border-b border-line">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "create"
                    ? "border-brand-fg text-brand-fg"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus size={16} />
                  Create IOU Request
                </div>
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "pending"
                    ? "border-brand-fg text-brand-fg"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Pending & Approved
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-brand-fg text-brand-fg"
                    : "border-transparent text-fg-secondary hover:text-fg"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  IOU History
                </div>
              </button>
            </div>
          </div>

          {/* Create IOU Request Tab */}
          {activeTab === "create" && (
            <div className="space-y-6">
              {loadingMaterials && (
                <Loader variant="section" text="Loading raw materials..." />
              )}
              {/* IOU Header */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-4">
                  IOU Request Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Request Date
                    </label>
                    <input
                      type="date"
                      value={iouRequest.date}
                      onChange={(e) =>
                        setIouRequest((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Estimated Total Amount
                    </label>
                    <input
                      type="text"
                      value={`Rs.${Number(iouRequest.totalAmount || 0).toFixed(
                        2
                      )}`}
                      readOnly
                      className="w-full px-3 py-2 border border-line rounded-md bg-subtle text-[14px] font-[600] text-fg"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-[14px] font-[500] text-fg mb-2">
                    Justification/Reason{" "}
                    <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={iouRequest.justification}
                    onChange={(e) =>
                      setIouRequest((prev) => ({
                        ...prev,
                        justification: e.target.value,
                      }))
                    }
                    placeholder="Explain why this IOU purchase is necessary..."
                    rows={3}
                    className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] resize-none"
                  />
                </div>

                {/* Supplier Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Supplier Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={iouRequest.supplierName}
                      onChange={(e) =>
                        setIouRequest((prev) => ({
                          ...prev,
                          supplierName: e.target.value,
                        }))
                      }
                      placeholder="Enter supplier name"
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Supplier Contact <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={iouRequest.supplierContact}
                      onChange={(e) =>
                        setIouRequest((prev) => ({
                          ...prev,
                          supplierContact: e.target.value,
                        }))
                      }
                      placeholder="Phone number or email"
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-[600] text-fg">
                    Request Items
                  </h3>
                  <button
                    onClick={addIOUItem}
                    className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-brand-fg bg-hover hover:bg-line rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          Raw Material
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          Quantity
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          Est. Unit Price
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                          Est. Total
                        </th>
                        <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {iouRequest.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-line">
                          <td className="py-4">
                            <select
                              value={item.materialId}
                              onChange={(e) =>
                                updateIOUItem(
                                  item.id,
                                  "materialId",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                              disabled={loadingMaterials}
                            >
                              <option value="">
                                {loadingMaterials
                                  ? "Loading materials..."
                                  : materialsError
                                  ? "Error loading materials"
                                  : "Select Material"}
                              </option>
                              {rawMaterials.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.code} - {material.name} (
                                  {material.unit})
                                </option>
                              ))}
                            </select>
                            {materialsError && (
                              <p className="text-error text-sm mt-1">
                                Error loading materials: {materialsError}
                              </p>
                            )}
                          </td>
                          <td className="py-4">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateIOUItem(
                                  item.id,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                            />
                          </td>
                          <td className="py-4">
                            <input
                              type="number"
                              value={item.estimatedPrice}
                              onChange={(e) =>
                                updateIOUItem(
                                  item.id,
                                  "estimatedPrice",
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                            />
                          </td>
                          <td className="py-4">
                            <span className="text-[14px] font-[600] text-fg">
                              Rs.{Number(item.estimatedTotal || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <button aria-label="Delete"
                              onClick={() => removeIOUItem(item.id)}
                              className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                              disabled={iouRequest.items.length === 1}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-line">
                  <button
                    onClick={submitIOURequest}
                    className="flex items-center justify-center gap-2 px-6 py-2 text-[14px] font-[500] text-on-brand bg-brand hover:bg-brand-hover rounded-lg transition-colors"
                  >
                    <Send size={16} />
                    Submit IOU Request
                  </button>
                  <button
                    onClick={() => {
                      setIouRequest({
                        id: "",
                        date: new Date().toISOString().split("T")[0],
                        justification: "",
                        supplierName: "",
                        supplierContact: "",
                        items: [
                          {
                            id: 1,
                            materialId: "",
                            materialName: "",
                            quantity: "",
                            estimatedPrice: "",
                            estimatedTotal: 0,
                          },
                        ],
                        totalAmount: 0,
                        status: "Draft",
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending & Approved IOUs Tab */}
          {activeTab === "pending" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <h3 className="text-[18px] font-[600] text-fg mb-4">
                Pending & Approved IOU Requests
              </h3>

              {loadingPurchases && (
                <Loader variant="section" text="Loading essential purchases..." />
              )}

              {purchasesError && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
                  <p className="text-error text-sm">
                    Error loading essential purchases: {purchasesError}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        IOU ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Supplier
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Amount
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
                    {essentialPurchases
                      .filter(
                        (iou) =>
                          iou.status === "Pending" || iou.status === "Approved"
                      )
                      .map((iou) => (
                        <tr
                          key={iou.id}
                          className="border-b border-line hover:bg-subtle"
                        >
                          <td className="py-4">
                            <span className="text-[14px] font-[600] text-fg">
                              {iou.id}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-[14px] text-fg">
                              {new Date(iou.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4">
                            <div>
                              <span className="text-[14px] font-[500] text-fg">
                                {iou.supplierName}
                              </span>
                              <br />
                              <span className="text-[12px] text-fg-secondary">
                                {iou.supplierContact}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-[14px] font-[600] text-fg">
                              Rs.{Number(iou.estimatedAmount || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-[500] ${getStatusColor(
                                iou.status
                              )}`}
                            >
                              {getStatusIcon(iou.status)}
                              {iou.status}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedIOU(iou);
                                  setShowIOUDetails(true);
                                }}
                                className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {iou.status === "Approved" && (
                                <button
                                  onClick={() => handleGRNEntry(iou)}
                                  className="p-2 text-success hover:bg-hover rounded-lg transition-colors"
                                  title="Create GRN"
                                >
                                  <Package size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {!loadingPurchases &&
                !purchasesError &&
                essentialPurchases.filter(
                  (iou) => iou.status === "Pending" || iou.status === "Approved"
                ).length === 0 && (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-fg-secondary mb-4" />
                    <p className="text-[16px] font-[500] text-fg mb-2">
                      No pending or approved IOUs
                    </p>
                    <p className="text-[14px] text-fg-secondary">
                      IOU requests awaiting approval or goods entry will appear
                      here
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* IOU History Tab */}
          {activeTab === "history" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <h3 className="text-[18px] font-[600] text-fg mb-4">
                IOU Request History
              </h3>

              {loadingPurchases && (
                <Loader variant="section" text="Loading essential purchases..." />
              )}

              {purchasesError && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
                  <p className="text-error text-sm">
                    Error loading essential purchases: {purchasesError}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        IOU ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Supplier
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Est. Amount
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Actual Amount
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-fg uppercase">
                        GRN Linked
                      </th>
                      <th className="text-center py-3 text-[12px] font-[600] text-fg uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {essentialPurchases.map((iou) => (
                      <tr
                        key={iou.id}
                        className="border-b border-line hover:bg-subtle"
                      >
                        <td className="py-4">
                          <span className="text-[14px] font-[600] text-fg">
                            {iou.id}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-[14px] text-fg">
                            {new Date(iou.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4">
                          <div>
                            <span className="text-[14px] font-[500] text-fg">
                              {iou.supplierName}
                            </span>
                            <br />
                            <span className="text-[12px] text-fg-secondary">
                              {iou.supplierContact}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-[14px] font-[500] text-fg">
                            Rs.{Number(iou.estimatedAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-[14px] font-[500] text-fg">
                            {iou.actualAmount > 0
                              ? `Rs.${Number(iou.actualAmount || 0).toFixed(2)}`
                              : "-"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-[500] ${getStatusColor(
                              iou.status
                            )}`}
                          >
                            {getStatusIcon(iou.status)}
                            {iou.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-[14px] text-fg">
                            {iou.grnLinked || "-"}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedIOU(iou);
                                setShowIOUDetails(true);
                              }}
                              className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => toast("Downloading IOU report...")}
                              className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loadingPurchases &&
                !purchasesError &&
                essentialPurchases.length === 0 && (
                  <div className="text-center py-12">
                    <FileText
                      size={48}
                      className="mx-auto text-fg-secondary mb-4"
                    />
                    <p className="text-[16px] font-[500] text-fg mb-2">
                      No IOU history
                    </p>
                    <p className="text-[14px] text-fg-secondary">
                      Your IOU request history will appear here
                    </p>
                  </div>
                )}
            </div>
          )}
        </main>
      </div>

      {/* IOU Details Modal */}
      {showIOUDetails && selectedIOU && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div>
                <h2 className="text-[20px] font-[600] text-fg">
                  IOU Request Details - {selectedIOU.id}
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  Request Date:{" "}
                  {new Date(selectedIOU.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast("Downloading IOU details...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-brand-fg bg-hover hover:bg-line rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
                <button aria-label="Close"
                  onClick={() => setShowIOUDetails(false)}
                  className="p-2 hover:bg-subtle rounded-lg transition-colors"
                >
                  <X size={20} className="text-fg-secondary" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* IOU Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                      STATUS
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-[500] ${getStatusColor(
                        selectedIOU.status
                      )}`}
                    >
                      {getStatusIcon(selectedIOU.status)}
                      {selectedIOU.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                      ESTIMATED AMOUNT
                    </p>
                    <p className="text-[16px] font-[600] text-fg">
                      Rs.{Number(selectedIOU.estimatedAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  {selectedIOU.actualAmount > 0 && (
                    <div>
                      <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                        ACTUAL AMOUNT
                      </p>
                      <p className="text-[16px] font-[600] text-fg">
                        Rs.{Number(selectedIOU.actualAmount || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {selectedIOU.financeOfficer && (
                    <div>
                      <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                        FINANCE OFFICER
                      </p>
                      <p className="text-[14px] font-[500] text-fg">
                        {selectedIOU.financeOfficer}
                      </p>
                    </div>
                  )}
                  {selectedIOU.approvalDate && (
                    <div>
                      <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                        APPROVAL DATE
                      </p>
                      <p className="text-[14px] text-fg">
                        {new Date(
                          selectedIOU.approvalDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedIOU.grnLinked && (
                    <div>
                      <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                        GRN LINKED
                      </p>
                      <p className="text-[14px] font-[500] text-brand-fg">
                        {selectedIOU.grnLinked}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Justification */}
              <div>
                <p className="text-[14px] font-[600] text-fg mb-2">
                  Justification
                </p>
                <div className="p-4 bg-subtle rounded-lg">
                  <p className="text-[14px] text-fg">
                    {selectedIOU.justification}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-[14px] font-[600] text-fg mb-4">
                  Requested Items
                </p>
                <div className="border border-line rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-subtle">
                      <tr>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Material Name
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Quantity
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Est. Price
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Est. Total
                        </th>
                        {selectedIOU.status === "Settled" && (
                          <>
                            <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                              Actual Price
                            </th>
                            <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                              Actual Total
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIOU.items.map((item, index) => (
                        <tr key={index} className="border-t border-line">
                          <td className="py-3 px-4 text-[14px] text-fg">
                            {item.materialName}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-fg text-right">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-fg text-right">
                            Rs.{Number(item.estimatedPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-[14px] font-[500] text-fg text-right">
                            Rs.{Number(item.estimatedTotal || 0).toFixed(2)}
                          </td>
                          {selectedIOU.status === "Settled" && (
                            <>
                              <td className="py-3 px-4 text-[14px] text-fg text-right">
                                Rs.{Number(item.actualPrice || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-[14px] font-[500] text-fg text-right">
                                Rs.
                                {(
                                  Number(item.actualPrice || 0) *
                                  Number(item.quantity || 0)
                                ).toFixed(2)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-6 border-t border-line">
              <button
                onClick={() => setShowIOUDetails(false)}
                className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN Entry Modal */}
      {showGRNModal && selectedIOU && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div>
                <h2 className="text-[20px] font-[600] text-fg">
                  Goods Received Note - {selectedIOU.id}
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  Record actual goods received for approved IOU request
                </p>
              </div>
              <button aria-label="Close"
                onClick={() => setShowGRNModal(false)}
                className="p-2 hover:bg-subtle rounded-lg transition-colors"
              >
                <X size={20} className="text-fg-secondary" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* GRN Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      GRN Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={grnEntry.grnDate}
                      onChange={(e) =>
                        setGrnEntry((prev) => ({
                          ...prev,
                          grnDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Vendor Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={grnEntry.vendorName}
                      onChange={(e) =>
                        setGrnEntry((prev) => ({
                          ...prev,
                          vendorName: e.target.value,
                        }))
                      }
                      placeholder="Enter vendor name"
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">
                      Vendor Contact
                    </label>
                    <input
                      type="text"
                      value={grnEntry.vendorContact}
                      onChange={(e) =>
                        setGrnEntry((prev) => ({
                          ...prev,
                          vendorContact: e.target.value,
                        }))
                      }
                      placeholder="Phone number or email"
                      className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-2">
                    Vendor Address
                  </label>
                  <textarea
                    value={grnEntry.vendorAddress}
                    onChange={(e) =>
                      setGrnEntry((prev) => ({
                        ...prev,
                        vendorAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter vendor address"
                    rows={4}
                    className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] resize-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-[14px] font-[600] text-fg mb-4">
                  Goods Received
                </p>
                <div className="border border-line rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-subtle">
                      <tr>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Material
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Batch/Lot
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Expiry Date
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Received Qty
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Actual Price
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnEntry.items.map((item, index) => (
                        <tr key={index} className="border-t border-line">
                          <td className="py-3 px-4 text-[14px] text-fg">
                            {item.materialName}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={item.batchNo}
                              onChange={(e) =>
                                updateGRNItem(index, "batchNo", e.target.value)
                              }
                              placeholder="Batch number"
                              className="w-full px-2 py-1 border border-line rounded text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "expiryDate",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border border-line rounded text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.receivedQty}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "receivedQty",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border border-line rounded text-[14px] text-right focus:outline-none focus:ring-1 focus:ring-brand-fg"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.actualPrice}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "actualPrice",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border border-line rounded text-[14px] text-right focus:outline-none focus:ring-1 focus:ring-brand-fg"
                            />
                          </td>
                          <td className="py-3 px-4 text-[14px] font-[500] text-fg text-right">
                            Rs.{Number(item.actualTotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-subtle border-t border-line">
                      <tr>
                        <td
                          colSpan={5}
                          className="py-3 px-4 text-[14px] font-[600] text-fg text-right"
                        >
                          Total Amount:
                        </td>
                        <td className="py-3 px-4 text-[16px] font-[700] text-fg text-right">
                          Rs.
                          {grnEntry.items
                            .reduce(
                              (sum, item) =>
                                sum + Number(item.actualTotal || 0),
                              0
                            )
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 p-6 border-t border-line">
              <button
                onClick={submitGRN}
                className="flex items-center justify-center gap-2 px-6 py-2 text-[14px] font-[500] text-on-brand bg-brand hover:bg-brand-hover rounded-lg transition-colors"
              >
                <Package size={16} />
                Submit GRN & Update Inventory
              </button>
              <button
                onClick={() => setShowGRNModal(false)}
                className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
              >
                Cancel
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
