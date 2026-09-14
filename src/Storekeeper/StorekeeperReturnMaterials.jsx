import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Eye,
  FileText,
  Package,
  Calendar,
  User,
  Building,
  AlertCircle,
  Save,
  Send,
  Download,
  Warehouse,
  Printer,
  Check,
  Edit,
} from "lucide-react";

// Report printing
import GoodsReturnNote from "../component/report/GoodsReturnNote.js";
import { printReactReport } from "../component/report/PrintHelper";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import posService from "../services/posService";
import Loader from "../component/Loader.jsx";

export default function StorekeeperReturnMaterials() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Return Materials");
  const [activeTab, setActiveTab] = useState("rawMaterials"); // 'rawMaterials', 'outletReturns'

  // State for return note creation
  const [returnNote, setReturnNote] = useState({
    returnNoteId: "RN" + Date.now(),
    returnDate: new Date().toISOString().split("T")[0],
    supplier: "",
    items: [],
  });

  // State for modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showReturnDetailsModal, setShowReturnDetailsModal] = useState(false);
  const [selectedReturnNote, setSelectedReturnNote] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReturnNote, setEditingReturnNote] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");

  // Suppliers fetched from backend
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierError, setSupplierError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSuppliers() {
      try {
        setLoadingSuppliers(true);
        setSupplierError(null);

        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        console.log(data);
        setSuppliers(data.suppliers || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSupplierError(err.message);
        }
      } finally {
        setLoadingSuppliers(false);
      }
    }

    fetchSuppliers();

    return () => controller.abort();
  }, []);

  // Sample suppliers data
  //   const suppliers = [];

  // Raw materials data from API
  const [availableStock, setAvailableStock] = useState([]);
  const [loadingRawMaterials, setLoadingRawMaterials] = useState(false);
  const [rawMaterialsError, setRawMaterialsError] = useState(null);

  // Return notes history from backend
  const [returnNotes, setReturnNotes] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [returnsError, setReturnsError] = useState(null);

  // Outlet Returns state
  const [outletReturns, setOutletReturns] = useState([]);
  const [loadingOutletReturns, setLoadingOutletReturns] = useState(false);
  const [outletReturnsError, setOutletReturnsError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const fetchReturns = async () => {
      try {
        setLoadingReturns(true);
        setReturnsError(null);
        console.log(
          `[REQUEST] GET ${process.env.REACT_APP_BASE_URL}/STK/v1/returns`
        );
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/returns`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        const data = await res.json();
        console.log(
          `[RESPONSE] GET ${process.env.REACT_APP_BASE_URL}/STK/v1/returns:`,
          data
        );

        // Align with new response shape: { returns: [...] }
        const list = Array.isArray(data.returns) ? data.returns : [];

        const mapped = list.map((r) => {
          // Derive overall status from items
          const itemStatuses = (r.items || []).map((it) =>
            (it.status || "").toUpperCase()
          );
          let overallStatus = "Pending";
          if (itemStatuses.includes("RETURNED")) overallStatus = "Returned";
          else if (
            itemStatuses.length &&
            itemStatuses.every((s) => s === "APPROVED")
          )
            overallStatus = "Approved";
          else if (itemStatuses.includes("NOT_APPROVED"))
            overallStatus = "Pending";
          else if (itemStatuses.includes("REJECTED"))
            overallStatus = "Rejected";

          const mappedItems = (r.items || []).map((it) => ({
            id: it.returnItemId,
            rawMaterialId: it.rawMaterialId,
            name: it.rawMaterialName || `RM-${it.rawMaterialId}`,
            code: String(it.rawMaterialId),
            brand: it.brand || "-",
            batchNo: it.batchNo || "-",
            expiryDate: it.expiryDate || "-",
            availableStock: it.availableStock != null ? it.availableStock : undefined,
            unit: it.unitOfMeasure || "",
            category: it.category || "",
            returnQuantity: Number(it.returnQuantity || 0),
            unitPrice: Number(it.unitPrice || 0),
            totalPrice: Number(it.totalPrice || 0),
            status: it.status || "",
            reason: it.reason || "",
            createdAt: it.createdAt,
            updatedAt: it.updatedAt,
          }));

          return {
            id: r.returnId,
            returnNoteId: `RN-${r.returnId}`,
            supplierId: r.supplierId,
            supplierName: r.supplierName || "",
            date: r.returnDate,
            status: overallStatus,
            totalItems: r.numberOfItems || mappedItems.length,
            totalCost: r.totalCost || 0,
            items: mappedItems,
            createdBy: "System",
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          };
        });

        setReturnNotes(mapped);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch returns:", err);
          setReturnsError(err.message || "Failed to load returns");
        }
      } finally {
        setLoadingReturns(false);
      }
    };
    fetchReturns();
    return () => controller.abort();
  }, []);

  // Fetch Outlet Returns
  const fetchOutletReturns = async () => {
    try {
      setLoadingOutletReturns(true);
      setOutletReturnsError(null);
      const data = await posService.getOutletReturnsByStatus('APPROVED');
      
      const outletReturnsList = Array.isArray(data) ? data : [];
      const mappedOutletReturns = outletReturnsList.map(ret => {
        let status = ret.status;
        if (status === 'PENDING') status = 'Pending';
        if (status === 'APPROVED') status = 'Approved';
        if (status === 'REJECTED') status = 'Rejected';
        if (status === 'RECEIVED') status = 'Received';

        return {
          id: ret.id,
          returnNoteId: ret.returnNoteId || `ORTN-${ret.id}`,
          outletName: ret.outletName || "Branch Outlet",
          date: ret.requestDate || new Date().toISOString(),
          status: status,
          totalItems: (ret.items || []).length,
          items: (ret.items || []).map(item => ({
            ...item,
            name: item.productName || `Prod-${item.productId}`,
            returnQuantity: item.quantity,
            unit: 'units'
          })),
          initiator: ret.initiatorName || "POS Cashier",
          remarks: ret.remarks
        };
      });

      setOutletReturns(mappedOutletReturns);
    } catch (err) {
      console.error("Failed to fetch outlet returns:", err);
      setOutletReturnsError(err.message);
    } finally {
      setLoadingOutletReturns(false);
    }
  };

  useEffect(() => {
    fetchOutletReturns();
    
    let interval;
    if (activeTab === 'outletReturns') {
      interval = setInterval(fetchOutletReturns, 30000); // 30s polling
    }
    return () => clearInterval(interval);
  }, [activeTab]);
  // Submit state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [approveLoadingId, setApproveLoadingId] = useState(null);

  // Return reasons
  const returnReasons = [
    "Expired",
    "Damaged",
    "Wrong Delivery",
    "Quality Issues",
    "Other",
  ];

  // Helper functions
  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-[#FFF4E6] text-[#F4A100]";
      case "Approved":
        return "bg-[#DDFFE0] text-[#199D26]";
      case "Rejected":
        return "bg-[#FEE2E2] text-[#EF4444]";
      default:
        return "bg-[#F0F1F3] text-[#667085]";
    }
  };

  // Fetch raw materials for selected supplier
  const fetchRawMaterials = async (supplierId) => {
    if (!supplierId) {
      setAvailableStock([]);
      return;
    }

    try {
      setLoadingRawMaterials(true);
      setRawMaterialsError(null);
      console.log(
        `[REQUEST] GET ${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers/${supplierId}/raw-materials`
      );

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers/${supplierId}/raw-materials`
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("No raw materials available for this supplier");
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `[RESPONSE] GET ${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers/${supplierId}/raw-materials:`,
        data
      );

      // Map API response to UI structure
      const mappedMaterials = (data.rawMaterials || []).map((material) => ({
        id: material.rawMaterialId,
        code: material.materialCode,
        name: material.rawMaterialName,
        brand: material.brand || "",
        unit: material.unitOfMeasure,
        batchNo: material.batchNo != null ? `BATCH-${material.batchNo}` : `BATCH-${material.rawMaterialId}`,
        expiryDate: material.expireDate,
        availableStock: material.currentStock,
        supplier: data.supplierName,
        unitCost: material.unitCost,
        negotiatedUnitCost: material.negotiatedUnitCost,
        leadTimeDays: material.leadTimeDays,
        isPreferred: material.isPreferred,
        category: material.category,
      }));

      setAvailableStock(mappedMaterials);
    } catch (error) {
      console.error("Failed to fetch raw materials:", error);
      setRawMaterialsError(error.message);
      setAvailableStock([]);
    } finally {
      setLoadingRawMaterials(false);
    }
  };

  // Add item to return note (works for both create and edit)
  const handleAddItem = (selectedItems) => {
    const newItems = selectedItems.map((item) => ({
      ...item,
      returnQuantity: 1,
      reason: "Expired",
    }));

    // Check if we're in edit mode or create mode
    if (showEditModal && editingReturnNote) {
      // If editing, add to editing return note
      setEditingReturnNote((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
      }));
    } else {
      // If creating new, add to return note
      setReturnNote((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
      }));
    }

    setShowAddItemModal(false);
  };

  // Remove item from return note
  const handleRemoveItem = (index) => {
    setReturnNote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update item in return note
  const handleUpdateItem = (index, field, value) => {
    setReturnNote((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleUpdateEditingItem = (index, field, value) => {
    setEditingReturnNote((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Remove item from editing return note
  const handleRemoveEditingItem = (index) => {
    setEditingReturnNote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Submit return note
  const handleSubmitReturnNote = async () => {
    if (!returnNote.supplier || returnNote.items.length === 0) {
      toast.error("Please select a supplier and add at least one item.");
      return;
    }

    // Validate quantities
    const invalidItems = returnNote.items.filter(
      (item) =>
        item.returnQuantity <= 0 || item.returnQuantity > item.availableStock
    );

    if (invalidItems.length > 0) {
      toast.error(
        "Please check return quantities. They must be greater than 0 and not exceed available stock."
      );
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    // Build payload per backend contract
    const payload = {
      returnDate: returnNote.returnDate,
      supplierId: Number(returnNote.supplier),
      returnItems: returnNote.items.map((item) => ({
        rawMaterialId: item.id ?? item.rawMaterialId,
        returnQuantity: Number(item.returnQuantity),
        reason: String(item.reason || "")
          .toUpperCase()
          .replace(/\s+/g, "_"),
      })),
    };

    try {
      console.log(
        `[REQUEST] POST ${process.env.REACT_APP_BASE_URL}/STK/v1/returns/create`,
        payload
      );
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/returns/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      console.log("[RESPONSE] status:", res.status);

      if (!res.ok) {
        let errMsg = `Server error: ${res.status}`;
        try {
          const errData = await res.json();
          console.error("Error body:", errData);
          errMsg = errData.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => ({}));
      console.log("Response body:", data);

      // Optimistic add to local history (optional)
      const newReturnNote = {
        id: Date.now(),
        ...returnNote,
        status: "Pending",
        totalItems: returnNote.items.length,
        createdBy: "Current User",
        date: returnNote.returnDate,
      };
      setReturnNotes((prev) => [newReturnNote, ...prev]);

      // Reset form
      setReturnNote({
        returnNoteId: "RN" + Date.now(),
        returnDate: new Date().toISOString().split("T")[0],
        supplier: "",
        items: [],
      });

      toast.success("Return note submitted successfully for approval!");
    } catch (err) {
      console.error("Failed to submit return note:", err);
      setSubmitError(err.message || "Failed to submit return note");
      toast.error(`Failed to submit: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Approve return via backend
  const handleMarkAsReturn = async (returnNoteId) => {
    const note = returnNotes.find((n) => n.returnNoteId === returnNoteId);
    if (!note) return;

    // Build full payload with return and item details
    const returnItems = (note.items || []).map((it) => ({
      returnItemId: it.id ?? it.returnItemId,
      rawMaterialId: it.rawMaterialId,
      rawMaterialName: it.name,
      unitOfMeasure: it.unit,
      returnQuantity: Number(it.returnQuantity || 0),
      unitPrice: Number(it.unitPrice || 0),
      totalPrice: Number(it.totalPrice || 0),
      status: String(it.status || "").toUpperCase() === "PENDING" ? "NOT_APPROVED" : String(it.status || "").toUpperCase(),
      reason: String(it.reason || "").toUpperCase().replace(/\s+/g, "_"),
    }));

    const payload = {
      returnId: note.id,
      returnDate: note.date,
      supplierId: note.supplierId,
      supplierName: note.supplierName || getSupplierNameById(note.supplierId),
      numberOfItems: note.totalItems || (note.items ? note.items.length : 0),
      totalCost: Number(note.totalCost || 0),
      returnItems,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setApproveLoadingId(returnNoteId);
      // Attempt 1: full payload
      let endpoint = `${process.env.REACT_APP_BASE_URL}/STK/v1/return-materials`;
      let attempt = 1;
      console.log(`[REQUEST][Attempt ${attempt}] PUT ${endpoint}`, payload);
      let res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`[RESPONSE][Attempt ${attempt}] status:`, res.status);

      if (!res.ok) {
        // Read error body for diagnostics
        let errBody = {};
        try {
          errBody = await res.json();
        } catch (_) {}
        console.error(`[ERROR][Attempt ${attempt}]`, errBody);

        // Attempt 2: minimal payload with just returnItemIds (legacy API shape)
        attempt = 2;
        const returnItemIds = (note.items || [])
          .map((it) => it.id ?? it.returnItemId)
          .filter((id) => id != null);
        const minimalPayload = { returnItemIds };
        console.log(
          `[REQUEST][Attempt ${attempt}] PUT ${endpoint}`,
          minimalPayload
        );
        res = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(minimalPayload),
        });
        console.log(`[RESPONSE][Attempt ${attempt}] status:`, res.status);

        if (!res.ok) {
          let errMsg = `Server error: ${res.status}`;
          try {
            const errData = await res.json();
            console.error(`[ERROR][Attempt ${attempt}]`, errData);
            errMsg = errData.message || errMsg;
          } catch (_) {}
          throw new Error(errMsg);
        }
      }

      const data = await res.json().catch(() => ({}));
      console.log("Response body:", data);

      // Update frontend: set this note status to Returned
      setReturnNotes((prev) =>
        prev.map((n) =>
          n.returnNoteId === returnNoteId
            ? {
                ...n,
                status: "Returned",
                processedDate: new Date().toISOString().split("T")[0],
              }
            : n
        )
      );

      toast.success("Return processed successfully.");
    } catch (err) {
      console.error("Failed to approve return:", err);
      toast.error(`Failed to approve return: ${err.message || "Unknown error"}`);
    } finally {
      setApproveLoadingId(null);
    }
  };

  // Receive Outlet Return
  const handleReceiveOutletReturn = async (id) => {
    const receiverId = localStorage.getItem("userId");
    try {
      setApproveLoadingId(id); // Reusing approveLoadingId for visual feedback
      await posService.receiveOutletReturn(id, receiverId);
      
      // Update local state
      setOutletReturns(prev => prev.map(ret => 
        ret.id === id ? { ...ret, status: 'RECEIVED' } : ret
      ));
      
      toast.success("Outlet return received and inventory updated successfully!");
    } catch (err) {
      console.error("Failed to receive outlet return:", err);
      toast.error(`Failed to receive: ${err.message || "Unknown error"}`);
    } finally {
      setApproveLoadingId(null);
    }
  };
  // Filter return notes
  const getFilteredReturnNotes = () => {
    let filtered = returnNotes;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.returnNoteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (getSupplierNameById(note.supplierId) || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((note) => note.status === statusFilter);
    }

    // Apply supplier filter
    if (supplierFilter !== "All") {
      filtered = filtered.filter(
        (note) => String(note.supplierId) === String(supplierFilter)
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredReturnNotes = getFilteredReturnNotes();

  // Helper: supplier name lookup (now we have supplierName in the data)
  const getSupplierNameById = (id) => {
    // First try to get from the return note data itself
    const returnNote = returnNotes.find((note) => note.supplierId === id);
    if (returnNote && returnNote.supplierName) {
      return returnNote.supplierName;
    }
    // Fallback to suppliers list
    const s = suppliers.find((x) => Number(x.supplierId) === Number(id));
    return s ? s.name : `Supplier #${id}`;
  };

  // Get unique suppliers from return notes for filter (use IDs, display names)
  const uniqueSuppliers = Array.from(
    new Set(returnNotes.map((note) => note.supplierId))
  ).map((id) => ({ id, name: getSupplierNameById(id) }));

  // Handle edit return note
  const handleEditReturnNote = (note) => {
    // Only allow editing for Pending status
    if (note.status !== "Pending") {
      toast.error("Only pending returns can be edited");
      return;
    }

    // Set editing data - copy all the note data
    setEditingReturnNote({
      id: note.id,
      returnNoteId: note.returnNoteId,
      returnDate: note.date,
      supplier: note.supplierId,
      supplierName: note.supplierName,
      items: note.items.map((item) => ({ ...item })), // Make a copy of items
    });

    // Fetch raw materials for the supplier
    fetchRawMaterials(note.supplierId);

    // Open the edit modal
    setShowEditModal(true);
  };

  // Save edited return note
  const handleSaveEditedReturnNote = async () => {
    // Validation: check if supplier and items exist
    if (!editingReturnNote.supplier || editingReturnNote.items.length === 0) {
      toast.error("Please select a supplier and add at least one item.");
      return;
    }

    // Validate quantities
    const invalidItems = editingReturnNote.items.filter(
      (item) =>
        item.returnQuantity <= 0 || item.returnQuantity > item.availableStock
    );

    if (invalidItems.length > 0) {
      toast.error(
        "Please check return quantities. They must be greater than 0 and not exceed available stock."
      );
      return;
    }

    // Update the return note in the list
    setReturnNotes((prev) =>
      prev.map((note) =>
        note.id === editingReturnNote.id
          ? {
              ...note,
              date: editingReturnNote.returnDate,
              supplierId: editingReturnNote.supplier,
              supplierName: editingReturnNote.supplierName,
              items: editingReturnNote.items,
              totalItems: editingReturnNote.items.length,
            }
          : note
      )
    );

    toast.success("Return note updated successfully!");

    // Close modal and clear editing state
    setShowEditModal(false);
    setEditingReturnNote(null);
  };

  // PUT: Update existing return note (full details)
  const handleUpdateReturnNote = async () => {
    if (!editingReturnNote) {
      toast.error("No return note selected for update.");
      return;
    }

    // Basic validation
    if (
      !editingReturnNote.supplier ||
      (editingReturnNote.items || []).length === 0
    ) {
      toast.error("Please select a supplier and add at least one item.");
      return;
    }

    // Build rich payload with return note + items
    const items = (editingReturnNote.items || []).map((it) => {
      const unitPriceNum = Number(it.unitPrice || 0);
      const returnQtyNum = Number(it.returnQuantity || 0);
      const totalPriceNum = Number(
        it.totalPrice != null ? it.totalPrice : unitPriceNum * returnQtyNum
      );
      return {
        returnItemId: it.id ?? it.returnItemId ?? null,
        rawMaterialId: it.rawMaterialId ?? it.id,
        rawMaterialName: it.name || it.rawMaterialName || "",
        category: it.category || "",
        unitOfMeasure: it.unit || it.unitOfMeasure || "",
        returnQuantity: returnQtyNum,
        unitPrice: unitPriceNum,
        totalPrice: totalPriceNum,
        status: String(it.status || "").toUpperCase() === "PENDING" ? "NOT_APPROVED" : String(it.status || "").toUpperCase(),
        reason: (it.reason || "").toUpperCase().replace(/\s+/g, "_"),
        createdAt: it.createdAt || null,
        updatedAt: new Date().toISOString(),
      };
    });

    const payload = {
      returnId: editingReturnNote.id,
      returnDate: editingReturnNote.returnDate,
      supplierId: Number(editingReturnNote.supplier),
      supplierName:
        editingReturnNote.supplierName ||
        getSupplierNameById(editingReturnNote.supplier),
      numberOfItems: items.length,
      totalCost: items.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0),
      items,
      createdAt: null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const endpoint = `${process.env.REACT_APP_BASE_URL}/STK/v1/returns/${editingReturnNote.id}`;
      console.log("[REQUEST] PUT", endpoint, payload);
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("[RESPONSE] status:", res.status);

      if (!res.ok) {
        let errMsg = `Server error: ${res.status}`;
        try {
          const errData = await res.json();
          console.error("[ERROR BODY]", errData);
          errMsg = errData.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => ({}));
      console.log("[RESPONSE BODY]", data);

      // Reflect updates locally
      setReturnNotes((prev) =>
        prev.map((note) =>
          note.id === editingReturnNote.id
            ? {
                ...note,
                date: editingReturnNote.returnDate,
                supplierId: editingReturnNote.supplier,
                supplierName: editingReturnNote.supplierName,
                items: editingReturnNote.items,
                totalItems: editingReturnNote.items.length,
                totalCost: payload.totalCost,
                updatedAt: payload.updatedAt,
              }
            : note
        )
      );

      toast.success("Return note updated successfully on server.");
    } catch (err) {
      console.error("Failed to update return note:", err);
      toast.error(`Failed to update return note: ${err.message || "Unknown error"}`);
    }
  };

  const handlePrint = () => {
    if (!selectedReturnNote) {
      toast.error("No return note selected for printing.");
      return;
    }

    // Map actual return note items to the format expected by GoodsReturnNote component
    const returnItems = selectedReturnNote.items.map((item) => ({
      code: item.code || `RM-${item.rawMaterialId}`,
      description: item.name || `Raw Material ${item.rawMaterialId}`,
      brand: item.brand || "-",
      unit: item.unit || "pcs",
      returnQty: item.returnQuantity || 0,
      reason: item.reason || "Not specified",
    }));

    const report = (
      <GoodsReturnNote
        companyName="Bakery Outlet Management System"
        returnNoteNo={selectedReturnNote.returnNoteId}
        returningDept="Store Department"
        grnNo={`GRN-${selectedReturnNote.id}`}
        date={new Date(selectedReturnNote.date).toLocaleDateString()}
        supplier={getSupplierNameById(selectedReturnNote.supplierId)}
        data={returnItems}
      />
    );

    printReactReport(
      report,
      `Goods Return Note - ${selectedReturnNote.returnNoteId}`
    );
  };

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />
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
              Return Materials
            </h1>
            <p className="text-[14px] text-[#667085]">
              Process returns for expired, damaged, or incorrect materials with
              manager approval
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    PENDING RETURNS
                  </p>
                  <p className="text-[24px] font-[700] text-[#F4A100]">
                    {
                      returnNotes.filter((note) => note.status === "Pending")
                        .length
                    }
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
                    APPROVED RETURNS
                  </p>
                  <p className="text-[24px] font-[700] text-[#199D26]">
                    {
                      returnNotes.filter((note) => note.status === "Approved")
                        .length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#DDFFE0] rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-[#199D26]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    REJECTED RETURNS
                  </p>
                  <p className="text-[24px] font-[700] text-[#EF4444]">
                    {
                      returnNotes.filter((note) => note.status === "Rejected")
                        .length
                    }
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
                    TOTAL RETURNS
                  </p>
                  <p className="text-[24px] font-[700] text-[#0F50AA]">
                    {returnNotes.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#EBF8FF] rounded-lg flex items-center justify-center">
                  <Check size={24} className="text-[#0F50AA]" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] mb-6">
            <div className="flex border-b border-[#E4E6EA]">
              <button
                onClick={() => setActiveTab("rawMaterials")}
                className={`flex items-center gap-2 px-6 py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "rawMaterials"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <RotateCcw size={16} />
                Raw Material Returns
              </button>
              <button
                onClick={() => setActiveTab("outletReturns")}
                className={`flex items-center gap-2 px-6 py-4 text-[14px] font-[500] border-b-2 transition-colors ${
                  activeTab === "outletReturns"
                    ? "border-[#0F50AA] text-[#0F50AA] bg-[#EBF8FF]"
                    : "border-transparent text-[#667085] hover:text-[#383E49]"
                }`}
              >
                <Warehouse size={16} />
                POS Outlet Returns
              </button>
            </div>
          </div>

          {activeTab === "rawMaterials" ? (
            <>
              {/* Create Return Note Section */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Create Return Note
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[12px] text-[#667085]">
                  Return Note ID:
                </span>
                <span className="text-[14px] font-[600] text-[#383E49]">
                  {returnNote.returnNoteId}
                </span>
              </div>
            </div>

            {/* Return Note Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Return Date <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="date"
                  value={returnNote.returnDate}
                  onChange={(e) =>
                    setReturnNote((prev) => ({
                      ...prev,
                      returnDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Supplier <span className="text-[#EF4444]">*</span>
                </label>

                <select
                  value={returnNote.supplier}
                  onChange={(e) => {
                    const selectedId =
                      e.target.value === "" ? "" : Number(e.target.value);
                    const selected = suppliers.find(
                      (s) => s.supplierId === selectedId
                    );
                    setReturnNote((prev) => ({
                      ...prev,
                      supplier: selectedId, // keep supplierId
                      supplierName: selected?.name || "", // optional convenience
                    }));

                    // Fetch raw materials when supplier is selected
                    if (selectedId) {
                      fetchRawMaterials(selectedId);
                    } else {
                      setAvailableStock([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                  disabled={loadingSuppliers}
                >
                  <option value="">Select Supplier</option>

                  {loadingSuppliers && <option>Loading suppliers...</option>}

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.supplierId}
                      value={supplier.supplierId}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>

                {supplierError && (
                  <p className="text-red-500 text-sm mt-1">
                    Error: {supplierError}
                  </p>
                )}
              </div>
            </div>

            {/* Add Item Button */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[16px] font-[600] text-[#383E49]">
                Return Items
              </h4>
              <button
                onClick={() => setShowAddItemModal(true)}
                disabled={!returnNote.supplier || loadingRawMaterials}
                className="flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#2563EB] disabled:bg-[#667085] disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
                {loadingRawMaterials
                  ? "Loading Materials..."
                  : "Add Raw Material"}
              </button>
            </div>

            {/* Return Items Table */}
            {returnNote.items.length > 0 ? (
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Material
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Batch Info
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Available
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Return Qty
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Reason
                      </th>
                      <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnNote.items.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[600] text-[#383E49]">
                              {item.name}
                            </p>
                            <p className="text-[12px] text-[#667085]">
                              Brand: {item.brand}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="text-[14px] font-[500] text-[#383E49]">
                              {item.batchNo}
                            </p>
                            <p
                              className={`text-[12px] ${
                                isExpired(item.expiryDate)
                                  ? "text-[#EF4444]"
                                  : "text-[#667085]"
                              }`}
                            >
                              Exp:{" "}
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                            {isExpired(item.expiryDate) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FEE2E2] text-[#EF4444] mt-1">
                                EXPIRED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">
                            {item.availableStock} {item.unit}
                          </p>
                        </td>
                        <td className="py-4">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            max={item.availableStock}
                            value={item.returnQuantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "returnQuantity",
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            className="w-20 px-2 py-1 border border-[#E4E6EA] rounded text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                          />
                        </td>
                        <td className="py-4">
                          <select
                            value={item.reason}
                            onChange={(e) =>
                              handleUpdateItem(index, "reason", e.target.value)
                            }
                            className="w-32 px-2 py-1 border border-[#E4E6EA] rounded text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                          >
                            {returnReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-[#E4E6EA] rounded-lg mb-6">
                <Package size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No items added yet
                </p>
                <p className="text-[14px] text-[#667085]">
                  Click "Add Raw Material" to start creating your return note
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E4E6EA]">
              <button
                onClick={handleSubmitReturnNote}
                disabled={
                  !returnNote.supplier ||
                  returnNote.items.length === 0 ||
                  submitLoading
                }
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#2563EB] disabled:bg-[#667085] disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
                {submitLoading ? "Submitting..." : "Submit for Approval"}
              </button>
              <button
                onClick={() =>
                  setReturnNote({
                    returnNoteId: "RN" + Date.now(),
                    returnDate: new Date().toISOString().split("T")[0],
                    supplier: "",
                    items: [],
                  })
                }
                className="px-6 py-3 text-[#667085] bg-white border border-[#E4E6EA] text-[14px] font-[500] rounded-md hover:bg-[#F8F9FA] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Return Notes History */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Return Notes History
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[12px] text-[#667085]">
                  Showing {filteredReturnNotes.length} return notes
                </span>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by return note ID or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Returned">Returned</option>
                </select>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                >
                  <option value="All">All Suppliers</option>
                  {uniqueSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Return Notes Table */}
            {loadingReturns ? (
              <Loader variant="section" text="Loading returns..." />
            ) : returnsError ? (
              <div className="text-center py-12">
                <AlertCircle
                  size={48}
                  className="mx-auto text-[#EF4444] mb-4"
                />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  Failed to load returns
                </p>
                <p className="text-[14px] text-[#667085]">{returnsError}</p>
              </div>
            ) : filteredReturnNotes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Return Note ID
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Supplier
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                        Items
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
                    {filteredReturnNotes.map((note) => (
                      <tr
                        key={note.id}
                        className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-[#383E49]">
                            {note.returnNoteId}
                          </p>
                          <p className="text-[12px] text-[#667085]">
                            by {note.createdBy}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">
                            {getSupplierNameById(note.supplierId)}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] text-[#383E49]">
                            {new Date(note.date).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">
                            {note.totalItems} items
                          </p>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${getStatusColor(
                              note.status
                            )}`}
                          >
                            {note.status === "Pending" && (
                              <Clock size={12} className="mr-1" />
                            )}
                            {note.status === "Approved" && (
                              <CheckCircle2 size={12} className="mr-1" />
                            )}
                            {note.status === "Rejected" && (
                              <AlertTriangle size={12} className="mr-1" />
                            )}
                            {note.status === "Returned" && (
                              <Check size={12} className="mr-1" />
                            )}
                            {note.status}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedReturnNote(note);
                                setShowReturnDetailsModal(true);
                              }}
                              className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditReturnNote(note)}
                              className="p-2 text-[#F4A100] hover:bg-[#FFF4E6] rounded-lg transition-colors"
                              title="Edit Return"
                            >
                              <Edit size={16} />
                            </button>
                            {note.status === "Approved" && (
                              <button
                                onClick={() =>
                                  handleMarkAsReturn(note.returnNoteId)
                                }
                                disabled={
                                  approveLoadingId === note.returnNoteId
                                }
                                className="p-2 text-[#199D26] hover:bg-[#F0FDF4] rounded-lg transition-colors disabled:text-[#94D3A2] disabled:cursor-not-allowed"
                                title="Mark as Returned"
                              >
                                <Check
                                  size={16}
                                  className={
                                    approveLoadingId === note.returnNoteId
                                      ? "animate-spin"
                                      : ""
                                  }
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No return notes found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm ||
                  statusFilter !== "All" ||
                  supplierFilter !== "All"
                    ? "Try adjusting your search criteria"
                    : "Return notes will appear here once created"}
                </p>
              </div>
            )}
            </div>
          </>
        ) : (
          /* Outlet Returns Tab Content */
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Approved POS Outlet Returns
                </h3>
                <p className="text-[14px] text-[#667085] mt-1">
                  Approved returns from POS outlets waiting to be received into main store inventory
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <span className="text-[12px] text-[#667085]">
                  Showing {outletReturns.length} pending receipts
                </span>
              </div>
            </div>

            {loadingOutletReturns ? (
              <Loader variant="section" text="Loading outlet returns..." />
            ) : outletReturnsError ? (
              <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-[#EF4444] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49]">Error</p>
                <p className="text-[14px] text-[#667085]">{outletReturnsError}</p>
              </div>
            ) : outletReturns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Return ID</th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Outlet</th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Items</th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Initiator</th>
                      <th className="text-center py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E6EA]">
                    {outletReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-[#F8F9FA]">
                        <td className="py-4 px-4">
                          <p className="text-[14px] font-[600] text-[#0F50AA]">{ret.returnNoteId}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Building size={16} className="text-[#667085]" />
                            <p className="text-[14px] font-[500] text-[#383E49]">{ret.outletName}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[14px] text-[#667085]">{new Date(ret.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[14px] font-[500] text-[#383E49]">{ret.totalItems} Items</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[14px] text-[#667085]">{ret.initiator}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedReturnNote({
                                  ...ret,
                                  returnNoteId: ret.returnNoteId,
                                  supplierId: ret.outletName, // for display
                                  date: ret.date,
                                  status: ret.status,
                                  totalItems: ret.totalItems,
                                  items: (ret.items || []).map(item => ({
                                    ...item,
                                    name: item.productName || `Prod-${item.productId}`,
                                    rawMaterialId: item.productId,
                                    returnQuantity: item.quantity,
                                    unit: 'units',
                                    unitPrice: 0,
                                    totalPrice: 0,
                                    reason: item.reason,
                                    status: 'APPROVED'
                                  }))
                                });
                                setShowReturnDetailsModal(true);
                              }}
                              className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                              title="View Items"
                            >
                              <Eye size={16} />
                            </button>
                            {ret.status === 'Approved' && (
                              <button
                                onClick={() => handleReceiveOutletReturn(ret.id)}
                                disabled={approveLoadingId === ret.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#199D26] text-white text-[12px] font-[500] rounded hover:bg-[#15803D] disabled:bg-[#94D3A2] transition-colors"
                              >
                                {approveLoadingId === ret.id ? (
                                  <Clock size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                Receive
                              </button>
                            )}
                            {ret.status === 'Received' && (
                              <span className="px-3 py-1 bg-[#DDFFE0] text-[#199D26] text-[12px] font-[600] rounded-full">
                                Received
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[#E4E6EA] rounded-lg">
                <Warehouse size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49]">No approved returns</p>
                <p className="text-[14px] text-[#667085]">There are no approved outlet returns waiting to be received.</p>
              </div>
            )}
          </div>
        )}
        </main>
      </div>

      {/* Edit Return Note Modal */}
      {showEditModal && editingReturnNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <div>
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Edit Return Note
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  Return Note ID: {editingReturnNote.returnNoteId}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReturnNote(null);
                }}
                className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>

            <div className="p-6 ">
              {/* Return Note Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                    Return Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    value={editingReturnNote.returnDate}
                    onChange={(e) =>
                      setEditingReturnNote((prev) => ({
                        ...prev,
                        returnDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                    Supplier <span className="text-[#EF4444]">*</span>
                  </label>

                  <select
                    value={editingReturnNote.supplier}
                    onChange={(e) => {
                      const selectedId =
                        e.target.value === "" ? "" : Number(e.target.value);
                      const selected = suppliers.find(
                        (s) => s.supplierId === selectedId
                      );
                      setEditingReturnNote((prev) => ({
                        ...prev,
                        supplier: selectedId, // keep supplierId
                        supplierName: selected?.name || "", // optional convenience
                      }));

                      // Fetch raw materials when supplier is selected
                      if (selectedId) {
                        fetchRawMaterials(selectedId);
                      } else {
                        setAvailableStock([]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                    disabled={loadingSuppliers}
                  >
                    <option value="">Select Supplier</option>

                    {loadingSuppliers && <option>Loading suppliers...</option>}

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.supplierId}
                        value={supplier.supplierId}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>

                  {supplierError && (
                    <p className="text-red-500 text-sm mt-1">
                      Error: {supplierError}
                    </p>
                  )}
                </div>
              </div>

              {/* Add Item Button */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[16px] font-[600] text-[#383E49]">
                  Return Items
                </h4>
                <button
                  onClick={() => setShowAddItemModal(true)}
                  disabled={!editingReturnNote.supplier || loadingRawMaterials}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#2563EB] disabled:bg-[#667085] disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                  {loadingRawMaterials
                    ? "Loading Materials..."
                    : "Add Raw Material"}
                </button>
              </div>

              {/* Return Items Table */}
              {editingReturnNote.items.length > 0 ? (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E6EA]">
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Material
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Batch Info
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Available
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Return Qty
                        </th>
                        <th className="text-left py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Reason
                        </th>
                        <th className="text-center py-3 text-[12px] font-[600] text-[#383E49] uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingReturnNote.items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                        >
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-[600] text-[#383E49]">
                                {item.name}
                              </p>
                              <p className="text-[12px] text-[#667085]">
                                Brand: {item.brand}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="text-[14px] font-[500] text-[#383E49]">
                                {item.batchNo}
                              </p>
                              <p
                                className={`text-[12px] ${
                                  isExpired(item.expiryDate)
                                    ? "text-[#EF4444]"
                                    : "text-[#667085]"
                                }`}
                              >
                                Exp:{" "}
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </p>
                              {isExpired(item.expiryDate) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FEE2E2] text-[#EF4444] mt-1">
                                  EXPIRED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="text-[14px] font-[500] text-[#383E49]">
                              {item.availableStock} {item.unit}
                            </p>
                          </td>
                          <td className="py-4">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              max={item.availableStock}
                              value={item.returnQuantity}
                              onChange={(e) =>
                                handleUpdateEditingItem(
                                  index,
                                  "returnQuantity",
                                  e.target.value === "" ? "" : parseFloat(e.target.value)
                                )
                              }
                              className="w-20 px-2 py-1 border border-[#E4E6EA] rounded text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                            />
                          </td>
                          <td className="py-4">
                            <select
                              value={item.reason}
                              onChange={(e) =>
                                handleUpdateEditingItem(
                                  index,
                                  "reason",
                                  e.target.value
                                )
                              }
                              className="w-32 px-2 py-1 border border-[#E4E6EA] rounded text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                            >
                              {returnReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleRemoveEditingItem(index)}
                              className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[#E4E6EA] rounded-lg mb-6">
                  <Package size={48} className="mx-auto text-[#667085] mb-4" />
                  <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                    No items added yet
                  </p>
                  <p className="text-[14px] text-[#667085]">
                    Click "Add Raw Material" to start creating your return note
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons at bottom */}
            <div className="p-6 border-t border-[#E4E6EA]">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEditedReturnNote}
                  disabled={
                    !editingReturnNote.supplier ||
                    editingReturnNote.items.length === 0
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#2563EB] disabled:bg-[#667085] disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleUpdateReturnNote}
                  disabled={
                    !editingReturnNote.supplier ||
                    editingReturnNote.items.length === 0
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-[#199D26] text-white text-[14px] font-[500] rounded-md hover:bg-[#15803D] disabled:bg-[#94D3A2] disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Update on Server (PUT)
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReturnNote(null);
                  }}
                  className="px-6 py-3 text-[#667085] bg-white border border-[#E4E6EA] text-[14px] font-[500] rounded-md hover:bg-[#F8F9FA]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-x-hidden overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <h2 className="text-[20px] font-[600] text-[#383E49]">
                Add Raw Materials to Return
              </h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#667085]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <AddItemModalContent
                availableStock={availableStock}
                selectedSupplier={returnNote.supplier}
                selectedSupplierName={returnNote.supplierName}
                onAddItems={handleAddItem}
                onClose={() => setShowAddItemModal(false)}
                loading={loadingRawMaterials}
                error={rawMaterialsError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {showReturnDetailsModal && selectedReturnNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-[#E4E6EA] gap-4">
              {/* Title & Info */}
              <div className="text-center sm:text-left">
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Return Note - {selectedReturnNote.returnNoteId}
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  {getSupplierNameById(selectedReturnNote.supplierId)} •{" "}
                  {new Date(selectedReturnNote.date).toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                {/* <button
                  onClick={() => alert("Downloading return note...")}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download
                </button> */}

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 text-[14px] font-[500] text-[#0F50AA] bg-[#EBF8FF] hover:bg-[#DBEAFE] rounded-lg transition-colors"
                >
                  <Printer size={16} />
                  Print
                </button>

                <button
                  onClick={() => setShowReturnDetailsModal(false)}
                  className="p-2 hover:bg-[#F8F9FA] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#667085]" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Return Note Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${getStatusColor(
                      selectedReturnNote.status
                    )}`}
                  >
                    {selectedReturnNote.status === "Pending" && (
                      <Clock size={12} className="mr-1" />
                    )}
                    {selectedReturnNote.status === "Approved" && (
                      <CheckCircle2 size={12} className="mr-1" />
                    )}
                    {selectedReturnNote.status === "Rejected" && (
                      <AlertTriangle size={12} className="mr-1" />
                    )}
                    {selectedReturnNote.status}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Created By
                  </p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedReturnNote.createdBy}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Total Items
                  </p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedReturnNote.totalItems}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-[#667085] mb-1">
                    Total Cost
                  </p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    Rs. {selectedReturnNote.totalCost?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Rejection Reason (if applicable) */}
              {selectedReturnNote.status === "Rejected" &&
                selectedReturnNote.rejectionReason && (
                  <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={20}
                        className="text-[#EF4444] mt-0.5"
                      />
                      <div>
                        <p className="text-[14px] font-[600] text-[#EF4444] mb-1">
                          Return Rejected
                        </p>
                        <p className="text-[14px] text-[#B91C1C]">
                          {selectedReturnNote.rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Return Items Table */}
              <div className="border border-[#E4E6EA] rounded-lg">
                <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#E4E6EA]">
                  <h4 className="text-[16px] font-[600] text-[#383E49]">
                    Returned Items
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8F9FA]">
                      <tr>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Material
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Brand
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Batch/Lot
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Expiry Date
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Available
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Return Qty
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Unit Price
                        </th>
                        <th className="text-right py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Total Price
                        </th>
                        <th className="text-left py-3 px-4 text-[12px] font-[600] text-[#383E49] uppercase">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {selectedReturnNote.items.map((item, index) => {
                        const displayName =
                          item.name || `RM-${item.rawMaterialId}`;
                        return (
                          <tr key={index} className="hover:bg-[#F8F9FA]">
                            <td className="py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                              {displayName}
                              <div className="text-[12px] text-[#667085]">
                                ID: {item.rawMaterialId}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[14px] text-[#383E49]">
                              {item.brand || "-"}
                            </td>
                            <td className="py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                              {item.batchNo}
                            </td>
                            <td className="py-3 px-4 text-[14px] text-[#383E49]">
                              {item.expiryDate || "-"}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] text-[#383E49]">
                              {item.availableStock != null
                                ? `${item.availableStock} ${item.unit}`
                                : "-"}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#EF4444]">
                              {item.returnQuantity} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] text-[#383E49]">
                              Rs. {item.unitPrice?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#383E49]">
                              Rs. {item.totalPrice?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-[14px] text-[#383E49]">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px]">
                                  {item.reason}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#F0F1F3] text-[#667085]">
                                  {item.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-6 border-t border-[#E4E6EA]">
              <button
                onClick={() => setShowReturnDetailsModal(false)}
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

// Add Item Modal Component
function AddItemModalContent({
  availableStock,
  selectedSupplier,
  selectedSupplierName,
  onAddItems,
  onClose,
  loading,
  error,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Filter available stock based on search term (supplier is already filtered by API)
  const filteredStock = availableStock.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find(
        (selected) =>
          selected.id === item.id && selected.batchNo === item.batchNo
      );
      if (exists) {
        return prev.filter(
          (selected) =>
            !(selected.id === item.id && selected.batchNo === item.batchNo)
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by material name, code, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
          />
        </div>
      </div>

      {/* Supplier Filter Info */}
      {selectedSupplier && selectedSupplierName && (
        <div className="mb-4 p-3 bg-[#EBF8FF] border border-[#BFDBFE] rounded-lg">
          <p className="text-[14px] text-[#1D4ED8]">
            <Building size={16} className="inline mr-2" />
            Showing items for supplier:{" "}
            <span className="font-[600]">{selectedSupplierName}</span>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
          <p className="text-[14px] text-[#EF4444]">
            <AlertCircle size={16} className="inline mr-2" />
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-3 bg-[#F0F9FF] border border-[#BFDBFE] rounded-lg">
          <p className="text-[14px] text-[#1D4ED8]">
            <Clock size={16} className="inline mr-2" />
            Loading raw materials...
          </p>
        </div>
      )}

      {/* Selected Items Counter */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] text-[#383E49]">
          Available Items ({filteredStock.length})
        </p>
        <p className="text-[14px] font-[500] text-[#0F50AA]">
          Selected: {selectedItems.length}
        </p>
      </div>

      {/* Items List */}
      <div className="border border-[#E4E6EA] rounded-lg">
        {loading ? (
          <Loader variant="section" text="Loading raw materials..." />
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-[#EF4444] mb-4" />
            <p className="text-[16px] font-[500] text-[#383E49] mb-2">
              Failed to load materials
            </p>
            <p className="text-[14px] text-[#667085]">{error}</p>
          </div>
        ) : filteredStock.length > 0 ? (
          <div className="divide-y divide-[#E4E6EA]">
            {filteredStock.map((item) => {
              const isSelected = selectedItems.some(
                (selected) =>
                  selected.id === item.id && selected.batchNo === item.batchNo
              );
              const expired = isExpired(item.expiryDate);

              return (
                <div
                  key={`${item.id}-${item.batchNo}`}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-[#EBF8FF]" : "hover:bg-[#F8F9FA]"
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleItemSelect(item)}
                          className="w-4 h-4 text-[#0F50AA] bg-gray-100 border-gray-300 rounded focus:ring-[#0F50AA] focus:ring-2"
                        />
                        <div>
                          <p className="text-[14px] font-[600] text-[#383E49]">
                            {item.name}
                          </p>
                          <p className="text-[12px] text-[#667085]">
                            {item.code} • Category: {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="ml-7 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
                        <div>
                          <span className="text-[#667085]">Batch: </span>
                          <span className="font-[500] text-[#383E49]">
                            {item.batchNo}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#667085]">Stock: </span>
                          <span className="font-[500] text-[#383E49]">
                            {item.availableStock} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#667085]">Expiry: </span>
                          <span
                            className={`font-[500] ${
                              expired ? "text-[#EF4444]" : "text-[#383E49]"
                            }`}
                          >
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#667085]">Unit Cost: </span>
                          <span className="font-[500] text-[#383E49]">
                            Rs. {item.unitCost}
                          </span>
                        </div>
                      </div>
                      {expired && (
                        <div className="ml-7 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-[500] bg-[#FEE2E2] text-[#EF4444]">
                            <AlertTriangle size={10} className="mr-1" />
                            EXPIRED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-[#667085] mb-4" />
            <p className="text-[16px] font-[500] text-[#383E49] mb-2">
              No items available
            </p>
            <p className="text-[14px] text-[#667085]">
              {selectedSupplier
                ? `No items found for ${selectedSupplierName}${
                    searchTerm ? " matching your search" : ""
                  }`
                : "Please select a supplier first to view available items"}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] hover:bg-[#F8F9FA] rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onAddItems(selectedItems)}
          disabled={selectedItems.length === 0}
          className="px-6 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-md hover:bg-[#2563EB] disabled:bg-[#667085] disabled:cursor-not-allowed transition-colors"
        >
          Add {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
