import React, { useState, useEffect } from "react";
import {
  Tag,
  Search,
  Eye,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Check
} from "lucide-react";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import managerService from "../services/managerService";

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";

export default function ManagerPromoCodes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Promo Codes");

  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  // Custom Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showNotification = (msg, type = "success") => {
      setToastMsg(msg);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const data = await managerService.getPromotions();
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

  const openView = (code) => {
    setSelected(code);
    setModal("view");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  const handleToggleActive = async (id) => {
    try {
      await managerService.togglePromotion(id);
      showNotification("Status updated successfully");
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
      <ManagerSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                Promo Codes
              </h1>
              <p className="text-[14px] text-[#667085]">
                View and toggle status of system promotions
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-2 rounded text-[12px] text-blue-700">
                Contact Admin to create or edit codes.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="FLAT">Flat</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>

              <select
                className="px-3 py-2.5 border border-[#E4E6EA] rounded-lg text-[14px] bg-white"
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
              <Loader variant="section" text="Loading promo codes..." />
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Tag size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49]">No promo codes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {["Code", "Description", "Type", "Value", "Valid Period", "Status", "Actions"].map((h) => (
                        <th key={h} className="py-3 text-[13px] font-[500] text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-[#F8F9FA]">
                        <td className="py-4 font-[600]">{code.promoCode}</td>
                        <td className="py-4 truncate max-w-[200px] text-[13px]">{code.description}</td>
                        <td className="py-4">{typeChip(code.discountType)}</td>
                        <td className="py-4 font-[600]">
                            {code.discountType === "FLAT" ? "Rs." : ""}{code.discountValue}{code.discountType === "PERCENTAGE" ? "%" : ""}
                        </td>
                        <td className="py-4 text-[12px] text-[#667085]">
                            {fmt(code.startDate)} → {fmt(code.endDate)}
                        </td>
                        <td className="py-4">
                          <button onClick={() => handleToggleActive(code.id)} className="flex items-center gap-2">
                               <div className={`relative w-9 h-5 rounded-full transition-colors ${code.isActive ? "bg-[#199D26]" : "bg-[#D1D5DB]"}`}>
                                   <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${code.isActive ? "translate-x-4" : "translate-x-0"}`} />
                               </div>
                               {statusChip(code.isActive)}
                          </button>
                        </td>
                        <td className="py-4 text-center">
                            <button onClick={() => openView(code)} className="p-2 text-[#667085] hover:text-[#0F50AA]"><Eye size={18} /></button>
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

      {modal === "view" && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-[600]">Promo Code Details</h3>
              <button onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#F0F8FF] p-4 rounded-lg text-center">
                <p className="text-[28px] font-[700] text-[#1366D9] tracking-widest">{selected.promoCode}</p>
                <p className="text-[14px] text-[#667085]">{selected.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8F9FA] p-3 rounded-lg text-center">
                    <p className="text-[11px] text-[#667085]">Discount</p>
                    <p className="font-[700] text-[18px]">
                        {selected.discountType === "FLAT" ? "Rs." : ""}{selected.discountValue}{selected.discountType === "PERCENTAGE" ? "%" : ""}
                    </p>
                </div>
                <div className="bg-[#F8F9FA] p-3 rounded-lg text-center">
                    <p className="text-[11px] text-[#667085]">Max Capped</p>
                    <p className="font-[700] text-[18px]">
                         {selected.maximumDiscountValue ? `Rs.${selected.maximumDiscountValue}` : "None"}
                    </p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end">
                <button onClick={closeModal} className="px-6 py-2 bg-[#0F50AA] text-white rounded-lg text-[13px]">Close</button>
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