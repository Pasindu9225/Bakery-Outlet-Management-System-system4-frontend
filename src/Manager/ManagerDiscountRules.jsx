import React, { useState, useEffect } from "react";
import {
    Tag,
    Search,
    Eye,
    X,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Check
} from "lucide-react";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import managerService from "../services/managerService";

export default function ManagerDiscountRules() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Discount Management');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);

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

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const data = await managerService.getDiscounts();
            setRules(data);
        } catch (err) {
            showNotification("Failed to fetch rules", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await managerService.toggleDiscount(id);
            showNotification("Status updated successfully");
            fetchRules();
        } catch (err) {
            showNotification("Failed to update status", "error");
        }
    };

    const filtered = rules.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openView = (rule) => {
        setSelected(rule);
        setModal("view");
    };

    return (
        <div className="flex bg-app h-screen overflow-hidden relative">
            <ManagerSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <ManagerNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-[20px] font-[600] text-fg">Discount Rules</h1>
                            <p className="text-[14px] text-fg-secondary">View system discount rules and Happy Hour settings</p>
                        </div>
                        <div className="bg-brand/10 border border-brand/20 p-2 rounded text-[12px] text-brand-fg">
                           Read-only access. Contact Admin for changes
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={18} />
                            <input
                                type="text"
                                placeholder="Search rules..."
                                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-[14px] outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm border border-line">
                        {loading ? (
                             <Loader variant="section" text="Loading discount rules..." />
                        ) : filtered.length === 0 ? (
                            <div className="p-12 text-center text-fg-secondary">No rules found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-subtle border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Rule</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Type</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Value</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Status</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {filtered.map(rule => (
                                            <tr key={rule.discountId} className="hover:bg-subtle">
                                                <td className="px-6 py-4 text-[14px] font-[600]">{rule.name}</td>
                                                <td className="px-6 py-4">
                                                     <div className="flex items-center gap-1">
                                                        {rule.ruleType === 'TIME_BASED' ? <Clock size={14} className="text-brand-fg" /> : <Tag size={14} className="text-plum" />}
                                                        <span className="text-[12px]">{rule.ruleType === 'TIME_BASED' ? 'Happy Hour' : 'Product'}</span>
                                                     </div>
                                                </td>
                                                <td className="px-6 py-4 font-[600]">
                                                     {rule.discountType === 'PERCENTAGE' ? `${rule.discountValue}%` : `Rs.${rule.discountValue}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleToggleActive(rule.discountId)} className="flex items-center gap-2">
                                                        <div className={`relative w-9 h-5 rounded-full transition-colors ${rule.isActive ? "bg-success-solid" : "bg-line-strong"}`}>
                                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface rounded-full transition-transform ${rule.isActive ? "translate-x-4" : "translate-x-0"}`} />
                                                        </div>
                                                        <span className={`text-[12px] ${rule.isActive ? 'text-success' : 'text-fg-muted'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => openView(rule)} className="p-2 text-fg-secondary hover:text-brand-fg"><Eye size={18} /></button>
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

            {modal === 'view' && selected && (
                <div className="fixed inset-0 bg-backdrop z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="p-4 border-b bg-subtle flex justify-between items-center">
                            <h3 className="font-[600]">Discount Details</h3>
                            <button onClick={() => setModal(null)}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <h4 className="text-[18px] font-[700] text-brand-fg">{selected.name}</h4>
                                <p className="text-[13px] text-fg-secondary">{selected.description}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4 border-y py-4">
                                <div>
                                    <p className="text-[11px] text-fg-muted uppercase">Discount Value</p>
                                    <p className="font-[600]">{selected.discountType === 'PERCENTAGE' ? `${selected.discountValue}%` : `Rs.${selected.discountValue}`}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-fg-muted uppercase">Max Capped</p>
                                    <p className="font-[600]">{selected.maximumDiscountValue ? `Rs.${selected.maximumDiscountValue}` : 'None'}</p>
                                </div>
                             </div>
                             {selected.ruleType === 'TIME_BASED' && (
                                <div className="bg-brand/10 p-3 rounded-lg">
                                    <p className="text-[12px] font-[600] text-brand-fg flex items-center gap-1 mb-1"><Clock size={14} /> Schedule Details</p>
                                    <p className="text-[13px]">{selected.startTime} - {selected.endTime}</p>
                                    <p className="text-[11px] text-brand-fg font-[500]">{selected.daysOfWeek}</p>
                                </div>
                             )}
                             <div>
                                <p className="text-[12px] font-[600] mb-2">Applicable Products</p>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 text-[12px]">
                                    {selected.appliedToAllProducts ? (
                                        <p className="p-2 text-brand-fg bg-brand/10 rounded">All Products in Inventory</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {selected.applicableProducts?.map(p => (
                                                <span key={p.id} className="bg-hover px-2 py-1 rounded text-[11px]">{p.productName}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                        <div className="p-4 bg-subtle border-t text-right">
                             <button onClick={() => setModal(null)} className="px-6 py-2 bg-brand text-on-brand rounded-lg text-[13px]">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 z-[10000000] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`bg-elevated border-l-4 ${toastType === 'success' ? 'border-success' : 'border-error'} rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]`}>
                        <div className={`flex-shrink-0 w-8 h-8 ${toastType === 'success' ? 'bg-success/10' : 'bg-error/10'} rounded-full flex items-center justify-center`}>
                            {toastType === 'success' ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-error" />}
                        </div>
                        <p className="text-[14px] text-fg font-[500]">{toastMsg}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
