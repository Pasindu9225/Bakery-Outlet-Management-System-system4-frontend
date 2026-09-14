import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  X,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Package,
} from "lucide-react";
import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import { formatQuantity } from "../utils/quantityFormatter";

export default function StorekeeperIouRequests() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("IOU Requests");
  const [ious, setIous] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [activeItemIndexForNewMaterial, setActiveItemIndexForNewMaterial] = useState(null);
  const [selectedIou, setSelectedIou] = useState(null);

  // Raw materials list
  const [rawMaterials, setRawMaterials] = useState([]);
  const [newMaterialForm, setNewMaterialForm] = useState({
    materialName: "",
    unitOfMeasure: "Kg",
    unitCost: 0,
    minimumStockLevel: 5,
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({
    userId: localStorage.getItem("userId") || "00000000-0000-0000-0000-000000000000", // Storekeeper user ID
    requestDate: new Date().toISOString().split("T")[0],
    justification: "",
    receiverName: "",
    items: [
      {
        supplierName: "",
        supplierContact: "",
        itemType: "RAW_MATERIAL",
        rawMaterialId: "",
        itemName: "",
        unitOfMeasure: "Kg",
        estimatedQuantity: 0,
        estimatedPrice: 0,
      },
    ],
  });

  // Settle Form State
  const [settleForm, setSettleForm] = useState({
    invoiceNumber: "",
    actualItems: [],
  });

  useEffect(() => {
    fetchIous();
    fetchRawMaterials();
  }, []);

  const fetchRawMaterials = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/STK/v1/materials/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setRawMaterials(data);
      }
    } catch (err) {
      console.error("Failed to fetch raw materials", err);
    }
  };

  const fetchIous = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch IOUs");
      const data = await res.json();
      setIous(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialForm.materialName.trim()) return;

    try {
      const token = localStorage.getItem("authToken");
      const payload = {
        name: newMaterialForm.materialName.trim(),
        materialName: newMaterialForm.materialName.trim(),
        materialCode: "RM-QUICK-" + Date.now().toString().slice(-5),
        unitOfMeasure: newMaterialForm.unitOfMeasure,
        unitCost: parseFloat(newMaterialForm.unitCost) || 0,
        minimumStockLevel: parseFloat(newMaterialForm.minimumStockLevel) || 5,
        isActive: true,
      };

      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/ADMIN/v1/raw-materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let createdMaterial = null;
      if (res.ok) {
        createdMaterial = await res.json();
      } else {
        // Fallback mock object if admin route fails
        createdMaterial = {
          id: Date.now(),
          materialName: payload.materialName,
          unitOfMeasure: payload.unitOfMeasure,
          unitCost: payload.unitCost,
        };
      }

      await fetchRawMaterials();

      if (activeItemIndexForNewMaterial !== null) {
        const updatedItems = [...createForm.items];
        updatedItems[activeItemIndexForNewMaterial] = {
          ...updatedItems[activeItemIndexForNewMaterial],
          rawMaterialId: createdMaterial.id || "",
          itemName: createdMaterial.materialName || createdMaterial.name || payload.materialName,
          unitOfMeasure: createdMaterial.unitOfMeasure || payload.unitOfMeasure,
          estimatedPrice: createdMaterial.unitCost || payload.unitCost || updatedItems[activeItemIndexForNewMaterial].estimatedPrice,
        };
        setCreateForm({ ...createForm, items: updatedItems });
      }

      setShowAddMaterialModal(false);
      setNewMaterialForm({ materialName: "", unitOfMeasure: "Kg", unitCost: 0, minimumStockLevel: 5 });
    } catch (err) {
      alert("Error creating raw material: " + err.message);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create IOU");
      setShowCreateModal(false);
      fetchIous();
      setCreateForm({
        userId: localStorage.getItem("userId") || "00000000-0000-0000-0000-000000000000",
        requestDate: new Date().toISOString().split("T")[0],
        justification: "",
        receiverName: "",
        items: [
          {
            supplierName: "",
            supplierContact: "",
            itemType: "RAW_MATERIAL",
            itemName: "",
            estimatedQuantity: 0,
            estimatedPrice: 0,
          },
        ],
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSettleClick = (iou) => {
    setSelectedIou(iou);
    setSettleForm({
      invoiceNumber: "",
      actualItems: iou.items.map((item) => ({
        iouRequestItemId: item.id,
        actualQuantity: "",
        actualPrice: "",
        actualItemName: item.itemName,
        actualSupplierName: item.supplierName,
      })),
    });
    setShowSettleModal(true);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests/${selectedIou.id}/settle/${localStorage.getItem("userId") || "00000000-0000-0000-0000-000000000000"}`, // Use actual UUID from login
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(settleForm),
        }
      );
      if (!res.ok) throw new Error("Failed to settle IOU");
      setShowSettleModal(false);
      fetchIous();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const printIou = (iou) => {
    const iouIdStr = `IOU-${iou.id.toString().padStart(4, '0')}`;
    const itemsHtml = iou.items && iou.items.length > 0 
      ? iou.items.map(item => `
        <tr style="border-bottom: 1px solid #E4E6EA;">
          <td style="padding: 12px; font-weight: 500;">${item.itemName}</td>
          <td style="padding: 12px; color: #667085;">${item.supplierName}</td>
          <td style="padding: 12px; text-align: right;">${item.estimatedQuantity}</td>
          <td style="padding: 12px; text-align: right;">Rs. ${Number(item.estimatedPrice).toFixed(2)}</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">Rs. ${(item.estimatedQuantity * item.estimatedPrice).toFixed(2)}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="5" style="padding: 20px; text-align: center; color: #667085;">No items listed in this request.</td>
        </tr>
      `;

    const printContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #E4E6EA; border-radius: 8px; color: #383E49;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F50AA; padding-bottom: 20px; margin-bottom: 25px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0F50AA; font-weight: 700; letter-spacing: -0.5px;">DOWNTOWN BAKERY</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #667085;">Inventory & Store Management System</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 18px; color: #383E49; font-weight: 600; letter-spacing: 0.5px;">IOU CASH ADVANCE</h2>
            <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: bold; color: #0F50AA;">${iouIdStr}</p>
          </div>
        </div>
        
        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: #F8F9FA; padding: 20px; border-radius: 6px; border: 1px solid #E4E6EA;">
          <div>
            <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: 600; color: #667085; text-transform: uppercase; letter-spacing: 0.5px;">Request Details</p>
            <p style="margin: 0 0 3px 0; font-size: 14px;"><strong>Date:</strong> ${iou.requestDate}</p>
            <p style="margin: 0 0 3px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #199D26; font-weight: 600;">Approved</span></p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: 600; color: #667085; text-transform: uppercase; letter-spacing: 0.5px;">Advance Receiver</p>
            <p style="margin: 0 0 3px 0; font-size: 14px;"><strong>Name:</strong> ${iou.receiverName}</p>
          </div>
        </div>

        <!-- Justification -->
        <div style="margin-bottom: 30px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #667085; text-transform: uppercase; letter-spacing: 0.5px;">Justification / Reason</p>
          <div style="font-size: 14px; line-height: 1.5; background-color: #FFFFFF; padding: 15px; border-radius: 6px; border: 1px solid #E4E6EA; font-style: italic;">
            "${iou.justification || 'No justification provided.'}"
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 40px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #667085; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Purchases</p>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #E4E6EA; font-size: 14px; text-align: left;">
            <thead>
              <tr style="background-color: #F8F9FA; border-bottom: 1px solid #E4E6EA;">
                <th style="padding: 12px; font-weight: 600; color: #667085;">Item Description</th>
                <th style="padding: 12px; font-weight: 600; color: #667085;">Supplier / Vendor</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #667085;">Est. Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #667085;">Est. Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #667085;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background-color: #F8F9FA; font-weight: bold; border-top: 2px solid #0F50AA;">
                <td colspan="4" style="padding: 15px 12px; text-align: right; text-transform: uppercase; font-size: 12px; color: #667085; letter-spacing: 0.5px;">Total Estimated Advance:</td>
                <td style="padding: 15px 12px; text-align: right; font-size: 16px; color: #0F50AA;">Rs. ${Number(iou.totalEstimatedAmount || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Signature lines -->
        <div style="margin-top: 70px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center;">
          <div>
            <div style="border-bottom: 1px solid #383E49; margin: 0 auto; height: 35px; width: 85%;"></div>
            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: bold; color: #667085; text-transform: uppercase;">Prepared By</p>
          </div>
          <div>
            <div style="border-bottom: 1px solid #383E49; margin: 0 auto; height: 35px; width: 85%;"></div>
            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: bold; color: #667085; text-transform: uppercase;">Checked By</p>
          </div>
          <div>
            <div style="border-bottom: 1px solid #383E49; margin: 0 auto; height: 35px; width: 85%;"></div>
            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: bold; color: #667085; text-transform: uppercase;">Authorized By</p>
          </div>
          <div>
            <div style="border-bottom: 1px solid #383E49; margin: 0 auto; height: 35px; width: 85%;"></div>
            <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: bold; color: #667085; text-transform: uppercase;">Received By</p>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${iouIdStr} - Cash Advance Voucher</title>
          <style>
            @media print {
              body {
                padding: 10px;
                background: white;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [rowSuppliers, setRowSuppliers] = useState({});

  const fetchSuppliersForMaterial = async (index, rawMaterialId) => {
    if (!rawMaterialId) {
      setRowSuppliers((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/suppliers/by-material/${rawMaterialId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRowSuppliers((prev) => ({
          ...prev,
          [index]: data.suppliers || [],
        }));
      } else {
        setRowSuppliers((prev) => ({ ...prev, [index]: [] }));
      }
    } catch (err) {
      console.error("Failed to fetch suppliers for material", err);
      setRowSuppliers((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const addCreateItem = () => {
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        {
          supplierName: "",
          supplierContact: "",
          itemType: "RAW_MATERIAL",
          rawMaterialId: "",
          itemName: "",
          unitOfMeasure: "Kg",
          estimatedQuantity: 0,
          estimatedPrice: 0,
        },
      ],
    });
  };

  const removeCreateItem = (index) => {
    const newItems = [...createForm.items];
    newItems.splice(index, 1);
    setCreateForm({ ...createForm, items: newItems });
    setRowSuppliers((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleCreateItemChange = (index, field, value) => {
    const newItems = [...createForm.items];
    newItems[index][field] = value;

    if (field === "rawMaterialId" && value) {
      const selected = rawMaterials.find((rm) => rm.id === Number(value));
      if (selected) {
        newItems[index].rawMaterialId = selected.id;
        newItems[index].itemName = selected.materialName || selected.name || "";
        newItems[index].unitOfMeasure = selected.unit || selected.unitOfMeasure || "Kg";
        if (selected.unitCost && selected.unitCost > 0) {
          newItems[index].estimatedPrice = selected.unitCost;
        }
        newItems[index].supplierName = "";
        newItems[index].supplierContact = "";
        fetchSuppliersForMaterial(index, selected.id);
      }
    }

    setCreateForm({ ...createForm, items: newItems });
  };

  const handleSettleItemChange = (index, field, value) => {
    const newItems = [...settleForm.actualItems];
    newItems[index][field] = value;
    setSettleForm({ ...settleForm, actualItems: newItems });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 bg-[#FFFBEB] text-[#F4A100] rounded-full text-[12px] font-[500] flex items-center gap-1">
            <Clock size={14} /> Pending Approval
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-3 py-1 bg-[#F0FDF4] text-[#199D26] rounded-full text-[12px] font-[500] flex items-center gap-1">
            <CheckCircle2 size={14} /> Approved
          </span>
        );
      case "SETTLEMENT_PENDING":
        return (
          <span className="px-3 py-1 bg-[#EFF6FF] text-[#0F50AA] rounded-full text-[12px] font-[500] flex items-center gap-1">
            <Clock size={14} /> Settlement Pending
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-3 py-1 bg-[#F0FDF4] text-[#199D26] rounded-full text-[12px] font-[500] flex items-center gap-1">
            <CheckCircle2 size={14} /> Settled / Closed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#F8F9FA] text-[#667085] rounded-full text-[12px] font-[500]">
            {status}
          </span>
        );
    }
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
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                IOU Requests
              </h1>
              <p className="text-[14px] text-[#667085]">
                Manage cash advances for external purchases
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 sm:mt-0 px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494] flex items-center gap-2"
            >
              <Plus size={16} />
              Create IOU Request
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA]">
            <div className="p-4 sm:p-6 border-b border-[#E4E6EA] flex justify-between items-center">
              <h2 className="text-[16px] font-[600] text-[#383E49]">
                All IOU Requests
              </h2>
              <button onClick={fetchIous} className="p-2 hover:bg-[#F8F9FA] rounded-md transition-colors">
                <RefreshCw size={18} className="text-[#64748B] hover:text-[#0F50AA]" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#E4E6EA] bg-[#F8F9FA]">
                    <th className="text-left py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">ID</th>
                    <th className="text-left py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">Date</th>
                    <th className="text-left py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">Receiver</th>
                    <th className="text-left py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">Est. Amount</th>
                    <th className="text-left py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">Status</th>
                    <th className="text-right py-4 px-4 text-[12px] font-[500] text-[#667085] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-[#667085]">Loading formatting IOUs...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-[#EF4444]">{error}</td>
                    </tr>
                  ) : ious.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-[#667085]">No IOUs found</td>
                    </tr>
                  ) : (
                    ious.map((iou) => (
                      <tr key={iou.id} className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]">
                        <td className="py-4 px-4">
                          <span className="text-[14px] font-[500] text-[#383E49]">IOU-{iou.id.toString().padStart(4, '0')}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] text-[#383E49]">{iou.requestDate}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] text-[#383E49]">{iou.receiverName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[14px] font-[500] text-[#383E49]">
                            Rs. {iou.totalEstimatedAmount?.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(iou.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={iou.status !== "APPROVED"}
                              onClick={() => printIou(iou)}
                              className={`p-2 rounded-lg transition-colors ${
                                iou.status === "APPROVED" 
                                ? "text-[#0F50AA] bg-[#F0F8FF] hover:bg-[#E0F0FF]" 
                                : "text-[#A0AAB4] bg-[#F8F9FA] cursor-not-allowed"
                              }`}
                              title={iou.status === "APPROVED" ? "Print IOU" : "Approval Required to Print"}
                            >
                              <Printer size={18} />
                            </button>
                            {iou.status === "APPROVED" && (
                              <button
                                onClick={() => handleSettleClick(iou)}
                                className="px-3 py-1.5 bg-[#199D26] text-white rounded-md text-[12px] font-[500] hover:bg-[#15801E]"
                              >
                                Settle
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE IOU MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <h2 className="text-[18px] font-[600] text-[#383E49]">Create IOU Request</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-[#F8F9FA] rounded-md transition-colors">
                <X size={20} className="text-[#64748B]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="createIouForm" onSubmit={handleCreateSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Request Date *</label>
                    <input 
                      type="date" 
                      required
                      value={createForm.requestDate}
                      onChange={e => setCreateForm({...createForm, requestDate: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Receiver Name *</label>
                    <input 
                      type="text" 
                      required
                      value={createForm.receiverName}
                      onChange={e => setCreateForm({...createForm, receiverName: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Justification / Reason *</label>
                    <textarea 
                      required
                      rows="2"
                      value={createForm.justification}
                      onChange={e => setCreateForm({...createForm, justification: e.target.value})}
                      className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-[600] text-[#383E49]">Supplier & Items Estimates</h3>
                  <button 
                    type="button" 
                    onClick={addCreateItem}
                    className="text-[#0F50AA] text-[14px] font-[500] flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} /> Add Market Item
                  </button>
                </div>

                {createForm.items.map((item, index) => (
                  <div key={index} className="bg-[#F8F9FA] rounded-lg p-4 mb-4 border border-[#E4E6EA] relative">
                    {createForm.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeCreateItem(index)}
                        className="absolute right-3 top-3 text-[#EF4444] hover:bg-[#FEF2F2] p-1 rounded-md"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                          Raw Material Item *
                        </label>
                        <select
                          required
                          value={item.rawMaterialId || ""}
                          onChange={(e) =>
                            handleCreateItemChange(index, "rawMaterialId", e.target.value)
                          }
                          className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] bg-white text-[#383E49]"
                        >
                          <option value="">-- Select Raw Material --</option>
                          {rawMaterials.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.materialName || rm.name} ({rm.code || `RM${rm.id}`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                          Supplier / Vendor *
                        </label>
                        {rowSuppliers[index] && rowSuppliers[index].length > 0 ? (
                          <select
                            required
                            value={item.supplierName || ""}
                            onChange={(e) => {
                              const selectedVal = e.target.value;
                              if (selectedVal === "__CUSTOM__") {
                                handleCreateItemChange(index, "supplierName", "");
                                handleCreateItemChange(index, "supplierContact", "");
                              } else {
                                const suppObj = (rowSuppliers[index] || []).find(
                                  (s) => s.name === selectedVal
                                );
                                handleCreateItemChange(index, "supplierName", selectedVal);
                                if (suppObj) {
                                  handleCreateItemChange(
                                    index,
                                    "supplierContact",
                                    suppObj.contactNumber || suppObj.email || ""
                                  );
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] bg-white text-[#383E49]"
                          >
                            <option value="">-- Select Supplier --</option>
                            {rowSuppliers[index].map((s) => (
                              <option key={s.supplierId || s.name} value={s.name}>
                                {s.name} {s.contactNumber ? `(${s.contactNumber})` : ""}
                              </option>
                            ))}
                            <option value="__CUSTOM__">-- Other / Custom Vendor --</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder={item.rawMaterialId ? "Enter vendor name" : "e.g. City Market"}
                            value={item.supplierName}
                            onChange={(e) =>
                              handleCreateItemChange(index, "supplierName", e.target.value)
                            }
                            className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">Contact (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="Phone / Email"
                          value={item.supplierContact}
                          onChange={e => handleCreateItemChange(index, 'supplierContact', e.target.value)}
                          className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">Item Display Name *</label>
                        <input 
                          type="text" 
                          required
                          value={item.itemName}
                          onChange={e => handleCreateItemChange(index, 'itemName', e.target.value)}
                          className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">Est. Quantity *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          required
                          value={item.estimatedQuantity}
                          onChange={e => handleCreateItemChange(index, 'estimatedQuantity', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                          className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-[500] text-[#667085] mb-1">Est. Unit Price *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          required
                          value={item.estimatedPrice}
                          onChange={e => handleCreateItemChange(index, 'estimatedPrice', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                          className="w-full px-3 py-2 text-[14px] border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-end">
                        <div className="w-full p-2 bg-white rounded border border-[#E4E6EA] text-right">
                          <span className="text-[12px] text-[#667085]">Est. Line Total: </span>
                          <span className="text-[14px] font-[600] text-[#383E49]">
                            Rs. {((item.estimatedQuantity || 0) * (item.estimatedPrice || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </form>
            </div>
            
            <div className="p-6 border-t border-[#E4E6EA] flex justify-between items-center bg-[#F8F9FA] rounded-b-lg">
              <div className="text-[16px] font-[600] text-[#383E49]">
                Total Estimate: Rs. {createForm.items.reduce((acc, item) => acc + ((item.estimatedQuantity || 0) * (item.estimatedPrice || 0)), 0).toFixed(2)}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E4E6EA] text-[#383E49] text-[14px] font-[500] rounded-lg hover:bg-[#F0F1F3]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="createIouForm"
                  className="px-4 py-2 bg-[#0F50AA] text-white text-[14px] font-[500] rounded-lg hover:bg-[#0D4494]"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE IOU MODAL */}
      {showSettleModal && selectedIou && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <div>
                <h2 className="text-[18px] font-[600] text-[#383E49]">Settle IOU - GRN & Invoice</h2>
                <p className="text-[14px] text-[#667085]">IOU-{selectedIou.id.toString().padStart(4, '0')} | Approved Est: Rs. {selectedIou.totalEstimatedAmount?.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowSettleModal(false)} className="p-2 hover:bg-[#F8F9FA] rounded-md transition-colors">
                <X size={20} className="text-[#64748B]" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle size={20} className="text-[#F57C00] mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-[600] text-[#383E49]">Important Note on Settlement</h4>
                  <p className="text-[13px] text-[#667085]">Submitting this settlement will automatically create Purchase Orders (PO) and Goods Received Notes (GRN) for these items based on the actual details provided. The final difference will be routed to the manager for balancing.</p>
                </div>
              </div>

              <form id="settleIouForm" onSubmit={handleSettleSubmit}>
                <div className="mb-6">
                  <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Invoice Number (Aggregated / Primary) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="INV-XXXXX"
                    value={settleForm.invoiceNumber}
                    onChange={e => setSettleForm({...settleForm, invoiceNumber: e.target.value})}
                    className="w-full md:w-1/3 px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]" 
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-[#E4E6EA] rounded-lg">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E4E6EA]">
                        <th className="py-3 px-4 text-left text-[12px] font-[500] text-[#667085]">Est. Details (Reference)</th>
                        <th className="py-3 px-4 text-left text-[12px] font-[500] text-[#667085]">Actual Item Name *</th>
                        <th className="py-3 px-4 text-left text-[12px] font-[500] text-[#667085]">Actual Supplier *</th>
                        <th className="py-3 px-4 text-left text-[12px] font-[500] text-[#667085]">Act. Qty *</th>
                        <th className="py-3 px-4 text-left text-[12px] font-[500] text-[#667085]">Act. Price *</th>
                        <th className="py-3 px-4 text-right text-[12px] font-[500] text-[#667085]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settleForm.actualItems.map((item, idx) => {
                        const original = selectedIou.items[idx];
                        const lineTotal = (item.actualQuantity || 0) * (item.actualPrice || 0);
                        return (
                          <tr key={idx} className="border-b border-[#E4E6EA]">
                            <td className="py-3 px-4 align-top w-1/4">
                              <p className="text-[13px] font-[500] text-[#383E49]">{original.itemName}</p>
                              <p className="text-[12px] text-[#667085]">{original.supplierName}</p>
                              <p className="text-[11px] text-[#A0AAB4]">Est: {formatQuantity(original.estimatedQuantity)} x {original.estimatedPrice}</p>
                            </td>
                            <td className="py-3 px-4 align-top">
                              <input 
                                type="text"
                                required
                                value={item.actualItemName}
                                onChange={(e) => handleSettleItemChange(idx, "actualItemName", e.target.value)}
                                className="w-full px-2 py-1.5 text-[13px] border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA]"
                              />
                            </td>
                            <td className="py-3 px-4 align-top">
                              <input 
                                type="text"
                                required
                                value={item.actualSupplierName}
                                onChange={(e) => handleSettleItemChange(idx, "actualSupplierName", e.target.value)}
                                className="w-full px-2 py-1.5 text-[13px] border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA]"
                              />
                            </td>
                             <td className="py-3 px-4 align-top">
                              <input 
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0"
                                value={item.actualQuantity}
                                onChange={(e) => handleSettleItemChange(idx, "actualQuantity", e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                                className="w-20 px-2 py-1.5 text-[13px] border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA]"
                              />
                            </td>
                            <td className="py-3 px-4 align-top">
                              <input 
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={item.actualPrice}
                                onChange={(e) => handleSettleItemChange(idx, "actualPrice", e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                                className="w-24 px-2 py-1.5 text-[13px] border border-[#E4E6EA] rounded focus:ring-1 focus:ring-[#0F50AA]"
                              />
                            </td>
                            <td className="py-3 px-4 align-top text-right text-[13px] font-[600] text-[#383E49]">
                              {lineTotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[#E4E6EA] flex justify-between items-center bg-[#F8F9FA] rounded-b-lg">
              <div className="flex flex-wrap gap-4">
                <div className="text-[14px]">
                  <span className="text-[#667085]">Manager Issued: </span>
                  <span className="font-[600] text-[#0F50AA]">Rs. {(selectedIou.issuedAmount || selectedIou.totalEstimatedAmount)?.toFixed(2)}</span>
                </div>
                <div className="text-[14px]">
                  <span className="text-[#667085]">Actual Total Spent: </span>
                  <span className="font-[600] text-[#383E49]">Rs. {settleForm.actualItems.reduce((acc, obj) => acc + ((obj.actualQuantity || 0) * (obj.actualPrice || 0)), 0).toFixed(2)}</span>
                </div>
                {(() => {
                  const issued = selectedIou.issuedAmount || selectedIou.totalEstimatedAmount || 0;
                  const spent = settleForm.actualItems.reduce((acc, obj) => acc + ((obj.actualQuantity || 0) * (obj.actualPrice || 0)), 0);
                  const diff = issued - spent;
                  return (
                    <div className="text-[14px] pl-4 border-l border-[#E4E6EA]">
                      <span className="text-[#667085]">Balance Status: </span>
                      {diff > 0 ? (
                        <span className="font-[600] text-[#199D26]">
                          Refund to Company: Rs. {diff.toFixed(2)}
                        </span>
                      ) : diff < 0 ? (
                        <span className="font-[600] text-[#EF4444]">
                          Reimburse Storekeeper: Rs. {Math.abs(diff).toFixed(2)}
                        </span>
                      ) : (
                        <span className="font-[600] text-[#383E49]">
                          Fully Balanced (Rs. 0.00)
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 border border-[#E4E6EA] text-[#383E49] text-[14px] font-[500] rounded-lg hover:bg-[#F0F1F3]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="settleIouForm"
                  className="px-4 py-2 bg-[#199D26] text-white text-[14px] font-[500] rounded-lg hover:bg-[#15801E]"
                >
                  Submit Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
