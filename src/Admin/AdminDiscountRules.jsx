import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { confirmDialog } from "../component/ConfirmDialog";
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
    Clock,
    Percent,
    Check
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import adminService from "../services/adminService";

export default function AdminDiscountRules() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Discount Management');
    const [rules, setRules] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [modal, setModal] = useState(null); // 'create', 'edit', 'view'
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

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maximumDiscountValue: "",
        ruleType: "PRODUCT_BASED",
        appliedToAllProducts: false,
        applicableProductIds: [],
        startTime: "00:00",
        endTime: "23:59",
        daysOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rulesData, productsData] = await Promise.all([
                adminService.getDiscounts(),
                adminService.getProducts()
            ]);
            setRules(rulesData);
            setProducts(productsData);
        } catch (err) {
            showNotification("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            name: "",
            description: "",
            discountType: "PERCENTAGE",
            discountValue: "",
            maximumDiscountValue: "",
            ruleType: "PRODUCT_BASED",
            appliedToAllProducts: false,
            applicableProductIds: [],
            startTime: "00:00",
            endTime: "23:59",
            daysOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            isActive: true
        });
        setModal("create");
    };

    const handleEdit = (rule) => {
        setFormData({
            ...rule,
            discountValue: rule.discountValue.toString(),
            maximumDiscountValue: rule.maximumDiscountValue?.toString() || "",
            applicableProductIds: rule.applicableProducts?.map(p => p.id) || [],
            daysOfWeek: rule.daysOfWeek || []
        });
        setSelected(rule);
        setModal("edit");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const trimmedName = formData.name ? formData.name.trim() : "";
        if (!trimmedName) {
            toast.error("Discount rule name is required");
            return;
        }

        const nameExists = rules.some(r => 
            r.name && r.name.trim().toLowerCase() === trimmedName.toLowerCase() && 
            r.discountId !== selected?.discountId
        );

        if (nameExists) {
            toast.error("A discount rule with this name already exists");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: formData.name,
                description: formData.description,
                ruleType: formData.ruleType,
                discountType: formData.discountType,
                discountValue: parseFloat(formData.discountValue),
                maximumDiscountValue: formData.maximumDiscountValue ? parseFloat(formData.maximumDiscountValue) : null,
                appliedToAllProducts: formData.appliedToAllProducts,
                productIds: formData.applicableProductIds,
                startTime: formData.startTime ? (formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime) : "00:00:00",
                endTime: formData.endTime ? (formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime) : "23:59:59",
                daysOfWeek: Array.isArray(formData.daysOfWeek) ? formData.daysOfWeek : []
            };

            if (modal === "create") {
                await adminService.createDiscount(payload);
                showNotification("Rule created successfully");
            } else {
                await adminService.updateDiscount(selected.discountId, payload);
                showNotification("Rule updated successfully");
            }
            setModal(null);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.message || "Operation failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!await confirmDialog("Are you sure?")) return;
        try {
            await adminService.deleteDiscount(id);
            showNotification("Rule deleted");
            fetchData();
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const handleToggleActive = async (id) => {
        try {
            await adminService.toggleDiscount(id);
            showNotification("Status updated");
            fetchData();
        } catch (err) {
            showNotification("Failed to update status", "error");
        }
    };

    const toggleProduct = (pid) => {
        setFormData(prev => {
            const exists = prev.applicableProductIds.includes(pid);
            return {
                ...prev,
                applicableProductIds: exists 
                    ? prev.applicableProductIds.filter(id => id !== pid)
                    : [...prev.applicableProductIds, pid]
            };
        });
    };

    const filtered = rules.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex bg-app h-screen overflow-hidden relative">
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-[20px] font-[600] text-fg">Discount Rules</h1>
                            <p className="text-[14px] text-fg-secondary">Manage product discounts and Happy Hour schedules</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="bg-brand text-on-brand px-4 py-2 rounded-lg flex items-center gap-2 text-[14px] font-[500]"
                        >
                            <Plus size={18} /> New Rule
                        </button>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={18} />
                            <input
                                type="text"
                                placeholder="Search rules..."
                                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-[14px] outline-none focus:ring-2 focus:ring-brand-fg/20"
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
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Rule Name</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Type</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Discount</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Status</th>
                                            <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {filtered.map(rule => (
                                            <tr key={rule.discountId} className="hover:bg-subtle group">
                                                <td className="px-6 py-4 text-[14px] font-[600] text-fg">{rule.name}</td>
                                                <td className="px-6 py-4">
                                                     <div className="flex items-center gap-1">
                                                        {rule.ruleType === 'TIME_BASED' ? <Clock size={14} className="text-brand-fg" /> : <Tag size={14} className="text-plum" />}
                                                        <span className="text-[12px]">{rule.ruleType === 'TIME_BASED' ? 'Happy Hour' : 'Product'}</span>
                                                     </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                     <span className="font-[600]">{rule.discountType === 'PERCENTAGE' ? `${rule.discountValue}%` : `Rs.${rule.discountValue}`}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleToggleActive(rule.discountId)} className="flex items-center gap-2">
                                                        <div className={`relative w-9 h-5 rounded-full transition-colors ${rule.isActive ? "bg-success-solid" : "bg-line-strong"}`}>
                                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface rounded-full transition-transform ${rule.isActive ? "translate-x-4" : "translate-x-0"}`} />
                                                        </div>
                                                        <span className={`text-[12px] ${rule.isActive ? 'text-success' : 'text-fg-muted'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => { setSelected(rule); setModal('view'); }} className="p-2 text-fg-muted hover:text-brand-fg"><Eye size={18} /></button>
                                                        <button onClick={() => handleEdit(rule)} className="p-2 text-fg-muted hover:text-success"><Edit size={18} /></button>
                                                        <button onClick={() => handleDelete(rule.discountId)} className="p-2 text-fg-muted hover:text-error"><Trash2 size={18} /></button>
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

            {(modal === 'create' || modal === 'edit') && (
                <div className="fixed inset-0 bg-backdrop z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b bg-subtle flex justify-between items-center">
                            <h3 className="font-[600]">{modal === 'create' ? 'Create New Discount' : 'Edit Discount Rule'}</h3>
                            <button onClick={() => setModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[13px] font-[600] text-fg mb-1">Rule Name *</label>
                                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-[14px] outline-none" placeholder="e.g. Happy Hour Special" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-[600] text-fg mb-1">Rule Type</label>
                                        <select value={formData.ruleType} onChange={e => setFormData({...formData, ruleType: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-[14px]">
                                            <option value="PRODUCT_BASED">Product Based</option>
                                            <option value="TIME_BASED">Time Based (Happy Hour)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-[600] text-fg mb-1">Discount Type</label>
                                        <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-[14px]">
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat (Rs.)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-[600] text-fg mb-1">Discount Value *</label>
                                        <input required type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-[14px]" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-[600] text-fg mb-1">Max Discount Cap (Rs.)</label>
                                        <input type="number" step="0.01" value={formData.maximumDiscountValue} onChange={e => setFormData({...formData, maximumDiscountValue: e.target.value})} className="w-full px-4 py-2 border rounded-lg text-[14px]" placeholder="No cap" />
                                    </div>
                                </div>

                                {formData.ruleType === 'TIME_BASED' && (
                                    <div className="bg-brand/10 p-4 rounded-xl space-y-3">
                                        <p className="text-[12px] font-[600] text-brand-fg uppercase flex items-center gap-1"><Clock size={14}/> Schedule Setting</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] text-brand-fg mb-1">Start Time</label>
                                                <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-1.5 border border-brand/20 rounded" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-brand-fg mb-1">End Time</label>
                                                <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-1.5 border border-brand/20 rounded" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-brand-fg mb-1">Active Days</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
                                                    const isSelected = Array.isArray(formData.daysOfWeek) && formData.daysOfWeek.includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => {
                                                                    const currentDays = Array.isArray(prev.daysOfWeek) ? prev.daysOfWeek : [];
                                                                    return {
                                                                        ...prev,
                                                                        daysOfWeek: currentDays.includes(day)
                                                                            ? currentDays.filter(d => d !== day)
                                                                            : [...currentDays, day]
                                                                    };
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 rounded text-[11px] font-[600] transition-colors border ${
                                                                isSelected
                                                                    ? 'bg-brand text-on-brand border-brand-fg'
                                                                    : 'bg-surface text-brand-fg border-brand/20 hover:bg-brand/10'
                                                            }`}
                                                        >
                                                            {day.charAt(0) + day.slice(1).toLowerCase()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[13px] font-[600] text-fg">Target Products</label>
                                        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                                            <input type="checkbox" checked={formData.appliedToAllProducts} onChange={e => setFormData({...formData, appliedToAllProducts: e.target.checked})} /> Apply to ALL products
                                        </label>
                                    </div>
                                    {!formData.appliedToAllProducts && (
                                        <div className="border rounded-lg p-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                                            {products.map(p => (
                                                <div key={p.id} onClick={() => toggleProduct(p.id)} className={`p-2 rounded border cursor-pointer text-[12px] transition-all ${formData.applicableProductIds.includes(p.id) ? 'bg-brand/10 border-brand-fg text-brand-fg' : 'hover:bg-subtle'}`}>
                                                    {p.productName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-lg font-[600] flex items-center justify-center gap-2">
                                    {submitting ? <Loader variant="inline" /> : (modal === 'create' ? 'Create Rule' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    <p className="text-[11px] text-brand-fg font-[500]">{Array.isArray(selected.daysOfWeek) ? selected.daysOfWeek.join(', ') : selected.daysOfWeek}</p>
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
