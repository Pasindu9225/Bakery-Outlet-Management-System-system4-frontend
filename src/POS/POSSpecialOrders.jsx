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
    CreditCard,
    Phone,
    Receipt,
    UserCheck,
    Key,
    Shield,
    Edit,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    Printer
} from "lucide-react";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import axios from "axios";
import posService from "../services/posService";
import toast from "react-hot-toast";

export default function POSSpecialOrders() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Credit Orders');
    const [currentView, setCurrentView] = useState('create'); // 'create' or 'fulfillment'

    // Header Information
    const [orderInfo] = useState({
        cashierName: localStorage.getItem("userName") || "John Doe",
        cashierId: localStorage.getItem("userId") || "CSH-001",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        specialOrderId: '' // Generated after save
    });

    // Customer Details
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        contactNumber: '',
        email: '',
        address: '',
        type: 'New' // New / Credit
    });

    // Product search and selection
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Delivery and Payment
    const [deliveryDateTime, setDeliveryDateTime] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    // Manager approval
    const [showManagerApproval, setShowManagerApproval] = useState(false);
    const [managerOtp, setManagerOtp] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: OTP, 2: Receipt

    // Specialist Verification for Creation
    const [managerVerificationCode, setManagerVerificationCode] = useState('');
    const [isManagerVerified, setIsManagerVerified] = useState(false);
    const [verifiedManagerName, setVerifiedManagerName] = useState('');
    const [verificationError, setVerificationError] = useState('');

    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [customerLookupStatus, setCustomerLookupStatus] = useState(''); // 'found', 'new', or ''

    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedOrderId, setGeneratedOrderId] = useState('');

    const [pendingOrders, setPendingOrders] = useState([]);

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const outletId = localStorage.getItem("outletId");
                const [productsRes, paymentsRes] = await Promise.all([
                    posService.getTodayItems(outletId),
                    axios.get(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/payment-methods`)
                ]);

                // Map products to the component's internal structure
                // Note: productsRes is already data because posService returns response.data
                const mappedProducts = productsRes.map(item => ({
                    id: item.dayProductionItemId, // Use production item ID
                    name: item.productionItemName || item.productName,
                    code: item.productionItemCode || item.productCode,
                    category: item.categoryName,
                    unitPrice: item.unitPrice,
                    stock: item.currentQty,
                    description: item.categoryName
                }));

                setAvailableProducts(mappedProducts);
                setPaymentMethods(paymentsRes.data);
                
                // Set default payment method if available
                if (paymentsRes.data && paymentsRes.data.length > 0) {
                    setPaymentMethod(paymentsRes.data[0].name);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch pending orders when switching to fulfillment view
    const fetchPendingOrders = async () => {
        setIsLoading(true);
        try {
            const data = await posService.getPendingSpecialOrders();
            setPendingOrders(data);
        } catch (error) {
            console.error("Error fetching pending orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentView === 'fulfillment') {
            fetchPendingOrders();
        }
    }, [currentView]);

    // Customer types
    const customerTypes = [
        { value: 'New', label: 'New Customer' },
        { value: 'Credit', label: 'Credit Customer' }
    ];

    // Filter products based on search
    const filteredProducts = availableProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate totals
    const subtotal = selectedProducts.reduce((sum, product) => sum + (product.quantity * (product.unitPrice || 0)), 0);
    const totalAmount = subtotal;
    const advanceAmountNum = parseFloat(advanceAmount) || 0;
    const remainingBalance = totalAmount - advanceAmountNum;

    // Add product to order
    const addProductToOrder = (product) => {
        const existingIndex = selectedProducts.findIndex(p => p.id === product.id);

        if (existingIndex !== -1) {
            // Update quantity if product already exists
            const updatedProducts = [...selectedProducts];
            updatedProducts[existingIndex].quantity += 1;
            setSelectedProducts(updatedProducts);
        } else {
            // Add new product
            setSelectedProducts([...selectedProducts, {
                ...product,
                quantity: 1,
                specialInstructions: ''
            }]);
        }
        setShowProductSearch(false);
        setSearchTerm('');
    };

    // Update product quantity
    const updateProductQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
        } else {
            setSelectedProducts(selectedProducts.map(p =>
                p.id === productId ? { ...p, quantity: newQuantity } : p
            ));
        }
    };

    // Update special instructions
    const updateSpecialInstructions = (productId, instructions) => {
        setSelectedProducts(selectedProducts.map(p =>
            p.id === productId ? { ...p, specialInstructions: instructions } : p
        ));
    };

    // Remove product from order
    const removeProduct = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    };

    // Verify Manager
    const handleVerifyManager = async () => {
        if (!managerVerificationCode) {
            setVerificationError('Please enter a verification code');
            return;
        }

        setIsLoading(true);
        setVerificationError('');
        try {
            const manager = await posService.verifyManagerCode(managerVerificationCode);
            setIsManagerVerified(true);
            setVerifiedManagerName(`${manager.first_name} ${manager.last_name}`);
            setVerificationError('');
        } catch (error) {
            console.error("Manager verification error:", error);
            setIsManagerVerified(false);
            setVerifiedManagerName('');
            setVerificationError(error.response?.data?.message || 'Invalid manager code or unauthorized');
        } finally {
            setIsLoading(false);
        }
    };


    // Validate form
    const isFormValid = () => {
        const isManagerRequired = advanceAmountNum > 0;
        return (
            customerDetails.name.trim() !== '' &&
            customerDetails.contactNumber.trim() !== '' &&
            selectedProducts.length > 0 &&
            deliveryDateTime !== '' &&
            advanceAmount !== '' &&
            advanceAmountNum >= 0 &&
            advanceAmountNum <= totalAmount &&
            (!isManagerRequired || isManagerVerified)
        );
    };

    // Submit order
    const submitSpecialOrder = async () => {
        if (!isFormValid()) {
            toast.error('Please complete all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                customerName: customerDetails.name,
                customerContact: customerDetails.contactNumber,
                customerEmail: customerDetails.email,
                customerAddress: customerDetails.address,
                items: selectedProducts.map(p => ({
                    productId: p.id,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice
                })),
                advanceAmount: parseFloat(advanceAmount) || 0,
                deliveryDate: deliveryDateTime.split('T')[0], // Extract YYYY-MM-DD
                cashierId: orderInfo.cashierId,
                outletId: localStorage.getItem("outletId") ? parseInt(localStorage.getItem("outletId")) : 1,
                managerVerificationCode: (parseFloat(advanceAmount) || 0) > 0 ? managerVerificationCode : (managerVerificationCode || "NONE")
            };

            const response = await posService.initiateSpecialOrder(payload);
            setGeneratedOrderId(response.specialOrderId || response.id);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error submitting credit order:", error);
            toast.error(error.response?.data?.message || "Failed to submit credit order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Print receipt or bill
    const printReceipt = (orderData = null, type = 'ADVANCE') => {
        const isAdvance = type === 'ADVANCE';
        const data = orderData || {
            id: generatedOrderId,
            customerName: customerDetails.name,
            contactNumber: customerDetails.contactNumber,
            totalAmount: totalAmount,
            advanceAmount: advanceAmountNum,
            balanceAmount: remainingBalance,
            deliveryDate: deliveryDateTime,
            items: selectedProducts,
            cashierName: orderInfo.cashierName
        };

        const printContent = `
            <div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="margin: 0; font-size: 18px;">Downtown Bakery</h2>
                    <p style="margin: 5px 0; font-size: 12px;">Special Order - ${isAdvance ? 'Advance Receipt' : 'Final Bill'}</p>
                </div>
                
                <div style="margin-bottom: 15px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Date & Time:</span>
                        <span>${new Date().toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Order ID:</span>
                        <span>${data.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Cashier:</span>
                        <span>${data.cashierName || orderInfo.cashierName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Customer:</span>
                        <span>${data.customerName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                        <span>Contact:</span>
                        <span>${data.contactNumber}</span>
                    </div>
                </div>

                <div style="border-top: 1px solid #ccc; padding-top: 10px; margin-bottom: 15px;">
                    <div style="font-size: 12px;">
                        ${data.items.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                <span>${item.quantity}x ${item.name || item.productName}</span>
                                <span>Rs. ${(item.quantity * (item.unitPrice || 0)).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-weight: bold;">
                        <span>Total Amount:</span>
                        <span>Rs. ${(data.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: green;">
                        <span>Advance Paid:</span>
                        <span>Rs. ${(data.advanceAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; border-top: 1px dashed #ccc; padding-top: 3px; font-weight: bold;">
                        <span>${isAdvance ? 'Balance Due' : 'Balance Paid'}:</span>
                        <span>Rs. ${(isAdvance ? data.balanceAmount : data.balanceAmount || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div style="border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-size: 10px;">
                    <p style="margin: 5px 0;">Delivery Date: ${new Date(data.deliveryDate).toLocaleDateString()}</p>
                    <p style="margin: 5px 0; font-weight: bold;">${isAdvance ? 'Please bring this receipt for pickup' : 'Order Completed'}</p>
                    <p style="margin: 5px 0;">Thank you for your order!</p>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${isAdvance ? 'Advance Receipt' : 'Final Bill'}</title>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleCustomerLookup = async () => {
        const phone = customerDetails.contactNumber.trim();
        if (!phone) return;
        setIsLookupLoading(true);
        setCustomerLookupStatus('');
        try {
            const response = await axios.get(`/api/pos/v1/customers/lookup?phone=${phone}`);
            const customer = response.data;
            setCustomerDetails({
                name: customer.name || '',
                contactNumber: customer.contactNumber || phone,
                email: customer.email || '',
                address: customer.address || '',
                type: customer.isCreditAllowed ? 'Credit' : 'New'
            });
            setCustomerLookupStatus('found');
            toast.success(`Customer found: ${customer.name}`);
        } catch (error) {
            if (error.response?.status === 404) {
                setCustomerLookupStatus('new');
                setCustomerDetails(prev => ({
                    ...prev,
                    type: 'New'
                }));
                toast.info("Customer not found. Set as New Customer.");
            } else {
                toast.error("Error looking up customer");
            }
        } finally {
            setIsLookupLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setCustomerDetails({ name: '', contactNumber: '', email: '', address: '', type: 'New' });
        setSelectedProducts([]);
        setDeliveryDateTime('');
        setOrderNotes('');
        setAdvanceAmount('');
        setPaymentMethod('Cash');
        setManagerOtp('');
        setShowManagerApproval(false);
        setCurrentStep(1);
        setShowSuccessModal(false);
        setGeneratedOrderId('');
        setManagerVerificationCode('');
        setIsManagerVerified(false);
        setVerifiedManagerName('');
        setVerificationError('');
        setCustomerLookupStatus('');
    };

    // Order Fulfillment Functions
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [finalPaymentAmount, setFinalPaymentAmount] = useState('');
    const [finalPaymentMethod, setFinalPaymentMethod] = useState('Cash');

    const retrieveOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
        setFinalPaymentAmount(order.balanceAmount?.toString() || "0");
        setFinalPaymentMethod(paymentMethods[0]?.name || 'Cash');
    };

    const recordFinalPayment = async () => {
        const amountNum = parseFloat(finalPaymentAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsLoading(true);
        try {
            const selectedMethod = paymentMethods.find(m => m.name === finalPaymentMethod);
            const payload = {
                amount: amountNum,
                paymentMethodId: selectedMethod?.paymentMethodId || 1,
                cashierId: orderInfo.cashierId
            };

            await posService.addOrderPayment(selectedOrder.id, payload);
            toast.success(`Payment of Rs. ${finalPaymentAmount} recorded successfully!`);
            
            // Refresh the specific order details or the list
            fetchPendingOrders();
            setShowOrderDetails(false);
            setSelectedOrder(null);
            setFinalPaymentAmount('');
        } catch (error) {
            console.error("Error recording final payment:", error);
            toast.error(error.response?.data?.message || "Failed to record payment.");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtpAndProceed = async () => {
        if (!managerOtp) {
            toast.error('Please enter the manager PIN/ID');
            return;
        }

        setIsLoading(true);
        try {
            await posService.approveAndCloseOrder(selectedOrder.id, managerOtp);
            toast.success('Order approved and closed successfully!');
            
            // Print Final Bill
            printReceipt(selectedOrder, 'BILL');
            
            fetchPendingOrders();
            setShowOrderDetails(false);
            setSelectedOrder(null);
            setShowManagerApproval(false);
            setManagerOtp('');
        } catch (error) {
            console.error("Error approving order:", error);
            toast.error(error.response?.data?.message || "Manager approval failed. Please verify the PIN.");
        } finally {
            setIsLoading(false);
        }
    };

    const closeOrder = () => {
        if (selectedOrder.balanceAmount > 0) {
            toast.error('Cannot close order with outstanding balance. Please record final payment first.');
            return;
        }
        setShowManagerApproval(true);
        setCurrentStep(1);
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
                        <div className="max-w-7xl mx-auto">
                            {/* Header with View Toggle */}
                            <div className="xl:mb-6 mb-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                                    {/* Title + Subtitle */}
                                    <div className="flex items-start md:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                        <div className="min-w-0 flex-1">
                                            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-fg truncate">
                                                Special Orders & Customer Advance
                                            </h1>
                                            <p className="text-xs sm:text-sm text-fg-secondary truncate">
                                                Create custom orders and manage customer advances
                                            </p>
                                        </div>
                                    </div>

                                    {/* View Toggle */}
                                    <div className="flex bg-surface rounded-lg border border-line p-1 w-full md:w-auto">
                                        <button
                                            onClick={() => setCurrentView('create')}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[14px] font-[500] transition-colors ${currentView === 'create'
                                                    ? 'bg-brand text-on-brand'
                                                    : 'text-fg-secondary hover:text-fg'
                                                }`}
                                        >
                                            Create Order
                                        </button>
                                        <button
                                            onClick={() => setCurrentView('fulfillment')}
                                            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[14px] font-[500] transition-colors ${currentView === 'fulfillment'
                                                    ? 'bg-brand text-on-brand'
                                                    : 'text-fg-secondary hover:text-fg'
                                                }`}
                                        >
                                            Order Fulfillment
                                        </button>
                                    </div>
                                </div>

                                {/* Order Header Information - Only for Create View */}
                                {currentView === 'create' && (
                                    <div className="bg-surface rounded-lg shadow-sm border border-line p-4 xl:mb-6 mb-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-[12px] text-fg-secondary mb-1">Cashier Name</p>
                                                <p className="text-[14px] font-[500] text-fg">{orderInfo.cashierName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary mb-1">Cashier ID</p>
                                                <p className="text-[14px] font-[500] text-fg">{orderInfo.cashierId}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary mb-1">Date</p>
                                                <p className="text-[14px] font-[500] text-fg">{orderInfo.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-fg-secondary mb-1">Time</p>
                                                <p className="text-[14px] font-[500] text-fg">{orderInfo.time}</p>
                                            </div>
                                        </div>
                                        {generatedOrderId && (
                                            <div className="mt-4 pt-4 border-t border-line">
                                                <div>
                                                    <p className="text-[12px] text-fg-secondary mb-1">Special Order ID</p>
                                                    <p className="text-[16px] font-[600] text-brand-fg bg-brand/10 px-3 py-1 rounded-lg inline-block">
                                                        {generatedOrderId}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Create Order View */}
                            {currentView === 'create' && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-6 gap-4">
                                    {/* Main Order Form */}
                                    <div className="xl:col-span-2 xl:space-y-6 space-y-4">
                                        {/* Customer Details Section */}
                                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                            <h3 className="text-[16px] font-[600] text-fg mb-4 flex items-center gap-2">
                                                <User size={18} />
                                                Customer Details
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Customer Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter customer name"
                                                        value={customerDetails.name}
                                                        onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Contact Number *
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="tel"
                                                            placeholder="Enter contact number"
                                                            value={customerDetails.contactNumber}
                                                            onChange={(e) => {
                                                                setCustomerDetails({ ...customerDetails, contactNumber: e.target.value });
                                                                setCustomerLookupStatus('');
                                                            }}
                                                            className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCustomerLookup}
                                                            disabled={!customerDetails.contactNumber.trim() || isLookupLoading}
                                                            className="px-4 py-2 bg-brand text-on-brand rounded-lg text-[12px] font-[500] hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                                                        >
                                                            {isLookupLoading ? '...' : 'Verify'}
                                                        </button>
                                                    </div>
                                                    {customerLookupStatus === 'found' && (
                                                        <p className="text-success text-[11px] mt-1.5 flex items-center gap-1">
                                                            <CheckCircle size={12} />
                                                            Customer found: {customerDetails.name} ({customerDetails.type === 'Credit' ? 'Credit Allowed' : 'Regular'})
                                                        </p>
                                                    )}
                                                    {customerLookupStatus === 'new' && (
                                                        <p className="text-brand-fg text-[11px] mt-1.5 flex items-center gap-1">
                                                            <AlertCircle size={12} />
                                                            New Customer: Will be registered automatically on submit.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        placeholder="Enter email address"
                                                        value={customerDetails.email}
                                                        onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Customer Type
                                                    </label>
                                                    <select
                                                        value={customerDetails.type}
                                                        onChange={(e) => setCustomerDetails({ ...customerDetails, type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none bg-surface"
                                                    >
                                                        {customerTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Pickup/Delivery Address
                                                    </label>
                                                    <textarea
                                                        placeholder="Enter full address"
                                                        value={customerDetails.address}
                                                        onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10 min-h-[80px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items Section */}
                                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[16px] font-[600] text-fg flex items-center gap-2">
                                                    <Package size={18} />
                                                    Order Items ({selectedProducts.length})
                                                </h3>
                                                <button
                                                    onClick={() => setShowProductSearch(!showProductSearch)}
                                                    className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors text-[14px] font-[500] flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Add Product
                                                </button>
                                            </div>

                                            {/* Product Search */}
                                            {showProductSearch && (
                                                <div className="mb-6 p-4 bg-subtle rounded-lg border border-line">
                                                    <div className="mb-3">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={18} />
                                                            <input
                                                                type="text"
                                                                placeholder="Search products by name or code..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                                        {filteredProducts.map((product) => (
                                                            <div
                                                                key={product.id}
                                                                onClick={() => addProductToOrder(product)}
                                                                className="p-3 bg-surface rounded-lg border border-line hover:border-brand-fg cursor-pointer transition-colors"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <p className="text-[14px] font-[500] text-fg">{product.name}</p>
                                                                        <p className="text-[12px] text-fg-secondary">{product.code} | {product.category}</p>
                                                                        <p className="text-[12px] text-fg-secondary mt-1">{product.description}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[14px] font-[600] text-brand-fg">Rs. {(product.unitPrice || 0).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {filteredProducts.length === 0 && (
                                                            <div className="text-center py-6">
                                                                <Package size={32} className="text-fg-muted mx-auto mb-2" />
                                                                <p className="text-[14px] text-fg-secondary">No products found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selected Products */}
                                            <div className="space-y-4">
                                                {selectedProducts.map((product) => (
                                                    <div key={product.id} className="p-4 bg-subtle rounded-lg border border-line">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h4 className="text-[14px] font-[500] text-fg">{product.name}</h4>
                                                                <p className="text-[12px] text-fg-secondary">{product.code} | {product.category}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => removeProduct(product.id)}
                                                                className="text-error hover:bg-error/10 p-1 rounded"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-[12px] text-fg-secondary mb-1">Quantity</label>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                                                                        className="w-8 h-8 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle"
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={product.quantity}
                                                                        onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                                                        className="w-16 text-center py-1 border border-line rounded text-[12px] focus:border-brand-fg focus:outline-none"
                                                                    />
                                                                    <button
                                                                        onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                                                                        className="w-8 h-8 flex items-center justify-center border border-line rounded text-fg-secondary hover:bg-subtle"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[12px] text-fg-secondary mb-1">Unit Price</label>
                                                                <p className="text-[14px] font-[500] text-fg py-1">
                                                                    Rs. {(product.unitPrice || 0).toFixed(2)}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[12px] text-fg-secondary mb-1">Total</label>
                                                                <p className="text-[14px] font-[600] text-brand-fg py-1">
                                                                    Rs. {(product.quantity * (product.unitPrice || 0)).toFixed(2)}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[12px] text-fg-secondary mb-1">Special Instructions</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Optional"
                                                                    value={product.specialInstructions}
                                                                    onChange={(e) => updateSpecialInstructions(product.id, e.target.value)}
                                                                    className="w-full px-2 py-1 border border-line rounded text-[12px] focus:border-brand-fg focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {selectedProducts.length === 0 && (
                                                    <div className="text-center py-8">
                                                        <ShoppingCart size={48} className="text-fg-muted mx-auto mb-3" />
                                                        <p className="text-[14px] text-fg-secondary">No products added yet</p>
                                                        <p className="text-[12px] text-fg-secondary mt-1">Click "Add Product" to start building the order</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delivery & Payment Section */}
                                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                                            <h3 className="text-[16px] font-[600] text-fg mb-4 flex items-center gap-2">
                                                <Calendar size={18} />
                                                Delivery & Payment Details
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Delivery Date & Time *
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={deliveryDateTime}
                                                        onChange={(e) => setDeliveryDateTime(e.target.value)}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Payment Method
                                                    </label>
                                                    <select
                                                        value={paymentMethod}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none bg-surface"
                                                    >
                                                        {paymentMethods.length > 0 ? (
                                                            paymentMethods.map(method => (
                                                                <option key={method.paymentMethodId} value={method.name}>{method.name}</option>
                                                            ))
                                                        ) : (
                                                            <option value="">Loading payment methods...</option>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-[12px] font-[500] text-fg mb-2">
                                                    Notes / Special Instructions
                                                </label>
                                                <textarea
                                                    placeholder="Add any special delivery instructions or notes..."
                                                    value={orderNotes}
                                                    onChange={(e) => setOrderNotes(e.target.value)}
                                                    className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none resize-none"
                                                    rows="3"
                                                />
                                            </div>


                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Advance Amount (Rs.) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={advanceAmount}
                                                        onChange={(e) => setAdvanceAmount(e.target.value)}
                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[12px] font-[500] text-fg mb-2">
                                                        Remaining Balance
                                                    </label>
                                                    <div className="px-3 py-2 bg-subtle border border-line rounded-lg text-[14px] font-[600] text-brand-fg">
                                                        Rs. {(remainingBalance || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Summary Panel */}
                                    <div className="xl:col-span-1">
                                        <div className="sticky top-0 space-y-6">
                                            {/* Order Summary */}
                                            <div className="bg-surface rounded-lg shadow-sm border border-line p-4">
                                                <h3 className="text-[16px] font-[600] text-fg mb-4 flex items-center gap-2">
                                                    <FileText size={18} />
                                                    Order Summary
                                                </h3>

                                                <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-fg-secondary">Total Items:</span>
                                                        <span className="font-[500] text-fg">{selectedProducts.length}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-fg-secondary">Subtotal:</span>
                                                        <span className="font-[500] text-fg">Rs. {(subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[16px] font-[600] border-t border-line pt-3">
                                                        <span className="text-fg">Total Amount:</span>
                                                        <span className="text-brand-fg">Rs. {(totalAmount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-fg-secondary">Advance Amount:</span>
                                                        <span className="font-[500] text-success">Rs. {(advanceAmountNum || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-fg-secondary">Remaining Balance:</span>
                                                        <span className="font-[500] text-warning">Rs. {(remainingBalance || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {customerDetails.name && (
                                                    <div className="p-3 bg-subtle rounded-lg border-t border-line">
                                                        <h4 className="text-[12px] font-[500] text-fg mb-2">Customer Info</h4>
                                                        <div className="text-[12px] text-fg-secondary space-y-1">
                                                            <div>Name: {customerDetails.name}</div>
                                                            <div>Contact: {customerDetails.contactNumber}</div>
                                                            <div>Type: {customerDetails.type}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Manager Authorization section */}
                                            <div className="bg-surface rounded-lg shadow-sm border border-line p-4">
                                                <h3 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-2">
                                                    <Shield size={16} className="text-brand-fg" />
                                                    Manager Authorization
                                                </h3>
                                                
                                                {advanceAmountNum === 0 ? (
                                                    <div className="p-3 bg-brand/10 border border-brand/20 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={18} className="text-brand-fg" />
                                                            <div>
                                                                <p className="text-[12px] font-[600] text-brand-fg">No Manager Authorization Required</p>
                                                                <p className="text-[11px] text-brand-fg">Advance amount is Rs. 0.00. Credit order can be submitted directly.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : !isManagerVerified ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[12px] text-fg-secondary mb-1">Manager Code</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="password"
                                                                    placeholder="Enter code"
                                                                    value={managerVerificationCode}
                                                                    onChange={(e) => setManagerVerificationCode(e.target.value)}
                                                                    className={`flex-1 px-3 py-2 border ${verificationError ? 'border-error' : 'border-line'} rounded-lg text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg`}
                                                                />
                                                                <button
                                                                    onClick={handleVerifyManager}
                                                                    disabled={isLoading || !managerVerificationCode}
                                                                    className="px-4 py-2 bg-brand text-on-brand rounded-lg text-[12px] font-[500] hover:bg-brand-hover disabled:opacity-50"
                                                                >
                                                                    Verify
                                                                </button>
                                                            </div>
                                                            {verificationError && (
                                                                <p className="text-error text-[11px] mt-1 flex items-center gap-1">
                                                                    <AlertCircle size={12} />
                                                                    {verificationError}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-fg-secondary">
                                                            * Manager verification is required when an advance amount is added.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle size={18} className="text-success" />
                                                                <div>
                                                                    <p className="text-[12px] font-[600] text-success">Authorized by Manager</p>
                                                                    <p className="text-[14px] text-success">{verifiedManagerName}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    setIsManagerVerified(false);
                                                                    setVerifiedManagerName('');
                                                                    setManagerVerificationCode('');
                                                                }}
                                                                className="text-success hover:text-success text-[11px] underline"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="space-y-3">
                                                <button
                                                    onClick={submitSpecialOrder}
                                                    disabled={!isFormValid() || isLoading}
                                                    title={!isFormValid() ? "Please fill Name, Contact, Products and a valid Advance Amount (<= Total)" : ""}
                                                    className="w-full px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500] flex items-center justify-center gap-2"
                                                >
                                                    {isLoading ? (
                                                        <RotateCcw className="animate-spin" size={16} />
                                                    ) : (
                                                        <Send size={16} />
                                                    )}
                                                    {isLoading ? 'Submitting...' : 'Submit Credit Order'}
                                                </button>

                                                <button
                                                    onClick={resetForm}
                                                    className="w-full px-4 py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors text-[14px] font-[500] flex items-center justify-center gap-2"
                                                >
                                                    <RotateCcw size={16} />
                                                    Reset Form
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Fulfillment View */}
                            {currentView === 'fulfillment' && (
                                <div className="bg-surface rounded-lg shadow-sm border border-line">
                                    <div className="p-6 border-b border-line">
                                        <h3 className="text-[18px] font-[600] text-fg flex items-center gap-2">
                                            <Clock size={20} />
                                            Pending Orders Dashboard
                                        </h3>
                                        <p className="text-[14px] text-fg-secondary mt-1">
                                            Manage and fulfill pending special orders
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-subtle border-b border-line">
                                                <tr>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Order ID</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Customer</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Total Amount</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Advance Paid</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Remaining Balance</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Delivery Date</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Status</th>
                                                    <th className="text-left px-6 py-3 text-[12px] font-[600] text-fg uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-line">
                                                {pendingOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-subtle transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] font-[500] text-brand-fg">{order.id}</div>
                                                            <div className="text-[12px] text-fg-secondary">{order.orderDate}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] font-[500] text-fg">{order.customerName}</div>
                                                            <div className="text-[12px] text-fg-secondary">{order.contactNumber}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] font-[600] text-fg">
                                                                Rs. {(order.totalAmount || 0).toFixed(2)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] font-[600] text-success">
                                                                Rs. {(order.advanceAmount || 0).toFixed(2)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] font-[600] text-warning">
                                                                Rs. {(order.balanceAmount || 0).toFixed(2)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[14px] text-fg">{order.deliveryDate}</div>
                                                            <div className="text-[12px] text-fg-secondary">{order.deliveryTime}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-[12px] font-[500] ${
                                                                order.status === 'ADVANCE_PAID'
                                                                    ? 'bg-brand/10 text-brand-fg'
                                                                    : order.status === 'PENDING_APPROVAL'
                                                                        ? 'bg-warning/10 text-warning'
                                                                        : 'bg-success/10 text-success'
                                                                }`}>
                                                                {(order.status || 'PENDING').replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => retrieveOrder(order)}
                                                                className="text-brand-fg hover:text-brand-fg text-[12px] font-[500] flex items-center gap-1"
                                                            >
                                                                <Eye size={14} />
                                                                Retrieve
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {pendingOrders.length === 0 && (
                                        <div className="text-center py-12">
                                            <Clock size={48} className="text-fg-muted mx-auto mb-3" />
                                            <p className="text-[16px] text-fg-secondary">No pending orders</p>
                                            <p className="text-[14px] text-fg-secondary mt-1">All special orders have been fulfilled</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Manager Approval Modal */}
            {showManagerApproval && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {currentStep === 1 && (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Shield size={32} className="text-warning" />
                                        </div>
                                        <h3 className="text-[18px] font-[600] text-fg mb-2">Manager Approval Required</h3>
                                        <p className="text-[14px] text-fg-secondary">
                                            Enter the manager OTP code to approve this special order
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-[14px] font-[500] text-fg mb-2">
                                                Manager OTP Code
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter OTP code"
                                                value={managerOtp}
                                                onChange={(e) => setManagerOtp(e.target.value)}
                                                className="w-full px-3 py-3 border border-line rounded-lg text-[16px] text-center font-mono focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                                maxLength="6"
                                            />
                                        </div>

                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowManagerApproval(false);
                                                setManagerOtp('');
                                                setCurrentStep(1);
                                            }}
                                            className="flex-1 px-4 py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={verifyOtpAndProceed}
                                            disabled={managerOtp.length === 0}
                                            className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Verify & Continue
                                        </button>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Receipt size={32} className="text-brand-fg" />
                                        </div>
                                        <h3 className="text-[18px] font-[600] text-fg mb-2">Generate Advance Receipt</h3>
                                        <p className="text-[14px] text-fg-secondary">
                                            Order approved! Generate receipt for advance payment
                                        </p>
                                    </div>

                                    <div className="space-y-4 mb-6 p-4 bg-subtle rounded-lg border border-line">
                                        <div className="text-center border-b border-line pb-3">
                                            <h4 className="text-[16px] font-[600] text-fg">Downtown Bakery</h4>
                                            <p className="text-[12px] text-fg-secondary">Special Order - Advance Receipt</p>
                                            <p className="text-[14px] font-[600] text-brand-fg mt-2">Order ID: {generatedOrderId}</p>
                                        </div>

                                        <div className="space-y-2 text-[12px]">
                                            <div className="flex justify-between">
                                                <span className="text-fg-secondary">Customer:</span>
                                                <span className="text-fg">{customerDetails.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-fg-secondary">Contact:</span>
                                                <span className="text-fg">{customerDetails.contactNumber}</span>
                                            </div>
                                             <div className="flex justify-between">
                                                <span className="text-fg-secondary">Total Amount:</span>
                                                <span className="font-[600] text-fg">Rs. {(totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-fg-secondary">Advance Paid:</span>
                                                <span className="font-[600] text-success">Rs. {(advanceAmountNum || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-fg-secondary">Balance Due:</span>
                                                <span className="font-[600] text-warning">Rs. {(remainingBalance || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                printReceipt();
                                                completeOrderSubmission();
                                            }}
                                            className="flex-1 px-4 py-3 border border-brand-fg text-brand-fg rounded-lg hover:bg-brand/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Printer size={16} />
                                            Print & Complete
                                        </button>
                                        <button
                                            onClick={completeOrderSubmission}
                                            className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                                        >
                                            Complete Order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={40} className="text-success" />
                                </div>
                                <h3 className="text-[20px] font-[600] text-fg mb-2">Order Submitted Successfully!</h3>
                                <p className="text-[14px] text-fg-secondary mb-4">
                                    Your special order has been created and is ready for processing
                                </p>
                                <div className="bg-subtle border border-brand-fg rounded-lg p-4">
                                    <p className="text-[12px] text-fg-secondary mb-1">Special Order ID</p>
                                    <p className="text-[18px] font-[600] text-brand-fg">{generatedOrderId}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 bg-subtle rounded-lg">
                                    <h4 className="text-[14px] font-[500] text-fg mb-3">Order Summary</h4>
                                    <div className="space-y-2 text-[14px]">
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Customer:</span>
                                            <span className="font-[500] text-fg">{customerDetails.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Contact:</span>
                                            <span className="font-[500] text-fg">{customerDetails.contactNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Items:</span>
                                            <span className="font-[500] text-fg">{selectedProducts.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Delivery:</span>
                                            <span className="font-[500] text-fg">
                                                {new Date(deliveryDateTime).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Advance Paid:</span>
                                            <span className="font-[500] text-success">Rs. {advanceAmountNum.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-fg-secondary">Balance Due:</span>
                                            <span className="font-[500] text-warning">Rs. {remainingBalance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={printReceipt}
                                    className="flex-1 px-4 py-3 border border-brand-fg text-brand-fg rounded-lg hover:bg-brand/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Printer size={16} />
                                    Print Receipt
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    New Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal (for Fulfillment) */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[18px] font-[600] text-fg">Order Details</h3>
                                    <p className="text-[14px] text-fg-secondary">Order ID: {selectedOrder.id}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowOrderDetails(false);
                                        setSelectedOrder(null);
                                    }}
                                    className="text-fg-secondary hover:text-fg p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Information */}
                                <div className="bg-subtle rounded-lg p-4">
                                    <h4 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-2">
                                        <User size={16} />
                                        Customer Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
                                        <div>
                                            <span className="text-fg-secondary">Name:</span>
                                            <span className="font-[500] text-fg ml-2">{selectedOrder.customerName}</span>
                                        </div>
                                        <div>
                                            <span className="text-fg-secondary">Contact:</span>
                                            <span className="font-[500] text-fg ml-2">{selectedOrder.contactNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-fg-secondary">Order Date:</span>
                                            <span className="font-[500] text-fg ml-2">{selectedOrder.orderDate}</span>
                                        </div>
                                        <div>
                                            <span className="text-fg-secondary">Delivery:</span>
                                            <span className="font-[500] text-fg ml-2">
                                                {selectedOrder.deliveryDate} at {selectedOrder.deliveryTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h4 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-2">
                                        <Package size={16} />
                                        Order Items
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-subtle rounded-lg">
                                                <div>
                                                    <p className="text-[14px] font-[500] text-fg">{item.name}</p>
                                                    <p className="text-[12px] text-fg-secondary">Quantity: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[14px] font-[600] text-brand-fg">
                                                        Rs. {(item.quantity * (item.unitPrice || 0)).toFixed(2)}
                                                    </p>
                                                    <p className="text-[12px] text-fg-secondary">
                                                        @ Rs. {(item.unitPrice || 0).toFixed(2)} each
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Summary */}
                                <div>
                                    <h4 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-2">
                                        <DollarSign size={16} />
                                        Payment Summary
                                    </h4>
                                    <div className="bg-subtle rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between text-[14px]">
                                            <span className="text-fg-secondary">Total Amount:</span>
                                            <span className="font-[600] text-fg">Rs. {(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[14px]">
                                            <span className="text-fg-secondary">Advance Paid:</span>
                                            <span className="font-[600] text-success">Rs. {(selectedOrder.advanceAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[16px] font-[600] border-t border-line pt-3">
                                            <span className="text-fg-secondary">Remaining Balance:</span>
                                            <span className="text-warning">Rs. {(selectedOrder.balanceAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Special Notes */}
                                {selectedOrder.notes && (
                                    <div>
                                        <h4 className="text-[14px] font-[600] text-fg mb-2 flex items-center gap-2">
                                            <FileText size={16} />
                                            Special Notes
                                        </h4>
                                        <div className="bg-subtle rounded-lg p-3">
                                            <p className="text-[14px] text-fg">{selectedOrder.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Final Payment Section */}
                                <div className="border-t border-line pt-6">
                                    <h4 className="text-[14px] font-[600] text-fg mb-4 flex items-center gap-2">
                                        <CreditCard size={16} />
                                        Record Final Payment
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[12px] font-[500] text-fg mb-2">
                                                Payment Amount (Rs.)
                                            </label>
                                            <input
                                                type="number"
                                                value={finalPaymentAmount}
                                                onChange={(e) => setFinalPaymentAmount(e.target.value)}
                                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                placeholder={(selectedOrder.balanceAmount || 0).toFixed(2)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[12px] font-[500] text-fg mb-2">
                                                Payment Method
                                            </label>
                                            <select
                                                value={finalPaymentMethod}
                                                onChange={(e) => setFinalPaymentMethod(e.target.value)}
                                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none bg-surface"
                                            >
                                                {paymentMethods.map(method => (
                                                    <option key={method.paymentMethodId} value={method.name}>{method.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="border-t border-line pt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            onClick={recordFinalPayment}
                                            disabled={isLoading || !finalPaymentAmount || parseFloat(finalPaymentAmount) <= 0}
                                            className="px-4 py-3 bg-success-solid text-on-brand rounded-lg hover:bg-success-solid transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500] flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <RotateCcw className="animate-spin" size={16} /> : <DollarSign size={16} />}
                                            {isLoading ? 'Processing...' : 'Record Payment'}
                                        </button>

                                        <button
                                            onClick={() => {
                                                toast('Manager approval requested for order modification');
                                            }}
                                            className="px-4 py-3 border border-warning text-warning rounded-lg hover:bg-warning/10 transition-colors text-[14px] font-[500] flex items-center justify-center gap-2"
                                        >
                                            <Shield size={16} />
                                            Manager Approval
                                        </button>

                                        <button
                                            onClick={closeOrder}
                                            disabled={isLoading}
                                            className="px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors text-[14px] font-[500] flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? <RotateCcw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                            {isLoading ? 'Closing...' : 'Close Order'}
                                        </button>
                                    </div>
                                </div>
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
        </div>
    );
}