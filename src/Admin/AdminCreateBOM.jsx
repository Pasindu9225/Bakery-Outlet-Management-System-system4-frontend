import React, { useState, useEffect, useRef } from "react";
import { onEnterClick } from "../utils/a11y";
import { confirmDialog } from "../component/ConfirmDialog";
import toast from "react-hot-toast";
import { Package, Search, Plus, Edit, Trash2, X, Check, AlertTriangle, ChevronDown, ChevronRight, FileText } from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader";

export default function AdminCreateBOM() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Create BOM');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBOMId, setEditingBOMId] = useState(null);
    const [expandedBOMs, setExpandedBOMs] = useState({});

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [productFilter, setProductFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [stageFilter, setStageFilter] = useState('All');
    const [centerFilter, setCenterFilter] = useState('All');

    const [productionCenters, setProductionCenters] = useState([]);
    const [productionStages, setProductionStages] = useState([]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("authToken");
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const fetchProductionCenters = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-centers`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setProductionCenters(data);
            }
        } catch (error) {
            console.error('Error fetching production centers:', error);
        }
    };

    const fetchProductionStages = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-stages`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setProductionStages(data);
            }
        } catch (error) {
            console.error('Error fetching production stages:', error);
        }
    };

    const fetchBOMs = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/bom/all`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setBOMs(data);
            }
        } catch (error) {
            console.error('Error fetching BOMs:', error);
        } finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/all`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.map(p => ({
                    id: p.id,
                    code: p.productCode,
                    name: p.productName,
                    category: p.categoryName,
                    productionCenter: p.productionCenterName,
                    salePrice: p.salePrice,
                    unit: p.unitOfMeasure
                })));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchChildItems = async () => {
        try {
            // Fetching raw materials as child items
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/ADMIN/v1/raw-materials`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setChildItems(data.map(rm => ({
                    id: rm.id,
                    code: rm.materialCode || '',
                    name: rm.genericMaterialName || rm.materialName || '',
                    type: 'Raw Material',
                    unit: rm.unitOfMeasure || '',
                    productionCenter: 'Bakery',
                    availableStock: rm.currentStock || 0,
                    originalDetails: rm
                })));
            }
        } catch (error) {
            console.error('Error fetching child items:', error);
        }
    };

    useEffect(() => {
        fetchProductionCenters();
        fetchProductionStages();
        fetchBOMs();
        fetchProducts();
        fetchChildItems();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                productDropdownRef.current &&
                !productDropdownRef.current.contains(event.target)
            ) {
                setShowProductDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(childItemDropdownRefs.current).forEach((key) => {
                if (
                    childItemDropdownRefs.current[key] &&
                    !childItemDropdownRefs.current[key].contains(event.target)
                ) {
                    setChildItemsForm(prev =>
                        prev.map(item =>
                            item.tempId.toString() === key
                                ? { ...item, showDropdown: false }
                                : item
                        )
                    );
                }
            });
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const productDropdownRef = useRef(null);
    const [childItems, setChildItems] = useState([]);
    const [boms, setBOMs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        parentProduct: null,
        status: 'Active'
    });

    const [childItemsForm, setChildItemsForm] = useState([]);
    const childItemDropdownRefs = useRef({});
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleChange = async (field, value) => {
        // Duplicate BOM Check
        if (field === 'parentProduct' && value) {
            const existingBOM = boms.find(b => b.parentProduct.id === value.id);
            if (existingBOM) {
                if (await confirmDialog(`${value.name} already has a BOM. Do you want to edit the existing one?`, { confirmText: "Edit existing BOM" })) {
                    setShowProductDropdown(false);
                    setProductSearchTerm('');
                    handleEdit(existingBOM);
                    return;
                } else {
                    // Reset selection if they don't want to edit
                    setFormData(prev => ({
                        ...prev,
                        parentProduct: null
                    }));
                    setProductSearchTerm('');
                    return;
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleAddChildItem = () => {
        setChildItemsForm([
            ...childItemsForm,
            {
                tempId: Date.now(),
                selectedType: '',  // Add this new field
                itemCode: '',
                showDropdown: false,
                name: '',
                type: '',
                qty: '',
                unit: '',
                productionCenter: '',
                active: true,
                searchTerm: ''  // Add this for filtering
            }
        ]);
    };

    const normalizeText = (text) => {
        return (text || '').toString()
            .toLowerCase()
            .replace(/[-_]/g, ' ')     // replace dash/underscore with space
            .replace(/\s+/g, ' ')      // remove extra spaces
            .trim();
    };

    const handleChildItemChange = (tempId, field, value) => {
        setChildItemsForm(prev => prev.map(item => {
            if (item.tempId === tempId) {
                const updated = { ...item, [field]: value };

                // Clear item selection when type changes
                if (field === 'selectedType') {
                    updated.itemCode = '';
                    updated.name = '';
                    updated.type = '';
                    updated.unit = '';
                    updated.productionCenter = '';
                    updated.searchTerm = '';
                }

                // Auto-fill fields when child item is selected
                if (field === 'itemCode') {
                    const sourceList = updated.selectedType === 'Product' ? products : childItems;
                    const selectedItem = sourceList.find(ci => ci.code === value);
                    if (selectedItem) {
                        updated.name = selectedItem.name;
                        updated.type = updated.selectedType === 'Product' ? 'Product' : 'Raw Material';
                        updated.unit = selectedItem.unit || '';
                        updated.productionCenter = selectedItem.productionCenter || 'Bakery';
                    }
                }

                return updated;
            }
            return item;
        }));
    };

    const handleRemoveChildItem = (tempId) => {
        setChildItemsForm(prev => prev.filter(item => item.tempId !== tempId));
    };

    const getUniqueTypes = () => {
        return ['Raw Material', 'Product'];
    };

    const getFilteredChildItems = (selectedType, searchTerm) => {
        let sourceList = selectedType === 'Product' ? products : childItems;
        let filtered = [...sourceList];

        if (selectedType === 'Product') {
            filtered = filtered.map(p => ({
                ...p,
                type: 'Product',
                unit: 'ea',
                productionCenter: p.productionCenter || 'Bakery'
            }));
        } else {
            // For raw materials, get unique names only (ignore brand)
            const uniqueMap = new Map();
            filtered.forEach(item => {
                const displayName = item.name || item.code || 'Unnamed Material';
                if (!uniqueMap.has(displayName)) {
                    uniqueMap.set(displayName, item);
                }
            });
            filtered = Array.from(uniqueMap.values());
        }

        if (searchTerm) {
            const searchWords = normalizeText(searchTerm).split(' ');

            filtered = filtered.filter(item => {
                const combined = normalizeText(`${item.code || ''} ${item.name || ''}`);
                return searchWords.every(word => combined.includes(word));
            });
        }

        return filtered;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.parentProduct) {
            newErrors.parentProduct = 'Parent Product is required';
        }

        if (childItemsForm.length === 0) {
            newErrors.childItems = 'At least one child item is required';
        }

        // Validate each child item
        childItemsForm.forEach((item, index) => {
            if (!item.selectedType) {
                newErrors[`childItem_${index}_selectedType`] = 'Type is required';
            }
            if (!item.itemCode) {
                newErrors[`childItem_${index}_itemCode`] = 'Item is required';
            }
            if (item.qty === '' || item.qty === null || item.qty === undefined || isNaN(item.qty) || parseFloat(item.qty) < 0) {
                newErrors[`childItem_${index}_qty`] = 'Valid quantity is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const parseFetchError = async (response, fallbackMsg) => {
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                if (errorData.fieldErrors && typeof errorData.fieldErrors === 'object') {
                    const errors = Object.entries(errorData.fieldErrors)
                        .map(([field, msg]) => {
                            const formattedField = field
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
                            return `${formattedField}: ${msg}`;
                        })
                        .join('\n');
                    return `Validation failed:\n${errors}`;
                }
                return errorData.message || errorData.error || fallbackMsg;
            } else {
                const text = await response.text();
                return text || response.statusText || fallbackMsg;
            }
        } catch (e) {
            return fallbackMsg;
        }
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            const itemsPayload = childItemsForm.map(item => {
                const sourceList = item.selectedType === 'Product' ? products : childItems;
                let foundItem;

                // 1. Try matching by exact item ID if item already has an ID (e.g. from existing BOM)
                if (item.id) {
                    foundItem = sourceList.find(si => String(si.id) === String(item.id));
                }

                // 2. Try matching by itemCode if available
                if (!foundItem && item.itemCode) {
                    foundItem = sourceList.find(si => si.code === item.itemCode);
                }

                // 3. Try matching by name
                if (!foundItem && item.name) {
                    const normName = normalizeText(item.name);
                    const sameNameItems = sourceList.filter(si => 
                        normalizeText(si.name) === normName ||
                        normalizeText(si.code) === normName ||
                        normalizeText(si.originalDetails?.materialName) === normName ||
                        normalizeText(si.originalDetails?.genericMaterialName) === normName
                    );
                    if (sameNameItems.length > 0) {
                        foundItem = sameNameItems.reduce((prev, curr) => 
                            (curr.availableStock || 0) < (prev.availableStock || 0) ? curr : prev
                        );
                    }
                }

                const resolvedChildId = foundItem ? foundItem.id : (item.id ? Number(item.id) : null);

                const center = productionCenters.find(pc => (pc.centerName || pc.center_name) === item.productionCenter);
                
                // Fallback to Bakery (ID 17 from my research) if not found, or use first center
                const fallbackId = productionCenters.length > 0 ? (productionCenters.find(pc => pc.centerName === 'Bakery')?.id || productionCenters[0].id) : 1;

                return {
                    childItemId: resolvedChildId,
                    childType: item.selectedType === 'Product' ? 'product' : 'raw_material',
                    quantity: parseFloat(item.qty || 0),
                    unit: item.unit,
                    productionCenterId: center ? center.id : fallbackId,
                    isActive: item.active
                };
            });

            const invalidItem = itemsPayload.find(it => !it.childItemId);
            if (invalidItem) {
                toast.error("One or more items in the BOM could not be matched to an existing Raw Material or Product ID. Please re-select the item(s) from the dropdown.");
                return;
            }

            if (isEditMode) {
                try {
                    const payload = {
                        items: itemsPayload
                    };

                    const token = localStorage.getItem("authToken");
                    const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/bom/update/${formData.parentProduct.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        try {
                            const updatedBOM = await response.json();
                            setBOMs(boms.map(bom =>
                                bom.id === (editingBOMId || updatedBOM.id) ? updatedBOM : bom
                            ));
                        } catch (e) {
                            // If response is not JSON, refetch from server to be sure
                            fetchBOMs();
                        }
                        setToastMessage('BOM updated successfully.');
                        setShowToast(true);
                        setShowModal(false);
                        resetForm();
                        setTimeout(() => setShowToast(false), 3000);
                    } else {
                        const errorMsg = await parseFetchError(response, 'Failed to update BOM.');
                        console.error('Update failed:', errorMsg);
                        toast.error(errorMsg);
                    }
                } catch (error) {
                    console.error('Error updating BOM:', error);
                    toast.error('Error connecting to the server. Please try again later.');
                }
            } else {
                try {
                    const payload = {
                        parentProductId: formData.parentProduct.id,
                        items: itemsPayload
                    };

                    const token = localStorage.getItem("authToken");
                    const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/bom/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        try {
                            const newBOM = await response.json();
                            setBOMs([...boms, newBOM]);
                        } catch (e) {
                            // If response is not JSON, refetch from server
                            fetchBOMs();
                        }
                        setToastMessage('BOM created successfully.');
                        setShowToast(true);
                        setShowModal(false);
                        resetForm();
                        setTimeout(() => setShowToast(false), 3000);
                    } else {
                        const errorMsg = await parseFetchError(response, 'Failed to create BOM.');
                        console.error('Creation failed:', errorMsg);
                        toast.error(errorMsg);
                    }
                } catch (error) {
                    console.error('Error creating BOM:', error);
                    toast.error('Error connecting to the server. Please try again later.');
                }
            }
        }
    };

    const handleEdit = (bom) => {
        setIsEditMode(true);
        setEditingBOMId(bom.id);
        setFormData({
            parentProduct: bom.parentProduct,
            status: bom.status
        });
        setChildItemsForm(bom.childItems.map(item => {
            const mappedType = (item.type?.toLowerCase() === 'product' || item.type?.toLowerCase() === 'semi-finished' || item.type?.toLowerCase() === 'semi finished' || item.childType?.toLowerCase() === 'product') ? 'Product' : 'Raw Material';
            return {
            tempId: item.id,
            id: item.id,
            selectedType: mappedType,
            itemCode: item.itemCode,
            name: item.name,
            type: item.type,
            qty: item.qty.toString(),
            unit: item.unit,
            productionCenter: item.productionCenter,
            active: item.active,
            searchTerm: ''  // Add this
        };
        }));
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingBOMId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            parentProduct: null,
            status: 'Active'
        });
        setChildItemsForm([]);
        setErrors({});
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingBOMId(null);
        resetForm();
    };

    const handleDelete = async (bom) => {
        if (await confirmDialog('Are you sure you want to delete this BOM?', { confirmText: "Delete", danger: true })) {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/bom/delete/${bom.parentProduct.id}`, {
                    method: 'DELETE',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (response.ok) {
                    setBOMs(boms.filter(b => b.id !== bom.id));
                    setToastMessage('BOM deleted successfully.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                } else {
                    const errorData = await response.json();
                    console.error('Delete failed:', errorData);
                    toast.error('Failed to delete BOM. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting BOM:', error);
                toast.error('Error connecting to the server. Please try again later.');
            }
        }
    };

    const toggleBOMExpansion = (bomId) => {
        setExpandedBOMs(prev => ({
            ...prev,
            [bomId]: !prev[bomId]
        }));
    };

    const getFilteredBOMs = () => {
        let filtered = boms;

        if (searchTerm) {
            filtered = filtered.filter(bom =>
                bom.parentProduct.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bom.parentProduct.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (productFilter !== 'All') {
            filtered = filtered.filter(bom => bom.parentProduct.name === productFilter);
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(bom => bom.status === statusFilter);
        }

        if (stageFilter !== 'All') {
            filtered = filtered.filter(bom => {
                const parentProd = products.find(p => p.id === bom.parentProduct?.id || p.code === bom.parentProduct?.code || p.name === bom.parentProduct?.name);
                const stage = bom.parentProduct?.productionStage || bom.parentProduct?.productionStageName || parentProd?.productionStage;
                return stage === stageFilter || bom.childItems?.some(item => item.productionStage === stageFilter || item.type === stageFilter);
            });
        }

        if (centerFilter !== 'All') {
            filtered = filtered.filter(bom => bom.childItems.some(item => item.productionCenter === centerFilter));
        }

        return filtered;
    };

    const filteredBOMs = getFilteredBOMs();
    const uniqueProducts = [...new Set(boms.map(b => b.parentProduct.name))].sort();


    const getFilteredProducts = () => {
        if (!productSearchTerm) return products;

        const searchWords = normalizeText(productSearchTerm).split(' ');

        return products.filter(p => {
            const combined = normalizeText(`${p.code} ${p.name}`);

            return searchWords.every(word => combined.includes(word));
        });
    };

    const exportBOMToPDF = (bom) => {
        toast(`Exporting BOM for ${bom.parentProduct.name} as PDF...`);
        // Implement PDF export logic here
    };

    const exportBOMToExcel = (bom) => {
        toast(`Exporting BOM for ${bom.parentProduct.name} as Excel...`);
        // Implement Excel export logic here
    };

    return (
        <div className="flex bg-app h-screen overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Navbar */}
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-[20px] font-[600] text-fg mb-1">
                            Bill of Materials (BOM)
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            View and manage product composition hierarchy
                        </p>
                    </div>

                    {/* BOM List Table */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">BOM List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
                            >
                                <Plus className="w-5 h-5" />
                                Create New BOM
                            </button>
                        </div>

                        {/* Search and Filter Controls */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            {/* Search Bar */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by product code or name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                                />
                            </div>

                            {/* Filter Controls */}
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={productFilter}
                                    onChange={(e) => setProductFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Products</option>
                                    {uniqueProducts.map(product => (
                                        <option key={product} value={product}>{product}</option>
                                    ))}
                                </select>
                                <select
                                    value={stageFilter}
                                    onChange={(e) => setStageFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Stages</option>
                                    {productionStages.map(stage => (
                                        <option key={stage.id} value={stage.productionStage}>{stage.productionStage}</option>
                                    ))}
                                </select>
                                <select
                                    value={centerFilter}
                                    onChange={(e) => setCenterFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Centers</option>
                                    {productionCenters.map(center => (
                                        <option key={center.id} value={center.centerName}>{center.centerName}</option>
                                    ))}
                                </select>
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

                        {/* BOM Table with Hierarchical View */}
                        {loading ? (
                            <Loader variant="section" text="Loading BOMs..." />
                        ) : filteredBOMs.length > 0 ? (
                            <div className="space-y-4">
                                {filteredBOMs.map((bom) => (
                                    <div key={bom.id} className="border border-line rounded-lg overflow-hidden">

                                        {/* Parent Product Header */}
                                        <div className="bg-subtle p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                {/* Left Section */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <button
                                                        onClick={() => toggleBOMExpansion(bom.id)}
                                                        className="p-1 hover:bg-line rounded transition-colors"
                                                    >
                                                        {expandedBOMs[bom.id] ? (
                                                            <ChevronDown className="w-5 h-5 text-fg" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-fg" />
                                                        )}
                                                    </button>
                                                    <Package className="w-6 h-6 text-brand-fg" />
                                                </div>

                                                {/* Middle Section — Product Info */}
                                                <div className="flex-1 min-w-[220px]">
                                                    <p className="text-[16px] font-[600] text-fg truncate">
                                                        {bom.parentProduct.name}
                                                    </p>
                                                    <p className="text-[12px] text-fg-secondary">
                                                        Code: {bom.parentProduct.code} | Created: {bom.createdDate}
                                                    </p>
                                                </div>

                                                {/* Right Section — Status + Actions */}
                                                <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                                                    <div className="flex items-center gap-6 mr-4">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[12px] text-fg-secondary uppercase font-[600]">Expected GP</span>
                                                            <span className="text-[15px] font-[700] text-fg-secondary">
                                                                {bom.parentProduct.expectedGP != null ? `${bom.parentProduct.expectedGP.toFixed(2)}%` : '0.00%'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[12px] text-fg-secondary uppercase font-[600]">Actual GP</span>
                                                            <span className={`text-[15px] font-[700] ${bom.parentProduct.actualGP != null && bom.parentProduct.actualGP > 0 ? 'text-success' : 'text-error'}`}>
                                                                {bom.parentProduct.actualGP != null ? `${bom.parentProduct.actualGP.toFixed(2)}%` : '0.00%'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[12px] text-fg-secondary uppercase font-[600]">Cost</span>
                                                            <span className="text-[15px] font-[700] text-brand-fg">
                                                                Rs. {(bom.parentProduct.totalCost || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[12px] text-fg-secondary uppercase font-[600]">Sale Price</span>
                                                            <span className="text-[15px] font-[700] text-brand-fg">
                                                                Rs. {(bom.parentProduct.salePrice || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${bom.status === 'Active'
                                                            ? 'bg-hover text-success'
                                                            : 'bg-hover text-error'
                                                            }`}
                                                    >
                                                        {bom.status}
                                                    </span>
                                                    <span className="text-[14px] text-fg-secondary">
                                                        {bom.childItems.length} items
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(bom)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit BOM"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(bom)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete BOM"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Child Items Table (Collapsible) */}
                                        {expandedBOMs[bom.id] && (
                                            <div className="p-4 overflow-x-auto">
                                                <div className="min-w-[1200px]">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-line">
                                                                <th className="text-left py-3 text-[14px] font-[500] text-fg">Item Code</th>
                                                                <th className="text-left py-3 text-[14px] font-[500] text-fg">Name</th>
                                                                <th className="text-left py-3 text-[14px] font-[500] text-fg">Type</th>
                                                                <th className="text-right py-3 text-[14px] font-[500] text-fg">Qty</th>
                                                                <th className="text-left py-3 text-[14px] font-[500] text-fg">Unit</th>
                                                                <th className="text-left py-3 text-[14px] font-[500] text-fg">Production Center</th>
                                                                <th className="text-right py-3 text-[14px] font-[500] text-fg">Unit Price</th>
                                                                <th className="text-center py-3 text-[14px] font-[500] text-fg">Active</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-line">
                                                            {bom.childItems.map((item) => (
                                                                <tr key={item.id} className="hover:bg-subtle transition-colors">
                                                                    <td className="py-3 text-[14px] font-[500] text-fg">{item.itemCode}</td>
                                                                    <td className="py-3 text-[14px] text-fg">{item.name}</td>
                                                                    <td className="py-3">
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[12px] font-[500] bg-hover text-brand-fg">
                                                                            {item.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-right text-[14px] font-[600] text-fg">
                                                                        {item.qty != null ? item.qty.toFixed(6) : '0.000000'}
                                                                    </td>
                                                                    <td className="py-3 text-[14px] text-fg">{item.unit}</td>
                                                                    <td className="py-3 text-[14px] text-fg">{item.productionCenter}</td>
                                                                    {/* <td className="py-3 text-right text-[14px] text-fg">{item.cost?.toFixed(2)}</td> */}
                                                                    <td className="py-3 text-right text-[14px] text-fg">{item.unitPrice?.toFixed(2)}</td>
                                                                    {/* <td className="py-3 text-right text-[14px] text-fg">{item.totalCost?.toFixed(2)}</td> */}
                                                                    {/* <td className="py-3 text-right text-[14px] text-fg">{item.salePrice?.toFixed(2)}</td> */}
                                                                    <td className="py-3 text-center">
                                                                        {item.active ? (
                                                                            <span className="inline-flex items-center justify-center w-5 h-5 bg-hover rounded-full">
                                                                                <Check className="w-3 h-3 text-success" />
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center justify-center w-5 h-5 bg-hover rounded-full">
                                                                                <X className="w-3 h-3 text-error" />
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Package size={48} className="mx-auto text-fg-secondary mb-4" />
                                <p className="text-[16px] font-[500] text-fg mb-2">No BOMs found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm || productFilter !== 'All' || statusFilter !== 'All'
                                        ? "Try adjusting your search criteria"
                                        : "Click 'Create New BOM' to add your first Bill of Materials"}
                                </p>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* BOM Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    {isEditMode ? 'Edit BOM' : 'Create New BOM'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update Bill of Materials information'
                                        : 'Define product composition and hierarchy'
                                    }
                                </p>
                            </div>
                            <button aria-label="Close"
                                onClick={handleCancel}
                                className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Parent Product Selection */}
                            <div className="mb-6">
                                <h3 className="text-[16px] font-[600] text-fg mb-4">Parent Product</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Select Product <span className="text-error">*</span>
                                        </label>

                                        <div className="relative" ref={productDropdownRef}>
                                            {/* Search Input */}
                                            <input
                                                type="text"
                                                placeholder="Search by code or name..."
                                                value={
                                                    formData.parentProduct
                                                        ? `${formData.parentProduct.code} - ${formData.parentProduct.name}`
                                                        : productSearchTerm
                                                }
                                                onChange={(e) => {
                                                    setProductSearchTerm(e.target.value);
                                                    setShowProductDropdown(true);
                                                    handleChange('parentProduct', null);
                                                }}
                                                onFocus={() => setShowProductDropdown(true)}
                                                className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.parentProduct ? 'border-error' : 'border-line'
                                                    }`}
                                            />

                                            {/* Dropdown List */}
                                            {showProductDropdown && (
                                                <div className="absolute z-50 w-full bg-elevated border border-line rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                                    {getFilteredProducts().length > 0 ? (
                                                        getFilteredProducts().map(product => (
                                                            <div
                                                                key={product.id}
                                                                role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => {
                                                                    handleChange('parentProduct', product);
                                                                    setProductSearchTerm('');
                                                                    setShowProductDropdown(false);
                                                                }}
                                                                className="px-4 py-2 hover:bg-app cursor-pointer text-[14px]"
                                                            >
                                                                {product.code} - {product.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-[14px] text-fg-secondary">
                                                            No products found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {errors.parentProduct && (
                                            <p className="text-error text-[12px] mt-1">{errors.parentProduct}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Child Items Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[16px] font-[600] text-fg">Child Items</h3>

                                </div>

                                {errors.childItems && childItemsForm.length === 0 && (
                                    <div className="mb-4 p-3 bg-hover border-l-4 border-error rounded">
                                        <p className="text-[14px] text-error">{errors.childItems}</p>
                                    </div>
                                )}

                                {childItemsForm.length > 0 ? (
                                    <div className="space-y-4">
                                        {childItemsForm.map((item, index) => (
                                            <div key={item.tempId} className="border border-line rounded-lg p-4 bg-subtle">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="text-[14px] font-[600] text-fg">
                                                        Item #{index + 1}
                                                    </h4>
                                                    <button aria-label="Delete"
                                                        type="button"
                                                        onClick={() => handleRemoveChildItem(item.tempId)}
                                                        className="p-1 text-error hover:bg-hover rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                    {/* Type Selection - FIRST */}
                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                                            Production Type <span className="text-error">*</span>
                                                        </label>
                                                        <select
                                                            value={item.selectedType}
                                                            onChange={(e) => handleChildItemChange(item.tempId, 'selectedType', e.target.value)}
                                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg bg-surface ${errors[`childItem_${index}_selectedType`] ? 'border-error' : 'border-line'}`}
                                                        >
                                                            <option value="">Select Type First</option>
                                                            {getUniqueTypes().map((type) => (
                                                                <option key={type} value={type}>
                                                                    {type}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Child Item Selection */}
                                                    <div
                                                        className="md:col-span-2 relative"
                                                        ref={(el) => (childItemDropdownRefs.current[item.tempId] = el)}
                                                    >
                                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                                            Child Item <span className="text-error">*</span>
                                                        </label>

                                                        <input
                                                            type="text"
                                                            placeholder={item.selectedType ? "Search by code or name..." : "Select type first"}
                                                            value={
                                                                item.itemCode
                                                                    ? (item.selectedType === 'Raw Material' ? item.name : `${item.itemCode} - ${item.name}`)
                                                                    : item.searchTerm || ''
                                                            }
                                                            disabled={!item.selectedType}
                                                            onChange={(e) => {
                                                                handleChildItemChange(item.tempId, 'searchTerm', e.target.value);
                                                                handleChildItemChange(item.tempId, 'itemCode', '');
                                                                handleChildItemChange(item.tempId, 'showDropdown', true);
                                                            }}
                                                            onFocus={() =>
                                                                handleChildItemChange(item.tempId, 'showDropdown', true)
                                                            }
                                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors[`childItem_${index}_itemCode`]
                                                                ? 'border-error'
                                                                : 'border-line'
                                                                }`}
                                                        />

                                                        {/* Dropdown */}
                                                        {item.showDropdown && item.selectedType && (
                                                            <div className="absolute z-50 w-full bg-elevated border border-line rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                                                {getFilteredChildItems(item.selectedType, item.searchTerm).length > 0 ? (
                                                                    getFilteredChildItems(item.selectedType, item.searchTerm).map(ci => (
                                                                        <div
                                                                            key={ci.id}
                                                                            role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => {
                                                                                handleChildItemChange(item.tempId, 'itemCode', ci.code);
                                                                                handleChildItemChange(item.tempId, 'searchTerm', '');
                                                                                handleChildItemChange(item.tempId, 'showDropdown', false);
                                                                            }}
                                                                            className="px-4 py-2 hover:bg-app cursor-pointer text-[14px]"
                                                                        >
                                                                            {item.selectedType === 'Raw Material' ? ci.name : `${ci.code} - ${ci.name}`}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-2 text-[14px] text-fg-secondary">
                                                                        No items found
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>



                                                    {/* Quantity */}
                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                                            Qty per Unit <span className="text-error">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => handleChildItemChange(item.tempId, 'qty', e.target.value)}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors[`childItem_${index}_qty`] ? 'border-error' : 'border-line'
                                                                }`}
                                                        />
                                                        {errors[`childItem_${index}_qty`] && (
                                                            <p className="text-error text-[12px] mt-1">
                                                                {errors[`childItem_${index}_qty`]}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Unit (Auto-filled) */}
                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                                            Unit of Measure
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.unit || ''}
                                                            readOnly
                                                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] bg-app text-fg-secondary"
                                                        />
                                                    </div>

                                                    {/* Production Center (Auto-filled) */}
                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                                            Production Center
                                                        </label>
                                                        <select
                                                            value={item.productionCenter || ''}
                                                            onChange={(e) => handleChildItemChange(item.tempId, 'productionCenter', e.target.value)}
                                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${item.selectedType === 'Raw Material' ? 'bg-subtle' : 'bg-surface'
                                                                } border-line`}
                                                        >
                                                            <option value="">Select Center</option>
                                                            {productionCenters.map(center => (
                                                                <option key={center.id} value={center.centerName}>
                                                                    {center.centerName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Active Status */}
                                                    <div className="flex items-end">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.active}
                                                                onChange={(e) => handleChildItemChange(item.tempId, 'active', e.target.checked)}
                                                                className="w-4 h-4 text-brand-fg border-line rounded focus:ring-2 focus:ring-brand-fg"
                                                            />
                                                            <span className="text-[14px] font-[500] text-fg">Active</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-line rounded-lg">
                                        <Package size={40} className="mx-auto text-fg-secondary mb-2" />
                                        <p className="text-[14px] text-fg-secondary">
                                            No child items added yet. Click "Add Item" to add components.
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end mb-4">
                                    <button
                                        type="button"
                                        onClick={handleAddChildItem}
                                        className="flex items-center gap-2 mt-3 bg-brand hover:bg-brand-hover text-on-brand px-3 py-2 rounded-md text-[14px] font-[500] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Item
                                    </button>
                                </div>
                            </div>

                            {/* Summary Information */}
                            {childItemsForm.length > 0 && (
                                <div className="mb-6 p-4 bg-hover border border-brand-fg rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-brand-fg" />
                                        <h4 className="text-[14px] font-[600] text-fg">BOM Summary</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[12px] text-fg-secondary">Total Items</p>
                                            <p className="text-[16px] font-[600] text-fg">
                                                {childItemsForm.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-fg-secondary">Active Items</p>
                                            <p className="text-[16px] font-[600] text-success">
                                                {childItemsForm.filter(i => i.active).length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-fg-secondary">Raw Materials</p>
                                            <p className="text-[16px] font-[600] text-fg">
                                                {childItemsForm.filter(i => i.selectedType === 'Raw Material' && i.itemCode).length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-fg-secondary">Semi-Finished</p>
                                            <p className="text-[16px] font-[600] text-fg">
                                                {childItemsForm.filter(i => i.selectedType === 'Product' && i.itemCode).length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex gap-3 pt-6 border-t border-line">
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
                                    {isEditMode ? 'Update BOM' : 'Create BOM'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
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

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}