import React, { useState, useEffect, useMemo } from "react";
import { friendlyError } from "../utils/friendlyError";
import toast from "react-hot-toast";
import { confirmDialog } from "../component/ConfirmDialog";
import { Package, Search, Plus, Edit, Trash2, X, Check, AlertTriangle, Archive, Calendar, Download } from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import rawMaterialService from "../services/rawMaterialService";
import axiosInstance from "../services/api";
import { exportToExcel } from "../utils/exportToExcel";

// Suggests the next code in the same series as whatever's typed so far, e.g. typing "MD" against
// existing codes MDK03/MFK09/SFB001/TR007 matches MDK03 (the only one starting with "MD") and
// suggests MDK04 - same letters, next number. Typing "TR" matches TR007 and suggests TR008. Picks
// the highest-numbered code in a matching series (not just the last one in the list) so it's right
// even if the backend doesn't return items in creation order.
function suggestNextCode(existingCodes, typedPrefix = '') {
    const prefix = (typedPrefix || '').toUpperCase();
    let best = null;
    for (const raw of existingCodes || []) {
        if (!raw) continue;
        const code = String(raw);
        if (!code.toUpperCase().startsWith(prefix)) continue;
        const match = /^(.*?)(\d+)$/.exec(code);
        if (!match) continue;
        const [, base, digits] = match;
        const num = Number(digits);
        if (!best || num > best.num) {
            best = { base, digits, num };
        }
    }
    if (!best) return '';
    const nextNumber = String(best.num + 1).padStart(best.digits.length, '0');
    return `${best.base}${nextNumber}`;
}

