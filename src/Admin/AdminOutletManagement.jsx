import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { confirmDialog } from "../component/ConfirmDialog";
import axios from "axios";
import { Store, X, Check, Trash2, Edit, Search, MapPin, Building2 } from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";

export default function AdminOutletManagement() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Outlet Management');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingOutletId, setEditingOutletId] = useState(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [outlets, setOutlets] = useState([]);
    const [mpcs, setMpcs] = useState([]); // {id?, name, isActive, _new?: bool}
    const [newMpcName, setNewMpcName] = useState("");

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchOutlets = async () => {
        try {
            const headers = getAuthHeaders();
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/all`, { headers });
            const formattedData = (response.data || []).map(item => ({
                id: item.outletId ?? item.id ?? item.outlet_id,
                name: item.name || item.outletName || "",
                location: item.location || "",
                mainBranch: item.mainBranch || "",
                address: item.address || "",
                status: item.status ? "Active" : "Inactive"
            }));
            setOutlets(formattedData);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            setToastMessage("Failed to fetch outlets");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        mainBranch: '',
        address: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Outlet name is required';
        } else {
            const nameExists = outlets.some(o =>
                o.name === formData.name && o.id !== editingOutletId
            );
            if (nameExists) {
                newErrors.name = 'Outlet name already exists';
            }
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.mainBranch.trim()) {
            newErrors.mainBranch = 'Main branch name is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addMpcStaged = () => {
        const trimmed = newMpcName.trim();
        if (!trimmed) {
            setErrors(prev => ({...prev, mpcName: 'Name is required'}));
            return;
        }
        if (mpcs.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error('This production center already exists');
            setErrors(prev => ({...prev, mpcName: 'This production center already exists'}));
            return;
        }
        setMpcs(prev => [...prev, { name: trimmed, isActive: true, _new: true }]);
        setNewMpcName("");
        setErrors(prev => ({...prev, mpcName: ''}));
    };

    const addMpcEdit = async () => {
        const trimmed = newMpcName.trim();
        if (!trimmed) {
            setErrors(prev => ({...prev, mpcName: 'Name is required'}));
            return;
        }
        if (!editingOutletId) return;

        if (mpcs.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error('This production center already exists');
            setErrors(prev => ({...prev, mpcName: 'This production center already exists'}));
            return;
        }

        try {
            const headers = getAuthHeaders();
            const res = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/${editingOutletId}/production-centers`,
                { name: trimmed, isActive: true },
                { headers }
            );
            setMpcs(prev => [...prev, { id: res.data.id, name: res.data.name, isActive: res.data.isActive }]);
            setNewMpcName("");
            setErrors(prev => ({...prev, mpcName: ''}));
        } catch (e) {
            console.error("Failed to create MPC", e);
            if (e.response && e.response.data && e.response.data.message) {
                setErrors(prev => ({...prev, mpcName: e.response.data.message}));
            } else {
                setErrors(prev => ({...prev, mpcName: 'Failed to add production center'}));
            }
        }
    };

    const toggleMpcActive = async (idx) => {
        const m = mpcs[idx];
        if (m.id) {
            try {
                const headers = getAuthHeaders();
                const res = await axios.put(
                    `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet-production-center/${m.id}`,
                    { name: m.name, isActive: !m.isActive },
                    { headers }
                );
                setMpcs(prev => prev.map((x, i) => i === idx ? { ...x, isActive: res.data.isActive } : x));
            } catch (e) {
                console.error("Failed to toggle MPC", e);
            }
        } else {
            setMpcs(prev => prev.map((x, i) => i === idx ? { ...x, isActive: !x.isActive } : x));
        }
    };

    const removeMpc = async (idx) => {
        const m = mpcs[idx];
        if (m.id) {
            try {
                const headers = getAuthHeaders();
                await axios.delete(
                    `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet-production-center/${m.id}`,
                    { headers }
                );
            } catch (e) {
                console.error("Failed to remove MPC", e);
                return;
            }
        }
        setMpcs(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            const headers = getAuthHeaders();
            if (isEditMode) {
                try {
                    const payload = {
                        name: formData.name,
                        location: formData.location,
                        mainBranch: formData.mainBranch,
                        address: formData.address,
                        status: formData.status === 'Active'
                    };

                    await axios.put(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/${editingOutletId}`, payload, { headers });

                    setToastMessage('Outlet updated successfully.');
                    setShowToast(true);
                    setShowModal(false);
                    resetForm();
                    fetchOutlets();
                    setTimeout(() => setShowToast(false), 3000);
                } catch (error) {
                    console.error("Error updating outlet:", error);
                    setToastMessage('Failed to update outlet.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
                return;
            } else {
                try {
                    const payload = {
                        name: formData.name,
                        location: formData.location,
                        mainBranch: formData.mainBranch,
                        address: formData.address,
                        status: formData.status === 'Active'
                    };

                    const createRes = await axios.post(
                        `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/create`,
                        payload,
                        { headers }
                    );
                    const newOutletId = createRes.data?.outletId ?? createRes.data?.id;

                    // Create any staged MPCs
                    if (newOutletId && mpcs.length > 0) {
                        const failures = [];
                        await Promise.all(mpcs.map(async (m) => {
                            try {
                                await axios.post(
                                    `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/${newOutletId}/production-centers`,
                                    { name: m.name, isActive: m.isActive },
                                    { headers }
                                );
                            } catch (e) {
                                failures.push(m.name);
                            }
                        }));
                        if (failures.length > 0) {
                            setToastMessage(`Outlet saved. Failed to add MPCs: ${failures.join(', ')}`);
                        } else {
                            setToastMessage('Outlet created successfully.');
                        }
                    } else {
                        setToastMessage('Outlet created successfully.');
                    }

                    setShowToast(true);
                    setShowModal(false);
                    resetForm();
                    fetchOutlets();
                    setTimeout(() => setShowToast(false), 3000);
                } catch (error) {
                    console.error("Error creating outlet:", error);
                    setToastMessage('Failed to create outlet.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
                return;
            }
        }
    };

    const handleEdit = async (outlet) => {
        setIsEditMode(true);
        setEditingOutletId(outlet.id);
        setFormData({
            name: outlet.name,
            location: outlet.location,
            mainBranch: outlet.mainBranch,
            address: outlet.address,
            status: outlet.status
        });
        try {
            const headers = getAuthHeaders();
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/${outlet.id}/production-centers`,
                { headers }
            );
            setMpcs((res.data || []).map(m => ({ id: m.id, name: m.name, isActive: m.isActive })));
        } catch (e) {
            console.error("Failed to load MPCs", e);
            setMpcs([]);
        }
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingOutletId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            mainBranch: '',
            address: '',
            status: 'Active'
        });
        setErrors({});
        setMpcs([]);
        setNewMpcName("");
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingOutletId(null);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('Are you sure you want to delete this outlet?', { confirmText: "Delete", danger: true })) {
            try {
                const headers = getAuthHeaders();
                await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/${id}`, { headers });
                setToastMessage('Outlet deleted successfully.');
                setShowToast(true);
                fetchOutlets();
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error("Error deleting outlet:", error);
                setToastMessage('Failed to delete outlet.');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        }
    };

    const getFilteredOutlets = () => {
        let filtered = outlets;

        if (searchTerm) {
            filtered = filtered.filter(outlet =>
                outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                outlet.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                outlet.mainBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                outlet.address.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(outlet => outlet.status === statusFilter);
        }

        return filtered;
    };

    const filteredOutlets = getFilteredOutlets();

    return (
        <div className="flex bg-app h-screen overflow-hidden">
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                    <div className="mb-6">
                        <h1 className="text-[20px] font-[600] text-fg mb-1">
                            Outlet Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            Manage outlet locations and information
                        </p>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Outlet List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
                            >
                                <Store className="w-5 h-5" />
                                Add New Outlet
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, location, branch or address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {filteredOutlets.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-line">
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Outlet Name
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Location
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Main Branch
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Address
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Status
                                            </th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-fg">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {filteredOutlets.map((outlet) => (
                                            <tr key={outlet.id} className="hover:bg-subtle transition-colors">
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        {outlet.name}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {outlet.location}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {outlet.mainBranch}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {outlet.address}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${outlet.status === 'Active'
                                                        ? 'bg-hover text-success'
                                                        : 'bg-hover text-error'
                                                        }`}>
                                                        {outlet.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(outlet)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit Outlet"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(outlet.id)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete Outlet"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Store size={48} className="mx-auto text-fg-secondary mb-4" />
                                <p className="text-[16px] font-[500] text-fg mb-2">No outlets found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm || statusFilter !== 'All'
                                        ? "Try adjusting your search criteria"
                                        : "Click 'Add New Outlet' to create your first outlet"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    {isEditMode ? 'Edit Outlet' : 'Add New Outlet'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update outlet information'
                                        : 'Fill in the details to create a new outlet'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Outlet Name <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter outlet name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.name ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-error text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Location <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Enter location"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.location ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.location && (
                                        <p className="text-error text-[12px] mt-1">{errors.location}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Main Branch Name <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="text"
                                            name="mainBranch"
                                            value={formData.mainBranch}
                                            onChange={handleChange}
                                            placeholder="Enter main branch name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.mainBranch ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.mainBranch && (
                                        <p className="text-error text-[12px] mt-1">{errors.mainBranch}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Address <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-fg-secondary" />
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows={3}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg resize-none ${errors.address ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.address && (
                                        <p className="text-error text-[12px] mt-1">{errors.address}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-fg mb-2">
                                      Outlet Mini Production Centers
                                    </label>
                                    <div className="space-y-2">
                                        {mpcs.length === 0 && (
                                            <p className="text-sm text-fg-secondary">No outlet mini production centers yet.</p>
                                        )}
                                        {mpcs.map((m, idx) => (
                                            <div key={m.id ?? `new-${idx}`} className="flex items-center gap-2 p-2 border rounded">
                                                <span className="flex-1">{m.name}</span>
                                                <button
                                                    type="button"
                                                    className={`px-2 py-1 text-xs rounded ${m.isActive ? 'bg-success/10 text-success' : 'bg-line text-fg'}`}
                                                    onClick={() => toggleMpcActive(idx)}
                                                >
                                                    {m.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 text-xs text-error"
                                                    onClick={() => removeMpc(idx)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            value={newMpcName}
                                            onChange={(e) => {
                                                setNewMpcName(e.target.value);
                                                if (errors.mpcName) {
                                                    setErrors(prev => ({ ...prev, mpcName: '' }));
                                                }
                                            }}
                                            placeholder="e.g., Hot Kitchen"
                                            className="flex-1 px-3 py-2 border rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => isEditMode ? addMpcEdit() : addMpcStaged()}
                                            className="px-3 py-2 bg-brand text-on-brand rounded text-sm"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    {errors.mpcName && (
                                        <p className="text-error text-[12px] mt-1">{errors.mpcName}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-6 border-t border-line">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2.5 border border-line text-fg rounded-md text-[14px] font-[500] hover:bg-subtle transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover text-on-brand rounded-md text-[14px] font-[500] transition-colors"
                                >
                                    {isEditMode ? 'Update Outlet' : 'Save Outlet'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed top-4 right-4 z-[10000] animate-fade-in">
                    <div className="bg-surface border-l-4 border-success rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
                        <div className="flex-shrink-0 w-8 h-8 bg-success-solid bg-opacity-10 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-[14px] text-fg font-[500]">{toastMessage}</p>
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}