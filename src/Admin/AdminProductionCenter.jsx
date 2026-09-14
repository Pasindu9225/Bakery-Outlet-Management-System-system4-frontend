import React, { useState, useEffect } from "react";
import axios from "axios";
import { Factory, X, Check, Trash2, Edit, Search, Calendar, MapPin } from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function AdminProductionCenter() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Production Centers');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCenterId, setEditingCenterId] = useState(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [centers, setCenters] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCenters = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/production-center/all`);
            const formattedData = response.data.map(item => ({
                id: item.id,
                name: item.centerName,
                location: item.location || "",
                type: item.type || 'BAKERY',
                outletId: item.outletId || null,
                establishedDate: item.createdAt,
                status: item.isActive ? "Active" : "Inactive"
            }));
            setCenters(formattedData);
        } catch (error) {
            console.error("Error fetching production centers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
        (async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/all`);
                setOutlets(res.data || []);
            } catch (e) {
                console.error("Failed to fetch outlets:", e);
            }
        })();
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
                c.name === formData.name && c.id !== editingCenterId
            );
            if (nameExists) {
                newErrors.name = 'Production Center name already exists';
            }
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.establishedDate) {
            newErrors.establishedDate = 'Established date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            const BASE_URL = process.env.REACT_APP_BASE_URL;

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
                    await axios.put(`${BASE_URL}/api/v1/admin/production-center/${editingCenterId}`, payload);

                    setToastMessage('Production Center updated successfully.');
                    setShowToast(true);
                    setShowModal(false);
                    resetForm();
                    fetchCenters();
                    setTimeout(() => setShowToast(false), 3000);
                } catch (error) {
                    console.error("Error updating production center:", error);
                    setToastMessage('Failed to update production center.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            } else {
                try {
                    await axios.post(`${BASE_URL}/api/v1/admin/production-center/create`, payload);

                    setToastMessage('Production Center created successfully.');
                    setShowToast(true);
                    setShowModal(false);
                    resetForm();
                    fetchCenters();
                    setTimeout(() => setShowToast(false), 3000);
                } catch (error) {
                    console.error("Error creating production center:", error);
                    setToastMessage('Failed to create production center.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
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
            establishedDate: center.establishedDate,
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this Production Center?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/production-center/${id}`);
                setToastMessage('Production Center deleted successfully.');
                setShowToast(true);
                fetchCenters();
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error("Error deleting production center:", error);
                setToastMessage('Failed to delete production center.');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
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
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                    <div className="mb-6">
                        <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                            Production Center Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-[#667085]">
                            Manage production centers
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-[#383E49]">Production Center List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-[#0F50AA] hover:bg-[#1366D9] text-white px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
                            >
                                <Factory className="w-5 h-5" />
                                Add Production Center
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
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
                                        <tr className="border-b border-[#E4E6EA]">
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Production Center
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Location
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Type
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Established Date
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Status
                                            </th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-[#383E49]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E4E6EA]">
                                        {filteredCenters.map((center) => (
                                            <tr key={center.id} className="hover:bg-[#F8F9FA] transition-colors">
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-[#383E49]">
                                                        {center.name}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-[#48505E]">
                                                        {center.location}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={center.type === 'KITCHEN'
                                                        ? 'inline-block px-2 py-1 text-xs rounded bg-orange-100 text-orange-800'
                                                        : 'inline-block px-2 py-1 text-xs rounded bg-amber-100 text-amber-800'}>
                                                        {center.type}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-[#48505E]">
                                                        {new Date(center.establishedDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${center.status === 'Active'
                                                        ? 'bg-[#DDFFE0] text-[#199D26]'
                                                        : 'bg-[#FEE2E2] text-[#EF4444]'
                                                        }`}>
                                                        {center.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(center)}
                                                            className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                                                            title="Edit Production Center"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(center.id)}
                                                            className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
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
                                <Factory size={48} className="mx-auto text-[#667085] mb-4" />
                                <p className="text-[16px] font-[500] text-[#383E49] mb-2">No production centers found</p>
                                <p className="text-[14px] text-[#667085]">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-[#383E49]">
                                    {isEditMode ? 'Edit Production Center' : 'Add Production Center'}
                                </h2>
                                <p className="text-[14px] text-[#667085] mt-1">
                                    {isEditMode
                                        ? 'Update production center information'
                                        : 'Fill in the details to create a new production center'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-2 text-[#667085] hover:bg-[#F8F9FA] rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Production Center Name <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Factory className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter production center name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.name ? 'border-[#EF4444]' : 'border-[#E4E6EA]'
                                                }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-[#EF4444] text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Location <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Enter location"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.location ? 'border-[#EF4444]' : 'border-[#E4E6EA]'
                                                }`}
                                        />
                                    </div>
                                    {errors.location && (
                                        <p className="text-[#EF4444] text-[12px] mt-1">{errors.location}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Type <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                        required
                                    >
                                        <option value="BAKERY">Bakery</option>
                                        <option value="KITCHEN">Kitchen</option>
                                        <option value="MPC">Mini Production Center (MPC)</option>
                                    </select>
                                </div>

                                {formData.type === 'MPC' && (
                                    <div>
                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                            Assign to Outlet <span className="text-[#EF4444]">*</span>
                                        </label>
                                        <select
                                            name="outletId"
                                            value={formData.outletId}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                            required
                                        >
                                            <option value="">— Select Outlet —</option>
                                            {outlets.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.outletName || o.name || `Outlet #${o.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Established Date <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                        <input
                                            type="date"
                                            name="establishedDate"
                                            value={formData.establishedDate}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.establishedDate ? 'border-[#EF4444]' : 'border-[#E4E6EA]'
                                                }`}
                                        />
                                    </div>
                                    {errors.establishedDate && (
                                        <p className="text-[#EF4444] text-[12px] mt-1">{errors.establishedDate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-6 border-t border-[#E4E6EA]">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2.5 border border-[#E4E6EA] text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
                                >
                                    {isEditMode ? 'Update Center' : 'Save Center'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed top-4 right-4 z-[10000] animate-fade-in">
                    <div className="bg-white border-l-4 border-[#51CC5D] rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#51CC5D] bg-opacity-10 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-[#199D26]" />
                        </div>
                        <p className="text-[14px] text-[#383E49] font-[500]">{toastMessage}</p>
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
