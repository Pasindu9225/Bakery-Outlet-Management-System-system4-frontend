import React, { useState, useEffect, useMemo } from "react";
import { friendlyError } from "../utils/friendlyError";
import { confirmDialog } from "../component/ConfirmDialog";
import { Package, Search, Edit, Trash2, X, Check, Plus, Tag, DollarSign, FileText, Building2, Calendar, Download } from "lucide-react";
import toast from "react-hot-toast";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import rawMaterialService from "../services/rawMaterialService";
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

export default function AdminManageProducts() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Manage Products');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [stageFilter, setStageFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryId, setEditCategoryId] = useState(null);
    const [showEditStageModal, setShowEditStageModal] = useState(false);
    const [editStageName, setEditStageName] = useState('');
    const [editStageId, setEditStageId] = useState(null);
    const [showAddBrand, setShowAddBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [brands, setBrands] = useState([]);
    // Production Stage States
    const [showAddStage, setShowAddStage] = useState(false);
    const [newStageName, setNewStageName] = useState('');
    const [productionStages, setProductionStages] = useState([]);

    const [productionCenters, setProductionCenters] = useState([]);

    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                //${process.env.REACT_APP_BASE_URL}
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/product/all`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    const formattedProducts = data.map(item => ({
                        id: item.id,
                        code: item.productCode,
                        GBmargin: item.gbMargin || 0,
                        name: item.productName,
                        productionStage: item.productionStageName,
                        category: item.categoryName,
                        brand: item.brand || '',
                        description: item.description,
                        unitPrice: item.unitPrice || 0,
                        sellingPrice: item.salePrice || 0,
                        actualGP: item.actualGP || 0,
                        maxStockLevel: item.maxOrderQty || 0,
                        minStockLevel: item.minOrderQty || 0,
                        unitOfMeasure: item.unitOfMeasure || '',
                        productionCenter: item.productionCenterName,
                        active: item.isActive,
                        vatIncluded: item.vatStatus || false,
                        isKotEnabled: item.isKotEnabled || false,
                        shelfLifeDays: item.shelfLifeDays
                    }));
                    setProducts(formattedProducts);
                } else {
                    console.error('Failed to fetch products');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            const uniqueBrands = [...new Set(products.map(p => p.brand).filter(b => b))];
            setBrands(uniqueBrands);
        }
    }, [products]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/categories`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                } else {
                    console.error('Failed to fetch categories');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        const fetchProductionStages = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-stages`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    setProductionStages(data);
                } else {
                    console.error('Failed to fetch production stages');
                }
            } catch (error) {
                console.error('Error fetching production stages:', error);
            }
        };

        const fetchProductionCenters = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-centers`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    setProductionCenters(data);
                } else {
                    console.error('Failed to fetch production centers');
                }
            } catch (error) {
                console.error('Error fetching production centers:', error);
            }
        };

        fetchCategories();
        fetchProductionStages();
        fetchProductionCenters();
    }, []);

    const [formData, setFormData] = useState({
        code: '',
        GBmargin: '',
        name: '',
        category: '',
        brand: '',
        productionStage: '',
        description: '',
        unitPrice: '',
        sellingPrice: '',
        minStockLevel: '',
        maxStockLevel: '',
        unitOfMeasure: '',
        productionCenter: '',
        active: true,
        vatIncluded: false,
        isKotEnabled: false,
        shelfLifeDays: ''
    });

    const suggestedProductCode = useMemo(
        () => suggestNextCode(products.map((p) => p.code), formData.code),
        [products, formData.code]
    );
    const showProductCodeGhost = !isEditMode && suggestedProductCode
        && suggestedProductCode.toUpperCase().startsWith(formData.code.toUpperCase())
        && suggestedProductCode.length > formData.code.length;

    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAddCategory = async () => {
        const trimmedCategory = newCategoryName.trim();

        if (!trimmedCategory) {
            return; // Don't add empty categories
        }

        // Check if category already exists (case-insensitive)
        if (categories.some(cat => {
            const catName = typeof cat === 'object' && cat !== null ? (cat.name || cat.categoryName || '') : cat;
            return catName?.toString().toLowerCase() === trimmedCategory.toLowerCase();
        })) {
            toast.error('This category already exists!');
            return;
        }

        try {
            const data = await rawMaterialService.createCategory(trimmedCategory);
            // Add new category
            setCategories([...categories, data]);

            // Set it as selected
            setFormData(prev => ({
                ...prev,
                category: data.name || data.categoryName || trimmedCategory
            }));

            // Reset add category mode
            setShowAddCategory(false);
            setNewCategoryName('');
            setToastMessage('Category added successfully.');
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

            // Update categories list in state
            setCategories(categories.map(c => c.id === editCategoryId ? data : c));

            // Update current form selection if the edited category was selected
            const currentSelectedCategoryName = typeof formData.category === 'object' && formData.category !== null 
                ? (formData.category.name || formData.category.categoryName)
                : formData.category;
            
            const oldCategoryName = (categories.find(c => (typeof c === 'object' && c !== null ? c.id : null) === editCategoryId)?.name) 
                || (categories.find(c => (typeof c === 'object' && c !== null ? c.id : null) === editCategoryId)?.categoryName);

            if (currentSelectedCategoryName === oldCategoryName) {
                setFormData(prev => ({ ...prev, category: updatedName }));
            }

            // Update category name of products in table
            setProducts(products.map(p => p.category === oldCategoryName ? { ...p, category: updatedName } : p));

            setShowEditCategoryModal(false);
            setToastMessage('Category updated successfully.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error(friendlyError(error, { fallback: "Failed to update category" }));
        }
    };

    const handleAddBrand = () => {
        const trimmedBrand = newBrandName.trim();

        if (!trimmedBrand) {
            return; // Don't add empty brands
        }

        // Check if brand already exists (case-insensitive)
        if (brands.some(b => {
            const brandName = typeof b === 'object' && b !== null ? (b.name || '') : b;
            return brandName?.toString().toLowerCase() === trimmedBrand.toLowerCase();
        })) {
            toast.error('This brand already exists!');
            return;
        }

        // Add new brand
        setBrands([...brands, trimmedBrand]);

        // Set it as selected
        setFormData(prev => ({
            ...prev,
            brand: trimmedBrand
        }));

        // Reset add brand mode
        setShowAddBrand(false);
        setNewBrandName('');
    };

    const handleAddStage = async () => {
        const trimmedStage = newStageName.trim();

        if (!trimmedStage) return;

        if (productionStages.some(stage => {
            const stageName = typeof stage === 'object' && stage !== null ? (stage.productionStage || '') : stage;
            return stageName?.toString().toLowerCase() === trimmedStage.toLowerCase();
        })) {
            toast.error('This production stage already exists!');
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-stages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name: trimmedStage }),
            });

            if (response.ok) {
                const data = await response.json();
                setProductionStages([...productionStages, data]);

                setFormData(prev => ({
                    ...prev,
                    productionStage: data.productionStage || trimmedStage
                }));

                setShowAddStage(false);
                setNewStageName('');
                setToastMessage('Production stage added successfully.');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                const errText = await response.text();
                toast.error(errText || 'Failed to add production stage');
            }
        } catch (error) {
            console.error('Error adding production stage:', error);
            toast.error(friendlyError(error, { fallback: "Failed to add production stage" }));
        }
    };

    const handleUpdateStage = async () => {
        if (!editStageName.trim()) return;
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${process.env.REACT_APP_BASE_URL || ''}/api/v1/admin/product/production-stages/${editStageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name: editStageName.trim() }),
            });

            if (response.ok) {
                const data = await response.json();
                const updatedName = data.productionStage;

                // Update production stages list in state
                setProductionStages(productionStages.map(s => s.id === editStageId ? data : s));

                // Update current form selection if the edited stage was selected
                const currentSelectedStageName = typeof formData.productionStage === 'object' && formData.productionStage !== null 
                    ? formData.productionStage.productionStage
                    : formData.productionStage;
                
                const oldStageName = productionStages.find(s => (typeof s === 'object' && s !== null ? s.id : null) === editStageId)?.productionStage;

                if (currentSelectedStageName === oldStageName) {
                    setFormData(prev => ({ ...prev, productionStage: updatedName }));
                }

                // Update production stage name of products in table
                setProducts(products.map(p => p.productionStage === oldStageName ? { ...p, productionStage: updatedName } : p));

                setShowEditStageModal(false);
                setToastMessage('Production stage updated successfully.');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                const errText = await response.text();
                toast.error(errText || 'Failed to update production stage');
            }
        } catch (error) {
            console.error('Error updating production stage:', error);
            toast.error(friendlyError(error, { fallback: "Failed to update production stage" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Product Code is required';
        }




        if (!formData.productionStage) {
            newErrors.productionStage = 'Production Stage is required';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.brand) {
            newErrors.brand = 'Brand is required';
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Product Name is required';
        }

        // if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
        //     newErrors.unitPrice = 'Valid Unit Price is required';
        // }

        // if (!formData.GBmargin || parseFloat(formData.GBmargin) <= 0) {
        //     newErrors.GBmargin = 'Valid GB Margin is required';
        // }

        if (formData.shelfLifeDays && (isNaN(formData.shelfLifeDays) || parseInt(formData.shelfLifeDays) < 0)) {
            newErrors.shelfLifeDays = 'Shelf Life must be a positive integer';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const parseFetchError = async (response, fallbackMsg) => {
        try {
            let msg = fallbackMsg;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                if (errorData.fieldErrors && typeof errorData.fieldErrors === 'object') {
                    const errors = Object.entries(errorData.fieldErrors)
                        .map(([field, m]) => {
                            const formattedField = field
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase());
                            return `${formattedField}: ${m}`;
                        })
                        .join('\n');
                    msg = `Validation failed:\n${errors}`;
                } else {
                    msg = errorData.message || errorData.error || fallbackMsg;
                }
            } else {
                const text = await response.text();
                msg = text || response.statusText || fallbackMsg;
            }

            if (msg.includes('Duplicate entry') || msg.includes('UK922x4t23nx64422orei4meb2y')) {
                return 'Product Code already exists! Please enter a unique Product Code.';
            }
            return msg;
        } catch (e) {
            return fallbackMsg;
        }
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            if (isEditMode) {
                try {
                    const selectedCenter = productionCenters.find(c => (typeof c === 'object' && c !== null ? c.centerName : c) === formData.productionCenter);
                    const selectedStage = productionStages.find(s => (typeof s === 'object' && s !== null ? s.productionStage : s) === formData.productionStage);
                    const payload = {
                        productName: formData.name,
                        productCode: formData.code,
                        description: formData.description,
                        category: formData.category,
                        brand: formData.brand,
                        unitPrice: parseFloat(formData.unitPrice) || 0.0,
                        salePrice: parseFloat(formData.sellingPrice) || 0.0,
                        gbMargin: parseFloat(formData.GBmargin) || 0.0,
                        actualGP: 0.0,
                        vatStatus: formData.vatIncluded,
                        isActive: formData.active,
                        isKotEnabled: formData.isKotEnabled,
                        productionCenterId: selectedCenter ? selectedCenter.id : null,
                        productionStageId: selectedStage ? selectedStage.id : null,
                        maxOrderQty: parseFloat(formData.maxStockLevel) || 0.0,
                        minOrderQty: parseFloat(formData.minStockLevel) || 0.0,
                        unitOfMeasure: formData.unitOfMeasure,
                        shelfLifeDays: parseInt(formData.shelfLifeDays) || 0
                    };
                    //${process.env.REACT_APP_BASE_URL}
                    const token = localStorage.getItem("authToken");
                    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/product/${editingProductId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        const updatedProduct = await response.json();
                        setProducts(products.map(product =>
                            product.id === editingProductId
                                ? {
                                    ...product,
                                    code: updatedProduct.productCode,
                                    name: updatedProduct.productName,
                                    productionStage: updatedProduct.productionStageName,
                                    category: updatedProduct.categoryName,
                                    brand: updatedProduct.brand,
                                    description: updatedProduct.description,
                                    unitPrice: updatedProduct.unitPrice,
                                    sellingPrice: updatedProduct.salePrice,
                                    maxStockLevel: updatedProduct.maxOrderQty,
                                    minStockLevel: updatedProduct.minOrderQty,
                                    unitOfMeasure: updatedProduct.unitOfMeasure,
                                    GBmargin: updatedProduct.gbMargin,
                                    productionCenter: updatedProduct.productionCenterName,
                                    active: updatedProduct.isActive,
                                    vatIncluded: updatedProduct.vatStatus,
                                    isKotEnabled: updatedProduct.isKotEnabled,
                                    shelfLifeDays: updatedProduct.shelfLifeDays
                                }
                                : product
                        ));
                        setToastMessage('Product updated successfully.');
                        setShowToast(true);
                        setShowModal(false);
                        resetForm();
                        setTimeout(() => setShowToast(false), 3000);
                    } else {
                        const errorMsg = await parseFetchError(response, "Failed to update product.");
                        console.error("Failed to update product:", errorMsg);
                        toast.error(errorMsg);
                    }
                } catch (error) {
                    console.error("Error updating product:", error);
                    toast.error("Error updating product. Please check console.");
                }
            } else {
                try {
                    const selectedCenter = productionCenters.find(c => (typeof c === 'object' && c !== null ? c.centerName : c) === formData.productionCenter);
                    const selectedStage = productionStages.find(s => (typeof s === 'object' && s !== null ? s.productionStage : s) === formData.productionStage);
                    const payload = {
                        productName: formData.name,
                        productCode: formData.code,
                        description: formData.description,
                        category: formData.category,
                        brand: formData.brand,
                        unitPrice: parseFloat(formData.unitPrice) || 0.0,
                        salePrice: parseFloat(formData.sellingPrice) || 0.0,
                        gbMargin: parseFloat(formData.GBmargin) || 0.0,
                        actualGP: 0.0,
                        vatStatus: formData.vatIncluded,
                        isActive: formData.active,
                        isKotEnabled: formData.isKotEnabled,
                        productionCenterId: selectedCenter ? selectedCenter.id : null,
                        productionStageId: selectedStage ? selectedStage.id : null,
                        maxOrderQty: parseFloat(formData.maxStockLevel) || 0.0,
                        minOrderQty: parseFloat(formData.minStockLevel) || 0.0,
                        unitOfMeasure: formData.unitOfMeasure,
                        shelfLifeDays: parseInt(formData.shelfLifeDays) || 0
                    };
                    //${process.env.REACT_APP_BASE_URL}
                    const token = localStorage.getItem("authToken");
                    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/product/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        const savedProduct = await response.json();
                        const newProduct = {
                            id: savedProduct.id,
                            code: savedProduct.productCode,
                            GBmargin: savedProduct.gbMargin || 0,
                            name: savedProduct.productName,
                            category: savedProduct.categoryName,
                            brand: savedProduct.brand || '',
                            description: savedProduct.description,
                            unitPrice: savedProduct.unitPrice,
                            sellingPrice: savedProduct.salePrice,
                            maxStockLevel: savedProduct.maxOrderQty,
                            minStockLevel: savedProduct.minOrderQty,
                            unitOfMeasure: savedProduct.unitOfMeasure,
                            productionCenter: savedProduct.productionCenterName,
                            productionStage: savedProduct.productionStageName,
                            active: savedProduct.isActive,
                            vatIncluded: savedProduct.vatStatus || false,
                            isKotEnabled: savedProduct.isKotEnabled || false,
                            shelfLifeDays: savedProduct.shelfLifeDays
                        };
                        setProducts([...products, newProduct]);
                        setToastMessage('Product added successfully.');
                        setShowToast(true);
                        setShowModal(false);
                        resetForm();
                        setTimeout(() => setShowToast(false), 3000);
                    } else {
                        const errorMsg = await parseFetchError(response, "Failed to create product.");
                        console.error("Failed to create product:", errorMsg);
                        toast.error(errorMsg);
                    }
                } catch (error) {
                    console.error("Error creating product:", error);
                    toast.error("Error creating product. Please check console.");
                }
            }
        }
    };

    const handleEdit = (product) => {
        setIsEditMode(true);
        setEditingProductId(product.id);
        setFormData({
            code: product.code,
            GBmargin: product.GBmargin.toString(),
            name: product.name,
            category: product.category,
            brand: product.brand,
            productionStage: product.productionStage || '',
            description: product.description,
            unitPrice: product.unitPrice.toString(),
            sellingPrice: product.sellingPrice ? product.sellingPrice.toString() : '0.00',
            maxStockLevel: product.maxStockLevel ? product.maxStockLevel.toString() : '0',
            minStockLevel: product.minStockLevel ? product.minStockLevel.toString() : '0',
            unitOfMeasure: product.unitOfMeasure || '',
            productionCenter: product.productionCenter,
            active: product.active,
            vatIncluded: product.vatIncluded,
            isKotEnabled: product.isKotEnabled || false,
            shelfLifeDays: product.shelfLifeDays ? product.shelfLifeDays.toString() : ''
        });
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingProductId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            GBmargin: '',
            name: '',
            category: '',
            brand: '',
            productionStage: '',
            description: '',
            unitPrice: '',
            sellingPrice: '',
            minStockLevel: '',
            maxStockLevel: '',
            unitOfMeasure: '',
            productionCenter: '',
            active: true,
            vatIncluded: false,
            isKotEnabled: false,
            shelfLifeDays: ''
        });
        setErrors({});
        setShowAddCategory(false);
        setNewCategoryName('');
        setShowAddBrand(false);
        setNewBrandName('');
        setShowAddStage(false);
        setNewStageName('');
        setShowEditCategoryModal(false);
        setEditCategoryName('');
        setEditCategoryId(null);
        setShowEditStageModal(false);
        setEditStageName('');
        setEditStageId(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingProductId(null);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('Are you sure you want to delete this product?', { confirmText: "Delete", danger: true })) {
            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/product/${id}`, {
                    method: 'DELETE',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (response.ok) {
                    setProducts(products.filter(product => product.id !== id));
                    setToastMessage('Product deleted successfully.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                } else {
                    const errorMsg = await parseFetchError(response, "Failed to delete product. Please try again.");
                    console.error("Failed to delete product:", errorMsg);
                    toast.error(errorMsg);
                }
            } catch (error) {
                console.error("Error deleting product:", error);
                toast.error("Error deleting product. Please check console.");
            }
        }
    };

    const getFilteredProducts = () => {
        let filtered = products;

        // Apply search filter
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(product =>
                (product.name || '').toLowerCase().includes(lowSearch) ||
                (product.code || '').toLowerCase().includes(lowSearch) ||
                (product.category || '').toLowerCase().includes(lowSearch) ||
                (product.productionCenter || '').toLowerCase().includes(lowSearch)
            );
        }

        // Apply category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }

        // Apply production stage filter
        if (stageFilter !== 'All') {
            filtered = filtered.filter(product => product.productionStage === stageFilter);
        }

        // Apply status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(product =>
                statusFilter === 'Active' ? product.active : !product.active
            );
        }

        return filtered;
    };

    const getFilteredModalCategories = () => {
        if (!formData.productionStage) {
            return categories;
        }

        const selectedStage = formData.productionStage.trim().toLowerCase();

        // Collect category names used by products matching this production stage
        const stageCategoriesFromProducts = new Set(
            products
                .filter(p => p.productionStage && p.productionStage.trim().toLowerCase() === selectedStage)
                .map(p => typeof p.category === 'object' && p.category !== null ? (p.category.name || p.category.categoryName) : p.category)
                .filter(Boolean)
        );

        const rawMaterialKeywords = [
            'ingredient', 'packaging', 'equipment', 'spices', 'oils', 'dry items',
            'meats', 'dairy', 'eggs', 'raw'
        ];
        const doughKeywords = ['dough'];
        const fillingKeywords = ['filling', 'curry', 'sambol'];

        const filtered = categories.filter(cat => {
            const catName = (typeof cat === 'object' && cat !== null ? (cat.name || cat.categoryName || '') : cat).toString();
            if (!catName) return false;

            const catLower = catName.toLowerCase();

            // Include if explicitly used by existing products in this stage
            if (stageCategoriesFromProducts.has(catName)) {
                return true;
            }

            if (selectedStage.includes('finish') && !selectedStage.includes('semi')) {
                // "Finished" stage should NOT show Raw Material, Dough, or Filling categories
                const isRaw = rawMaterialKeywords.some(kw => catLower.includes(kw));
                const isDough = doughKeywords.some(kw => catLower.includes(kw));
                const isFilling = fillingKeywords.some(kw => catLower.includes(kw));
                return !isRaw && !isDough && !isFilling;
            } else if (selectedStage.includes('dough')) {
                return doughKeywords.some(kw => catLower.includes(kw));
            } else if (selectedStage.includes('fill')) {
                return fillingKeywords.some(kw => catLower.includes(kw));
            } else if (selectedStage.includes('semi')) {
                const isDoughOrFilling = doughKeywords.some(kw => catLower.includes(kw)) || fillingKeywords.some(kw => catLower.includes(kw));
                const isRaw = rawMaterialKeywords.some(kw => catLower.includes(kw));
                return isDoughOrFilling || !isRaw;
            }

            return true;
        });

        return filtered.length > 0 ? filtered : categories;
    };

    const filteredProducts = getFilteredProducts();

    const handleExportExcel = () => {
        const rows = filteredProducts.map(p => ({
            "Product Code": p.code,
            "Product Name": p.name,
            "Production Stage": p.productionStage,
            "Category": p.category,
            "Brand": p.brand,
            "Unit Price (Rs.)": p.unitPrice,
            "Selling Price (Rs.)": p.sellingPrice,
            "Expected GP (%)": p.GBmargin,
            "Actual GP (%)": p.actualGP,
            "Unit of Measure": p.unitOfMeasure,
            "Min Stock Level": p.minStockLevel,
            "Max Stock Level": p.maxStockLevel,
            "Shelf Life (Days)": p.shelfLifeDays,
            "Production Center": p.productionCenter,
            "VAT Included": p.vatIncluded ? "Yes" : "No",
            "KOT Required": p.isKotEnabled ? "Yes" : "No",
            "Status": p.active ? "Active" : "Inactive",
        }));
        exportToExcel(rows, `Products_${new Date().toISOString().slice(0, 10)}`, "Products");
    };

    // Get unique categories from products
    const uniqueCategories = [...new Set(products.map(p => p.category))].sort();

    const getCategoryColor = (category) => {
        const colors = {
            'Bread': 'bg-warning/20 text-warning',
            'Bun': 'bg-line text-brand-fg',
            'Pastry': 'bg-hover text-error',
            'Cake': 'bg-hover text-plum',
            'Cookie': 'bg-warning/20 text-warning',
            'Other': 'bg-hover text-fg'
        };
        return colors[category] || colors['Other'];
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
                            Product Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            Add, edit, and manage product details
                        </p>
                    </div>

                    {/* Product List Table */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Product List</h3>
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
                                    Add New Product
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        {/* Search + Filters Section */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">

                            {/* Search Bar */}
                            <div className="flex-1 min-w-[250px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by product name, code, category, or production center..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3">
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
                                    value={stageFilter}
                                    onChange={(e) => setStageFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                                >
                                    <option value="All">All Stages</option>
                                    {productionStages.map((stage) => {
                                        const stageName = typeof stage === 'object' && stage !== null ? stage.productionStage : stage;
                                        const stageId = typeof stage === 'object' && stage !== null ? stage.id : stage;
                                        return <option key={stageId} value={stageName}>{stageName}</option>
                                    })}
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


                        {/* Products Table */}
                        {filteredProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-line">
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Code
                                            </th>

                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Product Name
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Production Stage
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Category
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Brand
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Cost
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Selling Price
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Expected GP
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Actual GP
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Shelf Life
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Production Center
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Status
                                            </th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-fg">
                                                VAT
                                            </th>
                                            <th className="text-center py-4 text-[14px] font-[500] text-fg">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-subtle transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-[500] text-fg-secondary">
                                                            {product.code}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-hover rounded-full flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-brand-fg" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-[600] text-fg">
                                                                {product.name}
                                                            </p>
                                                            {product.description && (
                                                                <p className="text-[12px] text-fg-secondary max-w-xs truncate">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-[14px] text-fg">
                                                        {product.productionStage}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] text-fg`}>
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] text-fg`}>
                                                        {product.brand}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        Rs. {(product.unitPrice || 0).toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-brand-fg">
                                                        Rs. {(product.sellingPrice || 0).toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[500] text-fg-secondary">
                                                        {(product.GBmargin || 0).toFixed(2)}%
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className={`text-[14px] font-[700] ${product.actualGP > 0 ? 'text-success' : 'text-error'}`}>
                                                        {(product.actualGP || 0).toFixed(2)}%
                                                    </p>
                                                </td>
                                                <td className="py-4 text-[14px] text-fg">
                                                    {product.shelfLifeDays ? `${product.shelfLifeDays} days` : '-'}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-fg-secondary" />
                                                        <span className="text-[14px] text-fg">
                                                            {product.productionCenter}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] ${product.active
                                                        ? 'bg-line text-success'
                                                        : 'bg-hover text-error'
                                                        }`}>
                                                        {product.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center">
                                                        {product.vatIncluded ? (
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
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete Product"
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
                                <p className="text-[16px] font-[500] text-fg mb-2">No products found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm
                                        ? "Try adjusting your search criteria"
                                        : "Click 'Add New Product' to add your first product"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Product Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    {isEditMode ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update product information'
                                        : 'Fill in the details to add a new product'
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
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                                    {/* Production Stage */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Production Stage <span className="text-error">*</span>
                                        </label>

                                        {!showAddStage ? (
                                            <div className="flex gap-2">
                                                <select
                                                    name="productionStage"
                                                    value={formData.productionStage}
                                                    onChange={handleChange}
                                                    className={`flex-1 px-4 py-2.5 border rounded-md text-[14px]
                focus:outline-none focus:ring-2 focus:ring-brand-fg
                ${errors.productionStage ? 'border-error' : 'border-line'}`}
                                                >
                                                    <option value="">Select stage</option>
                                                    {productionStages.map(stage => {
                                                        const stageName = typeof stage === 'object' && stage !== null ? stage.productionStage : stage;
                                                        const stageId = typeof stage === 'object' && stage !== null ? (stage.id || stageName) : stage;
                                                        return <option key={stageId} value={stageName}>{stageName}</option>
                                                    })}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const stageObj = productionStages.find(s => (typeof s === 'object' && s !== null ? s.productionStage : s) === formData.productionStage);
                                                        if (stageObj && stageObj.id) {
                                                            setEditStageId(stageObj.id);
                                                            setEditStageName(stageObj.productionStage);
                                                            setShowEditStageModal(true);
                                                        } else {
                                                            toast.error("Cannot edit this production stage as it has no ID.");
                                                        }
                                                    }}
                                                    disabled={!formData.productionStage}
                                                    className={`px-3 py-2.5 border rounded-md transition-colors ${formData.productionStage ? 'border-warning text-warning hover:bg-hover' : 'border-line text-fg-muted cursor-not-allowed'}`}
                                                    title="Edit selected stage"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button aria-label="Increase quantity"
                                                    type="button"
                                                    onClick={() => setShowAddStage(true)}
                                                    className="px-3 py-2.5 border border-brand-fg
                text-brand-fg rounded-md hover:bg-hover"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newStageName}
                                                    onChange={(e) => setNewStageName(e.target.value)}
                                                    placeholder="Enter new stage"
                                                    className="flex-1 px-4 py-2.5 border border-line
                rounded-md text-[14px]"
                                                />
                                                <button aria-label="Close"
                                                    type="button"
                                                    onClick={() => setShowAddStage(false)}
                                                    className="px-3 py-2.5 border border-line"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button aria-label="Confirm"
                                                    type="button"
                                                    onClick={handleAddStage}
                                                    className="px-3 py-2.5 bg-brand text-on-brand rounded-md"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {errors.productionStage && (
                                            <p className="text-error text-[12px] mt-1">
                                                {errors.productionStage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Category <span className="text-error">*</span>
                                        </label>
                                        {!showAddCategory ? (
                                            <div className="flex gap-2">
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className={`flex-1 px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.category ? 'border-error' : 'border-line'
                                                        }`}
                                                >
                                                    <option value="">Select category</option>
                                                    {getFilteredModalCategories().map(cat => (
                                                        <option key={typeof cat === 'object' && cat !== null ? (cat.id || cat.name || cat.categoryName) : cat} value={typeof cat === 'object' && cat !== null ? (cat.name || cat.categoryName) : cat}>
                                                            {typeof cat === 'object' && cat !== null ? (cat.name || cat.categoryName) : cat}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const catObj = categories.find(c => (typeof c === 'object' && c !== null ? (c.name || c.categoryName) : c) === formData.category);
                                                        if (catObj && catObj.id) {
                                                            setEditCategoryId(catObj.id);
                                                            setEditCategoryName(catObj.name || catObj.categoryName);
                                                            setShowEditCategoryModal(true);
                                                        } else {
                                                            toast.error("Cannot edit this category as it has no ID.");
                                                        }
                                                    }}
                                                    disabled={!formData.category}
                                                    className={`px-3 py-2.5 border rounded-md transition-colors ${formData.category ? 'border-warning text-warning hover:bg-hover' : 'border-line text-fg-muted cursor-not-allowed'}`}
                                                    title="Edit selected category"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddCategory(true)}
                                                    className="px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors flex items-center gap-1"
                                                    title="Add new category"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Enter new category name"
                                                        className="flex-1 px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCategory();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowAddCategory(false);
                                                            setNewCategoryName('');
                                                        }}
                                                        className="px-3 py-2.5 border border-line text-fg-secondary rounded-md hover:bg-subtle transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCategory}
                                                        className="px-3 py-2.5 bg-brand text-on-brand rounded-md hover:bg-brand-hover transition-colors"
                                                        title="Save category"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-[12px] text-fg-secondary">
                                                    Press Enter or click check to add category
                                                </p>
                                            </div>
                                        )}
                                        {errors.category && (
                                            <p className="text-error text-[12px] mt-1">{errors.category}</p>
                                        )}
                                    </div>

                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Product Name <span className="text-error">*</span>
                                        </label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Enter product name"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.name ? 'border-error' : 'border-line'
                                                    }`}
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-error text-[12px] mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Brand */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Brand <span className="text-error">*</span>
                                        </label>
                                        {!showAddBrand ? (
                                            <div className="flex gap-2">
                                                <select
                                                    name="brand"
                                                    value={formData.brand}
                                                    onChange={handleChange}
                                                    className={`flex-1 px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.brand ? 'border-error' : 'border-line'
                                                        }`}
                                                >
                                                    <option value="">Select brand</option>
                                                    {brands.map(brand => (
                                                        <option key={brand} value={brand}>{brand}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddBrand(true)}
                                                    className="px-3 py-2.5 border border-brand-fg text-brand-fg rounded-md hover:bg-hover transition-colors flex items-center gap-1"
                                                    title="Add new brand"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newBrandName}
                                                        onChange={(e) => setNewBrandName(e.target.value)}
                                                        placeholder="Enter new brand name"
                                                        className="flex-1 px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddBrand();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowAddBrand(false);
                                                            setNewBrandName('');
                                                        }}
                                                        className="px-3 py-2.5 border border-line text-fg-secondary rounded-md hover:bg-subtle transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddBrand}
                                                        className="px-3 py-2.5 bg-brand text-on-brand rounded-md hover:bg-brand-hover transition-colors"
                                                        title="Save brand"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-[12px] text-fg-secondary">
                                                    Press Enter or click check to add brand
                                                </p>
                                            </div>
                                        )}
                                        {errors.brand && (
                                            <p className="text-error text-[12px] mt-1">{errors.brand}</p>
                                        )}
                                    </div>

                                    {/* Product Code */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Product Code <span className="text-error">*</span>
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary z-10" />
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                onKeyDown={(e) => {
                                                    if ((e.key === 'Tab' || e.key === 'ArrowRight') && !isEditMode
                                                        && suggestedProductCode && suggestedProductCode.length > formData.code.length
                                                        && e.currentTarget.selectionStart === formData.code.length) {
                                                        e.preventDefault();
                                                        setFormData((prev) => ({ ...prev, code: suggestedProductCode }));
                                                    }
                                                }}
                                                placeholder={showProductCodeGhost ? '' : "Enter product code (e.g., P-001)"}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] bg-transparent relative z-10 focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.code ? 'border-error' : 'border-line'
                                                    }`}
                                            />
                                            {showProductCodeGhost && (
                                                <div className="absolute inset-0 flex items-center pl-10 pr-4 py-2.5 text-[14px] pointer-events-none whitespace-pre">
                                                    <span className="invisible">{formData.code}</span>
                                                    <span className="text-fg-muted">{suggestedProductCode.slice(formData.code.length)}</span>
                                                </div>
                                            )}
                                        </div>
                                        {errors.code && (
                                            <p className="text-error text-[12px] mt-1">{errors.code}</p>
                                        )}
                                    </div>


                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                                    {/* Production Center */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Production Center
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                            <select
                                                name="productionCenter"
                                                value={formData.productionCenter}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.productionCenter ? 'border-error' : 'border-line'
                                                    }`}
                                            >
                                                <option value="">Select production center</option>
                                                {productionCenters.map(center => (
                                                    <option key={center.id} value={center.centerName}>{center.centerName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.productionCenter && (
                                            <p className="text-error text-[12px] mt-1">{errors.productionCenter}</p>
                                        )}
                                    </div>


                                    {/* Unit Price */}
                                    {/* <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Unit Price (Rs.) <span className="text-error"></span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                value={formData.unitPrice}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className={`w-full pl-4 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.unitPrice ? 'border-error' : 'border-line'
                                                    }`}
                                            />
                                        </div>
                                        {errors.unitPrice && (
                                            <p className="text-error text-[12px] mt-1">{errors.unitPrice}</p>
                                        )}
                                    </div> */}

                                    {/* GP M Price */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Expected GP (%) <span className="text-error"></span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="GBmargin"
                                                value={formData.GBmargin}
                                                onChange={handleChange}
                                                placeholder="0"
                                                step="1"
                                                min="0"
                                                className={`w-full pl-4 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.GBmargin ? 'border-error' : 'border-line'
                                                    }`}
                                            />
                                        </div>
                                        {errors.GBmargin && (
                                            <p className="text-error text-[12px] mt-1">{errors.GBmargin}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Selling Price */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Selling Price (Rs.)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[14px] font-[500] text-fg-secondary select-none">Rs.</span>
                                            <input
                                                type="number"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleChange}
                                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                            />
                                        </div>
                                    </div>

                                    {/* Unit of Measure */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Unit of Measure
                                        </label>
                                        <select
                                            name="unitOfMeasure"
                                            value={formData.unitOfMeasure}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        >
                                            <option value="">Select Unit</option>
                                            <option value="Kg">Kg</option>
                                            <option value="L">L</option>
                                            <option value="Pack">Pack</option>
                                            <option value="Pieces">Pieces</option>
                                        </select>
                                    </div>

                                    {/* Minimum Stock Level */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Minimum Stock Level
                                        </label>
                                        <input
                                            type="number"
                                            name="minStockLevel"
                                            value={formData.minStockLevel}
                                            onChange={handleChange}
                                            placeholder="0"
                                            min="0"
                                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        />
                                    </div>

                                    {/* Maximum Stock Level */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Maximum Stock Level
                                        </label>
                                        <input
                                            type="number"
                                            name="maxStockLevel"
                                            value={formData.maxStockLevel}
                                            onChange={handleChange}
                                            placeholder="0"
                                            min="0"
                                            className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                        />
                                    </div>

                                    {/* Shelf Life */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Shelf Life (Days)
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                            <input
                                                type="number"
                                                name="shelfLifeDays"
                                                value={formData.shelfLifeDays}
                                                onChange={handleChange}
                                                placeholder="Enter days (e.g., 5)"
                                                min="0"
                                                step="1"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.shelfLifeDays ? 'border-error' : 'border-line'}`}
                                            />
                                        </div>
                                        {errors.shelfLifeDays && (
                                            <p className="text-error text-[12px] mt-1">{errors.shelfLifeDays}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Active Status */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Active Status <span className="text-error">*</span>
                                    </label>
                                    <select
                                        name="active"
                                        value={formData.active ? 'true' : 'false'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            active: e.target.value === 'true'
                                        }))}
                                        className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                    <p className="text-[12px] text-fg-secondary mt-1">
                                        Enable this product for production and sales
                                    </p>
                                </div>

                                {/* VAT Checkbox */}
                                <div>
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
                                                VAT Included in Price
                                            </p>
                                            {/* <p className="text-[12px] text-fg-secondary">
                Check this if the unit price already includes VAT (Value Added Tax). If unchecked, VAT will be calculated separately.
            </p> */}
                                        </div>
                                    </div>
                                </div>

                                {/* KOT Setting */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-3">
                                        KOT Settings
                                    </label>
                                    <div className="flex items-start gap-3 p-4 bg-subtle rounded-lg border border-line">
                                        <input
                                            type="checkbox"
                                            name="isKotEnabled"
                                            checked={formData.isKotEnabled}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                isKotEnabled: e.target.checked
                                            }))}
                                            className="w-5 h-5 text-brand-fg border-line rounded focus:ring-2 focus:ring-brand-fg mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <p className="text-[14px] font-[500] text-fg mb-1">
                                                KOT Preparation Required
                                            </p>
                                            <p className="text-[12px] text-fg-secondary">
                                                Enable this if the item needs to be sent to the kitchen.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Description */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Description
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-5 h-5 text-fg-secondary" />
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Enter product description"
                                            rows="3"
                                            className="w-full pl-10 pr-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg resize-none"
                                        />
                                    </div>
                                </div>


                            </div>

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
                                    {isEditMode ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </div>
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

            {/* Edit Stage Modal */}
            {showEditStageModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-backdrop">
                    <div className="bg-elevated rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                            <h3 className="text-[18px] font-[600] text-fg-strong">Edit Production Stage</h3>
                            <button aria-label="Close" onClick={() => setShowEditStageModal(false)} className="text-fg-muted hover:text-fg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-[14px] font-[500] text-fg mb-1">
                                Production Stage Name <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                value={editStageName}
                                onChange={(e) => setEditStageName(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-line rounded-lg text-[14px] focus:outline-none focus:border-warning"
                                placeholder="Enter stage name"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-subtle border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowEditStageModal(false)}
                                className="px-4 py-2 text-[14px] font-[500] text-fg bg-surface border border-line rounded-lg hover:bg-subtle transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateStage}
                                className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-warning-solid rounded-lg hover:bg-warning-solid transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-4 right-4 z-[10001] animate-fade-in">
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