export default function AdminRawMaterials() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Manage Raw Materials');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedBatchMaterial, setSelectedBatchMaterial] = useState(null);

    
    // Quick Create Modals
    const [showAddGenericModal, setShowAddGenericModal] = useState(false);
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPackDetails, setShowPackDetails] = useState(false);
    const [showAddPackSize, setShowAddPackSize] = useState(false);
    const [newPackSize, setNewPackSize] = useState('');
    const [customPackSizes, setCustomPackSizes] = useState([]);
    const [packDetails, setPackDetails] = useState({
        packUnit: '',
        packSize: ''
    });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [brandFilter, setbrandFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [vatFilter, setVatFilter] = useState('All');

    const [materials, setMaterials] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await rawMaterialService.getRawMaterials();
                console.log("Raw materials data fetched:", data);
                const formattedMaterials = data.map(item => ({
                    id: item.id,
                    code: item.materialCode,
                    name: item.materialName,
                    genericMaterialName: item.genericMaterialName,
                    category: typeof item.category === 'object' && item.category !== null ? (item.category.name || item.category.categoryName) : (item.category || ''),
                    brand: typeof item.brand === 'object' && item.brand !== null ? (item.brand.name || item.brand.brandName) : (item.brand || ''),
                    batchNo: item.batchNo ? String(item.batchNo) : '',
                    unit: item.unitOfMeasure,
                    maxstoplevel: item.maxStockLevel || 0,
                    currentStock: item.currentStock,
                    minStockLevel: item.minimumStockLevel,
                    status: item.isActive ? 'Active' : 'Inactive',
                    vatIncluded: item.vatIncluded,
                    unitCost: item.unitCost || 0,
                    packDetails: item.packDetails || [],
                    supplierId: item.supplierId,
                    supplierName: item.supplierName,
                    genericId: item.genericMaterialId,
                    brandId: item.brandId
                }));
                setMaterials(formattedMaterials);
            } catch (error) {
                console.error('Error fetching materials:', error);
            }
        };

        fetchMaterials();
    }, []);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: '',
        genericId: '', // Added
        brandId: '',   // Added
        batchNo: '',
        unit: '',
        // unitCost: '',
        packUnit: '',      // Add this
        packSize: '',
        maxstoplevel: '',
        currentStock: '',
        minStockLevel: '',
        // expiryDate: '',
        status: 'Active',
        vatIncluded: false,
        supplierId: ''
    });

    const suggestedMaterialCode = useMemo(
        () => suggestNextCode(materials.map((m) => m.code), formData.code),
        [materials, formData.code]
    );
    const showMaterialCodeGhost = !isEditMode && suggestedMaterialCode
        && suggestedMaterialCode.toUpperCase().startsWith(formData.code.toUpperCase())
        && suggestedMaterialCode.length > formData.code.length;

    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [categories, setCategories] = useState([]);
    const [generics, setGenerics] = useState([]);
    const [brands, setBrands] = useState([]);
    const [names, setNames] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.get(`/ADMIN/v1/raw-materials/categories`);
                const data = response.data;
                setCategories(data && data.length > 0 ? data : []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchGenerics = async () => {
            try {
                const data = await rawMaterialService.getGenericMaterials();
                setGenerics(data);
                // Also extract unique categories from generics if the backend doesn't provide a separate category list
                // But the user mentioned Categories are likely pre-existing (e.g. Ingredient, Packaging)
            } catch (error) {
                console.error('Error fetching generics:', error);
            }
        };
        fetchGenerics();
    }, []);

    useEffect(() => {
        const fetchBrands = async () => {
            let genericBrands = [];
            if (formData.genericId) {
                try {
                    genericBrands = await rawMaterialService.getBrandsByGeneric(formData.genericId);
                } catch (error) {
                    console.error('Error fetching brands for generic:', error);
                }
            }
            // Only show brands that belong to the selected generic material.
            // Do NOT mix in brands from other generic materials — that causes
            // the wrong generic to be assigned when saving.
            setBrands(genericBrands || []);
        };
        fetchBrands();
    }, [formData.genericId, materials]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axiosInstance.get(`/ADMIN/v1/suppliers`);
                setSuppliers(response.data);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            }
        };
        fetchSuppliers();
    }, []);
    const [units, setUnits] = useState(['kg', 'g', 'mg', 'L', 'ml', 'pack', 'units', 'pieces', 'nos', 'box', 'sack', 'bottle', 'can', 'packet']);
    const packUnits = ['kg', 'g', 'mg', 'L', 'ml', 'pieces', 'nos', 'units'];

    // ADDED STATE FOR CATEGORY MODAL
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // ADDED STATE FOR GENERIC MATERIAL MODAL FIELDS
    const [newGenericUom, setNewGenericUom] = useState('kg');
    const [newGenericMinStock, setNewGenericMinStock] = useState('');
    const [newGenericMaxStock, setNewGenericMaxStock] = useState('');
    const [newGenericPackSize, setNewGenericPackSize] = useState('');
    const [newGenericPackUnit, setNewGenericPackUnit] = useState('kg');

    // ADDED STATE FOR EDIT MODALS
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState(null);

    const [showEditGenericModal, setShowEditGenericModal] = useState(false);
    const [editGenericName, setEditGenericName] = useState('');
    const [editGenericCategory, setEditGenericCategory] = useState('');
    const [editGenericId, setEditGenericId] = useState(null);
    const [editGenericUom, setEditGenericUom] = useState('kg');
    const [editGenericMinStock, setEditGenericMinStock] = useState('');
    const [editGenericMaxStock, setEditGenericMaxStock] = useState('');
    const [editGenericPackSize, setEditGenericPackSize] = useState('');
    const [editGenericPackUnit, setEditGenericPackUnit] = useState('kg');

    const [showEditBrandModal, setShowEditBrandModal] = useState(false);
    const [editBrandName, setEditBrandName] = useState('');
    const [editBrandId, setEditBrandId] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            const selectedGenericObj = generics.find(g => g.id === parseInt(formData.genericId));
            const isSameCategory = selectedGenericObj && 
                (selectedGenericObj.category || '').toLowerCase() === (value || '').toLowerCase();

            setFormData(prev => ({
                ...prev,
                category: value,
                genericId: isSameCategory ? prev.genericId : '',
                brandId: isSameCategory ? prev.brandId : ''
            }));
        } else if (name === 'genericId') {
            const selectedGeneric = generics.find(g => g.id === parseInt(value));
            let parsedPackSize = '';
            let parsedPackUnit = '';
            let isPack = false;
            
            if (selectedGeneric) {
                isPack = (selectedGeneric.unitOfMeasure || '').toLowerCase() === 'pack';
                if (isPack && selectedGeneric.description) {
                    try {
                        const descObj = JSON.parse(selectedGeneric.description);
                        parsedPackSize = descObj.packSize || '';
                        parsedPackUnit = descObj.packUnit || '';
                    } catch (e) {
                        parsedPackSize = parseFloat(selectedGeneric.description) || '';
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                genericId: value,
                brandId: '',
                name: '',
                unit: selectedGeneric ? selectedGeneric.unitOfMeasure : prev.unit,
                packSize: parsedPackSize || prev.packSize,
                packUnit: parsedPackUnit || prev.packUnit,
                minStockLevel: selectedGeneric ? (selectedGeneric.minimumStockLevel !== null ? selectedGeneric.minimumStockLevel : '') : prev.minStockLevel,
                maxstoplevel: selectedGeneric ? (selectedGeneric.maxStockLevel !== null ? selectedGeneric.maxStockLevel : '') : prev.maxstoplevel
            }));
            setShowPackDetails(isPack);
        } else if (name === 'brandId') {
            setFormData(prev => ({
                ...prev,
                brandId: value,
                name: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };


    const handleAddPackSize = () => {
        const size = parseFloat(newPackSize);
        if (!size || isNaN(size) || size <= 0) {
            toast.error('Please enter a valid pack size');
            return;
        }

        setCustomPackSizes(prev => [...prev, size]);
        setFormData(prev => ({
            ...prev,
            packSize: size.toString()
        }));

        setShowAddPackSize(false);
        setNewPackSize('');
    };


    const handleUnitChange = (e) => {
        const selectedUnit = e.target.value;
        setFormData(prev => ({
            ...prev,
            unit: selectedUnit,
            packUnit: '',
            packSize: ''
        }));

        if ((selectedUnit || '').toLowerCase() === 'pack') {
            setShowPackDetails(true);
        } else {
            setShowPackDetails(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Material Code is required';
        } else {
            const codeExists = materials.some(m =>
                m.code === formData.code && m.id !== editingMaterialId
            );
            if (codeExists) {
                newErrors.code = 'Material Code already exists';
            }
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Material Name is required';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        if (!formData.genericId) {
            newErrors.genericId = 'Generic Material is required';
        }

        if (!formData.brandId) {
            newErrors.brandId = 'Brand is required';
        }

        if (!formData.unit) {
            newErrors.unit = 'Unit of Measure is required';
        }

        if (!formData.unitCost || isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0) {
            newErrors.unitCost = 'Valid Unit Cost is required';
        }
        if (!formData.genericId && (formData.maxstoplevel === '' || isNaN(formData.maxstoplevel) || parseFloat(formData.maxstoplevel) < 0)) {
            newErrors.maxstoplevel = 'Valid Max Stop Level is required';
        }

        // if (!formData.currentStock || isNaN(formData.currentStock) || parseInt(formData.currentStock) < 0) {
        //     newErrors.currentStock = 'Valid Current Stock is required';
        // }

        if (!formData.genericId && (formData.minStockLevel === '' || isNaN(formData.minStockLevel) || parseFloat(formData.minStockLevel) < 0)) {
            newErrors.minStockLevel = 'Valid Minimum Stock Level is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleEdit = (material) => {
        setIsEditMode(true);
        setEditingMaterialId(material.id);

        const isPack = (material.unit || '').toLowerCase() === 'pack';

        setFormData({
            code: material.code,
            name: material.name,
            category: material.category,
            brand: material.brand,
            batchNo: material.batchNo,
            unit: material.unit,
            packUnit: material.packDetails?.[0]?.packUom || '',
            packSize: material.packDetails?.[0]?.packSize || '',
            maxstoplevel: material.maxstoplevel.toString(),
            currentStock: material.currentStock.toString() || '',
            minStockLevel: material.minStockLevel.toString(),
            status: material.status,
            vatIncluded: material.vatIncluded,
            unitCost: material.unitCost?.toString() || '',
            supplierId: material.supplierId ? String(material.supplierId) : '',
            genericId: material.genericId ? String(material.genericId) : '',
            brandId: material.brandId ? String(material.brandId) : ''
        });

        setShowPackDetails(isPack);  // Add this
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingMaterialId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            category: '',
            genericId: '',
            brandId: '',
            batchNo: '',
            unit: '',
            // unitCost: '',
            packUnit: '',      // Add this
            packSize: '',
            maxstoplevel: '',
            currentStock: '',
            minStockLevel: '',
            // expiryDate: '',
            status: 'Active',
            vatIncluded: false,
            unitCost: '',
            supplierId: ''
        });
        setErrors({});
        setShowAddPackSize(false);
        setNewPackSize('');
        setShowPackDetails(false);
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingMaterialId(null);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('Are you sure you want to delete this raw material?', { confirmText: "Delete", danger: true })) {
            try {
                //${process.env.REACT_APP_BASE_URL}
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/ADMIN/v1/raw-materials/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setMaterials(materials.filter(material => material.id !== id));
                    setToastMessage('Raw material deleted successfully.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                } else {
                    console.error("Failed to delete material");
                    toast.error("Failed to delete material. Please try again.");
                }
            } catch (error) {
                console.error("Error deleting material:", error);
                toast.error("Error deleting material. Please check console.");
            }
        }
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                const payload = {
                    materialCode: formData.code,
                    materialName: formData.name,
                    category: formData.category,
                    brandId: formData.brandId ? parseInt(formData.brandId) : null,
                    genericMaterialId: formData.genericId ? parseInt(formData.genericId) : null,
                    unitOfMeasure: formData.unit, 
                    maxStockLevel: parseFloat(formData.maxstoplevel) || 0,
                    minimumStockLevel: parseFloat(formData.minStockLevel) || 0,
                    isActive: formData.status === 'Active',
                    vatIncluded: formData.vatIncluded,
                    unitCost: parseFloat(formData.unitCost) || 0,
                    packDetails: (formData.unit || '').toLowerCase() === 'pack' ? [
                        {
                            packUom: formData.packUnit,
                            packSize: parseFloat(formData.packSize) || 0
                        }
                    ] : [],
                    supplierId: formData.supplierId ? parseInt(formData.supplierId) : null
                };

                if (isEditMode) {
                    await rawMaterialService.updateRawMaterial(editingMaterialId, payload);
                } else {
                    await rawMaterialService.createRawMaterial(payload);
                }

                setToastMessage(`Material ${isEditMode ? 'updated' : 'added'} successfully!`);
                setShowToast(true);
                setShowModal(false);
                resetForm();
                // Reset category, status, and VAT filters so the updated/added material is visible in the list
                setCategoryFilter('All');
                setStatusFilter('All');
                setVatFilter('All');
                setSearchTerm('');
                // Refresh list properly
                const data = await rawMaterialService.getRawMaterials();
                const transformedMaterials = data.map(material => ({
                    id: material.id,
                    code: material.materialCode,
                    name: material.materialName,
                    genericMaterialName: material.genericMaterialName,
                    category: typeof material.category === 'object' && material.category !== null ? (material.category.name || material.category.categoryName) : (material.category || ''),
                    brand: typeof material.brand === 'object' && material.brand !== null ? (material.brand.name || material.brand.brandName) : (material.brand || ''),
                    batchNo: material.batchNo ? String(material.batchNo) : '',
                    unit: material.unitOfMeasure,
                    maxstoplevel: material.maxStockLevel || 0,
                    currentStock: material.currentStock || 0,
                    minStockLevel: material.minimumStockLevel,
                    status: material.isActive ? 'Active' : 'Inactive',
                    vatIncluded: !!material.vatIncluded,
                    unitCost: material.unitCost || 0,
                    packDetails: material.packDetails || [],
                    supplierId: material.supplierId,
                    supplierName: material.supplierName,
                    genericId: material.genericMaterialId,
                    brandId: material.brandId
                }));
                setMaterials(transformedMaterials);
                setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
                console.error('Error saving material:', error);
                toast.error(friendlyError(error));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleAddGeneric = async (name) => {
        if (!name.trim()) return;

        let description = '';
        if (newGenericUom === 'pack') {
            description = JSON.stringify({
                packSize: parseFloat(newGenericPackSize) || 0,
                packUnit: newGenericPackUnit || 'kg'
            });
        }

        try {
            const data = await rawMaterialService.createGenericMaterial({
                name: name.trim(),
                genericMaterialName: name.trim(),
                category: formData.category,
                categoryName: formData.category,
                unitOfMeasure: newGenericUom,
                minimumStockLevel: parseFloat(newGenericMinStock) || 0,
                maxStockLevel: parseFloat(newGenericMaxStock) || 0,
                description: description
            });
            setGenerics([...generics, data]);

            let parsedPackSize = '';
            let parsedPackUnit = '';
            let isPack = (data.unitOfMeasure || '').toLowerCase() === 'pack';
            if (isPack && data.description) {
                try {
                    const descObj = JSON.parse(data.description);
                    parsedPackSize = descObj.packSize || '';
                    parsedPackUnit = descObj.packUnit || '';
                } catch (e) {
                    parsedPackSize = parseFloat(data.description) || '';
                }
            }

            setFormData(prev => ({ 
                ...prev, 
                genericId: data.id,
                unit: data.unitOfMeasure,
                packSize: parsedPackSize || prev.packSize,
                packUnit: parsedPackUnit || prev.packUnit,
                minStockLevel: data.minimumStockLevel,
                maxstoplevel: data.maxStockLevel
            }));

            setShowPackDetails(isPack);
            setShowAddGenericModal(false);
            // Reset modal states
            setNewGenericMinStock('');
            setNewGenericMaxStock('');
            setNewGenericPackSize('');
            setNewGenericPackUnit('kg');
        } catch (error) {
            console.error('Error adding generic:', error);
            toast.error(friendlyError(error, { fallback: "Failed to add generic material" }));
        }
    };

    const handleAddBrand = async (name) => {
        if (!name.trim()) return;
        try {
            const data = await rawMaterialService.createBrand({
                name: name.trim(),
                brandName: name.trim(),
                genericMaterialId: formData.genericId
            });
            setBrands([...brands, data]);
            setFormData(prev => ({ ...prev, brandId: data.id }));
            setShowAddBrandModal(false);
        } catch (error) {
            console.error('Error adding brand:', error);
            toast.error('Failed to add brand');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const data = await rawMaterialService.createCategory(newCategoryName.trim());
            const catName = data.name || data.categoryName;
            setCategories([...categories, catName]);
            setFormData(prev => ({ ...prev, category: catName, genericId: '', brandId: '', name: '' }));
            setShowAddCategoryModal(false);
            setNewCategoryName('');
            setToastMessage('Category added successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error(friendlyError(error, { fallback: "Failed to add category" }));
        }
    };

    const handleUpdateCategory = async () => {
        if (!editCategoryName.trim()) return;
        try {
            const data = await rawMaterialService.updateCategory(editCategoryId, editCategoryName.trim());
            const updatedName = data.name || data.categoryName;
            
            // Update local categories list
            setCategories(categories.map(c => c.id === editCategoryId ? data : c));
            
            // Update formData if the currently selected category was changed
            if (formData.category === categories.find(c => c.id === editCategoryId)?.name) {
                setFormData(prev => ({ ...prev, category: updatedName }));
            }
            
            // Update materials table
            setMaterials(materials.map(m => m.category === categories.find(c => c.id === editCategoryId)?.name ? { ...m, category: updatedName } : m));
            
            setShowEditCategoryModal(false);
            setToastMessage('Category updated successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(friendlyError(error, { fallback: "Failed to update category" }));
        }
    };

    const handleUpdateGeneric = async () => {
        if (!editGenericName.trim()) return;

        let description = '';
        if (editGenericUom === 'pack') {
            description = JSON.stringify({
                packSize: parseFloat(editGenericPackSize) || 0,
                packUnit: editGenericPackUnit || 'kg'
            });
        }

        try {
            const data = await rawMaterialService.updateGenericMaterial(editGenericId, {
                name: editGenericName.trim(),
                genericMaterialName: editGenericName.trim(),
                category: editGenericCategory,
                unitOfMeasure: editGenericUom,
                minimumStockLevel: editGenericMinStock !== '' ? parseFloat(editGenericMinStock) : 0,
                maxStockLevel: editGenericMaxStock !== '' ? parseFloat(editGenericMaxStock) : 0,
                description: description
            });
            
            // Update local generics list
            setGenerics(generics.map(g => g.id === editGenericId ? { ...g, ...data, category: editGenericCategory, name: data.name || editGenericName.trim() } : g));
            
            // Update formData if currently selected
            if (parseInt(formData.genericId) === editGenericId) {
                setFormData(prev => ({
                    ...prev,
                    category: editGenericCategory || prev.category,
                    unit: data.unitOfMeasure || editGenericUom,
                    minStockLevel: data.minimumStockLevel !== undefined ? data.minimumStockLevel : editGenericMinStock,
                    maxstoplevel: data.maxStockLevel !== undefined ? data.maxStockLevel : editGenericMaxStock,
                    packSize: editGenericPackSize,
                    packUnit: editGenericPackUnit
                }));
            }

            // Update materials table
            if (editGenericCategory) {
                setMaterials(materials.map(m => m.genericId === editGenericId ? { ...m, category: editGenericCategory } : m));
            }

            setShowEditGenericModal(false);
            setToastMessage('Generic material updated successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Error updating generic material:', error);
            toast.error(friendlyError(error, { fallback: "Failed to update generic material" }));
        }
    };

    const handleUpdateBrand = async () => {
        if (!editBrandName.trim()) return;
        try {
            const data = await rawMaterialService.updateBrand(editBrandId, {
                name: editBrandName.trim()
            });
            
            // Update local brands list
            setBrands(brands.map(b => b.id === editBrandId ? { ...b, name: data.name } : b));
            
            // Update materials table
            setMaterials(materials.map(m => m.brandId === editBrandId ? { ...m, brand: data.name } : m));
            
            setShowEditBrandModal(false);
            setToastMessage('Brand updated successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Error updating brand:', error);
            toast.error(friendlyError(error, { fallback: "Failed to update brand" }));
        }
    };

    const getStockStatus = (material) => {
        if (material.currentStock === 0) return 'Out of Stock';
        if (material.currentStock <= material.minStockLevel) return 'Low Stock';
        return 'In Stock';
    };

    const getStockStatusColor = (material) => {
        if (material.currentStock === 0) return 'bg-hover text-error';
        if (material.currentStock <= material.minStockLevel) return 'bg-hover text-warning';
        return 'bg-hover text-success';
    };

    const getFilteredMaterials = () => {
        let filtered = materials;

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(material => {
                const genericObj = generics.find(g => g.id === material.genericId);
                const resolvedGenericName = genericObj ? (genericObj.name || genericObj.genericMaterialName) : (material.genericMaterialName || '');
                return (material.code || '').toLowerCase().includes(lowSearch) ||
                    (material.name || '').toLowerCase().includes(lowSearch) ||
                    (resolvedGenericName || '').toLowerCase().includes(lowSearch) ||
                    (material.batchNo || '').toLowerCase().includes(lowSearch);
            });
        }

        if (categoryFilter !== 'All') {
            filtered = filtered.filter(material => material.category === categoryFilter);
        }

        if (brandFilter !== 'All') {
            filtered = filtered.filter(material => material.brand === brandFilter);
        }

        if (statusFilter !== 'All') {
            if (statusFilter === 'Low Stock') {
                filtered = filtered.filter(material =>
                    material.currentStock > 0 && material.currentStock <= material.minStockLevel
                );
            } else if (statusFilter === 'Out of Stock') {
                filtered = filtered.filter(material => material.currentStock === 0);
            } else if (statusFilter === 'Active') {
                filtered = filtered.filter(material => material.status === 'Active');
            } else if (statusFilter === 'Inactive') {
                filtered = filtered.filter(material => material.status === 'Inactive');
            }
        }

        if (vatFilter !== 'All') {
            if (vatFilter === 'VAT Included') {
                filtered = filtered.filter(material => material.vatIncluded === true);
            } else if (vatFilter === 'No VAT') {
                filtered = filtered.filter(material => material.vatIncluded === false);
            }
        }

        return filtered;
    };



    const formatBatchDisplay = (batchString, limit = 2) => {
        if (!batchString) return { display: 'N/A', hasMore: false, all: [] };

        const batches = batchString.split(',').map(b => b.trim());
        const displayBatches = batches.slice(0, limit);
        const hasMore = batches.length > limit;

        return {
            display: displayBatches.join(', '),
            hasMore: hasMore,
            remaining: batches.length - limit,
            all: batches
        };
    };

    const handleViewBatches = (material) => {
        setSelectedBatchMaterial(material);
        setShowBatchModal(true);
    };

    const filteredMaterials = getFilteredMaterials();

    const handleExportExcel = () => {
        const rows = filteredMaterials.map(m => {
            // The table shows the linked generic material's name here, not the raw m.name field -
            // many rows never had m.name filled in properly, only the generic material link.
            const genericObj = generics.find(g => g.id === m.genericId);
            const displayName = genericObj ? (genericObj.name || genericObj.genericMaterialName) : (m.genericMaterialName || m.name);
            return {
                "Material Code": m.code,
                "Name": displayName,
                "Generic Material": m.genericMaterialName,
                "Category": m.category,
                "Brand": m.brand,
                "Unit of Measure": m.unit,
                "Unit Cost (Rs.)": m.unitCost,
                "Current Stock": m.currentStock,
                "Min Stock Level": m.minStockLevel,
                "Max Stock Level": m.maxstoplevel,
                "Supplier": m.supplierName,
                "VAT Included": m.vatIncluded ? "Yes" : "No",
                "Status": m.status,
            };
        });
        exportToExcel(rows, `Raw_Materials_${new Date().toISOString().slice(0, 10)}`, "Raw Materials");
    };

    const uniqueCategories = [...new Set(materials.map(m => m.category))];
    const uniquebrands = [...new Set(materials.map(m => m.brand))];

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
                            Raw Material Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            Add, view, and manage raw materials
                        </p>
                    </div>

                    {/* Materials List Table */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Material List</h3>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 border border-line hover:bg-subtle text-fg px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    Export to Excel
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add New Material
                                </button>
                            </div>
                        </div>

                        {/* Search and Filter Controls */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            {/* Search Bar */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by code, name, or batch number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                                />
                            </div>

                            {/* Filter Controls */}
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Categories</option>
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
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
                                    <option value="Low Stock">Low Stock</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                </select>

                                <select
                                    value={vatFilter}
                                    onChange={(e) => setVatFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All VAT Status</option>
                                    <option value="VAT Included">VAT Included</option>
                                    <option value="No VAT">No VAT</option>
                                </select>
                            </div>
                        </div>

                        {/* Materials Table */}
                        {filteredMaterials.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-line">
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Code</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Name</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Category</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Brand</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Supplier</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Stock</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Unit</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Cost</th>
                                            {/* <th className="text-left py-4 text-[14px] font-[500] text-fg">Max Stop Level</th> */}
                                            {/* <th className="text-left py-4 text-[14px] font-[500] text-fg">Expiry</th> */}
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Stock Status</th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">Status</th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-fg">VAT</th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-fg">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {filteredMaterials.map((material) => (
                                            <tr key={material.id} className="hover:bg-subtle transition-colors">
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        {material.code}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        {(() => {
                                                            const genericObj = generics.find(g => g.id === material.genericId);
                                                            const genericName = genericObj ? (genericObj.name || genericObj.genericMaterialName) : (material.genericMaterialName || material.name);
                                                            const brand = material.brand;
                                                            const hasBrand = brand && 
                                                                             brand.toLowerCase() !== 'unbranded' && 
                                                                             brand.toLowerCase() !== 'no brand' && 
                                                                             brand.toLowerCase() !== 'n/a' && 
                                                                             brand.toLowerCase() !== 'default';
                                                            return hasBrand ? `${genericName}, ${brand}` : genericName;
                                                        })() || <span className="text-brand-fg italic">({material.code})</span>}
                                                    </p>
                                                    <div className="text-[12px] text-fg-secondary">
                                                        {(() => {
                                                            const batchInfo = formatBatchDisplay(material.batchNo, 2);
                                                            return (
                                                                <>
                                                                    <span>Batch: {batchInfo.display}</span>
                                                                    {batchInfo.hasMore && (
                                                                        <button
                                                                            onClick={() => handleViewBatches(material)}
                                                                            className="ml-2 text-brand-fg hover:underline font-[500]"
                                                                        >
                                                                            +{batchInfo.remaining} more
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {material.category || <span className="text-fg-muted">Uncategorized</span>}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {material.brand || <span className="text-fg-muted">No Brand</span>}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {material.supplierName || <span className="text-fg-muted">Not Assigned</span>}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        {material.currentStock.toLocaleString()} {material.unit}
                                                    </p>
                                                    {material.unit?.toLowerCase() === 'pack' && material.packDetails?.[0] && (
                                                        <p className="text-[12px] text-fg-secondary">
                                                            Total: {(material.currentStock * material.packDetails[0].packSize).toLocaleString()} {material.packDetails[0].packUom}
                                                        </p>
                                                    )}
                                                    <p className="text-[12px] text-fg-secondary">
                                                        Min: {material.minStockLevel.toFixed(2)}
                                                    </p>
                                                    <p className="text-[12px] text-fg-secondary">
                                                        Max: {material.maxstoplevel.toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {material.unit}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[500] text-fg">
                                                        Rs. {(material.unitCost || 0).toFixed(2)}
                                                    </p>
                                                </td>
                                                {/* <td className="py-4">
                                                    <p className="text-[14px] font-[500] text-fg">
                                                        Rs. {material.maxstoplevel.toFixed(2)}
                                                    </p>
                                                </td> */}
                                                {/* <td className="py-4">
                                                    <p className="text-[14px] text-fg">
                                                        {material.expiryDate || 'N/A'}
                                                    </p>
                                                </td> */}
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${getStockStatusColor(material)}`}>
                                                        {getStockStatus(material)}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${material.status === 'Active'
                                                        ? 'bg-hover text-success'
                                                        : 'bg-hover text-error'
                                                        }`}>
                                                        {material.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center">

                                                        {material.vatIncluded ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-hover text-brand-fg">
                                                                VAT Included
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-hover text-fg-secondary">
                                                                No VAT
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(material)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit Material"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(material.id)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete Material"
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
                                <Package size={48} className="mx-auto text-fg-secondary mb-4" />
                                <p className="text-[16px] font-[500] text-fg mb-2">No materials found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All' || vatFilter !== 'All'
                                        ? "Try adjusting your search or filter criteria"
                                        : "Click 'Add New Material' to add your first raw material"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Material Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    {isEditMode ? 'Edit Raw Material' : 'Add New Raw Material'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update raw material information'
                                        : 'Fill in the details to add a new raw material'
                                    }
                                </p>
                            </div>
                            <button aria-label="Close"
                                type="button"
                                onClick={handleCancel}
                                className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                 {/* Category Selection */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Category <span className="text-error">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className={`flex-1 min-w-0 px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg truncate ${errors.category ? 'border-error' : 'border-line'}`}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id || cat.name || cat} value={cat.name || cat}>{cat.name || cat}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const catObj = categories.find(c => (c.name || c) === formData.category);
                                                if (catObj && catObj.id) {
                                                    setEditCategoryId(catObj.id);
                                                    setEditCategoryName(catObj.name);
                                                    setShowEditCategoryModal(true);
                                                } else {
                                                    toast.error("Cannot edit this category as it has no ID.");
                                                }
                                            }}
                                            disabled={!formData.category}
                                           className={`shrink-0 px-3 py-2.5 border rounded-md transition-colors ${formData.category ? 'border-warning text-warning hover:bg-hover' : 'border-line text-fg-muted cursor-not-allowed'}`}
                                            title="Edit selected category"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCategoryModal(true)}
                                           className="shrink-0 px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors"
                                            title="Add new category"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {errors.category && (
                                        <p className="text-error text-[12px] mt-1">{errors.category}</p>
                                    )}
                                </div>

                                {/* Generic Material Selection */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Generic Material <span className="text-error">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            name="genericId"
                                            value={formData.genericId}
                                            onChange={handleChange}
                                            disabled={!formData.category}
                                          className={`flex-1 min-w-0 px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg truncate ${errors.genericId ? 'border-error' : 'border-line'}`}
                                        >
                                            <option value="">Select Generic</option>
                                            {generics
                                                .filter(g => {
                                                    if (!formData.category) return true;
                                                    const gCat = (g.category || '').toString().trim().toLowerCase();
                                                    const fCat = (formData.category || '').toString().trim().toLowerCase();
                                                    return gCat === fCat || g.id === parseInt(formData.genericId);
                                                })
                                                .map(g => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.name || g.genericMaterialName} {g.category ? `(${g.category})` : ''}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const genObj = generics.find(g => g.id === parseInt(formData.genericId));
                                                if (genObj) {
                                                    setEditGenericId(genObj.id);
                                                    setEditGenericName(genObj.name || genObj.genericMaterialName || '');
                                                    setEditGenericCategory(genObj.category || formData.category || '');
                                                    setEditGenericUom(genObj.unitOfMeasure || 'kg');
                                                    setEditGenericMinStock(genObj.minimumStockLevel !== null && genObj.minimumStockLevel !== undefined ? genObj.minimumStockLevel : '');
                                                    setEditGenericMaxStock(genObj.maxStockLevel !== null && genObj.maxStockLevel !== undefined ? genObj.maxStockLevel : '');
                                                    
                                                    let pSize = '';
                                                    let pUnit = 'kg';
                                                    if ((genObj.unitOfMeasure || '').toLowerCase() === 'pack' && genObj.description) {
                                                        try {
                                                            const descObj = JSON.parse(genObj.description);
                                                            pSize = descObj.packSize || '';
                                                            pUnit = descObj.packUnit || 'kg';
                                                        } catch (e) {
                                                            pSize = parseFloat(genObj.description) || '';
                                                        }
                                                    }
                                                    setEditGenericPackSize(pSize);
                                                    setEditGenericPackUnit(pUnit);

                                                    setShowEditGenericModal(true);
                                                }
                                            }}
                                            disabled={!formData.genericId}
                                         className={`shrink-0 px-3 py-2.5 border rounded-md transition-colors ${formData.genericId ? 'border-warning text-warning hover:bg-hover' : 'border-line text-fg-muted cursor-not-allowed'}`}
                                            title="Edit selected generic material"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewGenericUom(formData.unit || 'kg');
                                                setShowAddGenericModal(true);
                                            }}
                                          className="shrink-0 px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors"
                                            title="Add new generic material"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {errors.genericId && (
                                        <p className="text-error text-[12px] mt-1">{errors.genericId}</p>
                                    )}
                                </div>

                               {/* Brand Selection */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Brand <span className="text-error">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            name="brandId"
                                            value={formData.brandId}
                                            onChange={handleChange}
                                            disabled={!formData.genericId}
                                            className={`flex-1 min-w-0 px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg truncate ${errors.brandId ? 'border-error' : 'border-line'}`}
                                        >
                                            <option value="">Select Brand</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>{b.name || b.brandName}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const brandObj = brands.find(b => b.id === parseInt(formData.brandId));
                                                if (brandObj) {
                                                    setEditBrandId(brandObj.id);
                                                    setEditBrandName(brandObj.name || brandObj.brandName);
                                                    setShowEditBrandModal(true);
                                                }
                                            }}
                                            disabled={!formData.brandId}
                                            className={`shrink-0 px-3 py-2.5 border rounded-md transition-colors ${formData.brandId ? 'border-warning text-warning hover:bg-hover' : 'border-line text-fg-muted cursor-not-allowed'}`}
                                            title="Edit selected brand"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddBrandModal(true)}
                                            disabled={!formData.genericId}
                                            className="shrink-0 px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Add new brand"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {errors.brandId && (
                                        <p className="text-error text-[12px] mt-1">{errors.brandId}</p>
                                    )}
                                </div>

                                {/* SKU Name (Was Material Name) */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        SKU Name <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., 1kg Pack, 50kg Sack"
                                        className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.name ? 'border-error' : 'border-line'}`}
                                    />
                                    {errors.name && (
                                        <p className="text-error text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* Material Code */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Material Code <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            onKeyDown={(e) => {
                                                if ((e.key === 'Tab' || e.key === 'ArrowRight') && !isEditMode
                                                    && suggestedMaterialCode && suggestedMaterialCode.length > formData.code.length
                                                    && e.currentTarget.selectionStart === formData.code.length) {
                                                    e.preventDefault();
                                                    setFormData((prev) => ({ ...prev, code: suggestedMaterialCode }));
                                                }
                                            }}
                                            placeholder={showMaterialCodeGhost ? '' : "e.g., RM-001"}
                                            className={`w-full px-4 py-2.5 border rounded-md text-[14px] bg-transparent relative z-10 focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.code ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                        {showMaterialCodeGhost && (
                                            <div className="absolute inset-0 flex items-center px-4 py-2.5 text-[14px] pointer-events-none whitespace-pre">
                                                <span className="invisible">{formData.code}</span>
                                                <span className="text-fg-muted">{suggestedMaterialCode.slice(formData.code.length)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {errors.code && (
                                        <p className="text-error text-[12px] mt-1">{errors.code}</p>
                                    )}
                                </div>

                                {/* Supplier Selection */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Primary Supplier
                                    </label>
                                     <select
                                         name="supplierId"
                                         value={formData.supplierId ? String(formData.supplierId) : ""}
                                         onChange={handleChange}
                                         className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                     >
                                         <option value="">Select Supplier</option>
                                         {suppliers.map(s => (
                                             <option key={s.supplierId} value={String(s.supplierId)}>{s.name}</option>
                                         ))}
                                     </select>
                                    <p className="text-[12px] text-fg-secondary mt-1">
                                        Associate this material with a supplier
                                    </p>
                                </div>

                                {/* Batch No removed */}

                                {/* Unit of Measure */}
                                <div>
                                     <label className="block text-[14px] font-[500] text-fg mb-1">
                                         Unit of Measure <span className="text-error">*</span>
                                     </label>
                                     <select
                                         name="unit"
                                         value={formData.unit}
                                         onChange={handleUnitChange}
                                         disabled={!!formData.genericId}
                                         className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.unit ? 'border-error' : 'border-line'
                                             } ${formData.genericId ? 'bg-subtle cursor-not-allowed' : ''}`}
                                     >
                                        <option value="">Select Unit</option>
                                        {(() => {
                                            const filteredUnits = [...new Set(
                                                materials
                                                    .filter(m => m.name === formData.name && m.brand === formData.brand)
                                                    .map(m => m.unit)
                                                    .filter(Boolean)
                                            )];
                                            const options = [...new Set([formData.unit, ...units, ...filteredUnits].filter(Boolean))];
                                            return options.map((unit) => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ));
                                        })()}
                                    </select>
                                    {errors.unit && (
                                        <p className="text-error text-[12px] mt-1">{errors.unit}</p>
                                    )}
                                </div>

                                {/* Pack Details - Only show when "pack" is selected */}
                                {showPackDetails && (
                                    <div className="md:col-span-2 p-4 bg-subtle border border-line rounded-lg">
                                        <h4 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Pack Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Pack Unit */}
                                            <div>
                                                <label className="block text-[14px] font-[500] text-fg mb-1">
                                                    Pack Unit <span className="text-error">*</span>
                                                </label>
                                                <select
                                                    name="packUnit"
                                                    value={formData.packUnit}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                >
                                                    <option value="">Select pack unit</option>
                                                    {(() => {
                                                        const filteredPackUnits = [...new Set(
                                                            materials
                                                                .filter(m => m.name === formData.name && m.brand === formData.brand)
                                                                .flatMap(m => m.packDetails?.map(p => p.packUom) || [])
                                                                .filter(Boolean)
                                                        )];
                                                        const options = [...new Set([formData.packUnit, ...packUnits, ...filteredPackUnits].filter(Boolean))];
                                                        return options.map((unit) => (
                                                            <option key={unit} value={unit}>{unit}</option>
                                                        ));
                                                    })()}
                                                </select>
                                                <p className="text-[12px] text-fg-secondary mt-1">
                                                    What unit is inside the pack?
                                                </p>
                                            </div>

                                            {/* Pack Size */}
                                            <div>
                                                <label className="block text-[14px] font-[500] text-fg mb-1">
                                                    Pack Size <span className="text-error">*</span>
                                                </label>
                                                {!showAddPackSize ? (
                                                    <div className="flex gap-2">
                                                        <select
                                                            name="packSize"
                                                            value={formData.packSize}
                                                            onChange={handleChange}
                                                            className="flex-1 px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                        >
                                                            <option value="">Select size</option>
                                                            {[...new Set([
                                                                formData.packSize,
                                                                ...materials
                                                                    .filter(m => m.name === formData.name && m.brand === formData.brand)
                                                                    .flatMap(m => m.packDetails?.map(p => p.packSize) || []),
                                                                ...customPackSizes
                                                            ])].filter(Boolean).map((size) => (
                                                                <option key={size} value={size}>{size}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAddPackSize(true)}
                                                            className="px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors"
                                                            title="Add new size"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={newPackSize}
                                                                onChange={(e) => setNewPackSize(e.target.value)}
                                                                placeholder="Enter size"
                                                                className="flex-1 px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddPackSize();
                                                                    }
                                                                }}
                                                            />
                                                            <button aria-label="Close"
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowAddPackSize(false);
                                                                    setNewPackSize('');
                                                                }}
                                                                className="px-3 py-2.5 border border-line text-fg-secondary rounded-md hover:bg-subtle transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <button aria-label="Confirm"
                                                                type="button"
                                                                onClick={handleAddPackSize}
                                                                className="px-3 py-2.5 bg-brand text-on-brand rounded-md hover:bg-brand-hover transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-[12px] text-fg-secondary">
                                                            Press Enter or click check to add size
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-[12px] text-fg-secondary mt-1">
                                                    Size per pack (e.g., 500 for 500kg pack)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                     <label className="block text-[14px] font-[500] text-fg mb-1">
                                         Unit Cost (Rs.) <span className="text-error">*</span>
                                     </label>
                                     <input
                                         type="number"
                                         name="unitCost"
                                         value={formData.unitCost}
                                         onChange={handleChange}
                                         placeholder="0.00"
                                         step="0.01"
                                         min="0"
                                         className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.unitCost ? 'border-error' : 'border-line'
                                             }`}
                                     />
                                     {errors.unitCost && (
                                         <p className="text-error text-[12px] mt-1">{errors.unitCost}</p>
                                     )}
                                 </div>

                                 {/* Minimum Stock Level */}
                                 <div>
                                     <label className="block text-[14px] font-[500] text-fg mb-1">
                                         Minimum Stock Level <span className="text-error">*</span>
                                     </label>
                                     <input
                                         type="number"
                                         name="minStockLevel"
                                         value={formData.minStockLevel}
                                         onChange={handleChange}
                                         disabled={!!formData.genericId}
                                         placeholder="e.g., 10"
                                         className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.minStockLevel ? 'border-error' : 'border-line'
                                             } ${formData.genericId ? 'bg-subtle cursor-not-allowed' : ''}`}
                                     />
                                     {errors.minStockLevel && (
                                         <p className="text-error text-[12px] mt-1">{errors.minStockLevel}</p>
                                     )}
                                 </div>
                                 <div>
                                     <label className="block text-[14px] font-[500] text-fg mb-1">
                                         Max Stock Level <span className="text-error">*</span>
                                     </label>
                                     <input
                                         type="number"
                                         name="maxstoplevel"
                                         value={formData.maxstoplevel}
                                         onChange={handleChange}
                                         disabled={!!formData.genericId}
                                         placeholder="e.g., 100"
                                         className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.maxstoplevel ? 'border-error' : 'border-line'
                                             } ${formData.genericId ? 'bg-subtle cursor-not-allowed' : ''}`}
                                     />
                                     {errors.maxstoplevel && (
                                         <p className="text-error text-[12px] mt-1">{errors.maxstoplevel}</p>
                                     )}
                                 </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Active Status
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

                            <div className="md:col-span-2">
                                <label className="block text-[14px] font-[500] text-fg mb-3">
                                    VAT Settings
                                </label>
                                <div className="flex items-start gap-3 p-4 bg-subtle rounded-lg border border-line">
                                    <input
                                        type="checkbox"
                                        name="vatIncluded"
                                        checked={formData.vatIncluded}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            vatIncluded: e.target.checked
                                        }))}
                                        className="w-5 h-5 text-brand-fg border-line rounded focus:ring-2 focus:ring-brand-fg mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[14px] font-[500] text-fg mb-1">
                                            VAT Included in Cost
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Alert Info */}
                            {formData.currentStock && formData.minStockLevel &&
                                parseInt(formData.currentStock) <= parseInt(formData.minStockLevel) && (
                                    <div className="mt-4 p-4 bg-hover border-l-4 border-warning rounded">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-warning" />
                                            <p className="text-[14px] font-[500] text-fg">
                                                Low Stock Warning
                                            </p>
                                        </div>
                                        <p className="text-[12px] text-fg-secondary mt-1 ml-7">
                                            Current stock is at or below the minimum level. Consider restocking soon.
                                        </p>
                                    </div>
                                )}

                            {/* Modal Footer */}
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
                                    {isEditMode ? 'Update Material' : 'Save Material'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Details Modal */}
            {showBatchModal && selectedBatchMaterial && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    Batch Details
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {selectedBatchMaterial.name} ({selectedBatchMaterial.code})
                                </p>
                            </div>
                            <button aria-label="Close"
                                onClick={() => setShowBatchModal(false)}
                                className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[16px] font-[600] text-fg mb-3">
                                        All Batches ({formatBatchDisplay(selectedBatchMaterial.batchNo).all.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {formatBatchDisplay(selectedBatchMaterial.batchNo).all.map((batch, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 border border-line rounded-lg hover:bg-subtle transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-brand bg-opacity-10 rounded-full flex items-center justify-center">
                                                        <span className="text-[12px] font-[600] text-brand-fg">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <span className="text-[14px] font-[500] text-fg">
                                                        {batch}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] text-fg-secondary bg-subtle px-3 py-1 rounded-full">
                                                    Batch #{index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end mt-6 pt-6 border-t border-line">
                                <button
                                    onClick={() => setShowBatchModal(false)}
                                    className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-on-brand rounded-md text-[14px] font-[500] transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Category Modal */}
            {showAddCategoryModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Add New Category</h3>
                            <button aria-label="Close" onClick={() => setShowAddCategoryModal(false)} className="text-fg-secondary hover:bg-subtle rounded-md p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">Category Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., INGREDIENT, PACKAGING"
                                    className="w-full px-4 py-2 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    autoFocus
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCategory();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddCategoryModal(false)}
                                className="flex-1 px-4 py-2.5 border border-line text-fg rounded-md text-[14px] hover:bg-subtle"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-md text-[14px] hover:bg-brand-hover"
                            >
                                Save Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Generic Modal */}
            {showAddGenericModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Add New Generic Material</h3>
                            <button aria-label="Close" onClick={() => setShowAddGenericModal(false)} className="text-fg-secondary hover:bg-subtle rounded-md p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">Generic Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Flour, Sugar"
                                    className="w-full px-4 py-2 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    id="new-generic-name"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">Unit of Measure</label>
                                <select 
                                    className="w-full px-4 py-2 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    value={newGenericUom}
                                    onChange={(e) => setNewGenericUom(e.target.value)}
                                >
                                    {['kg', 'L', 'pack', 'units', 'pieces'].map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            {newGenericUom === 'pack' && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-subtle rounded-md border border-line">
                                    <div>
                                        <label className="block text-[12px] font-[500] text-fg mb-1">Pack Size *</label>
                                        <input
                                            type="number"
                                            value={newGenericPackSize}
                                            onChange={(e) => setNewGenericPackSize(e.target.value)}
                                            placeholder="e.g., 25"
                                            className="w-full px-3 py-2 border border-line rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-[500] text-fg mb-1">Pack Unit *</label>
                                        <select
                                            value={newGenericPackUnit}
                                            onChange={(e) => setNewGenericPackUnit(e.target.value)}
                                            className="w-full px-3 py-2 border border-line rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        >
                                            {['kg', 'L', 'pieces'].map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">Min Stock Level</label>
                                    <input
                                        type="number"
                                        value={newGenericMinStock}
                                        onChange={(e) => setNewGenericMinStock(e.target.value)}
                                        placeholder="Min"
                                        className="w-full px-4 py-2 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">Max Stock Level</label>
                                    <input
                                        type="number"
                                        value={newGenericMaxStock}
                                        onChange={(e) => setNewGenericMaxStock(e.target.value)}
                                        placeholder="Max"
                                        className="w-full px-4 py-2 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddGenericModal(false)}
                                className="flex-1 px-4 py-2.5 border border-line text-fg rounded-md text-[14px] hover:bg-subtle"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAddGeneric(document.getElementById('new-generic-name').value)}
                                className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-md text-[14px] hover:bg-brand-hover"
                            >
                                Save Generic Material
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Brand Modal */}
            {showAddBrandModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-[18px] font-[600] text-fg mb-4">Add New Brand</h3>
                        <p className="text-[14px] text-fg-secondary mb-4">Generic: <span className="font-[500]">{generics.find(g => g.id === parseInt(formData.genericId))?.name}</span></p>
                        <input
                            type="text"
                            placeholder="e.g., Prima, Pelwatte"
                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg mb-4"
                            id="new-brand-name"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddBrandModal(false)}
                                className="flex-1 px-4 py-2.5 border border-line text-fg rounded-md text-[14px]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAddBrand(document.getElementById('new-brand-name').value)}
                                className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-md text-[14px]"
                            >
                                Save
                            </button>
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
            {/* Edit Category Modal */}
            {showEditCategoryModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-backdrop">
                    <div className="bg-elevated rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                            <h3 className="text-[18px] font-[600] text-fg-strong">Edit Category</h3>
                            <button aria-label="Close" onClick={() => setShowEditCategoryModal(false)} className="text-fg-muted hover:text-fg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-[14px] font-[500] text-fg mb-1">
                                Category Name <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                placeholder="Enter category name"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-subtle border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowEditCategoryModal(false)}
                                className="px-4 py-2 text-[14px] font-[500] text-fg bg-surface border border-line rounded-lg hover:bg-subtle transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateCategory}
                                className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-warning-solid rounded-lg hover:bg-warning-solid transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Generic Material Modal */}
            {showEditGenericModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-backdrop">
                    <div className="bg-elevated rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                            <h3 className="text-[18px] font-[600] text-fg-strong">Edit Generic Material</h3>
                            <button aria-label="Close" onClick={() => setShowEditGenericModal(false)} className="text-fg-muted hover:text-fg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">
                                    Generic Material Name <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editGenericName}
                                    onChange={(e) => setEditGenericName(e.target.value)}
                                    className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                    placeholder="Enter generic material name"
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">
                                    Category <span className="text-error">*</span>
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                    value={editGenericCategory}
                                    onChange={(e) => setEditGenericCategory(e.target.value)}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id || cat.name || cat} value={cat.name || cat}>{cat.name || cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[14px] font-[500] text-fg mb-1">
                                    Unit of Measure
                                </label>
                                <select 
                                    className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                    value={editGenericUom}
                                    onChange={(e) => setEditGenericUom(e.target.value)}
                                >
                                    {['kg', 'L', 'pack', 'units', 'pieces', 'g', 'ml', 'box', 'sack', 'bottle', 'can', 'packet'].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {editGenericUom === 'pack' && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-subtle rounded-md border border-line">
                                    <div>
                                        <label className="block text-[12px] font-[500] text-fg mb-1">Pack Size *</label>
                                        <input
                                            type="number"
                                            value={editGenericPackSize}
                                            onChange={(e) => setEditGenericPackSize(e.target.value)}
                                            placeholder="e.g., 25"
                                            className="w-full px-3 py-2 border border-line rounded-md text-[13px] focus:outline-none focus:border-warning"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-[500] text-fg mb-1">Pack Unit *</label>
                                        <select
                                            value={editGenericPackUnit}
                                            onChange={(e) => setEditGenericPackUnit(e.target.value)}
                                            className="w-full px-3 py-2 border border-line rounded-md text-[13px] focus:outline-none focus:border-warning"
                                        >
                                            {['kg', 'L', 'pieces'].map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">Min Stock Level</label>
                                    <input
                                        type="number"
                                        value={editGenericMinStock}
                                        onChange={(e) => setEditGenericMinStock(e.target.value)}
                                        placeholder="Min"
                                        className="w-full px-4 py-2 border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">Max Stock Level</label>
                                    <input
                                        type="number"
                                        value={editGenericMaxStock}
                                        onChange={(e) => setEditGenericMaxStock(e.target.value)}
                                        placeholder="Max"
                                        className="w-full px-4 py-2 border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-subtle border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowEditGenericModal(false)}
                                className="px-4 py-2 text-[14px] font-[500] text-fg bg-surface border border-line rounded-lg hover:bg-subtle transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateGeneric}
                                className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-warning-solid rounded-lg hover:bg-warning-solid transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Brand Modal */}
            {showEditBrandModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-backdrop">
                    <div className="bg-elevated rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                            <h3 className="text-[18px] font-[600] text-fg-strong">Edit Brand</h3>
                            <button aria-label="Close" onClick={() => setShowEditBrandModal(false)} className="text-fg-muted hover:text-fg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-[14px] font-[500] text-fg mb-1">
                                Brand Name <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                value={editBrandName}
                                onChange={(e) => setEditBrandName(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                placeholder="Enter brand name"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-subtle border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowEditBrandModal(false)}
                                className="px-4 py-2 text-[14px] font-[500] text-fg bg-surface border border-line rounded-lg hover:bg-subtle transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateBrand}
                                className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-warning-solid rounded-lg hover:bg-warning-solid transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
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
