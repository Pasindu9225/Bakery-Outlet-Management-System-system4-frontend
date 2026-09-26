import React, { useState } from "react";
import { confirmDialog } from "../component/ConfirmDialog";
import { BookOpen, Search, Edit, Trash2, X, Check, Plus, Package, DollarSign, Tag, Trash, PlusCircle } from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";

export default function AdminManageRecipes() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Manage Recipes');
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingRecipeId, setEditingRecipeId] = useState(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [statusFilter, setStatusFilter] = useState('All');

    // Available products
    const [availableproductionCenters] = useState([
        { id: 1, name: 'Sample 01' },
        { id: 2, name: 'Sample 02' },
        { id: 3, name: 'Sample 03' },
        { id: 4, name: 'Sample 04' },
        { id: 5, name: 'Sample 05' }
    ]);

    // Available raw materials
    const [availableMaterials] = useState([
        { id: 1, code: 'RM-001', name: 'Flour', unit: 'kg', costPerUnit: 200.00 },
        { id: 2, code: 'RM-002', name: 'Sugar', unit: 'kg', costPerUnit: 150.00 },
        { id: 3, code: 'RM-003', name: 'Yeast', unit: 'g', costPerUnit: 5.00 },
        { id: 4, code: 'RM-004', name: 'Salt', unit: 'kg', costPerUnit: 80.00 },
        { id: 5, code: 'RM-005', name: 'Butter', unit: 'kg', costPerUnit: 800.00 },
        { id: 6, code: 'RM-006', name: 'Milk', unit: 'L', costPerUnit: 250.00 },
        { id: 7, code: 'RM-007', name: 'Eggs', unit: 'unit', costPerUnit: 30.00 },
        { id: 8, code: 'RM-008', name: 'Vanilla Extract', unit: 'ml', costPerUnit: 10.00 },
        { id: 9, code: 'RM-009', name: 'Chocolate Chips', unit: 'kg', costPerUnit: 1200.00 },
        { id: 10, code: 'RM-010', name: 'Baking Powder', unit: 'g', costPerUnit: 3.00 }
    ]);

    const [recipes, setRecipes] = useState([
        {
            id: 1,
            name: 'Bread Dough',
            productionCenter: { id: 1, name: 'Sample 0' },
            version: 'v1.0',
            materials: [
                { id: 1, code: 'RM-001', name: 'Flour', unit: 'kg', qtyPerUnit: 0.5, costPerUnit: 200.00, totalCost: 100.00 },
                { id: 3, code: 'RM-003', name: 'Yeast', unit: 'g', qtyPerUnit: 10, costPerUnit: 5.00, totalCost: 50.00 },
                { id: 4, code: 'RM-004', name: 'Salt', unit: 'kg', qtyPerUnit: 0.02, costPerUnit: 80.00, totalCost: 1.60 }
            ],
            totalCostPerUnit: 151.60,
            active: true
        },
        {
            id: 2,
            name: 'Chocolate Bun Mix',
            productionCenter: { id: 2, name: 'Sample 0' },
            version: 'v1.0',
            materials: [
                { id: 1, code: 'RM-001', name: 'Flour', unit: 'kg', qtyPerUnit: 0.15, costPerUnit: 200.00, totalCost: 30.00 },
                { id: 2, code: 'RM-002', name: 'Sugar', unit: 'kg', qtyPerUnit: 0.05, costPerUnit: 150.00, totalCost: 7.50 },
                { id: 9, code: 'RM-009', name: 'Chocolate Chips', unit: 'kg', qtyPerUnit: 0.03, costPerUnit: 1200.00, totalCost: 36.00 }
            ],
            totalCostPerUnit: 73.50,
            active: true
        },
        {
            id: 3,
            name: 'Pastry Dough',
            productionCenter: { id: 3, name: 'Sample 0' },
            version: 'v2.0',
            materials: [
                { id: 1, code: 'RM-001', name: 'Flour', unit: 'kg', qtyPerUnit: 0.2, costPerUnit: 200.00, totalCost: 40.00 },
                { id: 5, code: 'RM-005', name: 'Butter', unit: 'kg', qtyPerUnit: 0.08, costPerUnit: 800.00, totalCost: 64.00 }
            ],
            totalCostPerUnit: 104.00,
            active: false
        }
    ]);

    const [formData, setFormData] = useState({
        name: '',
        productionCenterId: '',
        version: '',
        active: true,
        materials: []
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

    const handleAddMaterial = () => {
        setFormData(prev => ({
            ...prev,
            materials: [
                ...prev.materials,
                {
                    id: null,
                    code: '',
                    name: '',
                    unit: '',
                    qtyPerUnit: '',
                    costPerUnit: 0,
                    totalCost: 0
                }
            ]
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...formData.materials];

        if (field === 'materialId') {
            const selectedMaterial = availableMaterials.find(m => m.id === parseInt(value));
            if (selectedMaterial) {
                newMaterials[index] = {
                    ...newMaterials[index],
                    id: selectedMaterial.id,
                    code: selectedMaterial.code,
                    name: selectedMaterial.name,
                    unit: selectedMaterial.unit,
                    costPerUnit: selectedMaterial.costPerUnit,
                    qtyPerUnit: newMaterials[index].qtyPerUnit || '',
                    totalCost: (newMaterials[index].qtyPerUnit || 0) * selectedMaterial.costPerUnit
                };
            }
        } else if (field === 'qtyPerUnit') {
            newMaterials[index].qtyPerUnit = value;
            newMaterials[index].totalCost = (parseFloat(value) || 0) * (newMaterials[index].costPerUnit || 0);
        }

        setFormData(prev => ({
            ...prev,
            materials: newMaterials
        }));
    };

    const handleRemoveMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    const calculateTotalCost = () => {
        return formData.materials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Recipe Name is required';
        }

        if (!formData.productionCenterId) {
            newErrors.productionCenterId = 'Production Center is required';
        }

        if (formData.materials.length === 0) {
            newErrors.materials = 'At least one raw material is required';
        } else {
            const invalidMaterials = formData.materials.some(m => !m.id || !m.qtyPerUnit || parseFloat(m.qtyPerUnit) <= 0);
            if (invalidMaterials) {
                newErrors.materials = 'All materials must have valid quantity';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const selectedproductionCenter = availableproductionCenters.find(p => p.id === parseInt(formData.productionCenterId));
            const totalCost = calculateTotalCost();

            if (isEditMode) {
                setRecipes(recipes.map(recipe =>
                    recipe.id === editingRecipeId
                        ? {
                            ...recipe,
                            name: formData.name,
                            productionCenter: selectedproductionCenter,
                            version: formData.version,
                            materials: formData.materials,
                            totalCostPerUnit: totalCost,
                            active: formData.active
                        }
                        : recipe
                ));
                setToastMessage('Recipe updated successfully.');
            } else {
                const newRecipe = {
                    id: Math.max(...recipes.map(r => r.id), 0) + 1,
                    name: formData.name,
                    productionCenter: selectedproductionCenter,
                    version: formData.version || 'v1.0',
                    materials: formData.materials,
                    totalCostPerUnit: totalCost,
                    active: formData.active
                };
                setRecipes([...recipes, newRecipe]);
                setToastMessage('Recipe added successfully.');
            }

            setShowToast(true);
            setShowModal(false);
            resetForm();
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleEdit = (recipe) => {
        setIsEditMode(true);
        setEditingRecipeId(recipe.id);
        setFormData({
            name: recipe.name,
            productionCenterId: recipe.productionCenter.id.toString(),
            version: recipe.version,
            active: recipe.active,
            materials: recipe.materials.map(m => ({ ...m }))
        });
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setIsEditMode(false);
        setEditingRecipeId(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            productionCenterId: '',
            version: '',
            active: true,
            materials: []
        });
        setErrors({});
    };

    const handleCancel = () => {
        setShowModal(false);
        setIsEditMode(false);
        setEditingRecipeId(null);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('Are you sure you want to delete this recipe?', { confirmText: "Delete", danger: true })) {
            setRecipes(recipes.filter(recipe => recipe.id !== id));
            setToastMessage('Recipe deleted successfully.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const getFilteredRecipes = () => {
        let filtered = recipes;

        if (searchTerm) {
            filtered = filtered.filter(recipe =>
                recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.productionCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.version.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(recipe =>
                statusFilter === 'Active' ? recipe.active : !recipe.active
            );
        }

        return filtered;
    };

    const filteredRecipes = getFilteredRecipes();

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
                            Recipe Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
                            Define and manage product recipes
                        </p>
                    </div>

                    {/* Recipe List Table */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-fg">Recipe List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Recipe
                            </button>
                        </div>

                        {/* Search + Filters Section */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">

                            {/* Search Bar */}
                            <div className="flex-1 min-w-[250px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by recipe name, production center, or version..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-3 flex-wrap">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface min-w-[150px]"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                        </div>


                        {/* Recipes Table */}
                        {filteredRecipes.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-line">
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Recipe Name
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Production Center
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Version
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Cost per Unit
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-fg">
                                                Materials
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
                                        {filteredRecipes.map((recipe) => (
                                            <tr key={recipe.id} className="hover:bg-subtle transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                                                            <BookOpen className="w-5 h-5 text-warning" />
                                                        </div>
                                                        <p className="text-[14px] font-[600] text-fg">
                                                            {recipe.name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div>
                                                        <p className="text-[14px] font-[500] text-fg">
                                                            {recipe.productionCenter.name}
                                                        </p>
                                                       
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-hover text-plum">
                                                        {recipe.version}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-fg">
                                                        Rs. {recipe.totalCostPerUnit.toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {recipe.materials.slice(0, 2).map((material) => (
                                                            <span
                                                                key={material.id}
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] bg-hover text-brand-fg"
                                                            >
                                                                {material.name}
                                                            </span>
                                                        ))}
                                                        {recipe.materials.length > 2 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] bg-subtle text-fg-secondary">
                                                                +{recipe.materials.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] ${recipe.active
                                                            ? 'bg-line text-success'
                                                            : 'bg-hover text-error'
                                                        }`}>
                                                        {recipe.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(recipe)}
                                                            className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors"
                                                            title="Edit Recipe"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(recipe.id)}
                                                            className="p-2 text-error hover:bg-hover rounded-lg transition-colors"
                                                            title="Delete Recipe"
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
                                <BookOpen size={48} className="mx-auto text-fg-secondary mb-4" />
                                <p className="text-[16px] font-[500] text-fg mb-2">No recipes found</p>
                                <p className="text-[14px] text-fg-secondary">
                                    {searchTerm
                                        ? "Try adjusting your search criteria"
                                        : "Click 'Add New Recipe' to add your first recipe"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Recipe Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                                    {isEditMode ? 'Edit Recipe' : 'Add New Recipe'}
                                </h2>
                                <p className="text-[14px] text-fg-secondary mt-1">
                                    {isEditMode
                                        ? 'Update recipe information and materials'
                                        : 'Fill in the details to create a new recipe'
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
                                {/* Recipe Name */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Recipe Name <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter recipe name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.name ? 'border-error' : 'border-line'
                                                }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-error text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* productionCenter and Version Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* productionCenter */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Production Center <span className="text-error">*</span>
                                        </label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                            <select
                                                name="productionCenterId"
                                                value={formData.productionCenterId}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${errors.productionCenterId ? 'border-error' : 'border-line'
                                                    }`}
                                            >
                                                <option value="">Select Production Center</option>
                                                {availableproductionCenters.map(productionCenter => (
                                                    <option key={productionCenter.id} value={productionCenter.id}>
                                                        {productionCenter.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.productionCenterId && (
                                            <p className="text-error text-[12px] mt-1">{errors.productionCenterId}</p>
                                        )}
                                    </div>

                                    {/* Version */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-fg mb-1">
                                            Version
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                                            <input
                                                type="text"
                                                name="version"
                                                value={formData.version}
                                                onChange={handleChange}
                                                placeholder="e.g., v1.0"
                                                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                            />
                                        </div>
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
                                </div>

                                {/* Raw Material Mapping Section */}
                                <div className="border-t border-line pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[16px] font-[600] text-fg">
                                                Raw Material Mapping
                                            </h3>
                                            <p className="text-[12px] text-fg-secondary mt-1">
                                                Add materials required for this recipe
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddMaterial}
                                            className="flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-hover text-on-brand rounded-md text-[14px] font-[500] transition-colors"
                                        >
                                            <PlusCircle size={16} />
                                            Add Material
                                        </button>
                                    </div>

                                    {errors.materials && formData.materials.length === 0 && (
                                        <p className="text-error text-[12px] mb-3">{errors.materials}</p>
                                    )}

                                    {/* Materials List */}
                                    {formData.materials.length > 0 ? (
                                        <div className="space-y-3">
                                            {formData.materials.map((material, index) => (
                                                <div key={index} className="p-4 bg-subtle rounded-lg border border-line">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                        {/* Material Selection */}
                                                        <div className="md:col-span-5">
                                                            <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                                                                Raw Material
                                                            </label>
                                                            <select
                                                                value={material.id || ''}
                                                                onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                                                                className="w-full px-3 py-2 border border-line bg-surface rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                            >
                                                                <option value="">Select material</option>
                                                                {availableMaterials.map(mat => (
                                                                    <option key={mat.id} value={mat.id}>
                                                                        {mat.name} ({mat.code})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Quantity */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                                                                Qty per Unit
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={material.qtyPerUnit}
                                                                onChange={(e) => handleMaterialChange(index, 'qtyPerUnit', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full px-3 py-2 border border-line bg-surface rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                                                            />
                                                        </div>

                                                        {/* Unit */}
                                                        <div className="md:col-span-1">
                                                            <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                                                                Unit
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.unit}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-line bg-app rounded-md text-[14px] text-fg-secondary"
                                                            />
                                                        </div>

                                                        {/* Cost per Unit */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                                                                Cost/Unit
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.costPerUnit ? `Rs. ${material.costPerUnit.toFixed(2)}` : '-'}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-line bg-app rounded-md text-[14px] text-fg-secondary"
                                                            />
                                                        </div>

                                                        {/* Total Cost */}
                                                        <div className="md:col-span-1">
                                                            <label className="block text-[12px] font-[500] text-fg-secondary mb-1">
                                                                Total
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.totalCost ? `${material.totalCost.toFixed(2)}` : '0.00'}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-line bg-app rounded-md text-[14px] font-[600] text-fg"
                                                            />
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div className="md:col-span-1 flex items-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMaterial(index)}
                                                                className="w-full p-2 text-error hover:bg-hover rounded-md transition-colors"
                                                                title="Remove Material"
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Total Cost Summary */}
                                            <div className="flex justify-end p-4 bg-hover rounded-lg border border-brand-fg">
                                                <div className="text-right">
                                                    <p className="text-[12px] text-fg-secondary mb-1">Total Cost per Unit</p>
                                                    <p className="text-[20px] font-[600] text-brand-fg">
                                                        Rs. {calculateTotalCost().toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-line rounded-lg">
                                            <Package size={40} className="mx-auto text-fg-secondary mb-3" />
                                            <p className="text-[14px] text-fg-secondary">
                                                No materials added yet. Click "Add Material" to start.
                                            </p>
                                        </div>
                                    )}
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
                                    {isEditMode ? 'Update Recipe' : 'Save Recipe'}
                                </button>
                            </div>
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