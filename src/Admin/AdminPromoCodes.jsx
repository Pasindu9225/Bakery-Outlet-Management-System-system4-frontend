import React, { useState, useEffect } from "react";
import {
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  Clock,
  Check
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import adminService from "../services/adminService";

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

export default function AdminPromoCodes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Promo Codes");

  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showNotification = (msg, type = "success") => {
      setToastMsg(msg);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const [formData, setFormData] = useState({
    promoCode: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maximumDiscountValue: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPromotions();
      setCodes(data);
    } catch (err) {
      showNotification("Failed to fetch promo codes", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = codes.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      c.promoCode.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q));
    const matchType =
      filterType === "ALL" || c.discountType === filterType;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && c.isActive) ||
      (filterStatus === "INACTIVE" && !c.isActive);
    return matchSearch && matchType && matchStatus;
  });

  const handleCreate = () => {
    setFormData({
      promoCode: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      maximumDiscountValue: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setModal("create");
  };

  const handleEdit = (code) => {
    setFormData({
      ...code,
      discountValue: code.discountValue.toString(),
      maximumDiscountValue: code.maximumDiscountValue?.toString() || "",
      startDate: code.startDate ? code.startDate.split("T")[0] : "",
      endDate: code.endDate ? code.endDate.split("T")[0] : "",
    });
    setSelected(code);
    setModal("edit");
  };

  const openView = (code) => {
    setSelected(code);
    setModal("view");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        promoCode: formData.promoCode,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maximumDiscountValue: formData.maximumDiscountValue ? parseFloat(formData.maximumDiscountValue) : null,
        startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null,
        endDate: formData.endDate ? `${formData.endDate}T23:59:59` : null,
      };

      if (modal === "create") {
        await adminService.createPromotion(payload);
        showNotification("Promo code created");
      } else {
        await adminService.updatePromotion(selected.id, payload);
        showNotification("Promo code updated");
      }
      closeModal();
      fetchCodes();
    } catch (err) {
      showNotification(err.response?.data?.message || "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      await adminService.deletePromotion(id);
      showNotification("Promo code deleted");
      fetchCodes();
    } catch (err) {
      showNotification("Failed to delete", "error");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminService.togglePromotion(id);
      showNotification("Status updated");
      fetchCodes();
    } catch (err) {
      showNotification("Failed to update status", "error");
    }
  };

  const typeChip = (type) =>
    type === "FLAT" ? (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full font-[500] text-[#1366D9] bg-[#F0F8FF]">
        FLAT
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full font-[500] text-[#7C3AED] bg-[#F5F0FF]">
        PERCENTAGE
      </span>
    );

  const statusChip = (active) =>
    active ? (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full font-[500] text-[#199D26] bg-[#F0FDF4]">
        <CheckCircle size={11} />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-full font-[500] text-[#EF4444] bg-[#FEF2F2]">
        <XCircle size={11} />
        Inactive
      </span>
    );

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden relative">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                Promo Code Management
              </h1>
              <p className="text-[14px] text-[#667085]">
                Manage system-wide promotional codes and discounts
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#0F50AA] text-white px-4 py-2.5 rounded-lg text-[14px] font-[500] hover:bg-[#1366D9] transition-all"
            >
              <Plus size={18} /> Add New Code
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] bg-white outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="FLAT">Flat</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>

              <select
                className="px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] bg-white outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <button
                onClick={() => { setSearchTerm(""); setFilterType("ALL"); setFilterStatus("ALL"); }}
                className="px-4 py-2.5 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] flex items-center gap-2 text-[14px]"
              >
                <RefreshCw size={15} /> Clear
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            {loading ? (
              <Loader variant="section" text="Loading promotions..." />
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Tag size={48} className="mx-auto text-[#D1D5DB] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49]">No promo codes found</p>
                <p className="text-[14px] text-[#667085]">Try adjusting your filters or create a new code.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      {["Code", "Description", "Type", "Value", "Valid Period", "Status", "Actions"].map((h) => (
                        <th key={h} className="py-3 text-[13px] font-[500] text-[#667085] text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((code) => (
                      <tr key={code.id} className="border-b border-[#F0F1F3] hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-4">
                          <span className="font-[600] text-[#383E49] bg-gray-50 px-2 py-1 rounded border uppercase">{code.promoCode}</span>
                        </td>
                        <td className="py-4 text-[13px] text-[#48505E] truncate max-w-[200px]">{code.description}</td>
                        <td className="py-4">{typeChip(code.discountType)}</td>
                        <td className="py-4">
                          <span className="font-[600] text-[#383E49]">
                            {code.discountType === "FLAT" ? "Rs." : ""}{code.discountValue}{code.discountType === "PERCENTAGE" ? "%" : ""}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col text-[12px] text-[#667085]">
                            <span>From: {fmt(code.startDate)}</span>
                            <span>To: {fmt(code.endDate)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleToggleActive(code.id)}
                            className="flex items-center gap-2 group"
                            title="Toggle Status"
                          >
                               <div className={`relative w-9 h-5 rounded-full transition-colors ${code.isActive ? "bg-[#199D26]" : "bg-[#D1D5DB]"}`}>
                                   <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${code.isActive ? "translate-x-4" : "translate-x-0"}`} />
                               </div>
                               {statusChip(code.isActive)}
                          </button>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => openView(code)} className="p-2 text-[#667085] hover:bg-blue-50 hover:text-[#0F50AA] rounded-lg transition-all" title="View Details"><Eye size={18} /></button>
                            <button onClick={() => handleEdit(code)} className="p-2 text-[#667085] hover:bg-green-50 hover:text-[#199D26] rounded-lg transition-all" title="Edit"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(code.id)} className="p-2 text-[#667085] hover:bg-red-50 hover:text-[#EF4444] rounded-lg transition-all" title="Delete"><Trash2 size={18} /></button>
                          </div>
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

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-[#F8F9FA]">
              <h3 className="font-[600] text-[18px] text-[#383E49]">{modal === "create" ? "Create Promo Code" : "Edit Promo Code"}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Promo Code *</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA] uppercase"
                      value={formData.promoCode}
                      onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Description</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Discount Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-[13px] rounded-lg border transition-all ${formData.discountType === "PERCENTAGE" ? "bg-purple-50 border-purple-200 text-purple-700 font-[600]" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        onClick={() => setFormData({ ...formData, discountType: "PERCENTAGE" })}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-[13px] rounded-lg border transition-all ${formData.discountType === "FLAT" ? "bg-blue-50 border-blue-200 text-blue-700 font-[600]" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                        onClick={() => setFormData({ ...formData, discountType: "FLAT" })}
                      >
                        Flat (Rs.)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Value *</label>
                    <div className="relative">
                       <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-[600]">{formData.discountType === "PERCENTAGE" ? "%" : "Rs"}</span>
                    </div>
                  </div>

                  <div>
                     <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Max Discount Cap (Rs.)</label>
                     <input
                      type="number"
                      step="0.01"
                      placeholder="No limit"
                      className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                      value={formData.maximumDiscountValue}
                      onChange={(e) => setFormData({ ...formData, maximumDiscountValue: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Limits the maximum Rs. amount discounted</p>
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <label className="block text-[13px] font-[600] text-[#48505E] mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-[600] text-[#48505E] mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t bg-[#F8F9FA] flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-[#E4E6EA] text-[#48505E] rounded-lg text-[14px] font-[500] hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-2 px-8 py-2.5 bg-[#0F50AA] text-white rounded-lg text-[14px] font-[500] hover:bg-[#1366D9] transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader variant="inline" /> : (modal === "create" ? "Register Promo" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "view" && selected && (
        <div className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border shadow-xl w-full max-w-lg overflow-hidden">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-[600]">Promo Code Details</h3>
               <button onClick={closeModal}><X size={18} /></button>
             </div>
             <div className="p-6 space-y-6">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[12px] text-blue-600 font-[700] uppercase tracking-widest mb-1">Coupon Code</p>
                    <p className="text-[32px] font-[800] text-[#0F50AA] tracking-widest">{selected.promoCode}</p>
                    <p className="text-[14px] text-gray-500 mt-2 italic">“{selected.description}”</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-[11px] text-gray-400 font-[600] uppercase">Discount Value</p>
                        <p className="text-[18px] font-[700] text-gray-700">
                             {selected.discountType === "FLAT" ? "Rs." : ""}{selected.discountValue}{selected.discountType === "PERCENTAGE" ? "%" : ""}
                        </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-[11px] text-gray-400 font-[600] uppercase">Maximum Cap</p>
                        <p className="text-[18px] font-[700] text-gray-700">
                             {selected.maximumDiscountValue ? `Rs.${selected.maximumDiscountValue}` : "Infinity"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 py-4 border-y border-dashed">
                    <div className="flex-1">
                        <p className="text-[11px] text-gray-400 font-[600] uppercase mb-1">Starts From</p>
                        <p className="text-[14px] flex items-center gap-2"><Calendar size={14}/> {fmt(selected.startDate)}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1">
                        <p className="text-[11px] text-gray-400 font-[600] uppercase mb-1">Expires On</p>
                        <p className="text-[14px] flex items-center gap-2"><Calendar size={14}/> {fmt(selected.endDate)}</p>
                    </div>
                </div>
             </div>
             <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button onClick={closeModal} className="px-6 py-2 bg-[#0F50AA] text-white rounded-lg">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* Custom Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000000] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`bg-white border-l-4 ${toastType === 'success' ? 'border-[#199D26]' : 'border-[#EF4444]'} rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]`}>
                <div className={`flex-shrink-0 w-8 h-8 ${toastType === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                    {toastType === 'success' ? <Check className="w-5 h-5 text-[#199D26]" /> : <X className="w-5 h-5 text-[#EF4444]" />}
                </div>
                <p className="text-[14px] text-[#383E49] font-[500]">{toastMsg}</p>
            </div>
        </div>
      )}
    </div>
  );
}
