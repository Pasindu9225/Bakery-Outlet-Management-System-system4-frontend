import React, { useState } from "react";
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

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
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
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
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
                        <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                            Recipe Management
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-[#667085]">
                            Define and manage product recipes
                        </p>
                    </div>

                    {/* Recipe List Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <h3 className="text-[18px] font-[600] text-[#383E49]">Recipe List</h3>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-[#0F50AA] hover:bg-[#1366D9] text-white px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
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
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by recipe name, production center, or version..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex gap-3 flex-wrap">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white min-w-[150px]"
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
                                        <tr className="border-b border-[#E4E6EA]">
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Recipe Name
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Production Center
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Version
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Cost per Unit
                                            </th>
                                            <th className="text-left py-4 text-[14px] font-[500] text-[#383E49]">
                                                Materials
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
                                        {filteredRecipes.map((recipe) => (
                                            <tr key={recipe.id} className="hover:bg-[#F8F9FA] transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-[#FEF3C7] rounded-full flex items-center justify-center">
                                                            <BookOpen className="w-5 h-5 text-[#92400E]" />
                                                        </div>
                                                        <p className="text-[14px] font-[600] text-[#383E49]">
                                                            {recipe.name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div>
                                                        <p className="text-[14px] font-[500] text-[#383E49]">
                                                            {recipe.productionCenter.name}
                                                        </p>
                                                       
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#E0E7FF] text-[#3730A3]">
                                                        {recipe.version}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-[14px] font-[600] text-[#383E49]">
                                                        Rs. {recipe.totalCostPerUnit.toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {recipe.materials.slice(0, 2).map((material) => (
                                                            <span
                                                                key={material.id}
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#EBF8FF] text-[#0F50AA]"
                                                            >
                                                                {material.name}
                                                            </span>
                                                        ))}
                                                        {recipe.materials.length > 2 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#F8F9FA] text-[#667085]">
                                                                +{recipe.materials.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] ${recipe.active
                                                            ? 'bg-[#D1FAE5] text-[#065F46]'
                                                            : 'bg-[#FEE2E2] text-[#991B1B]'
                                                        }`}>
                                                        {recipe.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(recipe)}
                                                            className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                                                            title="Edit Recipe"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(recipe.id)}
                                                            className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
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
                                <BookOpen size={48} className="mx-auto text-[#667085] mb-4" />
                                <p className="text-[16px] font-[500] text-[#383E49] mb-2">No recipes found</p>
                                <p className="text-[14px] text-[#667085]">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
                            <div>
                                <h2 className="text-[20px] leading-[30px] font-[600] text-[#383E49]">
                                    {isEditMode ? 'Edit Recipe' : 'Add New Recipe'}
                                </h2>
                                <p className="text-[14px] text-[#667085] mt-1">
                                    {isEditMode
                                        ? 'Update recipe information and materials'
                                        : 'Fill in the details to create a new recipe'
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

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="space-y-4">
                                {/* Recipe Name */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Recipe Name <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter recipe name"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.name ? 'border-[#EF4444]' : 'border-[#E4E6EA]'
                                                }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-[#EF4444] text-[12px] mt-1">{errors.name}</p>
                                    )}
                                </div>

                                {/* productionCenter and Version Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* productionCenter */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                            Production Center <span className="text-[#EF4444]">*</span>
                                        </label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                            <select
                                                name="productionCenterId"
                                                value={formData.productionCenterId}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.productionCenterId ? 'border-[#EF4444]' : 'border-[#E4E6EA]'
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
                                            <p className="text-[#EF4444] text-[12px] mt-1">{errors.productionCenterId}</p>
                                        )}
                                    </div>

                                    {/* Version */}
                                    <div>
                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                            Version
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                                            <input
                                                type="text"
                                                name="version"
                                                value={formData.version}
                                                onChange={handleChange}
                                                placeholder="e.g., v1.0"
                                                className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Status */}
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Active Status <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <select
                                        name="active"
                                        value={formData.active ? 'true' : 'false'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            active: e.target.value === 'true'
                                        }))}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>

                                {/* Raw Material Mapping Section */}
                                <div className="border-t border-[#E4E6EA] pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-[16px] font-[600] text-[#383E49]">
                                                Raw Material Mapping
                                            </h3>
                                            <p className="text-[12px] text-[#667085] mt-1">
                                                Add materials required for this recipe
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddMaterial}
                                            className="flex items-center gap-2 px-3 py-2 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
                                        >
                                            <PlusCircle size={16} />
                                            Add Material
                                        </button>
                                    </div>

                                    {errors.materials && formData.materials.length === 0 && (
                                        <p className="text-[#EF4444] text-[12px] mb-3">{errors.materials}</p>
                                    )}

                                    {/* Materials List */}
                                    {formData.materials.length > 0 ? (
                                        <div className="space-y-3">
                                            {formData.materials.map((material, index) => (
                                                <div key={index} className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E4E6EA]">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                        {/* Material Selection */}
                                                        <div className="md:col-span-5">
                                                            <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                                                                Raw Material
                                                            </label>
                                                            <select
                                                                value={material.id || ''}
                                                                onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] bg-white rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
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
                                                            <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                                                                Qty per Unit
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={material.qtyPerUnit}
                                                                onChange={(e) => handleMaterialChange(index, 'qtyPerUnit', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] bg-white rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                                                            />
                                                        </div>

                                                        {/* Unit */}
                                                        <div className="md:col-span-1">
                                                            <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                                                                Unit
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.unit}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] bg-[#F0F1F3] rounded-md text-[14px] text-[#667085]"
                                                            />
                                                        </div>

                                                        {/* Cost per Unit */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                                                                Cost/Unit
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.costPerUnit ? `Rs. ${material.costPerUnit.toFixed(2)}` : '-'}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] bg-[#F0F1F3] rounded-md text-[14px] text-[#667085]"
                                                            />
                                                        </div>

                                                        {/* Total Cost */}
                                                        <div className="md:col-span-1">
                                                            <label className="block text-[12px] font-[500] text-[#667085] mb-1">
                                                                Total
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={material.totalCost ? `${material.totalCost.toFixed(2)}` : '0.00'}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] bg-[#F0F1F3] rounded-md text-[14px] font-[600] text-[#383E49]"
                                                            />
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div className="md:col-span-1 flex items-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveMaterial(index)}
                                                                className="w-full p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-colors"
                                                                title="Remove Material"
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Total Cost Summary */}
                                            <div className="flex justify-end p-4 bg-[#EBF8FF] rounded-lg border border-[#0F50AA]">
                                                <div className="text-right">
                                                    <p className="text-[12px] text-[#667085] mb-1">Total Cost per Unit</p>
                                                    <p className="text-[20px] font-[600] text-[#0F50AA]">
                                                        Rs. {calculateTotalCost().toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-[#E4E6EA] rounded-lg">
                                            <Package size={40} className="mx-auto text-[#667085] mb-3" />
                                            <p className="text-[14px] text-[#667085]">
                                                No materials added yet. Click "Add Material" to start.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
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
                    <div className="bg-white border-l-4 border-[#51CC5D] rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#51CC5D] bg-opacity-10 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-[#199D26]" />
                        </div>
                        <p className="text-[14px] text-[#383E49] font-[500]">{toastMessage}</p>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}