import React, { useState, useRef, useEffect } from "react";
import {
    Search,
    Filter,
    Package,
    Calendar,
    User,
    Building2,
    FileText,
    Check,
    X,
    Plus,
    Minus,
    AlertTriangle,
    Clock,
    Hash,
    Eye,
    Trash2,
    Send,
    RotateCcw,
    ChevronDown,
    ShoppingCart,
    Warehouse
} from "lucide-react";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import posService from "../services/posService";

export default function POSReturnToStore() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Return to Store');

    // Outlet Selection States
    const [selectedOutletId, setSelectedOutletId] = useState('');
    const [outlets] = useState([
        {
            id: 'OUT-001',
            name: "Downtown Bakery Outlet",
            code: "OUT-001",
            address: "123 Main Street, Downtown",
            manager: "John Doe"
        },
        {
            id: 'OUT-002',
            name: "Mall Food Court Outlet",
            code: "OUT-002",
            address: "456 Shopping Mall, Level 2",
            manager: "Jane Smith"
        },
        {
            id: 'OUT-003',
            name: "Airport Terminal Outlet",
            code: "OUT-003",
            address: "789 Airport Terminal, Gate A12",
            manager: "Mike Johnson"
        }
    ]);

    // Header Information
    const [outletInfo, setOutletInfo] = useState({
        name: "",
        code: "",
        cashier: "",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        returnNoteId: ''
    });

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [productTypeFilter, setProductTypeFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Stock and Selection States
    const [availableStock, setAvailableStock] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [returnRemarks, setReturnRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedReturnId, setGeneratedReturnId] = useState('');

    // Fetch available stock from backend
    const fetchStock = async (outletId = null) => {
        try {
            setLoading(true);
            const currentOutletId = outletId || localStorage.getItem("outletId");
            const data = await posService.getTodayItems(currentOutletId ? parseInt(currentOutletId) : null);
            const mappedStock = data.map(item => ({
                id: item.productId,
                dayProductionItemId: item.dayProductionItemId,
                name: item.productName,
                code: item.productCode,
                type: item.categoryName || "Finished Goods",
                batch: `BATCH-${item.dayProductionItemId}`,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mock expiry for display
                availableQty: item.currentQty,
                uom: item.uom || "PCS",
                returnQty: 0,
                reason: "",
                remarks: "",
                selected: false
            }));
            setAvailableStock(mappedStock);
        } catch (error) {
            console.error("Error fetching stock:", error);
            alert("Failed to fetch available stock.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
        
        // Populate outlet info from localStorage/Role
        const userName = localStorage.getItem("userName") || "Cashier";
        
        setOutletInfo(prev => ({
            ...prev,
            name: "Downtown Bakery Outlet",
            code: "OUT-001",
            cashier: userName
        }));
        setSelectedOutletId("OUT-001"); // Default for now
    }, []);

    // Return reasons
    const returnReasons = [
        { value: '', label: 'Select Reason' },
        { value: 'excess', label: 'Excess Stock' },
        { value: 'wrong_item', label: 'Wrong Item' },
        { value: 'damaged', label: 'Damaged' },
        { value: 'expired', label: 'Expired' },
        { value: 'other', label: 'Other' }
    ];

    // Handle outlet selection
    const handleOutletSelection = (outletId) => {
        setSelectedOutletId(outletId);
        const selectedOutlet = outlets.find(outlet => outlet.id === outletId);

        if (selectedOutlet) {
            setOutletInfo({
                ...outletInfo,
                name: selectedOutlet.name,
                code: selectedOutlet.code,
                cashier: selectedOutlet.manager
            });
            fetchStock(outletId);
        } else {
            setOutletInfo({
                name: "",
                code: "",
                cashier: "",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                returnNoteId: ''
            });
            setAvailableStock([]);
        }

        setReturnRemarks('');
        setSearchTerm('');
        setProductTypeFilter('');
        setBatchFilter('');
    };

    // Filter stock based on search and filters
    const filteredStock = availableStock.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !productTypeFilter || item.type === productTypeFilter;
        const matchesBatch = !batchFilter || item.batch.toLowerCase().includes(batchFilter.toLowerCase());

        return matchesSearch && matchesType && matchesBatch;
    });

    // Handle item selection
    const toggleItemSelection = (itemId) => {
        setAvailableStock(availableStock.map(item =>
            item.id === itemId
                ? { ...item, selected: !item.selected, returnQty: item.selected ? 0 : 1 }
                : item
        ));
    };

    // Update return quantity
    const updateReturnQuantity = (itemId, quantity) => {
        const numQty = Math.max(0, parseInt(quantity) || 0);
        setAvailableStock(availableStock.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    returnQty: Math.min(numQty, item.availableQty),
                    selected: numQty > 0
                }
                : item
        ));
    };

    // Update return reason
    const updateReturnReason = (itemId, reason) => {
        setAvailableStock(availableStock.map(item =>
            item.id === itemId ? { ...item, reason } : item
        ));
    };

    // Update item remarks
    const updateItemRemarks = (itemId, remarks) => {
        setAvailableStock(availableStock.map(item =>
            item.id === itemId ? { ...item, remarks } : item
        ));
    };

    // Get selected items for summary
    const getSelectedItems = () => {
        return availableStock.filter(item => item.selected && item.returnQty > 0);
    };

    // Calculate totals
    const selectedItemsData = getSelectedItems();
    const totalSelectedItems = selectedItemsData.length;
    const totalReturnQuantity = selectedItemsData.reduce((sum, item) => sum + item.returnQty, 0);

    // Validate form
    const isFormValid = () => {
        if (!selectedOutletId) return false;

        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) return false;

        return selectedItems.every(item =>
            item.returnQty > 0 &&
            item.returnQty <= item.availableQty &&
            item.reason !== ''
        );
    };

    // Submit return
    const handleSubmitReturn = () => {
        if (!isFormValid()) {
            if (!selectedOutletId) {
                alert('Please select an outlet first');
                return;
            }
            alert('Please ensure all selected items have valid quantities and reasons');
            return;
        }
        setShowConfirmModal(true);
    };

    // Confirm return submission
    const confirmReturn = async () => {
        const initiatorId = localStorage.getItem("userId");
        if (!initiatorId) {
            alert("User session expired. Please log in again.");
            return;
        }

        const selectedItems = getSelectedItems();
        const returnData = {
            outletId: 1, // Defaulting to 1 as per POSSales pattern
            reason: selectedItems[0]?.reason || "EXCESS", // Primary reason from first item or general
            remarks: returnRemarks,
            initiatorId: initiatorId,
            items: selectedItems.map(item => ({
                productId: item.id,
                dayProductionItemId: item.dayProductionItemId,
                qty: item.returnQty,
                batchNote: item.batch
            }))
        };

        try {
            setLoading(true);
            const response = await posService.initiateOutletReturn(returnData);
            
            setGeneratedReturnId(response.returnId || `RTN-${Date.now()}`);
            setShowConfirmModal(false);
            setShowSuccessModal(true);
            
            // Re-fetch stock to reflect changes
            await fetchStock();
        } catch (error) {
            console.error('Return submission failed:', error);
            alert(error.response?.data?.message || "Failed to submit return request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        fetchStock();
        setReturnRemarks('');
        setSearchTerm('');
        setProductTypeFilter('');
        setBatchFilter('');
        setShowSuccessModal(false);
        setGeneratedReturnId('');
    };

    return (
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
            <POSSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <POSNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <div className="xl:mb-6 mb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <div className="min-w-0 flex-1">
                                            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#383E49] truncate">
                                                Return to Store
                                            </h1>
                                            <p className="text-xs sm:text-sm text-[#667085] truncate">
                                                <span className="hidden sm:inline">Processing return - </span>
                                                Step to Store
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Outlet Selection */}
                                <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={18} className="text-[#0F50AA]" />
                                        <h3 className="text-[16px] font-[600] text-[#383E49]">Select Outlet</h3>
                                    </div>
                                    <select
                                        value={selectedOutletId}
                                        onChange={(e) => handleOutletSelection(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]/10"
                                    >
                                        <option value="">Choose an outlet...</option>
                                        {outlets.map((outlet) => (
                                            <option key={outlet.id} value={outlet.id}>
                                                {outlet.name} ({outlet.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Outlet Information */}
                                {selectedOutletId && (
                                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 xl:mb-6 mb-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-[12px] text-[#667085] mb-1">Outlet Name</p>
                                                <p className="text-[14px] font-[500] text-[#383E49]">{outletInfo.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#667085] mb-1">Outlet Code</p>
                                                <p className="text-[14px] font-[500] text-[#383E49]">{outletInfo.code}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#667085] mb-1">Manager</p>
                                                <p className="text-[14px] font-[500] text-[#383E49]">{outletInfo.cashier}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-[#667085] mb-1">Date & Time</p>
                                                <p className="text-[14px] font-[500] text-[#383E49]">{outletInfo.date} {outletInfo.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!selectedOutletId && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Building2 size={64} className="text-[#E4E6EA] mb-4" />
                                    <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Select an Outlet</h3>
                                    <p className="text-[14px] text-[#667085] max-w-md">
                                        Please select an outlet from the dropdown above to view available stock and create a return request.
                                    </p>
                                </div>
                            )}

                            {selectedOutletId && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
                                    {/* Stock Selection Area */}
                                    <div className="xl:col-span-2 space-y-4 xl:space-y-6">
                                        {/* Search and Filters */}
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by product name or code..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]/10"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setShowFilters(!showFilters)}
                                                    className="px-4 py-2 border border-[#E4E6EA] rounded-lg text-[#667085] hover:bg-[#F8F9FA] transition-colors flex items-center gap-2"
                                                >
                                                    <Filter size={16} />
                                                    Filters
                                                    <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>

                                            {showFilters && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8F9FA] rounded-lg">
                                                    <div>
                                                        <label className="block text-[12px] font-[500] text-[#383E49] mb-1">Product Type</label>
                                                        <select
                                                            value={productTypeFilter}
                                                            onChange={(e) => setProductTypeFilter(e.target.value)}
                                                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none bg-white"
                                                        >
                                                            <option value="">All Types</option>
                                                            <option value="Raw Material">Raw Material</option>
                                                            <option value="Semi-Finished">Semi-Finished</option>
                                                            <option value="Finished Goods">Finished Goods</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[12px] font-[500] text-[#383E49] mb-1">Batch/Lot</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Search batch number"
                                                            value={batchFilter}
                                                            onChange={(e) => setBatchFilter(e.target.value)}
                                                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stock Table */}
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA]">
                                            <div className="p-4 border-b border-[#E4E6EA]">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
                                                    <Package size={18} />
                                                    Available Stock ({filteredStock.length} items)
                                                </h3>
                                            </div>

                                            <div className="px-2">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-[#F8F9FA]">
                                                            <tr>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Select</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Product</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Type</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Batch</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Expiry</th>
                                                                <th className="text-right px-4 py-3 text-[12px] font-[600] text-[#383E49]">Available</th>
                                                                <th className="text-center px-4 py-3 text-[12px] font-[600] text-[#383E49]">Return Qty</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Reason</th>
                                                                <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredStock.map((item) => (
                                                                <tr key={item.id} className={`border-b border-[#E4E6EA] hover:bg-[#F8F9FA] ${item.selected ? 'bg-[#0F50AA]/5' : ''}`}>
                                                                    <td className="px-2 py-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.selected}
                                                                            onChange={() => toggleItemSelection(item.id)}
                                                                            className="rounded border-[#E4E6EA] text-[#0F50AA] focus:ring-[#0F50AA]/10"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[100px]">
                                                                        <div>
                                                                            <p className="text-[14px] font-[500] text-[#383E49]">{item.name}</p>
                                                                            <p className="text-[12px] text-[#667085]">{item.code}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[110px]">
                                                                        <span className={`inline-flex px-2 py-1 text-[10px] font-[500] rounded-full ${item.type === 'Raw Material'
                                                                                ? 'bg-[#0F50AA]/10 text-[#0F50AA]'
                                                                                : item.type === 'Semi-Finished'
                                                                                    ? 'bg-[#B3A5FF]/10 text-[#B3A5FF]'
                                                                                    : 'bg-[#10B981]/10 text-[#10B981]'
                                                                            }`}>
                                                                            {item.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[100px]">
                                                                        <span className="text-[12px] text-[#667085] font-mono">{item.batch}</span>
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[100px]">
                                                                        <div className="text-[12px] text-[#667085]">{item.expiryDate}</div>
                                                                        {new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                                                            <div className="flex items-center gap-1 text-[10px] text-[#F4A100] mt-1">
                                                                                <AlertTriangle size={10} />
                                                                                <span>Expiring Soon</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-right">
                                                                        <span className="text-[14px] font-[500] text-[#383E49]">
                                                                            {item.availableQty} {item.uom}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={() => updateReturnQuantity(item.id, item.returnQty - 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-[#E4E6EA] rounded text-[#667085] hover:bg-[#F8F9FA] disabled:opacity-50"
                                                                                disabled={item.returnQty <= 0}
                                                                            >
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={item.availableQty}
                                                                                value={item.returnQty}
                                                                                onChange={(e) => updateReturnQuantity(item.id, e.target.value)}
                                                                                className="w-16 text-center py-1 border border-[#E4E6EA] rounded text-[12px] focus:border-[#0F50AA] focus:outline-none"
                                                                            />
                                                                            <button
                                                                                onClick={() => updateReturnQuantity(item.id, item.returnQty + 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-[#E4E6EA] rounded text-[#667085] hover:bg-[#F8F9FA] disabled:opacity-50"
                                                                                disabled={item.returnQty >= item.availableQty}
                                                                            >
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="text-center text-[10px] text-[#667085] mt-1">
                                                                            {item.uom}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[110px]">
                                                                        <select
                                                                            value={item.reason}
                                                                            onChange={(e) => updateReturnReason(item.id, e.target.value)}
                                                                            disabled={!item.selected}
                                                                            className="w-full px-2 py-1 border border-[#E4E6EA] rounded text-[12px] focus:border-[#0F50AA] focus:outline-none disabled:bg-[#F8F9FA] disabled:text-[#667085]"
                                                                        >
                                                                            {returnReasons.map(reason => (
                                                                                <option key={reason.value} value={reason.value}>
                                                                                    {reason.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-2 py-2 min-w-[110px]">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Optional"
                                                                            value={item.remarks}
                                                                            onChange={(e) => updateItemRemarks(item.id, e.target.value)}
                                                                            disabled={!item.selected}
                                                                            className="w-full px-2 py-1 border border-[#E4E6EA] rounded text-[12px] focus:border-[#0F50AA] focus:outline-none disabled:bg-[#F8F9FA] disabled:text-[#667085]"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {filteredStock.length === 0 && (
                                                        <div className="text-center py-12">
                                                            <Package size={48} className="text-[#E4E6EA] mx-auto mb-3" />
                                                            <p className="text-[14px] text-[#667085]">No stock items found</p>
                                                            <p className="text-[12px] text-[#667085] mt-1">Try adjusting your search or filters</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Details Panel */}
                                    <div className="xl:col-span-1">
                                        <div className="sticky top-0 space-y-4 xl:space-y-6">
                                            {/* Return Summary */}
                                            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                                                    <ShoppingCart size={18} />
                                                    Return Summary
                                                </h3>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-[#667085]">Selected Items:</span>
                                                        <span className="font-[500] text-[#383E49]">{totalSelectedItems}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-[#667085]">Total Quantity:</span>
                                                        <span className="font-[500] text-[#383E49]">{totalReturnQuantity} units</span>
                                                    </div>
                                                </div>

                                                {selectedItemsData.length > 0 && (
                                                    <div className="border-t border-[#E4E6EA] pt-4">
                                                        <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Selected Items:</h4>
                                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                                            {selectedItemsData.map((item) => (
                                                                <div key={item.id} className="p-2 bg-[#F8F9FA] rounded border border-[#E4E6EA]">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <p className="text-[12px] font-[500] text-[#383E49]">{item.name}</p>
                                                                            <p className="text-[10px] text-[#667085]">{item.code}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[12px] font-[500] text-[#0F50AA]">
                                                                                {item.returnQty} {item.uom}
                                                                            </p>
                                                                            <p className="text-[10px] text-[#667085]">{item.reason}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedItemsData.length === 0 && (
                                                    <div className="text-center py-6">
                                                        <ShoppingCart size={32} className="text-[#E4E6EA] mx-auto mb-2" />
                                                        <p className="text-[12px] text-[#667085]">No items selected</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Return Remarks */}
                                            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                                                    <FileText size={18} />
                                                    Return Remarks
                                                </h3>

                                                <textarea
                                                    placeholder="Add optional remarks for this return note..."
                                                    value={returnRemarks}
                                                    onChange={(e) => setReturnRemarks(e.target.value)}
                                                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none resize-none"
                                                    rows="4"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleSubmitReturn}
                                                    disabled={!isFormValid()}
                                                    className="w-full px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500] flex items-center justify-center gap-2"
                                                >
                                                    <Send size={16} />
                                                    Submit Return
                                                </button>

                                                <button
                                                    onClick={resetForm}
                                                    className="w-full px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors text-[14px] font-[500] flex items-center justify-center gap-2"
                                                >
                                                    <RotateCcw size={16} />
                                                    Clear Selection
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-orange-600" />
                                </div>
                                <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Confirm Return Submission</h3>
                                <p className="text-[14px] text-[#667085]">
                                    Please review the return details before submitting to the main store
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                    <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Return Summary</h4>
                                    <div className="space-y-2 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Selected Items:</span>
                                            <span className="font-[500] text-[#383E49]">{totalSelectedItems}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Total Quantity:</span>
                                            <span className="font-[500] text-[#383E49]">{totalReturnQuantity} units</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Outlet:</span>
                                            <span className="font-[500] text-[#383E49]">{outletInfo.code}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={16} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-[14px] font-[500] text-[#EF4444] mb-1">Important Notice</h4>
                                            <p className="text-[12px] text-[#EF4444]">
                                                Once submitted, this return cannot be modified. Ensure all quantities and reasons are correct.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors w-full"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={confirmReturn}
                                    className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                    <Send size={16} />
                                    Submit Return
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={40} className="text-green-600" />
                                </div>
                                <h3 className="text-[20px] font-[600] text-[#383E49] mb-2">Return Submitted Successfully!</h3>
                                <p className="text-[14px] text-[#667085] mb-4">
                                    Your return request has been sent to the main store for processing
                                </p>
                                <div className="bg-[#F0F8FF] border border-[#0F50AA] rounded-lg p-4">
                                    <p className="text-[12px] text-[#667085] mb-1">Return Note ID</p>
                                    <p className="text-[18px] font-[600] text-[#0F50AA]">{generatedReturnId}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                    <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Return Details</h4>
                                    <div className="space-y-2 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Items Returned:</span>
                                            <span className="font-[500] text-[#383E49]">{totalSelectedItems}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Total Quantity:</span>
                                            <span className="font-[500] text-[#383E49]">{totalReturnQuantity} units</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Submitted At:</span>
                                            <span className="font-[500] text-[#383E49]">{new Date().toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    New Return
                                </button>
                            </div>
                        </div>
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