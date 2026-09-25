import React, { useState, useRef, useEffect } from "react";
import {
    RotateCcw,
    Search,
    Receipt,
    AlertTriangle,
    Check,
    X,
    Trash2,
    Package,
    DollarSign,
    CreditCard,
    Building2,
    ArrowLeft,
    Scan,
    RefreshCw,
    ShoppingBag,
    Calendar,
    User,
    Hash,
    Eye,
    ChevronDown,
    ChevronUp,
    FileText,
    Lock,
    ArrowRight,
    Plus,
    Minus,
    MessageCircle
} from "lucide-react";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import posService from "../services/posService";
import axios from "../services/api";
import toast from "react-hot-toast";

export default function POSReturns() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Returns');
    const [currentStep, setCurrentStep] = useState(1);
    const receiptInputRef = useRef(null);

    // Step 1: Transaction Search
    const [receiptId, setReceiptId] = useState('');
    const [foundTransaction, setFoundTransaction] = useState(null);

    // Step 2: Item Selection
    const [selectedItems, setSelectedItems] = useState([]);
    const [returnReason, setReturnReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    // Step 3: Return Type Selection
    const [refundType, setRefundType] = useState(''); // refund, exchange

    // Step 4: Exchange/Refund Processing
    const [exchangeItems, setExchangeItems] = useState([]);
    const [showExchangeProducts, setShowExchangeProducts] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [additionalPayment, setAdditionalPayment] = useState(0);

    // Step 5: Final Confirmation
    const [processedReturn, setProcessedReturn] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [managerVerificationCode, setManagerVerificationCode] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [printReturnData, setPrintReturnData] = useState(null);

    // Mobile responsive states
    const [showReturnSummary, setShowReturnSummary] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});

    const [todaySales, setTodaySales] = useState([]);
    const [exchangeProducts, setExchangeProducts] = useState([]);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);

    // Fetch today's sales and exchange products from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = process.env.REACT_APP_BASE_URL || "";
                
                // Fetch today's sales
                const salesData = await posService.getTodaySalesForReturn();
                setTodaySales(salesData);

                // Fetch products for exchange (using today-production-items as seen in other POS pages)
                const outletId = localStorage.getItem("outletId");
                const productsData = await posService.getTodayItems(outletId);
                
                const mappedProducts = productsData.map(item => ({
                    id: item.productId,
                    dayProductionItemId: item.dayProductionItemId,
                    name: item.productName,
                    code: item.productCode,
                    price: item.unitPrice,
                    stock: item.currentQty
                }));
                setExchangeProducts(mappedProducts);

                // Fetch payment methods
                const paymentMethodsData = await posService.getPaymentMethods();
                setAvailablePaymentMethods(paymentMethodsData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    // Return reason options
    const returnReasons = [
        { value: 'damaged', label: 'Damaged Product' },
        { value: 'wrong_item', label: 'Wrong Item Delivered' },
        { value: 'expired', label: 'Expired Product' },
        { value: 'quality_issue', label: 'Quality Issue' },
        { value: 'customer_dissatisfaction', label: 'Customer Dissatisfaction' },
        { value: 'other', label: 'Other (Please specify)' }
    ];

    // Focus receipt input on page load
    useEffect(() => {
        if (receiptInputRef.current && currentStep === 1) {
            receiptInputRef.current.focus();
        }
    }, [currentStep]);

    // Step Indicator Component
    const renderStepIndicator = () => (
        <div className="mb-4 sm:mb-6">
            <div className="w-full overflow-x-auto">
                <div className="flex items-center justify-center min-w-max px-2 pb-2">
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        {/* Step 1 - Transaction Search */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 1
                                ? 'border-brand-fg bg-brand text-on-brand'
                                : currentStep > 1
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                                }`}>
                                {currentStep > 1 ?
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> :
                                    <Search size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap ${currentStep === 1 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                }`}>
                                Search
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 1 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 2 - Item Selection */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 2
                                ? 'border-brand-fg bg-brand text-on-brand'
                                : currentStep > 2
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                                }`}>
                                {currentStep > 2 ?
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> :
                                    <Package size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap ${currentStep === 2 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                }`}>
                                Items
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 2 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 3 - Return Type */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 3
                                ? 'border-brand-fg bg-brand text-on-brand'
                                : currentStep > 3
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                                }`}>
                                {currentStep > 3 ?
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> :
                                    <RefreshCw size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap ${currentStep === 3 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                }`}>
                                Type
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 3 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 4 - Processing */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 4
                                ? 'border-brand-fg bg-brand text-on-brand'
                                : currentStep > 4
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                                }`}>
                                {currentStep > 4 ?
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> :
                                    <DollarSign size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap ${currentStep === 4 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                }`}>
                                Process
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 4 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 5 - Confirmation */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${currentStep === 5
                                ? 'border-brand-fg bg-brand text-on-brand'
                                : 'border-line bg-surface text-fg-secondary'
                                }`}>
                                <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs text-center whitespace-nowrap ${currentStep === 5 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                }`}>
                                Confirm
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Search for transaction
    const handleReceiptSearch = () => {
        if (!receiptId.trim()) {
            toast.error('Please enter a transaction ID');
            return;
        }

        const rawInput = receiptId.trim();
        const cleanedInput = rawInput.replace(/^(#|BILL-|SALE-|INV-|TXN-)/i, '').replace(/^0+/, '').trim();

        const transaction = todaySales.find(sale => {
            if (!sale) return false;
            const saleBillNo = sale.billNumber || (sale.saleId ? `BILL-${String(sale.saleId).padStart(6, '0')}` : '');
            const sId = sale.saleId ? sale.saleId.toString() : '';
            return (
                (saleBillNo && saleBillNo.toLowerCase() === rawInput.toLowerCase()) ||
                (sId && sId === cleanedInput) ||
                (sId && sId === rawInput)
            );
        });
        
        if (transaction) {
            const mappedTransaction = {
                id: transaction.saleId.toString(),
                saleId: transaction.saleId,
                billNumber: transaction.billNumber || `BILL-${String(transaction.saleId).padStart(6, '0')}`,
                date: transaction.saleDate,
                time: transaction.saleTime,
                cashier: transaction.cashierName,
                total: transaction.totalAmount,
                items: transaction.saleItems.map(item => ({
                    id: item.saleItemId,
                    name: item.productName,
                    code: item.productCode,
                    price: item.price,
                    quantity: item.qty,
                    total: item.price * item.qty
                }))
            };

            setFoundTransaction(mappedTransaction);
            setSelectedItems(mappedTransaction.items.map(item => ({
                ...item,
                returnQuantity: 0,
                resellable: true
            })));
            setCurrentStep(2);
        } else {
            toast.error('Transaction not found in today\'s sales. Please check the Bill ID (e.g. BILL-000001 or 1).');
        }
    };

    // Update return quantity for an item
    const updateReturnQuantity = (itemId, quantity) => {
        setSelectedItems(selectedItems.map(item =>
            item.id === itemId
                ? { ...item, returnQuantity: Math.max(0, Math.min(quantity, item.quantity)) }
                : item
        ));
    };

    // Toggle resellable status
    const toggleResellable = (itemId) => {
        setSelectedItems(selectedItems.map(item =>
            item.id === itemId
                ? { ...item, resellable: !item.resellable }
                : item
        ));
    };


    // Calculate return totals
    const returnItems = selectedItems.filter(item => item.returnQuantity > 0);
    const returnTotal = returnItems.reduce((sum, item) =>
        sum + (item.price * item.returnQuantity), 0
    );

    // Add exchange item
    const addExchangeItem = (product) => {
        const existingItem = exchangeItems.find(item => item.id === product.id);
        if (existingItem) {
            setExchangeItems(exchangeItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setExchangeItems([...exchangeItems, { ...product, quantity: 1 }]);
        }
    };

    // Remove exchange item
    const removeExchangeItem = (itemId) => {
        setExchangeItems(exchangeItems.filter(item => item.id !== itemId));
    };

    // Update exchange item quantity
    const updateExchangeItemQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeExchangeItem(itemId);
        } else {
            setExchangeItems(exchangeItems.map(item =>
                item.id === itemId
                    ? { ...item, quantity: Math.max(1, quantity) }
                    : item
            ));
        }
    };

    // Calculate exchange total
    const exchangeTotal = exchangeItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
    );

    const balanceAmount = refundType === 'exchange' ? returnTotal - exchangeTotal : returnTotal;

    // Navigation functions
    const goToNextStep = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Step validation
    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return foundTransaction !== null;
            case 2:
                return returnItems.length > 0 && returnReason && (returnReason !== 'other' || customReason.trim().length >= 10);
            case 3:
                return refundType !== '';
            case 4:
                if (refundType === 'exchange') {
                    return exchangeItems.length > 0 && paymentMethod !== '';
                }
                return paymentMethod !== '';
            default:
                return true;
        }
    };

    // Process final return
    const processReturn = () => {
        const returnId = `RET-${Date.now()}`;
        const processedData = {
            returnId,
            originalTransaction: foundTransaction.id,
            returnItems,
            returnReason: returnReason === 'other' ? customReason : returnReasons.find(r => r.value === returnReason)?.label,
            refundType,
            exchangeItems: refundType === 'exchange' ? exchangeItems : [],
            returnTotal,
            exchangeTotal: refundType === 'exchange' ? exchangeTotal : 0,
            balanceAmount,
            paymentMethod,
            processedAt: new Date(),
            cashier: localStorage.getItem("userPhone") || "Current User"
        };

        setProcessedReturn(processedData);
        setShowConfirmModal(true);
    };

    // Confirm return processing
    const confirmReturn = async () => {
        if (!managerVerificationCode.trim()) {
            toast.error("Manager verification code is required to process a return.");
            return;
        }
        try {
            const cashierId = localStorage.getItem("userId") || "34000000-0000-0000-0000-000000000000";

            // Find selected payment method object or fallback to Cash method from backend
            const targetMethodName = (paymentMethod && paymentMethod !== 'none') ? paymentMethod.toString().toLowerCase() : 'cash';

            const defaultCash = (availablePaymentMethods || []).find(m => 
                (m.category && m.category.toString().toUpperCase() === 'CASH') ||
                (m.name && m.name.toString().toLowerCase().includes('cash'))
            ) || (availablePaymentMethods && availablePaymentMethods[0]);
            
            const selectedPaymentMethod = (availablePaymentMethods || []).find(m => {
                const nameMatch = m.name && m.name.toString().toLowerCase() === targetMethodName;
                const catMatch = m.category && m.category.toString().toLowerCase() === targetMethodName;
                return nameMatch || catMatch;
            }) || defaultCash;

            const finalPaymentMethodId = selectedPaymentMethod ? selectedPaymentMethod.paymentMethodId : (defaultCash ? defaultCash.paymentMethodId : 1);

            const targetSaleId = foundTransaction.saleId || parseInt(String(foundTransaction.id).replace(/\D/g, '')) || 1;

            // Construct the final request body
            const requestBody = {
                saleId: targetSaleId,
                returnReason: processedReturn.returnReason,
                refundType: refundType.toUpperCase(), // "REFUND" or "EXCHANGE"
                cashierId: cashierId,
                paymentMethodId: finalPaymentMethodId,
                verificationCode: managerVerificationCode,
                returnItems: returnItems.map(item => ({
                    saleItemId: item.id,
                    qty: item.returnQuantity,
                    unitPrice: item.price,
                    isResellable: item.resellable
                })),
                exchangeItems: refundType === 'exchange' ? exchangeItems.map(item => ({
                    dayProductionItemId: item.dayProductionItemId,
                    qty: item.quantity,
                    unitPrice: item.price
                })) : []
            };

            const data = await posService.processItemReturn(requestBody);

            setShowConfirmModal(false);
            setManagerVerificationCode('');
            setShowSuccessModal(true);
            setCurrentStep(5);
            toast.success('Return processed successfully!');

            // Refresh today's sales to reflect the adjusted totalAmount
            try {
                const salesData = await posService.getTodaySalesForReturn();
                setTodaySales(salesData);
            } catch (refreshErr) {
                console.error("Warning: Failed to refresh today's sales after return:", refreshErr);
            }
        } catch (error) {
            console.error("Error processing return:", error);
            const errorMessage = error.message || "Failed to process return. Please check the server connection and try again.";
            toast.error(errorMessage);
        }
    };

    const handlePrintReceipt = () => {
        if (!processedReturn) return;
        setPrintReturnData(processedReturn);
        toast.success("Return receipt printed!");
        setTimeout(() => {
            window.print();
            setPrintReturnData(null);
        }, 150);
    };

    // Reset form
    const resetForm = () => {
        setCurrentStep(1);
        setReceiptId('');
        setFoundTransaction(null);
        setSelectedItems([]);
        setReturnReason('');
        setCustomReason('');
        setRefundType('');
        setExchangeItems([]);
        setShowExchangeProducts(false);
        setPaymentMethod('');
        setAdditionalPayment(0);
        setProcessedReturn(null);
        setShowReturnSummary(false);
        setExpandedItems({});
        setShowConfirmModal(false);
        setShowSuccessModal(false);
    };

    return (

        <div className="flex bg-app h-screen overflow-hidden">
            <POSSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <POSNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-fg truncate">
                                            Returns
                                        </h1>
                                        <p className="text-xs sm:text-sm text-fg-secondary truncate">
                                            <span className="hidden sm:inline">Processing return - </span>
                                            Step {currentStep} of 5
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Step Indicator */}
                            {renderStepIndicator()}

                            {/* Step 1: Transaction Search */}
                            {currentStep === 1 && (
                                <div className=" mx-auto">
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6 lg:p-8">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={32} className="text-brand-fg" />
                                            </div>
                                            <h2 className="text-[20px] font-[600] text-fg mb-2">Find Original Transaction</h2>
                                            <p className="text-[14px] text-fg-secondary">
                                                Enter transaction ID or scan receipt barcode
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[14px] font-[500] text-fg mb-2">
                                                    Transaction ID *
                                                </label>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={18} />
                                                    <input
                                                        ref={receiptInputRef}
                                                        type="text"
                                                        placeholder="Enter transaction ID (e.g., TXN-001234)"
                                                        value={receiptId}
                                                        onChange={(e) => setReceiptId(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleReceiptSearch()}
                                                        className="w-full pl-10 pr-12 py-3 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                    />
                                                    <button
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-secondary hover:text-brand-fg transition-colors"
                                                    >
                                                        <Scan size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleReceiptSearch}
                                                disabled={!receiptId.trim()}
                                                className="w-full bg-brand text-on-brand py-3 rounded-lg font-[500] hover:bg-brand-hover transition-colors disabled:bg-line disabled:text-fg-secondary flex items-center justify-center gap-2"
                                            >
                                                <Search size={16} />
                                                Search Transaction
                                            </button>
                                        </div>


                                    </div>
                                </div>
                            )}

                            {/* Step 2: Item Selection */}
                            {currentStep === 2 && foundTransaction && (
                                <div className="space-y-6">
                                    {/* Transaction Details */}
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                        <h3 className="text-[18px] font-[600] text-fg mb-4">Original Transaction Details</h3>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-subtle rounded-lg mb-6">
                                            <div>
                                                <p className="text-[12px] text-fg-secondary">Bill ID</p>
                                                <p className="text-[14px] font-[600] text-brand-fg break-all">{foundTransaction.billNumber || foundTransaction.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary">Date & Time</p>
                                                <p className="text-[14px] font-[500] text-fg">{foundTransaction.date} {foundTransaction.time}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary">Cashier</p>
                                                <p className="text-[14px] font-[500] text-fg">{foundTransaction.cashier}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary">Total Amount</p>
                                                <p className="text-[14px] font-[500] text-fg">Rs. {foundTransaction.total.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Items Selection */}
                                        <h4 className="text-[16px] font-[500] text-fg mb-4">Select Items to Return</h4>
                                        <div className="space-y-3">
                                            {selectedItems.map((item) => (
                                                <div key={item.id} className="border border-line rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <p className="text-[14px] font-[500] text-fg">{item.name}</p>
                                                            <p className="text-[12px] text-fg-secondary">{item.code}</p>
                                                            <p className="text-[14px] text-brand-fg font-[500]">
                                                                Rs. {item.price} × {item.quantity} = Rs. {item.total.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-[12px] text-fg-secondary whitespace-nowrap">Return Qty:</label>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => updateReturnQuantity(item.id, item.returnQuantity - 1)}
                                                                        className="w-8 h-8 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle transition-colors"
                                                                        disabled={item.returnQuantity <= 0}
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={item.quantity}
                                                                        value={item.returnQuantity}
                                                                        onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                                                                        className="w-16 text-center py-1 border border-line rounded text-[14px] focus:border-brand-fg focus:outline-none"
                                                                    />
                                                                    <button
                                                                        onClick={() => updateReturnQuantity(item.id, item.returnQuantity + 1)}
                                                                        className="w-8 h-8 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle transition-colors"
                                                                        disabled={item.returnQuantity >= item.quantity}
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                                <span className="text-[12px] text-fg-secondary whitespace-nowrap">/ {item.quantity}</span>
                                                            </div>

                                                            {item.returnQuantity > 0 && (
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.resellable}
                                                                        onChange={() => toggleResellable(item.id)}
                                                                        className="rounded border-line text-brand-fg focus:ring-brand-fg/10"
                                                                    />
                                                                    <span className="text-[12px] text-fg-secondary">Resellable</span>
                                                                </label>
                                                            )}
                                                        </div>

                                                        {item.returnQuantity > 0 && (
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-[16px] font-[600] text-success">
                                                                    Rs. {(item.price * item.returnQuantity).toLocaleString()}
                                                                </p>
                                                                <p className="text-[10px] text-fg-secondary">
                                                                    {item.resellable ? 'Back to stock' : 'Mark as wastage'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Return Reason */}
                                        <div className="mt-6">
                                            <h4 className="text-[16px] font-[500] text-fg mb-4">Return Reason *</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {returnReasons.map((reason) => (
                                                    <label key={reason.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-subtle border border-line transition-colors">
                                                        <input
                                                            type="radio"
                                                            name="returnReason"
                                                            value={reason.value}
                                                            checked={returnReason === reason.value}
                                                            onChange={(e) => setReturnReason(e.target.value)}
                                                            className="text-brand-fg focus:ring-brand-fg/10 mt-0.5"
                                                        />
                                                        <span className="text-[14px] text-fg flex-1">{reason.label}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {returnReason === 'other' && (
                                                <div className="mt-4">
                                                    <textarea
                                                        placeholder="Please specify the reason (minimum 10 characters)"
                                                        value={customReason}
                                                        onChange={(e) => setCustomReason(e.target.value)}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none resize-none"
                                                        rows="3"
                                                    />
                                                    {customReason.trim().length > 0 && customReason.trim().length < 10 && (
                                                        <p className="text-[12px] text-error mt-1">Please enter at least 10 characters</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Return Summary */}
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                        <h3 className="text-[16px] font-[600] text-fg mb-4">Return Summary</h3>

                                        {returnItems.length > 0 ? (
                                            <div className="space-y-3">
                                                {returnItems.map((item) => (
                                                    <div key={item.id} className="flex justify-between text-[14px] py-2 border-b border-line last:border-0">
                                                        <span className="text-fg-secondary">{item.returnQuantity}× {item.name}</span>
                                                        <span className="text-fg font-[500]">
                                                            Rs. {(item.price * item.returnQuantity).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="border-t border-line pt-3">
                                                    <div className="flex justify-between text-[18px] font-[600]">
                                                        <span className="text-fg">Total Return:</span>
                                                        <span className="text-success">Rs. {returnTotal.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Package size={48} className="text-fg-muted mx-auto mb-3" />
                                                <p className="text-[14px] text-fg-secondary">No items selected for return</p>
                                                <p className="text-[12px] text-fg-secondary mt-1">Select items above to continue</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Return Type Selection */}
                            {currentStep === 3 && (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <RefreshCw size={32} className="text-brand-fg" />
                                            </div>
                                            <h2 className="text-[20px] font-[600] text-fg mb-2">Select Return Type</h2>
                                            <p className="text-[14px] text-fg-secondary">
                                                Choose how you want to process the return
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-lg hover:bg-subtle transition-colors ${refundType === 'refund' ? 'border-brand-fg bg-brand/5' : 'border-line'}`}>
                                                <input
                                                    type="radio"
                                                    name="refundType"
                                                    value="refund"
                                                    checked={refundType === 'refund'}
                                                    onChange={(e) => setRefundType(e.target.value)}
                                                    className="text-brand-fg focus:ring-brand-fg/10"
                                                />
                                                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                                                    <DollarSign size={24} className="text-success" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-[16px] font-[500] text-fg">Cash Refund</h3>
                                                    <p className="text-[12px] text-fg-secondary">Return money to customer</p>
                                                    <p className="text-[14px] font-[600] text-success mt-1">
                                                        Rs. {returnTotal.toLocaleString()}
                                                    </p>
                                                </div>
                                            </label>

                                            <label className={`flex items-center gap-4 cursor-pointer p-4 border-2 rounded-lg hover:bg-subtle transition-colors ${refundType === 'exchange' ? 'border-brand-fg bg-brand/5' : 'border-line'}`}>
                                                <input
                                                    type="radio"
                                                    name="refundType"
                                                    value="exchange"
                                                    checked={refundType === 'exchange'}
                                                    onChange={(e) => setRefundType(e.target.value)}
                                                    className="text-brand-fg focus:ring-brand-fg/10"
                                                />
                                                <div className="w-12 h-12 bg-plum/20 rounded-lg flex items-center justify-center">
                                                    <RefreshCw size={24} className="text-plum" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-[16px] font-[500] text-fg">Exchange</h3>
                                                    <p className="text-[12px] text-fg-secondary">Replace with different items</p>
                                                    <p className="text-[14px] font-[600] text-plum mt-1">
                                                        Credit: Rs. {returnTotal.toLocaleString()}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Process Refund/Exchange */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    {refundType === 'refund' && (
                                        <div className="max-w-2xl mx-auto">
                                            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                                <div className="text-center mb-6">
                                                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <DollarSign size={32} className="text-success" />
                                                    </div>
                                                    <h2 className="text-[20px] font-[600] text-fg mb-2">Process Refund</h2>
                                                    <p className="text-[14px] text-fg-secondary">
                                                        Select refund payment method
                                                    </p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="p-4 bg-subtle rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[16px] font-[500] text-fg">Refund Amount:</span>
                                                            <span className="text-[24px] font-[700] text-success">
                                                                Rs. {returnTotal.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[14px] font-[500] text-fg mb-3">
                                                            Payment Method *
                                                        </label>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-subtle transition-colors ${paymentMethod === 'cash' ? 'border-brand-fg bg-brand/5' : 'border-line'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name="paymentMethod"
                                                                    value="cash"
                                                                    checked={paymentMethod === 'cash'}
                                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                                    className="text-brand-fg focus:ring-brand-fg/10"
                                                                />
                                                                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                                                                    <DollarSign size={20} className="text-success" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="text-[14px] font-[500] text-fg">Cash Refund</span>
                                                                    <p className="text-[12px] text-fg-secondary">Immediate cash return</p>
                                                                </div>
                                                            </label>

                                                            <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-subtle transition-colors ${paymentMethod === 'card' ? 'border-brand-fg bg-brand/5' : 'border-line'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name="paymentMethod"
                                                                    value="card"
                                                                    checked={paymentMethod === 'card'}
                                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                                    className="text-brand-fg focus:ring-brand-fg/10"
                                                                />
                                                                <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                                                                    <CreditCard size={20} className="text-brand-fg" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="text-[14px] font-[500] text-fg">Card Refund</span>
                                                                    <p className="text-[12px] text-fg-secondary">Refund to original card</p>
                                                                </div>
                                                            </label>

                                                            <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-subtle transition-colors ${paymentMethod === 'bank' ? 'border-brand-fg bg-brand/5' : 'border-line'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name="paymentMethod"
                                                                    value="bank"
                                                                    checked={paymentMethod === 'bank'}
                                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                                    className="text-brand-fg focus:ring-brand-fg/10"
                                                                />
                                                                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                                                                    <Building2 size={20} className="text-warning" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="text-[14px] font-[500] text-fg">Bank Transfer</span>
                                                                    <p className="text-[12px] text-fg-secondary">Transfer to bank account</p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {refundType === 'exchange' && (
                                        <div className="space-y-6">
                                            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[18px] font-[600] text-fg">Exchange Items</h3>
                                                    <div className="text-right">
                                                        <p className="text-[12px] text-fg-secondary">Available Credit</p>
                                                        <p className="text-[16px] font-[600] text-plum">Rs. {returnTotal.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                {/* Selected Exchange Items */}
                                                {exchangeItems.length > 0 && (
                                                    <div className="mb-6 p-4 bg-subtle rounded-lg">
                                                        <h4 className="text-[14px] font-[500] text-fg mb-3">Selected Items:</h4>
                                                        <div className="space-y-2">
                                                            {exchangeItems.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center p-3 bg-surface rounded-lg border border-line">
                                                                    <div className="flex-1">
                                                                        <p className="text-[14px] font-[500] text-fg">{item.name}</p>
                                                                        <p className="text-[12px] text-fg-secondary">{item.code}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => updateExchangeItemQuantity(item.id, item.quantity - 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle"
                                                                            >
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <span className="text-[14px] font-[500] text-fg w-8 text-center">{item.quantity}</span>
                                                                            <button
                                                                                onClick={() => updateExchangeItemQuantity(item.id, item.quantity + 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle"
                                                                            >
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-[14px] font-[500] text-brand-fg w-20 text-right">
                                                                            Rs. {(item.price * item.quantity).toLocaleString()}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => removeExchangeItem(item.id)}
                                                                            className="text-error hover:bg-error/10 rounded p-1"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="border-t border-line mt-4 pt-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[14px] font-[500] text-fg">Exchange Total:</span>
                                                                <span className="text-[16px] font-[600] text-plum">Rs. {exchangeTotal.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[16px] font-[600] text-fg">Balance:</span>
                                                                <span className={`text-[18px] font-[700] ${balanceAmount >= 0 ? 'text-success' : 'text-error'}`}>
                                                                    Rs. {Math.abs(balanceAmount).toLocaleString()} {balanceAmount >= 0 ? 'Refund' : 'Due'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Product Selection Button */}
                                                <div className="mb-4">
                                                    <button
                                                        onClick={() => setShowExchangeProducts(!showExchangeProducts)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-fg rounded-lg text-brand-fg hover:bg-brand/5 transition-colors"
                                                    >
                                                        <Plus size={20} />
                                                        {showExchangeProducts ? 'Hide Products' : 'Add Exchange Items'}
                                                        {showExchangeProducts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>

                                                {/* Product Selection */}
                                                {showExchangeProducts && (
                                                    <div className="border border-line rounded-lg">
                                                        <div className="p-3 bg-subtle border-b border-line">
                                                            <h4 className="text-[14px] font-[500] text-fg">Available Products</h4>
                                                        </div>
                                                        <div className="max-h-64 overflow-y-auto">
                                                            <div className="grid grid-cols-1 gap-0">
                                                                {exchangeProducts.map((product) => (
                                                                    <div
                                                                        key={product.id}
                                                                        onClick={() => addExchangeItem(product)}
                                                                        className="p-4 hover:bg-subtle transition-colors border-b border-line last:border-0 cursor-pointer"
                                                                    >
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex-1">
                                                                                <p className="text-[14px] font-[500] text-fg">{product.name}</p>
                                                                                <p className="text-[12px] text-fg-secondary">{product.code} • Stock: {product.stock}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[14px] font-[600] text-brand-fg">Rs. {product.price.toLocaleString()}</p>
                                                                                <div className="flex items-center gap-1 text-[12px] text-success mt-1">
                                                                                    <Plus size={12} />
                                                                                    <span>Add Item</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Method Selection */}
                                                {exchangeItems.length > 0 && (
                                                    <div className="mt-6">
                                                        <h4 className="text-[16px] font-[500] text-fg mb-4">Payment Method *</h4>

                                                        {balanceAmount < 0 ? (
                                                            <div className="p-4 bg-subtle border border-error/30 rounded-lg mb-4">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <AlertTriangle size={16} className="text-error" />
                                                                    <h5 className="text-[14px] font-[500] text-error">Additional Payment Required</h5>
                                                                </div>
                                                                <p className="text-[12px] text-error mb-3">
                                                                    Customer needs to pay Rs. {Math.abs(balanceAmount).toLocaleString()} more
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${paymentMethod === 'cash' ? 'border-brand-fg bg-brand/5' : 'border-line bg-surface'}`}>
                                                                        <input
                                                                            type="radio"
                                                                            name="additionalPayment"
                                                                            value="cash"
                                                                            checked={paymentMethod === 'cash'}
                                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                                            className="text-brand-fg focus:ring-brand-fg/10"
                                                                        />
                                                                        <DollarSign size={16} className="text-success" />
                                                                        <span className="text-[12px] font-[500] text-fg">Cash Refund</span>
                                                                    </label>
                                                                    <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${paymentMethod === 'card' ? 'border-brand-fg bg-brand/5' : 'border-line bg-surface'}`}>
                                                                        <input
                                                                            type="radio"
                                                                            name="refundMethod"
                                                                            value="card"
                                                                            checked={paymentMethod === 'card'}
                                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                                            className="text-brand-fg focus:ring-brand-fg/10"
                                                                        />
                                                                        <CreditCard size={16} className="text-brand-fg" />
                                                                        <span className="text-[12px] font-[500] text-fg">Card Refund</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-subtle border border-brand-fg rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <RefreshCw size={16} className="text-brand-fg" />
                                                                    <h5 className="text-[14px] font-[500] text-brand-fg">Even Exchange</h5>
                                                                </div>
                                                                <p className="text-[12px] text-brand-fg">
                                                                    Perfect balance! No additional payment or refund needed.
                                                                </p>
                                                                <input
                                                                    type="hidden"
                                                                    name="paymentMethod"
                                                                    value="none"
                                                                    onChange={() => setPaymentMethod('none')}
                                                                />
                                                                {paymentMethod !== 'none' && setPaymentMethod('none')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Final Confirmation/Success */}
                            {currentStep === 5 && processedReturn && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                        <div className="text-center mb-6">
                                            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Check size={40} className="text-success" />
                                            </div>
                                            <h2 className="text-[22px] font-[600] text-fg mb-2">Return Processed Successfully!</h2>
                                            <p className="text-[14px] text-fg-secondary">
                                                Return ID: <span className="font-[500] text-fg bg-subtle px-2 py-1 rounded">{processedReturn.returnId}</span>
                                            </p>
                                        </div>

                                        {/* Return Summary */}
                                        <div className="space-y-4 mb-6">
                                            <div className="p-4 bg-subtle rounded-lg">
                                                <h4 className="text-[14px] font-[500] text-fg mb-3">Transaction Summary</h4>
                                                <div className="space-y-2 text-[14px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-fg-secondary">Original Transaction:</span>
                                                        <span className="font-[500] text-fg">{processedReturn.originalTransaction}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-fg-secondary">Return Amount:</span>
                                                        <span className="font-[500] text-success">Rs. {processedReturn.returnTotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-fg-secondary">Refund Type:</span>
                                                        <span className="font-[500] text-fg capitalize">{processedReturn.refundType}</span>
                                                    </div>
                                                    {processedReturn.refundType === 'exchange' && (
                                                        <>
                                                            <div className="flex justify-between">
                                                                <span className="text-fg-secondary">Exchange Total:</span>
                                                                <span className="font-[500] text-plum">Rs. {processedReturn.exchangeTotal.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between border-t border-line pt-2">
                                                                <span className="text-fg-secondary">Final Balance:</span>
                                                                <span className={`font-[600] text-[16px] ${processedReturn.balanceAmount >= 0 ? 'text-success' : 'text-error'}`}>
                                                                    Rs. {Math.abs(processedReturn.balanceAmount).toLocaleString()} {processedReturn.balanceAmount >= 0 ? 'Refund' : 'Due'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Returned Items */}
                                            <div className="p-4 bg-hover rounded-lg">
                                                <h4 className="text-[14px] font-[500] text-success mb-3 flex items-center gap-2">
                                                    <Package size={16} />
                                                    Stock Updated
                                                </h4>
                                                <div className="space-y-1">
                                                    {processedReturn.returnItems.map((item) => (
                                                        <div key={item.id} className="flex justify-between text-[12px] text-success">
                                                            <span>
                                                                {item.name} ({item.returnQuantity} units)
                                                            </span>
                                                            <span>
                                                                {item.resellable ? '✓ Back to stock' : '⚠ Marked as wastage'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Exchange Items */}
                                            {processedReturn.refundType === 'exchange' && processedReturn.exchangeItems.length > 0 && (
                                                <div className="p-4 bg-subtle rounded-lg">
                                                    <h4 className="text-[14px] font-[500] text-brand-fg mb-3 flex items-center gap-2">
                                                        <RefreshCw size={16} />
                                                        Exchange Items
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {processedReturn.exchangeItems.map((item) => (
                                                            <div key={item.id} className="flex justify-between text-[12px] text-brand-fg">
                                                                <span>
                                                                    {item.name} ({item.quantity} units)
                                                                </span>
                                                                <span>
                                                                    Rs. {(item.price * item.quantity).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={handlePrintReceipt}
                                                className="flex-1 px-4 py-3 border border-brand-fg text-brand-fg rounded-lg hover:bg-brand/5 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Receipt size={16} />
                                                Print Receipt
                                            </button>
                                            <button
                                                onClick={resetForm}
                                                className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={16} />
                                                New Return
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Sticky Footer with Navigation Buttons */}
                    <div className="sticky bottom-0 bg-surface border-t border-line p-4 z-50">
                        <div className="max-w-6xl mx-auto flex justify-between items-center">
                            {/* Left side buttons */}
                            <div className="flex gap-3">
                                {currentStep > 1 && (
                                    <button
                                        onClick={goToPreviousStep}
                                        className="px-4 py-2 sm:px-6 sm:py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors text-[14px] font-[500] flex items-center gap-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 sm:px-6 sm:py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors text-[14px] font-[500]"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Right side buttons */}
                            {currentStep < 4 && (
                                <button
                                    onClick={goToNextStep}
                                    disabled={!isStepValid()}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500] flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight size={16} />
                                </button>
                            )}

                            {currentStep === 4 && (
                                <button
                                    onClick={processReturn}
                                    disabled={!isStepValid()}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-success-solid text-on-brand rounded-lg hover:bg-success-solid transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500] flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    Process Return
                                </button>
                            )}
                        </div>
                    </div>


                </main>
            </div>


            {/* Confirmation Modal */}
            {showConfirmModal && processedReturn && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-warning" />
                                </div>
                                <h3 className="text-[18px] font-[600] text-fg mb-2">Confirm Return Processing</h3>
                                <p className="text-[14px] text-fg-secondary">
                                    Please review the return details before processing
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-subtle rounded-lg">
                                    <div className="space-y-2 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Return Amount:</span>
                                            <span className="font-[500] text-success">Rs. {processedReturn.returnTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Refund Type:</span>
                                            <span className="font-[500] text-fg capitalize">{processedReturn.refundType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Payment Method:</span>
                                            <span className="font-[500] text-fg capitalize">{processedReturn.paymentMethod}</span>
                                        </div>
                                        {processedReturn.refundType === 'exchange' && (
                                            <div className="flex justify-between border-t border-line pt-2">
                                                <span className="text-fg-secondary">Final Balance:</span>
                                                <span className={`font-[500] ${processedReturn.balanceAmount >= 0 ? 'text-success' : 'text-error'}`}>
                                                    Rs. {Math.abs(processedReturn.balanceAmount).toLocaleString()} {processedReturn.balanceAmount >= 0 ? 'Refund' : 'Due'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[14px] font-[500] text-fg mb-1">
                                        Manager Verification Code
                                    </label>
                                    <input
                                        type="password"
                                        value={managerVerificationCode}
                                        onChange={(e) => setManagerVerificationCode(e.target.value)}
                                        placeholder="Enter manager code to authorize this return"
                                        className="w-full px-4 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowConfirmModal(false); setManagerVerificationCode(''); }}
                                    className="flex-1 px-4 py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReturn}
                                    className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    Confirm Return
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Printable Return Receipt (Thermal Printer Template) */}
            {printReturnData && (
                <div id="printable-return-receipt" className="hidden print:block fixed inset-0 bg-surface text-fg-strong p-2 font-mono text-xs z-[99999]">
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            #printable-return-receipt, #printable-return-receipt * {
                                visibility: visible !important;
                            }
                            #printable-return-receipt {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                display: block !important;
                            }
                        }
                    `}} />
                    <div className="w-[80mm] mx-auto text-fg-strong">
                        <div className="text-center font-bold text-sm mb-1">BAKERY MANAGEMENT SYSTEM</div>
                        <div className="text-center text-[10px] mb-2">ANURADHAPURA OUTLET</div>
                        <div className="border-t border-dashed my-1"></div>
                        <div className="text-center font-bold text-xs mb-2">
                            RETURN / REFUND RECEIPT
                        </div>
                        <div className="text-[10px] space-y-0.5 mb-2">
                            <div>Date: {new Date().toLocaleDateString()} Time: {new Date().toLocaleTimeString()}</div>
                            <div>Return ID: {printReturnData.returnId}</div>
                            <div>Original Bill: {foundTransaction?.billNumber || printReturnData.originalTransaction}</div>
                            <div>Cashier: {localStorage.getItem("firstName") ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ''}`.trim() : (localStorage.getItem("userName") || "Cashier")}</div>
                            <div>Refund Type: {printReturnData.refundType?.toUpperCase()}</div>
                        </div>
                        <div className="border-t border-dashed my-1"></div>
                        <div className="text-[10px] font-bold mb-1">RETURNED ITEMS:</div>
                        <table className="w-full text-[10px] text-left mb-2">
                            <thead>
                                <tr className="border-b border-dashed">
                                    <th className="py-0.5">Item</th>
                                    <th className="text-center py-0.5">Qty</th>
                                    <th className="text-right py-0.5">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printReturnData.returnItems?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-0.5">{item.name}</td>
                                        <td className="text-center py-0.5">{item.returnQuantity}</td>
                                        <td className="text-right py-0.5">Rs. {(item.price * item.returnQuantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {printReturnData.exchangeItems && printReturnData.exchangeItems.length > 0 && (
                            <>
                                <div className="border-t border-dashed my-1"></div>
                                <div className="text-[10px] font-bold mb-1">EXCHANGE ITEMS:</div>
                                <table className="w-full text-[10px] text-left mb-2">
                                    <thead>
                                        <tr className="border-b border-dashed">
                                            <th className="py-0.5">Item</th>
                                            <th className="text-center py-0.5">Qty</th>
                                            <th className="text-right py-0.5">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {printReturnData.exchangeItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-0.5">{item.name}</td>
                                                <td className="text-center py-0.5">{item.quantity}</td>
                                                <td className="text-right py-0.5">Rs. {(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                        <div className="border-t border-dashed my-1"></div>
                        <div className="text-[10px] space-y-1">
                            <div className="flex justify-between font-bold">
                                <span>RETURN TOTAL:</span>
                                <span>Rs. {printReturnData.returnTotal?.toFixed(2)}</span>
                            </div>
                            {printReturnData.refundType === 'exchange' && (
                                <div className="flex justify-between font-bold">
                                    <span>EXCHANGE TOTAL:</span>
                                    <span>Rs. {printReturnData.exchangeTotal?.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-xs border-t border-dashed pt-1">
                                <span>NET REFUND:</span>
                                <span>Rs. {printReturnData.balanceAmount?.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="border-t border-dashed my-2"></div>
                        <div className="text-center text-[9px]">
                            <div>Thank You!</div>
                            <div>Please keep this receipt for your records.</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}