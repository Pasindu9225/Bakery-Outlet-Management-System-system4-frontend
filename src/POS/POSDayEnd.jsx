import React, { useState, useEffect } from "react";
import { friendlyError } from "../utils/friendlyError";
import ButtonHint from "../component/ButtonHint.jsx";
import {
    DollarSign,
    CreditCard,
    Calculator,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Package,
    TrendingUp,
    Clock,
    FileText,
    Printer,
    Lock,
    ArrowLeft,
    Check,
    Eye,
    EyeOff,
    User,
    Store,
    ShoppingCart,
    Trash2
} from "lucide-react";
import axios from "axios";

import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import Loader from "../component/Loader.jsx";
import toast from "react-hot-toast";

export default function POSDayEnd() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Day End & Finish Shift');
    const [activeTab, setActiveTab] = useState('day-end'); // 'day-end' or 'finish-shift'
    const [currentStep, setCurrentStep] = useState(1);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [cashierPin, setCashierPin] = useState('');

    const [dayEndData, setDayEndData] = useState({
        shiftId: '',
        shiftConfirmed: false,
        transactionsValidated: false,
        cashCounted: '',
        cardCounted: '',
        uberPickmeCounted: '',
        stockUpdateConfirmed: false,
        finalConfirmation: false,
        denominations: {
            n5000: '',
            n1000: '',
            n500: '',
            n100: '',
            n50: '',
            n20: '',
            c10: '',
            c5: '',
            c2: '',
            c1: ''
        }
    });

    const [dayEndSummary, setDayEndSummary] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const userId = localStorage.getItem("userId");
                const token = localStorage.getItem("authToken");
                const baseUrl = process.env.REACT_APP_BASE_URL || '';

                if (!userId || !token) return;

                const response = await axios.get(
                    `${baseUrl}/api/pos/v1/day-end/summary?closureDate=${today}&cashierId=${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const summary = response.data;
                setDayEndSummary(summary);

                if (summary) {
                    const dbCard = summary.expectedCard !== undefined ? String(summary.expectedCard) : '';
                    const dbUberPickme = (summary.expectedUber !== undefined || summary.expectedPickme !== undefined) 
                        ? String((summary.expectedUber || 0) + (summary.expectedPickme || 0)) 
                        : '';

                    setDayEndData(prev => ({
                        ...prev,
                        cardCounted: prev.cardCounted || dbCard,
                        uberPickmeCounted: prev.uberPickmeCounted || dbUberPickme
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch day-end summary", error);
            }
        };

        fetchSummary();
    }, []);
    const currentCashier = localStorage.getItem("username") || "Current Cashier";

    const [productData, setProductData] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Fetch Products for Stock Closing when entering Step 3
    useEffect(() => {
        if (currentStep === 3) {
            const fetchProducts = async () => {
                setIsLoadingProducts(true);
                try {
                    const token = localStorage.getItem("authToken");
                    const baseUrl = process.env.REACT_APP_BASE_URL || '';
                    
                    const response = await axios.get(
                        `${baseUrl}/api/pos/day-end/inventory`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    const mappedProducts = response.data.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        systemQty: item.currentQty,
                        unit: item.unitName || 'pcs',
                        physicalQty: '',
                        carryForwardQty: 0,
                        wastageQty: 0,
                        wastageReason: 'UNSOLD',
                        action: null
                    }));
                    
                    setProductData(mappedProducts);
                } catch (error) {
                    console.error("Failed to fetch closing inventory", error);
                } finally {
                    setIsLoadingProducts(false);
                }
            };

            fetchProducts();
        }
    }, [currentStep]);

    const pendingTransactions = [];



    // Physical = what was counted on the shelf. Wastage = the part of it that can't be sold
    // tomorrow. Carry forward = physical - wastage. Any gap between system and physical is
    // missing stock, which is shown separately and not recorded as wastage.
    const updateStockRow = (productId, changes) => {
        setProductData(prev =>
            prev.map(item => {
                if (item.productId !== productId) return item;
                const next = { ...item, ...changes };
                const physical = next.physicalQty === '' ? 0 : Math.max(0, parseInt(next.physicalQty) || 0);
                const wastage = Math.max(0, parseInt(next.wastageQty) || 0);
                return {
                    ...next,
                    carryForwardQty: Math.max(0, physical - wastage)
                };
            })
        );
    };

    const handleProductQtyChange = (productId, physicalQty) => updateStockRow(productId, { physicalQty });
    const handleWastageChange = (productId, wastageQty) => updateStockRow(productId, { wastageQty });
    const handleWastageReasonChange = (productId, wastageReason) => updateStockRow(productId, { wastageReason });

    const stockRowError = (item) => {
        if (item.physicalQty === '') return null;
        const physical = parseInt(item.physicalQty) || 0;
        const wastage = parseInt(item.wastageQty) || 0;
        if (physical < 0 || wastage < 0) return 'Quantities cannot be negative';
        if (wastage > physical) return 'Wastage cannot be more than the counted quantity';
        return null;
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return dayEndData.shiftConfirmed && dayEndData.transactionsValidated;
            case 2:
                const openingFloat = dayEndSummary?.openingFloat || 0;
                const countedCash = parseFloat(dayEndData.cashCounted) || 0;
                return dayEndData.cashCounted && dayEndData.cardCounted && dayEndData.uberPickmeCounted && countedCash >= openingFloat;
            case 3:
                return productData.length > 0
                    ? productData.every(item => item.physicalQty !== '' && !stockRowError(item))
                    : true;
            case 4:
                return true;
            case 5:
                return dayEndData.finalConfirmation && cashierPin;
            default:
                return false;
        }
    };

    // What the cashier still has to do before Next / Confirm can be pressed (shown under the button).
    const nextStepHint = () => {
        switch (currentStep) {
            case 1:
                if (!dayEndData.shiftConfirmed) return 'Tick the confirmation box first.';
                return 'Press "Validate Open Transactions" first.';
            case 2: {
                const openingFloat = dayEndSummary?.openingFloat || 0;
                if (!dayEndData.cashCounted || !dayEndData.cardCounted || !dayEndData.uberPickmeCounted)
                    return 'Enter the counted cash, card and Uber/PickMe totals.';
                return `Counted cash must be at least the opening float (Rs. ${Number(openingFloat).toLocaleString()}).`;
            }
            case 3:
                return 'Enter the physical count for every product and fix any row marked in red.';
            case 5:
                if (!dayEndData.finalConfirmation) return 'Tick the final confirmation box.';
                return 'Enter your code to finish.';
            default:
                return '';
        }
    };

    const handleNextStep = () => {
        if (canProceedToNextStep() && currentStep < 5) {
            if (activeTab === 'finish-shift' && currentStep === 2) {
                setCurrentStep(4);
            } else {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            if (activeTab === 'finish-shift' && currentStep === 4) {
                setCurrentStep(2);
            } else {
                setCurrentStep(currentStep - 1);
            }
        }
    };

    const handleFinalizeDayEnd = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const userId = localStorage.getItem("userId");
            const token = localStorage.getItem("authToken");
            const baseUrl = process.env.REACT_APP_BASE_URL || '';
            const currentOutletId = localStorage.getItem("outletId") || 1;
            
            // 1. Submit Stock Closing (FR-POS-13) - Only if not finish-shift
            if (activeTab !== 'finish-shift') {
                const stockRequest = {
                    outletId: currentOutletId, 
                    cashierId: userId,
                    items: productData.map(item => ({
                        productId: item.productId,
                        systemQty: item.systemQty || 0,
                        physicalQty: parseInt(item.physicalQty) || 0,
                        carryForwardQty: item.carryForwardQty || 0,
                        wastageQty: parseInt(item.wastageQty) || 0,
                        wastageReason: item.wastageReason || 'UNSOLD'
                    }))
                };

                await axios.post(`${baseUrl}/api/pos/day-end/submit`, stockRequest, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // 2. Submit Shift Closure (Financial)
            const financialRequest = {
                cashierId: userId,
                outletId: currentOutletId,
                closureDate: today,
                actualCash: parseFloat(dayEndData.cashCounted || 0),
                actualCard: parseFloat(dayEndData.cardCounted || 0),
                actualUber: parseFloat(dayEndData.uberPickmeCounted || 0) / 2, 
                actualPickme: parseFloat(dayEndData.uberPickmeCounted || 0) / 2,
                cashierPin: cashierPin,
                shiftOnly: activeTab === 'finish-shift',
                cashDenominations: JSON.stringify(dayEndData.denominations)
            };

            console.log("Submitting Day-End closure:", financialRequest);

            await axios.post(`${baseUrl}/api/pos/v1/day-end/close`, financialRequest, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(
                activeTab === 'finish-shift' 
                    ? 'Shift ended and settled successfully!' 
                    : 'Day-End process completed and locked successfully!'
            );
            setShowConfirmation(false);
            setTimeout(() => {
                window.location.href = '/posDashboard';
            }, 1500);
        } catch (error) {
            toast.error(friendlyError(error, { fallback: "Error finalizing day end." }));
            setShowConfirmation(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="mb-4 sm:mb-6">
            <div className="w-full overflow-x-auto">
                <div className="flex items-center justify-center min-w-max px-2 pb-2">
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                currentStep === 1
                                    ? 'border-brand-fg bg-brand text-on-brand'
                                    : currentStep > 1
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                            }`}>
                                {currentStep > 1 ? 
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> : 
                                    <User size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[12px] sm:text-xs text-center whitespace-nowrap ${
                                currentStep === 1 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                            }`}>
                                Shift
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 1 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 2 */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                currentStep === 2
                                    ? 'border-brand-fg bg-brand text-on-brand'
                                    : currentStep > 2
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                            }`}>
                                {currentStep > 2 ? 
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> : 
                                    <DollarSign size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[12px] sm:text-xs text-center whitespace-nowrap ${
                                currentStep === 2 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                            }`}>
                                Cash
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 2 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 3 (Stock) - Only for Day End */}
                        {activeTab !== 'finish-shift' && (
                            <>
                                <div className="flex flex-col items-center min-w-0">
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                        currentStep === 3
                                            ? 'border-brand-fg bg-brand text-on-brand'
                                            : currentStep > 3
                                            ? 'border-success bg-success-solid text-on-brand'
                                            : 'border-line bg-surface text-fg-secondary'
                                    }`}>
                                        {currentStep > 3 ? 
                                            <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> : 
                                            <Package size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                        }
                                    </div>
                                    <span className={`mt-1 text-[12px] sm:text-xs text-center whitespace-nowrap ${
                                        currentStep === 3 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                                    }`}>
                                        Stock
                                    </span>
                                </div>
                                <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 3 ? 'bg-success-solid' : 'bg-line'}`} />
                            </>
                        )}

                        {/* Step 4 */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                currentStep === 4
                                    ? 'border-brand-fg bg-brand text-on-brand'
                                    : currentStep > 4
                                    ? 'border-success bg-success-solid text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                            }`}>
                                {currentStep > 4 ? 
                                    <Check size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> : 
                                    <FileText size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                }
                            </div>
                            <span className={`mt-1 text-[12px] sm:text-xs text-center whitespace-nowrap ${
                                currentStep === 4 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                            }`}>
                                Review
                            </span>
                        </div>

                        {/* Connector */}
                        <div className={`h-0.5 w-4 sm:w-8 md:w-12 flex-shrink-0 ${currentStep > 4 ? 'bg-success-solid' : 'bg-line'}`} />

                        {/* Step 5 */}
                        <div className="flex flex-col items-center min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                currentStep === 5
                                    ? 'border-brand-fg bg-brand text-on-brand'
                                    : 'border-line bg-surface text-fg-secondary'
                            }`}>
                                <Lock size={12} className="sm:w-3 sm:h-3 md:w-4 md:h-4" />
                            </div>
                            <span className={`mt-1 text-[12px] sm:text-xs text-center whitespace-nowrap ${
                                currentStep === 5 ? 'text-brand-fg font-medium' : 'text-fg-secondary'
                            }`}>
                                Confirm
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-6">
                    {activeTab === 'finish-shift' ? 'Initiate Shift-End Confirmation' : 'Initiate Day-End (Shift Confirmation)'}
                </h3>

                {/* Shift Details */}
                <div className="mb-6 p-4 bg-subtle rounded-lg">
                    <h4 className="text-[16px] font-[600] text-fg mb-4">Current Shift Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] text-fg-secondary mb-1">Cashier</label>
                            <div className="text-[14px] font-[500] text-fg">{currentCashier}</div>
                        </div>
                        <div>
                            <label className="block text-[12px] text-fg-secondary mb-1">Date</label>
                            <div className="text-[14px] font-[500] text-fg">{new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                {/* Notice Panel */}
                <div className="mb-6 p-4 bg-brand/10 border border-brand/20 rounded-lg">
                    <div className="flex gap-3">
                        <AlertTriangle className="text-brand-fg flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-[14px] font-[600] text-brand-fg mb-2">Important Notice</h4>
                            <p className="text-[13px] text-brand-fg">
                                {activeTab === 'finish-shift' 
                                    ? "All sales/returns for your shift must be synced before finishing your shift." 
                                    : "All sales/returns must be synced before closing the day."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Confirmations */}
                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dayEndData.shiftConfirmed}
                            onChange={(e) => setDayEndData(prev => ({ ...prev, shiftConfirmed: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-brand-fg border-line rounded focus:ring-brand-fg"
                        />
                        <span className="text-[14px] text-fg">
                            I confirm I've completed all sales/returns for this shift.
                        </span>
                    </label>
                </div>

                {/* Validate Transactions */}
                <div className="mt-6">
                    <button
                        onClick={() => {
                            if (dayEndSummary?.pendingWaiterItemsCount > 0) {
                                toast.error(`Cannot proceed: There are ${dayEndSummary.pendingWaiterItemsCount} pending waiter items to be settled first.`);
                            } else {
                                setDayEndData(prev => ({ ...prev, transactionsValidated: true }));
                                toast.success("All transactions validated successfully.");
                            }
                        }}
                        className={`px-6 py-3 text-on-brand rounded-lg transition-colors text-[14px] font-[500] ${dayEndData.shiftConfirmed ? 'bg-brand hover:bg-brand-hover' : 'bg-neutral-solid cursor-not-allowed'}`}
                        disabled={!dayEndData.shiftConfirmed}
                    >
                        Validate Open Transactions
                    </button>
                    <ButtonHint show={!dayEndData.shiftConfirmed}>Tick the confirmation box above first.</ButtonHint>
                    {dayEndSummary?.pendingWaiterItemsCount > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-error bg-error/10 p-3 rounded-lg border border-error/30">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span className="text-[14px] font-[500]">
                                {activeTab === 'finish-shift' ? 
                                    `There are ${dayEndSummary.pendingWaiterItemsCount} pending items in the waiter section. Please settle these in the POS before finishing your shift.` :
                                    `There are ${dayEndSummary.pendingWaiterItemsCount} pending items in the waiter section across all POS terminals. Please settle these in the POS before ending the day.`
                                }
                            </span>
                        </div>
                    )}
                    {dayEndData.transactionsValidated && (!dayEndSummary?.pendingWaiterItemsCount || dayEndSummary.pendingWaiterItemsCount === 0) && (
                        <div className="mt-3 flex items-center gap-2 text-success">
                            <CheckCircle size={20} />
                            <span className="text-[14px]">
                                No pending transactions found. Ready to proceed.
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const calculateDenominationTotal = (denoms) => {
        if (!denoms) return 0;
        return (
            (parseInt(denoms.n5000) || 0) * 5000 +
            (parseInt(denoms.n1000) || 0) * 1000 +
            (parseInt(denoms.n500) || 0) * 500 +
            (parseInt(denoms.n100) || 0) * 100 +
            (parseInt(denoms.n50) || 0) * 50 +
            (parseInt(denoms.n20) || 0) * 20 +
            (parseInt(denoms.c10) || 0) * 10 +
            (parseInt(denoms.c5) || 0) * 5 +
            (parseInt(denoms.c2) || 0) * 2 +
            (parseInt(denoms.c1) || 0) * 1
        );
    };

    const handleDenominationChange = (key, value) => {
        const parsedVal = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        setDayEndData(prev => {
            const updatedDenoms = {
                ...prev.denominations,
                [key]: parsedVal
            };
            const total = calculateDenominationTotal(updatedDenoms);
            return {
                ...prev,
                denominations: updatedDenoms,
                cashCounted: String(total)
            };
        });
    };

    const renderStep2 = () => {
        const expectedCashTotal = (dayEndSummary?.expectedCash || 0) + (dayEndSummary?.openingFloat || 0);
        const expectedCardTotal = dayEndSummary?.expectedCard || 0;
        const expectedUberPickmeTotal = (dayEndSummary?.expectedUber || 0) + (dayEndSummary?.expectedPickme || 0);

        return (
            <div className="space-y-6">
                <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[18px] font-[600] text-fg">Cash Reconciliation</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cash Count */}
                        <div className="p-4 bg-subtle rounded-lg border border-line md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="text-success" size={24} />
                                    <h4 className="text-[16px] font-[600] text-fg">Cash Count & Denominations Breakdown</h4>
                                </div>
                                <span className="text-[12px] font-[600] text-fg bg-surface px-2.5 py-1 rounded border border-line">
                                    System total: Rs. {expectedCashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Notes Column */}
                                <div className="bg-surface p-4 rounded-lg border border-line space-y-3">
                                    <h5 className="text-[13px] font-[700] text-fg uppercase tracking-wider mb-2 border-b pb-2 flex justify-between items-center">
                                        <span>Currency Notes</span>
                                        <span className="text-[12px] text-fg-secondary font-normal">Count x Value</span>
                                    </h5>
                                    {[
                                        { label: 'Rs. 5000 Note', key: 'n5000', val: 5000 },
                                        { label: 'Rs. 1000 Note', key: 'n1000', val: 1000 },
                                        { label: 'Rs. 500 Note',  key: 'n500',  val: 500 },
                                        { label: 'Rs. 100 Note',  key: 'n100',  val: 100 },
                                        { label: 'Rs. 50 Note',   key: 'n50',   val: 50 },
                                        { label: 'Rs. 20 Note',   key: 'n20',   val: 20 },
                                    ].map(item => {
                                        const count = dayEndData.denominations?.[item.key] || '';
                                        const subtotal = (parseInt(count) || 0) * item.val;
                                        return (
                                            <div key={item.key} className="flex items-center justify-between gap-3 text-[13px]">
                                                <span className="w-32 font-[500] text-fg">{item.label}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={count}
                                                    onChange={(e) => handleDenominationChange(item.key, e.target.value)}
                                                    className="w-24 px-3 py-1.5 border border-line rounded text-center font-[600] text-fg focus:ring-1 focus:ring-brand-fg"
                                                    placeholder="0"
                                                />
                                                <span className="w-28 text-right font-[600] text-success">
                                                    Rs. {subtotal.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Coins Column */}
                                <div className="bg-surface p-4 rounded-lg border border-line space-y-3 flex flex-col justify-between">
                                    <div>
                                        <h5 className="text-[13px] font-[700] text-fg uppercase tracking-wider mb-2 border-b pb-2 flex justify-between items-center">
                                            <span>Currency Coins</span>
                                            <span className="text-[12px] text-fg-secondary font-normal">Count x Value</span>
                                        </h5>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Rs. 10 Coin', key: 'c10', val: 10 },
                                                { label: 'Rs. 5 Coin',  key: 'c5',  val: 5 },
                                                { label: 'Rs. 2 Coin',  key: 'c2',  val: 2 },
                                                { label: 'Rs. 1 Coin',  key: 'c1',  val: 1 },
                                            ].map(item => {
                                                const count = dayEndData.denominations?.[item.key] || '';
                                                const subtotal = (parseInt(count) || 0) * item.val;
                                                return (
                                                    <div key={item.key} className="flex items-center justify-between gap-3 text-[13px]">
                                                        <span className="w-32 font-[500] text-fg">{item.label}</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={count}
                                                            onChange={(e) => handleDenominationChange(item.key, e.target.value)}
                                                            className="w-24 px-3 py-1.5 border border-line rounded text-center font-[600] text-fg focus:ring-1 focus:ring-brand-fg"
                                                            placeholder="0"
                                                        />
                                                        <span className="w-28 text-right font-[600] text-success">
                                                            Rs. {subtotal.toLocaleString()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Calculated Total Box */}
                                    <div className="pt-4 border-t border-line bg-subtle p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[13px] font-[600] text-fg">Counted Total Cash (Rs.):</label>
                                            <input
                                                type="number"
                                                value={dayEndData.cashCounted}
                                                onChange={(e) => setDayEndData(prev => ({ ...prev, cashCounted: e.target.value }))}
                                                className="w-36 px-3 py-2 border border-brand-fg rounded font-[700] text-[15px] text-brand-fg text-right"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {dayEndData.cashCounted && parseFloat(dayEndData.cashCounted) < (dayEndSummary?.openingFloat || 0) && (
                                            <div className="mt-2 flex items-center gap-2 text-error text-[12px] bg-error/10 p-2 rounded">
                                                <AlertTriangle size={14} />
                                                <span>Counted cash cannot be less than opening float (Rs. {dayEndSummary?.openingFloat?.toLocaleString()})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Count */}
                        <div className="p-4 bg-subtle rounded-lg border border-line">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="text-brand-fg" size={24} />
                                    <h4 className="text-[16px] font-[600] text-fg">Card Total</h4>
                                </div>
                                <span className="text-[12px] font-[600] text-brand-fg bg-brand/10 px-2.5 py-1 rounded border border-brand/20">
                                    System total: Rs. {expectedCardTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[12px] text-fg-secondary">Card Counted Total</label>
                                        <button
                                            type="button"
                                            onClick={() => setDayEndData(prev => ({ ...prev, cardCounted: String(expectedCardTotal) }))}
                                            className="text-[12px] text-brand-fg hover:underline font-[500]"
                                        >
                                            Use DB Amount
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        value={dayEndData.cardCounted}
                                        onChange={(e) => setDayEndData(prev => ({ ...prev, cardCounted: e.target.value }))}
                                        className="w-full px-3 py-3 border border-line rounded-md focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                                        placeholder={`System total: Rs. ${expectedCardTotal.toFixed(2)}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PickMe/Uber Count */}
                        <div className="p-4 bg-subtle rounded-lg border border-line">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="text-plum" size={24} />
                                    <h4 className="text-[16px] font-[600] text-fg">PickMe / Uber Total</h4>
                                </div>
                                <span className="text-[12px] font-[600] text-plum bg-plum/10 px-2.5 py-1 rounded border border-plum/30">
                                    System total: Rs. {expectedUberPickmeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-[12px] text-fg-secondary">PickMe/Uber Counted Total</label>
                                        <button
                                            type="button"
                                            onClick={() => setDayEndData(prev => ({ ...prev, uberPickmeCounted: String(expectedUberPickmeTotal) }))}
                                            className="text-[12px] text-brand-fg hover:underline font-[500]"
                                        >
                                            Use DB Amount
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        value={dayEndData.uberPickmeCounted}
                                        onChange={(e) => setDayEndData(prev => ({ ...prev, uberPickmeCounted: e.target.value }))}
                                        className="w-full px-3 py-3 border border-line rounded-md focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                                        placeholder={`System total: Rs. ${expectedUberPickmeTotal.toFixed(2)}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-6">End-of-Day Stock Management</h3>
                {isLoadingProducts ? (
                    <Loader variant="section" text="Loading current inventory..." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-line">
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Product</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">System Qty</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Physical Qty</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Wastage</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Wastage Reason</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Carry Forward</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Missing</th>
                                    <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productData.map((item) => {
                                    const rowError = stockRowError(item);
                                    const missing = item.physicalQty === '' ? 0 : Math.max(0, (item.systemQty || 0) - (parseInt(item.physicalQty) || 0));
                                    return (
                                    <tr key={item.productId} className="border-b border-line">
                                        <td className="py-3 px-4 text-[14px] text-fg font-[500]">{item.productName}</td>
                                        <td className="py-3 px-4 text-[14px] text-fg-secondary">{item.systemQty}</td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                value={item.physicalQty}
                                                onChange={(e) => handleProductQtyChange(item.productId, e.target.value)}
                                                className="w-20 px-2 py-1 border border-line rounded focus:ring-1 focus:ring-brand-fg text-[14px]"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.wastageQty}
                                                disabled={item.physicalQty === ''}
                                                onChange={(e) => handleWastageChange(item.productId, e.target.value)}
                                                className={`w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-brand-fg text-[14px] disabled:bg-subtle ${rowError ? 'border-error' : 'border-line'}`}
                                                placeholder="0"
                                            />
                                            {rowError && <p className="text-[12px] text-error mt-1 max-w-[160px]">{rowError}</p>}
                                        </td>
                                        <td className="py-3 px-4">
                                            {(parseInt(item.wastageQty) || 0) > 0 ? (
                                                <select
                                                    value={item.wastageReason || 'UNSOLD'}
                                                    onChange={(e) => handleWastageReasonChange(item.productId, e.target.value)}
                                                    className="px-2 py-1 border border-line rounded text-[13px] focus:ring-1 focus:ring-brand-fg"
                                                >
                                                    <option value="UNSOLD">Unsold at day end</option>
                                                    <option value="EXPIRED">Expired</option>
                                                    <option value="DAMAGED">Damaged</option>
                                                    <option value="QUALITY_REJECT">Quality reject</option>
                                                </select>
                                            ) : (
                                                <span className="text-[13px] text-fg-muted">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-[14px] text-success font-[600]">
                                            {item.carryForwardQty}
                                        </td>
                                        <td className={`py-3 px-4 text-[14px] font-[600] ${missing > 0 ? 'text-warning' : 'text-fg-muted'}`}
                                            title="System quantity minus counted quantity. Not recorded as wastage.">
                                            {missing}
                                        </td>
                                        <td className="py-3 px-4 text-[14px] text-fg-secondary">{item.unit}</td>
                                    </tr>
                                    );
                                })}
                                {productData.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-6 text-center text-fg-secondary text-[14px]">No products in today's inventory.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h3 className="text-[18px] font-[600] text-fg mb-6">Review All Inputs</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Shift Information */}
                    <div>
                        <h4 className="text-[16px] font-[600] text-fg mb-3">Shift Information</h4>
                        <div className="p-4 bg-subtle rounded-lg h-[96px] flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[12px] text-fg-secondary">Date:</span>
                                    <p className="text-[14px] font-[500] text-fg">{new Date().toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-[12px] text-fg-secondary">Cashier:</span>
                                    <p className="text-[14px] font-[500] text-fg">{currentCashier}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Summary */}
                    <div>
                        <h4 className="text-[16px] font-[600] text-fg mb-3">Shift Sales Summary</h4>
                        <div className="p-4 bg-subtle rounded-lg h-[96px] flex flex-col justify-center">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-2 bg-surface rounded border border-line flex flex-col justify-center">
                                    <span className="text-[12px] text-fg-secondary block uppercase font-[600]">Total Sales</span>
                                    <span className="text-[13px] font-[700] text-brand-fg truncate">
                                        Rs. {(dayEndSummary?.totalSalesAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </span>
                                </div>
                                <div className="text-center p-2 bg-surface rounded border border-line flex flex-col justify-center">
                                    <span className="text-[12px] text-fg-secondary block uppercase font-[600]">Total Bills</span>
                                    <span className="text-[13px] font-[700] text-warning">
                                        {dayEndSummary?.totalBills || 0}
                                    </span>
                                </div>
                                <div className="text-center p-2 bg-surface rounded border border-line flex flex-col justify-center">
                                    <span className="text-[12px] text-fg-secondary block uppercase font-[600]">Loyal Cust.</span>
                                    <span className="text-[13px] font-[700] text-success">
                                        {dayEndSummary?.loyaltyCustomersCount || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Reconciliation */}
                <div className="mb-6">
                    <h4 className="text-[16px] font-[600] text-fg mb-3">Payment Reconciliation Comparison</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-line rounded-lg">
                            <thead>
                                <tr className="bg-subtle border-b border-line">
                                    <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Payment Method</th>
                                    <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-right">Expected (System)</th>
                                    <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-right">Counted (Entered)</th>
                                    <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Cash */}
                                <tr className="border-b border-line">
                                    <td className="py-3 px-4 text-[14px] text-fg font-[500]">Cash (incl. Float)</td>
                                    <td className="py-3 px-4 text-[14px] text-fg-secondary text-right">
                                        Rs. {((dayEndSummary?.expectedCash || 0) + (dayEndSummary?.openingFloat || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td className="py-3 px-4 text-[14px] text-fg text-right font-[500]">
                                        Rs. {dayEndData.cashCounted ? parseFloat(dayEndData.cashCounted).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                    </td>
                                    <td className={`py-3 px-4 text-[14px] text-right font-[600] ${
                                        (parseFloat(dayEndData.cashCounted) || 0) - ((dayEndSummary?.expectedCash || 0) + (dayEndSummary?.openingFloat || 0)) >= 0 
                                            ? 'text-success' 
                                            : 'text-error'
                                    }`}>
                                        Rs. {((parseFloat(dayEndData.cashCounted) || 0) - ((dayEndSummary?.expectedCash || 0) + (dayEndSummary?.openingFloat || 0))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                </tr>
                                {/* Card */}
                                <tr className="border-b border-line">
                                    <td className="py-3 px-4 text-[14px] text-fg font-[500]">Card</td>
                                    <td className="py-3 px-4 text-[14px] text-fg-secondary text-right">
                                        Rs. {(dayEndSummary?.expectedCard || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td className="py-3 px-4 text-[14px] text-fg text-right font-[500]">
                                        Rs. {dayEndData.cardCounted ? parseFloat(dayEndData.cardCounted).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                    </td>
                                    <td className={`py-3 px-4 text-[14px] text-right font-[600] ${
                                        (parseFloat(dayEndData.cardCounted) || 0) - (dayEndSummary?.expectedCard || 0) >= 0 
                                            ? 'text-success' 
                                            : 'text-error'
                                    }`}>
                                        Rs. {((parseFloat(dayEndData.cardCounted) || 0) - (dayEndSummary?.expectedCard || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                </tr>
                                {/* PickMe/Uber */}
                                <tr>
                                    <td className="py-3 px-4 text-[14px] text-fg font-[500]">PickMe / Uber</td>
                                    <td className="py-3 px-4 text-[14px] text-fg-secondary text-right">
                                        Rs. {((dayEndSummary?.expectedUber || 0) + (dayEndSummary?.expectedPickme || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td className="py-3 px-4 text-[14px] text-fg text-right font-[500]">
                                        Rs. {dayEndData.uberPickmeCounted ? parseFloat(dayEndData.uberPickmeCounted).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                    </td>
                                    <td className={`py-3 px-4 text-[14px] text-right font-[600] ${
                                        (parseFloat(dayEndData.uberPickmeCounted) || 0) - ((dayEndSummary?.expectedUber || 0) + (dayEndSummary?.expectedPickme || 0)) >= 0 
                                            ? 'text-success' 
                                            : 'text-error'
                                    }`}>
                                        Rs. {((parseFloat(dayEndData.uberPickmeCounted) || 0) - ((dayEndSummary?.expectedUber || 0) + (dayEndSummary?.expectedPickme || 0))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stock Updates Summary (Only for Day End) */}
                {activeTab !== 'finish-shift' && (
                    <>
                        <div className="mb-6">
                            <h4 className="text-[16px] font-[600] text-fg mb-3">Stock Updates Summary</h4>
                            <div className="p-4 bg-subtle rounded-lg">
                                <div className="text-[14px] text-fg-secondary">Products Processed: {productData.filter(item => item.physicalQty !== '').length} / {productData.length}</div>
                            </div>
                        </div>

                        {/* Product Actions Summary */}
                        <div>
                            <h4 className="text-[16px] font-[600] text-fg mb-3">Product Actions Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-success/10 rounded-lg">
                                    <h5 className="text-[14px] font-[600] text-success mb-2">Carry Forward</h5>
                                    {productData.filter(item => item.carryForwardQty > 0).map(item => (
                                        <div key={item.productId} className="text-[12px] text-success">
                                            {item.productName} - {item.carryForwardQty} {item.unit}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-error/10 rounded-lg">
                                    <h5 className="text-[14px] font-[600] text-error mb-2">Wastage</h5>
                                    {productData.filter(item => item.wastageQty > 0).map(item => (
                                        <div key={item.productId} className="text-[12px] text-error">
                                            {item.productName} - {item.wastageQty} {item.unit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-6">
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="text-center">
                    <Lock size={64} className="text-brand-fg mx-auto mb-4" />
                    <h3 className="text-[20px] font-[600] text-fg mb-4">
                        {activeTab === 'finish-shift' ? 'Confirm & Close Shift' : 'Confirm & Lock Day-End'}
                    </h3>
                    <p className="text-[14px] text-fg-secondary mb-6">
                        {activeTab === 'finish-shift' 
                            ? "Please review and confirm all the shift information below. Once closed, you will be checked out of your shift." 
                            : "Please review and confirm all the information below. Once confirmed, this action cannot be undone."}
                    </p>

                    {/* Effects List */}
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 text-left">
                        <h4 className="text-[14px] font-[600] text-warning mb-3">This action will:</h4>
                        <ul className="text-[13px] text-warning space-y-2">
                            {activeTab === 'finish-shift' ? (
                                <>
                                    <li>• Close your shift cash float permanently</li>
                                    <li>• Lock your shift's transaction records</li>
                                    <li>• Update inventory with physical counts</li>
                                    <li>• Process carry-forward and wastage items</li>
                                    <li>• Generate your shift report</li>
                                    <li>• Allow other cashiers to open their shifts subsequently</li>
                                </>
                            ) : (
                                <>
                                    <li>• Close the current shift permanently</li>
                                    <li>• Lock all transaction records for today</li>
                                    <li>• Update inventory with physical counts</li>
                                    <li>• Process carry-forward and wastage items</li>
                                    <li>• Generate final day-end report</li>
                                    <li>• Prevent further modifications to today's data</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Final Confirmation */}
                    <div className="mb-6">
                        <label className="flex items-start gap-3 cursor-pointer justify-center">
                            <input
                                type="checkbox"
                                checked={dayEndData.finalConfirmation}
                                onChange={(e) => setDayEndData(prev => ({ ...prev, finalConfirmation: e.target.checked }))}
                                className="mt-1 w-4 h-4 text-brand-fg border-line rounded focus:ring-brand-fg"
                            />
                            <span className="text-[14px] text-fg">
                                I certify the above information is true and complete.
                            </span>
                        </label>
                    </div>

                    {/* PIN/Password Prompt */}
                    <div className="mb-6 max-w-xs mx-auto">
                        <label className="block text-[14px] font-[500] text-fg mb-2">Enter Cashier PIN</label>
                        <input
                            type="password"
                            value={cashierPin}
                            onChange={(e) => setCashierPin(e.target.value)}
                            className="w-full px-3 py-3 border border-line rounded-md focus:ring-2 focus:ring-brand-fg focus:border-transparent text-center text-[16px] font-[600]"
                            placeholder="****"
                            maxLength="4"
                        />
                    </div>

                    {/* Final Action Button */}
                    <button
                        onClick={() => setShowConfirmation(true)}
                        disabled={!canProceedToNextStep()}
                        className="px-8 py-4 bg-error-solid text-on-brand rounded-lg hover:bg-error-solid transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[16px] font-[600] flex items-center gap-2 mx-auto"
                    >
                        <Lock size={20} />
                        {activeTab === 'finish-shift' ? 'Confirm & Close Shift' : 'Confirm Day-End & Lock'}
                    </button>
                    <ButtonHint show={!canProceedToNextStep()}>{nextStepHint()}</ButtonHint>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed left-0 right-0 bottom-0 w-screen h-screen bg-backdrop bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-surface rounded-lg p-6 max-w-md w-full">
                        <div className="text-center">
                            <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
                            <h3 className="text-[18px] font-[600] text-fg mb-4">
                                {activeTab === 'finish-shift' ? 'Close Shift Confirmation' : 'Final Confirmation'}
                            </h3>
                            <p className="text-[14px] text-fg-secondary mb-6">
                                {activeTab === 'finish-shift' 
                                    ? "Are you sure you want to finalize and close your shift? This will settle your counts." 
                                    : "Are you absolutely sure you want to finalize and lock the day-end process? This action cannot be undone."}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="flex-1 px-4 py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFinalizeDayEnd}
                                    className="flex-1 px-4 py-3 bg-error-solid text-on-brand rounded-lg hover:bg-error-solid transition-colors"
                                >
                                    {activeTab === 'finish-shift' ? 'Yes, Close Shift' : 'Yes, Lock Day-End'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return null;
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return activeTab === 'finish-shift' ? 'Initiate Shift-End' : 'Initiate Day End';
            case 2: return 'Cash Reconciliation';
            case 3: return 'Stock & Product Management';
            case 4: return 'Review Summary';
            case 5: return activeTab === 'finish-shift' ? 'Confirm & Close Shift' : 'Confirm & Lock';
            default: return activeTab === 'finish-shift' ? 'Finish Shift' : 'Day End';
        }
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
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-fg truncate">
                                            {getStepTitle()}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-fg-secondary truncate">
                                            <span className="hidden sm:inline">{currentTime.toLocaleDateString()} - </span>
                                            Step {activeTab === 'finish-shift' ? (currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep) : currentStep} of {activeTab === 'finish-shift' ? 4 : 5}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-line mb-6">
                                <button
                                    onClick={() => {
                                        setActiveTab('day-end');
                                        setCurrentStep(1);
                                        setCashierPin('');
                                        setDayEndData(prev => ({
                                            ...prev,
                                            shiftConfirmed: false,
                                            transactionsValidated: false,
                                            cashCounted: '',
                                            cardCounted: '',
                                            uberPickmeCounted: '',
                                            stockUpdateConfirmed: false,
                                            finalConfirmation: false
                                        }));
                                    }}
                                    className={`px-6 py-3 border-b-2 font-semibold text-[15px] transition-all duration-200 ${
                                        activeTab === 'day-end'
                                            ? 'border-brand-fg text-brand-fg'
                                            : 'border-transparent text-fg-secondary hover:text-fg'
                                    }`}
                                >
                                    Day End
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('finish-shift');
                                        setCurrentStep(1);
                                        setCashierPin('');
                                        setDayEndData(prev => ({
                                            ...prev,
                                            shiftConfirmed: false,
                                            transactionsValidated: false,
                                            cashCounted: '',
                                            cardCounted: '',
                                            uberPickmeCounted: '',
                                            stockUpdateConfirmed: false,
                                            finalConfirmation: false
                                        }));
                                    }}
                                    className={`px-6 py-3 border-b-2 font-semibold text-[15px] transition-all duration-200 ${
                                        activeTab === 'finish-shift'
                                            ? 'border-brand-fg text-brand-fg'
                                            : 'border-transparent text-fg-secondary hover:text-fg'
                                    }`}
                                >
                                    Finish Shift
                                </button>
                            </div>

                            {/* Step Indicator */}
                            {renderStepIndicator()}

                            {/* Step Content */}
                            {renderCurrentStep()}
                        </div>
                    </div>

                    {/* Sticky Footer with Navigation Buttons */}
                    <div className="bg-surface border-t border-line p-4">
                        <div className="max-w-6xl mx-auto flex justify-between items-center">
                            <div className="flex gap-3">
                                {currentStep > 1 && (
                                    <button
                                        onClick={handlePreviousStep}
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

                            {currentStep < 5 && (
                                <div className="flex flex-col items-end">
                                <button
                                    onClick={handleNextStep}
                                    disabled={!canProceedToNextStep()}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-[500]"
                                >
                                    Next
                                </button>
                                <ButtonHint show={!canProceedToNextStep()} className="text-right">{nextStepHint()}</ButtonHint>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}