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
    Utensils,
    CreditCard,
    Receipt,
    Edit3,
    TableProperties,
    ChefHat,
    DollarSign,
    Users
} from "lucide-react";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import axios from "../services/api";
import posService from "../services/posService";


export default function POSWaiterBilling() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Waiter Management');

    // Header Information
    const [cashierInfo] = useState({
        name: localStorage.getItem("userPhone") || "Sarah Johnson",
        id: localStorage.getItem("userId") || "CSH-005",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Waiter Management
    const [selectedWaiter, setSelectedWaiter] = useState('');
    const [waiters, setWaiters] = useState([]);


    // New Table Modal State
    const [showNewTableModal, setShowNewTableModal] = useState(false);
    const [newTableData, setNewTableData] = useState({
        name: '',
        status: 'available',
        seats: ''
    });

    const [productionCenters, setProductionCenters] = useState([]);
    const [targetWaiterId, setTargetWaiterId] = useState('');
    const [showCancelVerification, setShowCancelVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [itemToCancel, setItemToCancel] = useState(null);

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            const requestBody = {
                tableName: newTableData.name,
                status: newTableData.status.charAt(0).toUpperCase() + newTableData.status.slice(1),
                seatCount: parseInt(newTableData.seats)
            };
            const response = await axios.post(`/api/pos/v1/table-billing/waiters`, requestBody);

            // Map backend response to local state format
            const newTable = {
                id: response.data.id,
                name: response.data.tableName,
                status: response.data.status.toLowerCase(),
                seats: response.data.seatCount
            };

            setWaiters([...waiters, newTable]);
            setShowNewTableModal(false);
            setNewTableData({ name: '', status: 'available', seats: '' });
        } catch (error) {
            console.error("Error adding table:", error);
            alert(error.response?.data?.message || "Failed to add table. Please try again.");
        }
    };

    const handleOrderItemOrder = async (item) => {
        try {
            const requestBody = {
                waiterId: String(selectedWaiter),
                productId: item.id,
                qty: item.qty,
                unitPrice: item.unitPrice,
                instructions: item.instructions || null
            };
            await axios.post(`/api/pos/v1/waiter-billing/add-item`, requestBody);
            alert(`Item ${item.name} added to waiter successfully!`);
            fetchWaiterDetails(); // Refresh billing details
            fetchTodayItems(); // Refresh stock in product grid
        } catch (error) {
            console.error("Error ordering item:", error);
            alert("Failed to place order. Please try again.");
        }
    };



    // Product Search and Selection
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductGrid, setShowProductGrid] = useState(false);
    // Products Data
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [highlightedItemId, setHighlightedItemId] = useState(null);

     const fetchTodayItems = async () => {
         try {
             const outletId = localStorage.getItem("outletId");
             const data = await posService.getTodayItems(outletId);
             
             const mappedData = data.map(item => ({
                 id: item.productId,
                 dayProductionItemId: item.dayProductionItemId,
                 name: item.productName,
                 code: item.productCode,
                 price: item.unitPrice,
                 category: item.categoryName,
                 available: true,
                 fastMoving: item.isFastMoving,
                 description: "",
                 currentQty: item.currentQty,
                 isKotEnabled: item.isKotEnabled
             }));
             setProducts(mappedData);
             // Dynamically build categories from backend data
             const uniqueCategoryNames = [...new Set(data.map(item => item.categoryName))].filter(Boolean);
             uniqueCategoryNames.sort((a, b) => a.localeCompare(b));
             setCategories(['All', ...uniqueCategoryNames]);
         } catch (error) {
             console.error("Error fetching items:", error);
         }
     };

     // Fetch items from backend
     useEffect(() => {
         fetchTodayItems();

         const fetchProductionCenters = async () => {
             try {
                 const data = await posService.getProductionCenters();
                 setProductionCenters(data);
             } catch (error) {
                 console.error("Error fetching production centers:", error);
             }
         };
         fetchProductionCenters();
     }, []);

    // Fetch waiters from backend
    const fetchWaiters = async () => {
        try {
            const response = await axios.get(`/api/pos/v1/waiter-billing/waiters?outletId=${localStorage.getItem("outletId")}`);
            const mappedData = response.data.map(item => ({
                id: item.userId,
                name: item.firstName + ' ' + item.lastName,
                username: item.username,
                status: 'available'
            }));
            setWaiters(mappedData);
        } catch (error) {
            console.error("Error fetching waiters:", error);
        }
    };

    useEffect(() => {
        fetchWaiters();
    }, []);




    // Order Management
    const [waiterOrders, setWaiterOrders] = useState({});
    const [currentOrder, setCurrentOrder] = useState([]);

    // Payment States
    const [showBillModal, setShowBillModal] = useState(false);
    const [amountReceived, setAmountReceived] = useState('');
    const [freeMealReason, setFreeMealReason] = useState('');
    const [staffId, setStaffId] = useState('');
    const [staffReason, setStaffReason] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showKOTModal, setShowKOTModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedBillId, setGeneratedBillId] = useState('');
    const [successPaymentDetails, setSuccessPaymentDetails] = useState({
        amountReceived: 0,
        changeAmount: 0,
        totalAmount: 0
    });
    const [printData, setPrintData] = useState(null);
    const [printPayloadToUse, setPrintPayloadToUse] = useState(null);
    const [lastSaleId, setLastSaleId] = useState(null);

    // Promotion States
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [appliedDiscounts, setAppliedDiscounts] = useState({});
    const [promoScope, setPromoScope] = useState('EVERY'); // 'EVERY', 'TOTAL', 'SELECTED'
    const [selectedPromoItems, setSelectedPromoItems] = useState([]); // Array of item IDs

    // Categories
    const [categoryFilter, setCategoryFilter] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);


    // Initialize table orders
    useEffect(() => {
        setWaiterOrders({});
    }, []);

    // Fetch payment methods from backend
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await axios.get(`/api/pos/v1/payment-methods`);
                setPaymentMethods(response.data);
                if (response.data.length > 0) {
                    setPaymentMethod(response.data[0].name);
                }
            } catch (error) {
                console.error("Error fetching payment methods:", error);
            }
        };

        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        if (!appliedPromo) {
            setAppliedDiscounts({});
            return;
        }

        const discounts = {};
        if (promoScope === 'TOTAL') {
            const currentSubtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
            currentOrder.forEach(item => {
                if (appliedPromo.type === 'PERCENTAGE') {
                    discounts[item.id] = parseFloat(((item.unitPrice * item.qty * appliedPromo.value) / 100).toFixed(2));
                } else if (appliedPromo.type === 'FLAT') {
                    // Option B: Proportional split across all items
                    const proportion = currentSubtotal > 0 ? (item.unitPrice * item.qty) / currentSubtotal : 0;
                    const itemShare = appliedPromo.value * proportion;
                    discounts[item.id] = parseFloat(itemShare.toFixed(2));
                }
            });
        } else {
            currentOrder.forEach(item => {
                const isSelected = promoScope === 'EVERY' || (promoScope === 'SELECTED' && selectedPromoItems.includes(item.id));
                if (isSelected) {
                    if (appliedPromo.type === 'PERCENTAGE') {
                        discounts[item.id] = parseFloat(((item.unitPrice * item.qty * appliedPromo.value) / 100).toFixed(2));
                    } else if (appliedPromo.type === 'FLAT') {
                        discounts[item.id] = appliedPromo.value;
                    }
                } else {
                    discounts[item.id] = 0;
                }
            });
        }
        setAppliedDiscounts(discounts);
    }, [currentOrder, appliedPromo, promoScope, selectedPromoItems]);


    const fetchWaiterDetails = async () => {
        if (!selectedWaiter) {
            setCurrentOrder([]);
            return;
        }
        try {
            const response = await axios.get(`/api/pos/v1/waiter-billing/waiter-details/${selectedWaiter}`);
            const mappedItems = (response.data.unpaidItems || []).map(item => ({
                id: item.id,
                productId: item.productId,
                dayProductionItemId: item.dayProductionItemId,
                name: item.productName,
                code: item.productCode || "",
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: item.qty * item.unitPrice,
                instructions: item.instructions || "",
                kotId: item.kotId,
                isKotEnabled: item.isKotEnabled,
                selectedCenterId: item.kotId ? null : (productionCenters[0]?.id || '')
            }));

            setCurrentOrder(mappedItems);
        } catch (error) {
            console.error("Error fetching table details:", error);
            setCurrentOrder([]);
        }
    };

    // Update current order when table selection changes
    useEffect(() => {
        fetchWaiterDetails();
        fetchTodayItems();
    }, [selectedWaiter]);

    // Filter products
    const filteredProducts = products.filter(product => {
        // Check if numeric shortcut search
        const trimmedSearch = searchTerm.trim();
        const categoryShortcutIndex = parseInt(trimmedSearch);
        
        if (!isNaN(categoryShortcutIndex) && categoryShortcutIndex > 0 && categoryShortcutIndex < categories.length) {
            const catName = categories[categoryShortcutIndex];
            return product.category === catName && product.available;
        }

        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === '' || categoryFilter === 'All' || product.category === categoryFilter;
        return matchesSearch && matchesCategory && product.available;
    });

    // Add item to current order
    const addToOrder = (product, quantity = 1, instructions = '') => {
        if (!selectedWaiter) {
            alert('Please select a table first');
            return;
        }

        // Immediately persist to backend for table management
        const itemToOrder = {
            ...product,
            qty: quantity,
            unitPrice: product.price, // Map price to unitPrice for handleOrderItemOrder
            instructions: instructions
        };
        
        handleOrderItemOrder(itemToOrder);
        
        // Visual feedback
        setHighlightedItemId(product.id);
        setTimeout(() => setHighlightedItemId(null), 1000);
    };

    // Update order item quantity
    const updateOrderQuantity = async (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeOrderItem(itemId);
            return;
        }

        try {
            await posService.updateTableItem(itemId, newQuantity, 
                currentOrder.find(item => item.id === itemId)?.instructions);
            fetchWaiterDetails();
            fetchTodayItems();
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    // Update order item instructions
    const updateOrderInstructions = async (itemId, instructions) => {
        try {
            const item = currentOrder.find(o => o.id === itemId);
            await posService.updateTableItem(itemId, item.qty, instructions);
            fetchWaiterDetails();
        } catch (error) {
            console.error("Error updating instructions:", error);
        }
    };

    // Remove item from order
    const removeOrderItem = async (itemId) => {
        try {
            await axios.delete(`/api/pos/v1/waiter-billing/items/${itemId}`);
            fetchWaiterDetails();
            fetchTodayItems();
        } catch (error) {
            console.error("Error removing item:", error);
            alert("Failed to remove item. It might be already sent to KOT.");
        }
    };

    // Calculate totals
    const subtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = Object.values(appliedDiscounts).reduce((sum, val) => sum + val, 0);
    const tax = (subtotal - totalDiscount) * 0.1; // 10% tax on discounted amount
    const totalPayable = subtotal - totalDiscount + tax;

    // Promo verification
    const verifyPromo = async () => {
        const code = (promoCode || '').trim().toUpperCase();
        if (!code) return alert('Enter a promo code');

        try {
            const response = await axios.get(`/api/pos/v1/promotions/validate?code=${code}`);
            
            const promo = response.data;
            setAppliedPromo({
                id: promo.id,
                code: code,
                type: promo.discountType,
                value: promo.discountValue
            });
            alert(`Promo applied: ${promo.discountValue}${promo.discountType === 'PERCENTAGE' ? '%' : ' Rs.'} discount`);
        } catch (error) {
            console.error("Error validating promo:", error);
            alert(error.response?.data?.message || "Promotion Expired or Invalid");
            removePromo();
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setAppliedDiscounts({});
    };
    // Generate KOT
    const generateKOT = () => {
        if (currentOrder.length === 0) {
            alert('No items in the order');
            return;
        }
        setShowKOTModal(true);
    };

    // Show bill
    const requestBill = () => {
        if (currentOrder.length === 0) {
            alert('No items in the order');
            return;
        }
        setShowBillModal(true);
    };

    // Process payment
    const processPayment = async () => {
        const receivedAmount = parseFloat(amountReceived) || 0;

        const selectedMethod = paymentMethods.find(m => m.name.toUpperCase() === paymentMethod.toUpperCase()) || null;
        if (!selectedMethod) {
            alert('Please select a valid payment method');
            return;
        }
        const isFreeMeal = selectedMethod.category === 'FREE_MEAL';

        if (!isFreeMeal && receivedAmount < totalPayable) {
            alert('Insufficient payment amount');
            return;
        }

        const effectiveReason = freeMealReason.trim() || (staffId.trim() ? `Staff ID: ${staffId.trim()}${staffReason.trim() ? ` - ${staffReason.trim()}` : ''}` : '');

        if (isFreeMeal && effectiveReason.length < 10) {
            alert('Please enter a valid staff ID or reason (minimum 10 characters)');
            return;
        }
        try {
            const cashierId = localStorage.getItem("userId") || "";

            const requestBody = {
                waiterId: String(selectedWaiter),
                cashierId: cashierId,
                amountReceived: receivedAmount,
                totalAmount: totalPayable,
                paymentMethodId: selectedMethod.paymentMethodId,
                globalPromotionId: promoScope === 'TOTAL' ? appliedPromo?.id : null,
                items: currentOrder.map(item => ({
                    dayProductionItemId: item.dayProductionItemId,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    freeMealReason: isFreeMeal ? effectiveReason : null,
                    bankTransferCode: null,
                    discountId: null,
                    manualDiscount: 0,
                    promotionId: (promoScope === 'EVERY' || (promoScope === 'SELECTED' && selectedPromoItems.includes(item.id))) ? appliedPromo?.id : null,
                    paymentMethodId: selectedMethod.paymentMethodId
                }))
            };

            const response = await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, requestBody);
            const saleData = response.data?.data || response.data;
            setGeneratedBillId(saleData.billId || `BILL-${Date.now()}`);
            setSuccessPaymentDetails({
                amountReceived: saleData.receivedAmount || receivedAmount,
                changeAmount: saleData.changeAmount || Math.max(0, receivedAmount - totalPayable),
                totalAmount: saleData.totalAmount || totalPayable
            });

            const kotItems = currentOrder.filter(item => item.isKotEnabled || item.kotBased).map(item => ({
                productName: item.name,
                qty: item.qty,
                specialInstructions: item.instructions || item.specialInstructions || ""
            }));

            const optionStr = `${paymentMethod || ''}`.toLowerCase();
            const isUberOrPickMe = optionStr.includes('uber') || optionStr.includes('pickme') || optionStr.includes('picme');

            const printPayload = {
                type: 'TAX',
                transactionId: saleData.billId || `BILL-${Date.now()}`,
                waiterName: waiters.find(w => w.id === selectedWaiter)?.name || null,
                cashierName: cashierInfo.name,
                paymentMethod: paymentMethod,
                deliveryOption: 'Dine-In',
                items: currentOrder.map(item => ({
                    productName: item.name,
                    qty: item.qty,
                    unitPrice: item.unitPrice
                })),
                subTotal: subtotal,
                discount: totalDiscount,
                finalTotal: totalPayable,
                kotItems: kotItems,
                isUberOrPickMe: isUberOrPickMe
            };
            setPrintPayloadToUse(printPayload);
            setLastSaleId(saleData.saleId);

            // Clear dummy table orders
            setWaiterOrders(prev => {
                const updated = { ...prev };
                delete updated[selectedWaiter];
                return updated;
            });

            fetchWaiters(); // Refresh waiters status
            setCurrentOrder([]);
            fetchTodayItems(); // Refresh stock in product grid
            setSelectedWaiter('');
            setAmountReceived('');
            setFreeMealReason('');
            setStaffId('');
            setStaffReason('');
            setPaymentMethod('Cash');
            setShowBillModal(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Failed to process payment. Please try again.");
        }
    };
    const handlePrintReceipt = async () => {
        try {
            if (lastSaleId) {
                await axios.put(`/api/pos/v1/sales/${lastSaleId}/print-status?printed=true`);
            }
        } catch (error) {
            console.error("Error updating print status:", error);
        }

        setPrintData(printPayloadToUse);
        setTimeout(() => {
            window.print();
            setPrintData(null);
            setShowSuccessModal(false);
        }, 150);
    };


    const handleTransferWaiter = async () => {
        if (!selectedWaiter || !targetWaiterId) return;
        try {
            await posService.transferTable(selectedWaiter, targetWaiterId);
            alert("Table items transferred successfully!");
            setSelectedWaiter(targetWaiterId);
            setTargetWaiterId('');
            fetchWaiters();
        } catch (error) {
            console.error("Error transferring table:", error);
            alert("Failed to transfer table");
        }
    };

    const handleGenerateKOTForItem = async (item) => {
        if (!item.selectedCenterId) {
            alert("Please select a production center");
            return;
        }
        try {
            await posService.generateKOT(item.id, item.selectedCenterId);
            alert("KOT generated successfully!");
            fetchWaiterDetails();
        } catch (error) {
            console.error("Error generating KOT:", error);
            alert("Failed to generate KOT");
        }
    };

    const handleCancelKOTRequest = (item) => {
        setItemToCancel(item);
        setShowCancelVerification(true);
    };

    const handleVerifyAndCancelKOT = async () => {
        if (!verificationCode) {
            alert("Please enter verification code");
            return;
        }
        try {
            await posService.cancelKOT(itemToCancel.id, verificationCode);
            alert("KOT cancelled successfully!");
            setShowCancelVerification(false);
            setVerificationCode('');
            setItemToCancel(null);
            fetchWaiterDetails();
            fetchTodayItems();
        } catch (error) {
            console.error("Error cancelling KOT:", error);
            alert(error.response?.data?.message || "Invalid verification code or failed to cancel KOT");
        }
    };

    const handleUpdateTableStatus = async (newStatus) => {
        if (!selectedWaiter || !newStatus) return;
        try {
            await posService.updateTableStatus(selectedWaiter, newStatus);
            alert(`Table status updated to ${newStatus}`);
            fetchWaiters();
        } catch (error) {
            console.error("Error updating table status:", error);
            alert("Failed to update table status");
        }
    };

    // Get table status color
    const getTableStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-[#51CC5D]/10 text-[#199D26]';
            case 'occupied': return 'bg-[#EF4444]/10 text-[#EF4444]';
            case 'reserved': return 'bg-[#F4A100]/10 text-[#F4A100]';
            default: return 'bg-[#E4E6EA] text-[#667085]';
        }
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
                                                Waiter Management
                                            </h1>
                                            <p className="text-xs sm:text-sm text-[#667085] truncate">
                                                Manage waiter orders and process payments
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cashier Information */}
                                <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 xl:mb-6 mb-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[12px] text-[#667085] mb-1">Cashier Name</p>
                                            <p className="text-[14px] font-[500] text-[#383E49]">{cashierInfo.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-[#667085] mb-1">Cashier ID</p>
                                            <p className="text-[14px] font-[500] text-[#383E49]">{cashierInfo.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-[#667085] mb-1">Date</p>
                                            <p className="text-[14px] font-[500] text-[#383E49]">{cashierInfo.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-[#667085] mb-1">Time</p>
                                            <p className="text-[14px] font-[500] text-[#383E49]">{cashierInfo.time}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
                                {/* Order Entry Section */}
                                <div className="xl:col-span-2 space-y-4 xl:space-y-6">
                                    {/* Waiter Selection */}
                                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
                                                <TableProperties size={18} />
                                                Waiter Selection
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                            {waiters.map(table => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedWaiter(table.id)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${selectedWaiter === table.id
                                                        ? 'border-[#0F50AA] bg-[#0F50AA]/5'
                                                        : 'border-[#E4E6EA] hover:border-[#0F50AA]/30'
                                                        }`}
                                                >
                                                    <div className="text-center">
                                                        <p className="text-[14px] font-[500] text-[#383E49]">{table.name}</p>
                                                        <p className="text-[10px] text-[#667085]">@{table.username}</p>
                                                        <span className={`inline-flex px-2 py-1 text-[10px] font-[500] rounded-full mt-1 ${getTableStatusColor(table.status)}`}>
                                                            {table.status}
                                                        </span>
                                                        {waiterOrders[table.id] && (
                                                            <div className="mt-1">
                                                                <span className="text-[10px] bg-[#0F50AA] text-white px-1 rounded">
                                                                    {waiterOrders[table.id].length} items
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Table Actions - Transfer Table */}
                                    {selectedWaiter && (
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[12px] text-[#667085] mb-1">Transfer to Waiter</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={targetWaiterId}
                                                            onChange={(e) => setTargetWaiterId(e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none bg-white"
                                                        >
                                                            <option value="">Select waiter to transfer to</option>
                                                            {waiters
                                                                .filter(t => t.status === 'available' && String(t.id) !== String(selectedWaiter))
                                                                .map(t => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                        </select>
                                                        <button
                                                            onClick={handleTransferWaiter}
                                                            disabled={!targetWaiterId}
                                                            className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors text-[14px] font-[500] disabled:opacity-50"
                                                        >
                                                            Transfer
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="w-full sm:w-48">
                                                    <label className="block text-[12px] text-[#667085] mb-1">Update Table Status</label>
                                                    <select
                                                        value={waiters.find(t => t.id === selectedWaiter)?.status || ''}
                                                        onChange={(e) => handleUpdateTableStatus(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none bg-white font-[500]"
                                                    >
                                                        <option value="available">Available</option>
                                                        <option value="occupied">Occupied</option>
                                                        <option value="reserved">Reserved</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Product Search & Selection */}
                                    {selectedWaiter && (
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
                                                    <Package size={18} />
                                                    Product Selection
                                                </h3>

                                                <button
                                                    onClick={() => setShowProductGrid(!showProductGrid)}
                                                    className="px-3 py-2 border border-[#E4E6EA] rounded-lg text-[#667085] hover:bg-[#F8F9FA] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                                                >
                                                    <Eye size={14} />
                                                    {showProductGrid ? 'Hide' : 'Show'} Products
                                                </button>
                                            </div>


                                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search products by name or code..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]/10"
                                                    />
                                                </div>
                                                <select
                                                    value={categoryFilter}
                                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                                    className="px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none bg-white"
                                                >
                                                    {categories.map((category, index) => (
                                                        <option key={category} value={category === 'All' ? '' : category}>
                                                            {category} {index > 0 ? `(${index})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {(showProductGrid || searchTerm) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                                    {filteredProducts.map(product => (
                                                        <div key={product.id} className="border border-[#E4E6EA] rounded-lg p-3 hover:border-[#0F50AA]/30 transition-colors">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <p className="text-[14px] font-[500] text-[#383E49]">{product.name}</p>
                                                                    <p className="text-[12px] text-[#667085]">{product.code} | {product.category}</p>
                                                                    <p className="text-[11px] text-[#667085] mt-1">{product.description}</p>
                                                                    <p className="text-[11px] font-[600] text-[#199D26] mt-1">Available Qty: {product.currentQty}</p>
                                                                </div>
                                                                <p className="text-[14px] font-[600] text-[#0F50AA]">Rs. {product.price}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => addToOrder(product)}
                                                                className="w-full px-3 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors text-[12px] font-[500] flex items-center justify-center gap-2"
                                                            >
                                                                <Plus size={14} />
                                                                Add to Order
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {filteredProducts.length === 0 && (
                                                        <div className="col-span-full text-center py-8">
                                                            <Package size={32} className="text-[#E4E6EA] mx-auto mb-2" />
                                                            <p className="text-[14px] text-[#667085]">No products found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Current Table Order */}
                                    {selectedWaiter && (
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA]">
                                            <div className="p-4 border-b border-[#E4E6EA] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
                                                    <Utensils size={18} />
                                                    Current Order - {waiters.find(t => t.id === selectedWaiter)?.name}
                                                </h3>

                                                {currentOrder.length > 0 && (
                                                    <button
                                                        onClick={generateKOT}
                                                        className="px-4 py-2 bg-[#B3A5FF] text-white rounded-lg hover:bg-[#A594FF] transition-colors text-[14px] font-[500] flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
                                                    >
                                                        <ChefHat size={16} />
                                                        Generate KOT
                                                    </button>
                                                )}
                                            </div>


                                            <div className="px-2">
                                                {currentOrder.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead className="bg-[#F8F9FA]">
                                                                <tr>
                                                                    <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Item</th>
                                                                    <th className="text-center px-4 py-3 text-[12px] font-[600] text-[#383E49]">Qty</th>
                                                                    <th className="text-right px-4 py-3 text-[12px] font-[600] text-[#383E49]">Unit Price</th>
                                                                    <th className="text-right px-4 py-3 text-[12px] font-[600] text-[#383E49]">Total</th>
                                                                    <th className="text-left px-4 py-3 text-[12px] font-[600] text-[#383E49]">Production Center</th>
                                                                    <th className="text-center px-4 py-3 text-[12px] font-[600] text-[#383E49]">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {currentOrder.map((item) => (
                                                                    <tr key={item.id} className={`border-b border-[#E4E6EA] transition-all ${highlightedItemId === item.id ? 'pulse-item bg-[#0F50AA]/5' : 'hover:bg-[#F8F9FA]'}`}>
                                                                        <td className="px-4 py-3">
                                                                            <div>
                                                                                <p className="text-[14px] font-[500] text-[#383E49]">{item.name}</p>
                                                                                <p className="text-[12px] text-[#667085]">{item.code}</p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <button
                                                                                    onClick={() => updateOrderQuantity(item.id, item.qty - 1)}
                                                                                    className="w-6 h-6 flex items-center justify-center border border-[#E4E6EA] rounded text-[#667085] hover:bg-[#F8F9FA]"
                                                                                >
                                                                                    <Minus size={12} />
                                                                                </button>
                                                                                <span className="w-8 text-center text-[14px] font-[500] text-[#383E49]">
                                                                                    {item.qty}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => updateOrderQuantity(item.id, item.qty + 1)}
                                                                                    className="w-6 h-6 flex items-center justify-center border border-[#E4E6EA] rounded text-[#667085] hover:bg-[#F8F9FA]"
                                                                                >
                                                                                    <Plus size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className="text-[14px] font-[500] text-[#383E49]">Rs. {item.unitPrice}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className="text-[14px] font-[600] text-[#0F50AA]">Rs. {item.total}</span>
                                                                        </td>
                                                                         <td className="px-4 py-3">
                                                                            {item.isKotEnabled ? (
                                                                                <select
                                                                                    value={item.selectedCenterId || ''}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setCurrentOrder(prev => prev.map(o => o.id === item.id ? { ...o, selectedCenterId: val } : o));
                                                                                    }}
                                                                                    disabled={!!item.kotId}
                                                                                    className="w-full px-2 py-1 border border-[#E4E6EA] rounded text-[12px] focus:border-[#0F50AA] focus:outline-none disabled:bg-[#F8F9FA]"
                                                                                >
                                                                                    <option value="">Select Center</option>
                                                                                    {productionCenters.map(pc => (
                                                                                        <option key={pc.id} value={pc.id}>{pc.centerName}</option>
                                                                                    ))}
                                                                                </select>
                                                                            ) : null}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                {item.isKotEnabled && (
                                                                                    <>
                                                                                        {!item.kotId ? (
                                                                                            <button
                                                                                                className="px-3 py-1 bg-[#B3A5FF] text-white rounded-lg hover:bg-[#A594FF] transition-colors text-[12px] font-[500] flex items-center gap-1"
                                                                                                onClick={() => handleGenerateKOTForItem(item)}
                                                                                            >
                                                                                                <ChefHat size={12} />
                                                                                                KOT
                                                                                            </button>
                                                                                        ) : (
                                                                                            <button
                                                                                                className="px-3 py-1 bg-[#EF4444] text-white rounded-lg hover:bg-[#D93030] transition-colors text-[12px] font-[500]"
                                                                                                onClick={() => handleCancelKOTRequest(item)}
                                                                                            >
                                                                                                Cancel KOT
                                                                                            </button>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => removeOrderItem(item.id)}
                                                                                    disabled={!!item.kotId}
                                                                                    className="p-1 text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors disabled:opacity-30"
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
                                                        <Utensils size={48} className="text-[#E4E6EA] mx-auto mb-3" />
                                                        <p className="text-[14px] text-[#667085]">No items in the order</p>
                                                        <p className="text-[12px] text-[#667085] mt-1">Add items to start building the order</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Summary & Payment */}
                                <div className="xl:col-span-1">
                                    <div className="sticky top-0 space-y-4 xl:space-y-6">
                                        {/* Order Summary */}
                                        {selectedWaiter && currentOrder.length > 0 && (
                                            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                                                    <Receipt size={18} />
                                                    Order Summary
                                                </h3>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-[#667085]">Items:</span>
                                                        <span className="font-[500] text-[#383E49]">{currentOrder.length}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-[#667085]">Subtotal:</span>
                                                        <span className="font-[500] text-[#383E49]">Rs. {subtotal}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-[#667085]">Tax (10%):</span>
                                                        <span className="font-[500] text-[#383E49]">Rs. {tax.toFixed(2)}</span>
                                                    </div>
                                                    <div className="border-t border-[#E4E6EA] pt-3">
                                                        <div className="flex justify-between text-[16px]">
                                                            <span className="text-[#383E49] font-[600]">Total Payable:</span>
                                                            <span className="font-[600] text-[#0F50AA]">Rs. {totalPayable.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>


                                                <div className="space-y-3">
                                                    <button
                                                        onClick={requestBill}
                                                        className="w-full px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors text-[14px] font-[500] flex items-center justify-center gap-2"
                                                    >
                                                        <Receipt size={16} />
                                                        Request Bill
                                                    </button>

                                                    <button
                                                        onClick={() => setCurrentOrder([])}
                                                        className="w-full px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors text-[14px] font-[500] flex items-center justify-center gap-2"
                                                    >
                                                        <RotateCcw size={16} />
                                                        Clear Order
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Table Status Overview */}
                                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                            <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                                                <Users size={18} />
                                                Table Overview
                                            </h3>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[14px]">
                                                    <span className="text-[#667085]">Total Tables:</span>
                                                    <span className="font-[500] text-[#383E49]">{waiters.length}</span>
                                                </div>
                                                <div className="flex justify-between text-[14px]">
                                                    <span className="text-[#667085]">Available:</span>
                                                    <span className="font-[500] text-[#51CC5D]">
                                                        {waiters.filter(t => t.status === 'available').length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[14px]">
                                                    <span className="text-[#667085]">Occupied:</span>
                                                    <span className="font-[500] text-[#EF4444]">
                                                        {waiters.filter(t => t.status === 'occupied').length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[14px]">
                                                    <span className="text-[#667085]">Reserved:</span>
                                                    <span className="font-[500] text-[#F4A100]">
                                                        {waiters.filter(t => t.status === 'reserved').length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        {!selectedWaiter && (
                                            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4">
                                                <h3 className="text-[16px] font-[600] text-[#383E49] mb-4">Quick Start</h3>
                                                <div className="text-center py-6">
                                                    <TableProperties size={48} className="text-[#E4E6EA] mx-auto mb-3" />
                                                    <p className="text-[14px] text-[#667085] mb-2">Select a table to start taking orders</p>
                                                    <p className="text-[12px] text-[#667085]">Choose from available waiters above</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* KOT Modal */}
            {showKOTModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ChefHat size={32} className="text-purple-600" />
                                </div>
                                <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Generate KOT</h3>
                                <p className="text-[14px] text-[#667085]">
                                    Kitchen Order Ticket for {waiters.find(t => t.id === selectedWaiter)?.name}
                                </p>
                            </div>

                            <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6">
                                <div className="text-center mb-4">
                                    <p className="text-[12px] text-[#667085]">KOT #{Date.now()}</p>
                                    <p className="text-[14px] font-[500] text-[#383E49]">
                                        {waiters.find(t => t.id === selectedWaiter)?.name}
                                    </p>
                                    <p className="text-[12px] text-[#667085]">{new Date().toLocaleString()}</p>
                                </div>

                                <div className="space-y-2">
                                    {currentOrder.map(item => (
                                        <div key={item.id} className="flex justify-between text-[12px]">
                                            <span className="flex-1">{item.name}</span>
                                            <span className="w-8 text-center">x{item.qty}</span>
                                            {item.instructions && (
                                                <span className="text-[#667085] text-[10px]">({item.instructions})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowKOTModal(false)}
                                    className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors w-full"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        setShowKOTModal(false);
                                        alert('KOT sent to kitchen!');
                                    }}
                                    className="flex-1 px-4 py-3 bg-[#B3A5FF] text-white rounded-lg hover:bg-[#A594FF] transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                    <Send size={16} />
                                    Send to Kitchen
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Bill Modal */}
            {showBillModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Receipt size={32} className="text-blue-600" />
                                </div>
                                <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Process Payment</h3>
                                <p className="text-[14px] text-[#667085]">
                                    Complete the payment for {waiters.find(t => t.id === selectedWaiter)?.name}
                                </p>
                            </div>

                            {/* Bill Summary */}
                            <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6">
                                <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Bill Summary</h4>

                                <div className="space-y-2 mb-4">
                                    {currentOrder.map(item => (
                                        <div key={item.id} className="flex items-center gap-2 text-[12px]">
                                            {promoScope === 'SELECTED' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPromoItems.includes(item.id)}
                                                    onChange={() => {
                                                        setSelectedPromoItems(prev => 
                                                            prev.includes(item.id) 
                                                                ? prev.filter(id => id !== item.id) 
                                                                : [...prev, item.id]
                                                        );
                                                    }}
                                                    className="w-3 h-3 accent-[#0F50AA]"
                                                />
                                            )}
                                            <span className="flex-1">{item.name} x{item.qty}</span>
                                            <span className="font-[500]">Rs. {item.total}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[#E4E6EA] pt-3 space-y-2">
                                    <div className="flex justify-between text-[14px]">
                                        <span className="text-[#667085]">Subtotal:</span>
                                        <span className="font-[500]">Rs. {subtotal}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between text-[14px] text-[#D92D20]">
                                            <span>Promotion Discount:</span>
                                            <span className="font-[500]">-Rs. {totalDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-[14px]">
                                        <span className="text-[#667085]">Tax (10%):</span>
                                        <span className="font-[500]">Rs. {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[16px] font-[600] border-t border-[#E4E6EA] pt-2">
                                        <span className="text-[#383E49]">Total:</span>
                                        <span className="text-[#0F50AA]">Rs. {totalPayable.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Promo Section */}
                            <div className="mb-6">
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Discount / Promo</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Enter promo code"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            disabled={!!appliedPromo}
                                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none disabled:bg-[#F8F9FA] disabled:text-[#A0AEC0]"
                                        />
                                        {appliedPromo && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[#51CC5D] text-[12px] font-[500]">
                                                <Check size={14} />
                                                Applied
                                            </div>
                                        )}
                                    </div>
                                    {appliedPromo ? (
                                        <button
                                            onClick={removePromo}
                                            className="px-4 py-2 bg-[#FEE4E2] text-[#D92D20] rounded-lg hover:bg-[#Fecdca] transition-colors text-[14px] font-[500]"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            onClick={verifyPromo}
                                            className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors text-[14px] font-[500]"
                                        >
                                            Apply
                                        </button>
                                    )}
                                </div>
                                {appliedPromo && (
                                    <div className="mt-4">
                                        <h4 className="text-[13px] font-[500] text-[#383E49] mb-2">Discount Scope</h4>
                                        <div className="flex gap-2 p-1 bg-[#F8F9FA] rounded-md border border-[#E4E6EA]">
                                            {[
                                                { id: 'EVERY', label: 'Every Item' },
                                                { id: 'TOTAL', label: 'Full Total' },
                                                { id: 'SELECTED', label: 'Selected' }
                                            ].map(scope => (
                                                <button
                                                    key={scope.id}
                                                    onClick={() => setPromoScope(scope.id)}
                                                    className={`flex-1 py-1 px-2 rounded-md text-[11px] font-[500] transition-all ${
                                                        promoScope === scope.id 
                                                            ? 'bg-white text-[#0F50AA] shadow-sm' 
                                                            : 'text-[#667085] hover:text-[#383E49]'
                                                    }`}
                                                >
                                                    {scope.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Payment Section */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method.paymentMethodId} value={method.name}>
                                                {method.name}
                                            </option>
                                        ))}

                                    </select>
                                </div>

                                {(() => {
                                    const selectedMethodObj = paymentMethods.find(m => m.name.toUpperCase() === (paymentMethod || '').toUpperCase()) || {};
                                    const isFreeMeal = selectedMethodObj.category === 'FREE_MEAL';

                                    return (
                                        <>
                                            {isFreeMeal ? (
                                                <div>
                                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Reason for Free Meal *</label>
                                                    <textarea
                                                        placeholder="Please specify the reason (minimum 10 characters)"
                                                        value={freeMealReason}
                                                        onChange={(e) => setFreeMealReason(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none resize-none"
                                                        rows="3"
                                                    />
                                                    <div className="mt-2 p-2 bg-[#F0F8FF] border border-[#0F50AA] rounded-lg text-[13px] text-[#0F50AA]">
                                                        Free Meal: No charge for this transaction.
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Amount Received</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]">Rs.</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={amountReceived}
                                                                onChange={(e) => setAmountReceived(e.target.value)}
                                                                className="w-full pl-12 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>

                                                    {amountReceived && (
                                                        <div className="p-3 bg-[#F0F8FF] border border-[#0F50AA] rounded-lg">
                                                            <div className="flex justify-between text-[14px]">
                                                                <span className="text-[#383E49]">Change Due:</span>
                                                                <span className="font-[600] text-[#0F50AA]">
                                                                    Rs. {Math.max(0, parseFloat(amountReceived || 0) - totalPayable).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowBillModal(false)}
                                    className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors w-full"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={processPayment}
                                    disabled={(() => {
                                        const selectedMethodObj = paymentMethods.find(m => m.name === paymentMethod) || {};
                                        const isFreeMeal = selectedMethodObj.category === 'FREE_MEAL';
                                        return isFreeMeal ? freeMealReason.trim().length < 10 : (!amountReceived || parseFloat(amountReceived) < totalPayable);
                                    })()}
                                    className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
                                >
                                    <CreditCard size={16} />
                                    Process Payment
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
                                <h3 className="text-[20px] font-[600] text-[#383E49] mb-2">Payment Successful!</h3>
                                <p className="text-[14px] text-[#667085] mb-4">
                                    The order has been completed and the table is now available
                                </p>
                                <div className="bg-[#F0F8FF] border border-[#0F50AA] rounded-lg p-4">
                                    <p className="text-[12px] text-[#667085] mb-1">Bill ID</p>
                                    <p className="text-[18px] font-[600] text-[#0F50AA]">{generatedBillId}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                    <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Payment Summary</h4>
                                    <div className="space-y-2 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Total Amount:</span>
                                            <span className="font-[500] text-[#383E49]">Rs. {successPaymentDetails?.totalAmount?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Received Amount:</span>
                                            <span className="font-[500] text-[#383E49]">Rs. {successPaymentDetails?.amountReceived?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Change Due:</span>
                                            <span className="font-[500] text-[#0F50AA]">Rs. {successPaymentDetails?.changeAmount?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Payment Method:</span>
                                            <span className="font-[500] text-[#383E49]">{paymentMethod}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#667085]">Completed At:</span>
                                            <span className="font-[500] text-[#383E49]">{new Date().toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handlePrintReceipt}
                                    className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Receipt size={16} />
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Table Modal */}
            {showNewTableModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-[#383E49]">Add New Table</h3>
                                <button
                                    onClick={() => setShowNewTableModal(false)}
                                    className="p-1 text-[#667085] hover:bg-[#F8F9FA] rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTable} className="space-y-4">
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Table Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTableData.name}
                                        onChange={(e) => setNewTableData({ ...newTableData, name: e.target.value })}
                                        placeholder="e.g. Table 7"
                                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={newTableData.status}
                                        onChange={(e) => setNewTableData({ ...newTableData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none bg-white"
                                    >
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="reserved">Reserved</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Seat Count
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newTableData.seats}
                                        onChange={(e) => setNewTableData({ ...newTableData, seats: e.target.value })}
                                        placeholder="e.g. 4"
                                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTableModal(false)}
                                        className="flex-1 px-4 py-2 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors"
                                    >
                                        Save Table
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* KOT Cancellation Verification Modal */}
            {showCancelVerification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-red-600" />
                                </div>
                                <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Manager Verification Required</h3>
                                <p className="text-[14px] text-[#667085]">
                                    Please enter your manager verification code to cancel KOT for {itemToCancel?.name}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                                        Verification Code
                                    </label>
                                    <input
                                        type="password"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="Enter code"
                                        className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowCancelVerification(false);
                                            setVerificationCode('');
                                            setItemToCancel(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVerifyAndCancelKOT}
                                        className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#D93030] transition-colors"
                                    >
                                        Verify & Cancel
                                    </button>
                                </div>
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

            {/* Hidden Print Receipt Template */}
            {printData && (
                <div id="print-receipt" className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-black font-mono w-[80mm] text-xs">
                    <style dangerouslySetInnerHTML={{__html: `
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            #print-receipt, #print-receipt * {
                                visibility: visible !important;
                            }
                            #print-receipt {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 80mm !important;
                                padding: 5mm !important;
                            }
                            .page-break {
                                page-break-before: always !important;
                                break-before: page !important;
                                margin-top: 15px;
                            }
                        }
                    `}} />
                    
                    {/* Main Receipt Content */}
                    {printData.printBill !== false && (
                        <>
                            {[...Array(printData.isUberOrPickMe ? 2 : 1)].map((_, copyIdx) => (
                                <div key={copyIdx} className={copyIdx > 0 ? "page-break pt-4 mt-4 border-t border-dashed" : ""}>
                                    <div className="text-center font-bold text-sm mb-1">BAKERY MANAGEMENT SYSTEM</div>
                                    <div className="text-center text-[10px] mb-2">ANURADHAPURA OUTLET</div>
                                    <div className="border-t border-dashed my-1"></div>
                                    <div className="text-center font-bold text-xs mb-2">
                                        {printData.type === 'PROFORMA'
                                            ? 'PROFORMA INVOICE (UNPAID)'
                                            : (printData.isUberOrPickMe
                                                ? (copyIdx === 0 ? 'TAX INVOICE (CUSTOMER COPY)' : 'TAX INVOICE (DELIVERY COPY)')
                                                : 'TAX INVOICE')
                                        }
                                    </div>
                                    <div className="text-[10px] space-y-0.5 mb-2">
                                        <div>Date: {new Date().toLocaleDateString()} Time: {new Date().toLocaleTimeString()}</div>
                                        {printData.transactionId && <div>Txn ID: {printData.transactionId}</div>}
                                        {printData.waiterName && <div>Waiter: {printData.waiterName}</div>}
                                        {printData.cashierName && <div>Cashier: {printData.cashierName}</div>}
                                        {printData.paymentMethod && <div>Payment: {printData.paymentMethod}</div>}
                                        {printData.deliveryOption && <div>Channel: {printData.deliveryOption}</div>}
                                    </div>
                                    <div className="border-t border-dashed my-1"></div>
                                    <table className="w-full text-[10px] text-left mb-2">
                                        <thead>
                                            <tr className="border-b border-dashed">
                                                <th className="py-1">Item</th>
                                                <th className="py-1 text-center">Qty</th>
                                                <th className="py-1 text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {printData.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-1 max-w-[40mm] truncate">{item.productName || item.name}</td>
                                                    <td className="py-1 text-center">{item.qty || item.quantity}</td>
                                                    <td className="py-1 text-right">Rs. {((item.unitPrice || item.price) * (item.qty || item.quantity)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="border-t border-dashed my-1"></div>
                                    <div className="text-xs space-y-1 mb-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Subtotal:</span>
                                            <span>Rs. {printData.subTotal.toFixed(2)}</span>
                                        </div>
                                        {printData.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span>Discount:</span>
                                                <span>Rs. {printData.discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t border-dashed pt-1">
                                            <span>Total:</span>
                                            <span>Rs. {printData.finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-dashed my-2"></div>
                                    <div className="text-center text-[10px] italic">
                                        THANK YOU! COME AGAIN.
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Separate KOT Token Slips for Each KOT Item */}
                    {printData.kotItems && printData.kotItems.length > 0 && printData.kotItems.map((item, idx) => (
                        <div key={idx} className="page-break pt-4 border-t border-dashed">
                            <div className="text-center font-bold text-sm mb-0.5">KITCHEN ORDER TICKET (KOT)</div>
                            <div className="text-center text-[10px] font-bold mb-1">SLIP #{idx + 1} OF {printData.kotItems.length}</div>
                            <div className="text-center text-[10px] mb-2">ANURADHAPURA OUTLET</div>
                            <div className="border-t border-dashed my-1"></div>
                            <div className="text-[10px] space-y-0.5 mb-2">
                                <div>Date: {new Date().toLocaleDateString()} Time: {new Date().toLocaleTimeString()}</div>
                                {printData.transactionId && <div>Txn ID: {printData.transactionId}</div>}
                                {printData.waiterName && <div>Waiter: {printData.waiterName}</div>}
                                {printData.cashierName && <div>Cashier: {printData.cashierName}</div>}
                            </div>
                            <div className="border-t border-dashed my-1"></div>
                            <div className="my-2 p-2 border border-dashed rounded">
                                <div className="text-[12px] font-bold">KOT ITEM: {item.productName || item.name}</div>
                                <div className="text-[12px] font-bold mt-1">QTY: {item.qty || item.quantity}</div>
                                {item.specialInstructions && (
                                    <div className="text-[10px] text-gray-800 italic font-mono mt-1">
                                        * Note: {item.specialInstructions}
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-dashed my-2"></div>
                            <div className="text-center text-[9px] italic font-bold">
                                * PLEASE PREPARE KOT ITEM IMMEDIATELY *
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}