import React, { useState, useEffect } from "react";
import { confirmDialog } from "../component/ConfirmDialog";
import axios from "axios";
import { Factory, X, Check, Trash2, Edit, Search, Calendar, MapPin, ClipboardList } from "lucide-react";
import MpcMenuModal from "./MpcMenuModal.jsx";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function AdminProductionCenter() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Production Centers');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCenterId, setEditingCenterId] = useState(null);
    const [menuMpc, setMenuMpc] = useState(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [centers, setCenters] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchCenters = async () => {
        setIsLoading(true);
        try {
            const BASE_URL = process.env.REACT_APP_BASE_URL;
            const headers = getAuthHeaders();
            const response = await axios.get(`${BASE_URL}/api/v1/admin/production-center/all`, { headers });
            const formattedData = (response.data || []).map(item => ({
                id: item.id,
                name: item.centerName,
                location: item.location || "",
                type: item.type || 'BAKERY',
                outletId: item.outletId || null,
                establishedDate: item.createdAt,
                status: item.isActive ? "Active" : "Inactive"
            }));

            try {
                const outletsRes = await axios.get(`${BASE_URL}/api/v1/admin/outlet/all`, { headers });
                const rawOutlets = outletsRes.data || [];
                const formattedOutlets = rawOutlets.map(o => ({
                    id: o.outletId ?? o.id ?? o.outlet_id,
                    name: o.name || o.outletName || o.location || `Outlet #${o.outletId ?? o.id}`
                })).filter(o => o.id !== undefined && o.id !== null);
                setOutlets(formattedOutlets);

                const mpcPromises = formattedOutlets.map(o => {
                    return axios.get(`${BASE_URL}/api/v1/admin/outlet/${o.id}/production-centers`, { headers })
                        .then(res => (res.data || []).map(mpc => ({
                            id: mpc.id,
                            name: mpc.name,
                            location: o.name,
                            type: 'MPC',
                            isMpc: true,
                            outletId: o.id,
                            establishedDate: mpc.createdAt || new Date().toISOString(),
                            status: mpc.isActive !== false ? "Active" : "Inactive"
                        })))
                        .catch(() => []);
                });
                const mpcResults = await Promise.all(mpcPromises);
                const allMpcs = mpcResults.flat();
                setCenters([...formattedData, ...allMpcs]);
            } catch (e) {
                console.error("Error fetching outlets or MPCs:", e);
                setCenters(formattedData);
            }
        } catch (error) {
            console.error("Error fetching production centers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: 'BAKERY',
        outletId: '',
        establishedDate: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const triggerToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

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
            newErrors.name = 'Production Center name is required';
        } else {
            const nameExists = centers.some(c =>
                c.name.toLowerCase() === formData.name.trim().toLowerCase() && c.id !== editingCenterId
            );
            if (nameExists) {
                newErrors.name = 'Production Center name already exists';
            }
        }

        if (formData.type !== 'MPC' && !formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (formData.type === 'MPC') {
            if (!formData.outletId || isNaN(Number(formData.outletId))) {
                newErrors.outletId = 'Assign to Outlet is required for MPC';
            }
        }

        if (!formData.establishedDate) {
            newErrors.establishedDate = 'Established date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const BASE_URL = process.env.REACT_APP_BASE_URL;
        const headers = getAuthHeaders();

        if (formData.type === 'MPC') {
            const numericOutletId = Number(formData.outletId);
            if (isEditMode) {
                try {
                    await axios.put(`${BASE_URL}/api/v1/admin/outlet-production-center/${editingCenterId}`, {
                        name: formData.name
                    }, { headers });
                    triggerToast('Mini Production Center updated successfully.', 'success');
                    setShowModal(false);
                    resetForm();
                    fetchCenters();
                } catch (error) {
                    console.error("Error updating MPC:", error);
                    const msg = error.response?.data?.message || 'Failed to update Mini Production Center.';
                    triggerToast(msg, 'error');
                }
            } else {
                try {
                    await axios.post(`${BASE_URL}/api/v1/admin/outlet/${numericOutletId}/production-centers`, {
                        name: formData.name
                    }, { headers });
                    triggerToast('Mini Production Center created successfully.', 'success');
                    setShowModal(false);
                    resetForm();
                    fetchCenters();
                } catch (error) {
                    console.error("Error creating MPC:", error);
                    const msg = error.response?.data?.message || 'Failed to create Mini Production Center.';
                    triggerToast(msg, 'error');
                }
            }
            return;
        }

        const payload = {
            productionCenterName: formData.name,
            location: formData.location,
            type: formData.type,
            outletId: formData.outletId ? Number(formData.outletId) : null,
            establishedDate: formData.establishedDate,
            isActive: formData.status === 'Active'
        };

        if (isEditMode) {
            try {
                await axios.put(`${BASE_URL}/api/v1/admin/production-center/${editingCenterId}`, payload, { headers });
                triggerToast('Production Center updated successfully.', 'success');
                setShowModal(false);
                resetForm();
                fetchCenters();
            } catch (error) {
                console.error("Error updating production center:", error);
                const msg = error.response?.data?.message || 'Failed to update production center.';
                triggerToast(msg, 'error');
            }
        } else {
            try {
                await axios.post(`${BASE_URL}/api/v1/admin/production-center/create`, payload, { headers });
                triggerToast('Production Center created successfully.', 'success');
                setShowModal(false);
                resetForm();
                fetchCenters();
            } catch (error) {
                console.error("Error creating production center:", error);
                const msg = error.response?.data?.message || 'Failed to create production center.';
                triggerToast(msg, 'error');
            }
        }
    };

    const handleEdit = (center) => {
        setIsEditMode(true);
        setEditingCenterId(center.id);
        setFormData({
            name: center.name,
            location: center.location,
            type: center.type || 'BAKERY',
            outletId: center.outletId || '',
            establishedDate: center.establishedDate ? center.establishedDate.split('T')[0] : '',
            status: center.status
        });
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingCenterId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            type: 'BAKERY',
            outletId: '',
            establishedDate: '',
            status: 'Active'
        });
        setErrors({});
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingCenterId(null);
        resetForm();
    };

    const handleDelete = async (center) => {
        const centerId = typeof center === 'object' ? center.id : center;
        const isMpc = typeof center === 'object' ? (center.type === 'MPC' || center.isMpc) : false;

        if (await confirmDialog('Are you sure you want to delete this Production Center?', { confirmText: "Delete", danger: true })) {
            const BASE_URL = process.env.REACT_APP_BASE_URL;
            const headers = getAuthHeaders();
            try {
                if (isMpc) {
                    await axios.delete(`${BASE_URL}/api/v1/admin/outlet-production-center/${centerId}`, { headers });
                } else {
                    await axios.delete(`${BASE_URL}/api/v1/admin/production-center/${centerId}`, { headers });
                }
                triggerToast('Production Center deleted successfully.', 'success');
                fetchCenters();
            } catch (error) {
                console.error("Error deleting production center:", error);
                const msg = error.response?.data?.message || 'Failed to delete production center.';
                triggerToast(msg, 'error');
            }
        }
    };

    const getFilteredCenters = () => {
        let filtered = centers;

        if (searchTerm) {
            filtered = filtered.filter(center =>
                center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                center.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(center => center.status === statusFilter);
        }

        return filtered;
    };

    const filteredCenters = getFilteredCenters();

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
                            Production Center Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            Manage production centers
                        </p>
                    </div>

                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Production Center List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
                            >
                                <Factory className="w-5 h-5" />
                                Add Production Center
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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

                        {isLoading ? (
                            <Loader variant="section" text="Loading production centers..." />
                        ) : filteredCenters.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-line">
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Production Center
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Location
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Type
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Established Date
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
                                        {filteredCenters.map((center) => (
                                            <tr key={center.id} className="hover:bg-subtle transition-colors">
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        {center.name}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {center.location}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={center.type === 'KITCHEN'
                                                        ? 'inline-block px-2 py-1 text-xs rounded bg-warning/10 text-warning font-medium'
                                                        : center.type === 'MPC'
                                                        ? 'inline-block px-2 py-1 text-xs rounded bg-brand/10 text-brand-fg font-medium'
                                                        : 'inline-block px-2 py-1 text-xs rounded bg-warning/10 text-warning font-medium'}>
                                                        {center.type === 'MPC' ? 'Mini Production Center (MPC)' : center.type}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {new Date(center.establishedDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${center.status === 'Active'
                                                        ? 'bg-hover text-success'
                                                        : 'bg-hover text-error'
                                                        }`}>
                                                        {center.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {center.type === 'MPC' && (
                                                            <button
                                                                onClick={() => setMenuMpc(center)}
                                                                className="p-2 text-success hover:bg-hover rounded-lg transition-colors"
                                                                title="MPC Menu"
                                                            >
                                                                <ClipboardList size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(center)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit Production Center"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(center)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete Production Center"
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
                                <Factory size={48} className="mx-auto text-fg-secondary mb-4" />
                                <p className="text-[16px] font-[500] text-fg mb-2">No production centers found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm || statusFilter !== 'All'
                                        ? "Try adjusting your search criteria"
                                        : "Click 'Add Production Center' to create your first center"
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
                                    {isEditMode ? 'Edit Production Center' : 'Add Production Center'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update production center information'
                                        : 'Fill in the details to create a new production center'
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
                                        Production Center Name <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <Factory className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter production center name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.name ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-error text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {formData.type !== 'MPC' && (
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
                                )}

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Type <span className="text-error">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        required
                                    >
                                        <option value="BAKERY">Bakery</option>
                                        <option value="KITCHEN">Kitchen</option>
                                        <option value="MPC">Mini Production Center (MPC)</option>
                                    </select>
                                </div>

                                {formData.type === 'MPC' && (
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Assign to Outlet <span className="text-error">*</span>
                                        </label>
                                        <select
                                            name="outletId"
                                            value={formData.outletId}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.outletId ? 'border-error' : 'border-line'}`}
                                            required
                                        >
                                            <option value="">— Select Outlet —</option>
                                            {outlets.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.outletId && (
                                            <p className="text-error text-[12px] mt-1">{errors.outletId}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Established Date <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="date"
                                            name="establishedDate"
                                            value={formData.establishedDate}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.establishedDate ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.establishedDate && (
                                        <p className="text-error text-[12px] mt-1">{errors.establishedDate}</p>
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
                                    {isEditMode ? 'Update Center' : 'Save Center'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {menuMpc && <MpcMenuModal mpc={menuMpc} onClose={() => setMenuMpc(null)} />}

            {showToast && (
                <div className="fixed top-4 right-4 z-[10000] animate-fade-in">
                    <div className={`bg-surface border-l-4 ${toastType === 'error' ? 'border-error' : 'border-success'} rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]`}>
                        <div className={`flex-shrink-0 w-8 h-8 ${toastType === 'error' ? 'bg-hover' : 'bg-success-solid bg-opacity-10'} rounded-full flex items-center justify-center`}>
                            {toastType === 'error' ? (
                                <X className="w-5 h-5 text-error" />
                            ) : (
                                <Check className="w-5 h-5 text-success" />
                            )}
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
