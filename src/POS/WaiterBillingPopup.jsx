import React, { useState, useEffect } from "react";
import { X, Banknote, CreditCard, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../services/api";
import { appChannel, appPrice } from "../utils/appPrice";
import { LoyaltyBox, EMPTY_LOYALTY, loyaltyRedemption, loyaltyRequest } from "../component/BillExtras";
import EBillPayButton from "../component/EBillPayButton";
import { tileColor } from "../utils/tileColors";
import MealDetails, { EMPTY_MEAL, mealReason } from "../component/MealDetails";
import { posBill, sendEBill } from "../utils/eBill";
import { DeliveryAppLogo } from "../component/AppLogos";
import { onEnterClick } from "../utils/a11y";
import { confirmDialog } from "../component/ConfirmDialog";
import CashQuickButtons from "../component/CashQuickButtons.jsx";
import useOutletInfo from "../utils/useOutletInfo";
import { PosPrintout } from "../component/print/ThermalPrint";

/**
 * The waiter's bill popup (owner 12 Nov: the same on New Sale and on Waiter Billing): pick the waiter, transfer, tick the
 * items paid now (the rest stay open), Cash / Card / More, quick cash, Pay without Receipt / Pay & Print / E-Bill.
 *  products: the POS products (Uber / PickMe prices); waiter: the waiter to open with; onSelect(waiter): the waiter picked;
 *  onClose(); onChanged(): after a payment or a transfer (refresh stock / waiters).
 */
export default function WaiterBillingPopup({ products = [], waiter = null, onSelect, onClose, onChanged }) {
    const outlet = useOutletInfo(); // outlet name/address printed on bills
    const [waiters, setWaiters] = useState([]);
    const [selectedWaiter, setSelectedWaiterState] = useState(waiter);
    const setSelectedWaiter = (w) => { setSelectedWaiterState(w); if (onSelect) onSelect(w); };
    const setShowWaiterPanel = (open) => { if (!open) onClose(); };
    const [waiterDiscountManagerCode, setWaiterDiscountManagerCode] = useState('');
    const [waiterDetails, setWaiterDetails] = useState(null);
    const [selectedWaiterItemIds, setSelectedWaiterItemIds] = useState([]);
    const [targetWaiterId, setTargetWaiterId] = useState('');
    const [waiterPaymentType, setWaiterPaymentType] = useState('CASH');
    // a free meal is recorded with who asked and why, a staff meal with a checked Staff ID (as at the payment popup)
    const [waiterFreeMealReason, setWaiterFreeMealReason] = useState('');   // kept for the resets below
    const [waiterMeal, setWaiterMeal] = useState(EMPTY_MEAL);
    const waiterMealKind = waiterPaymentType === 'STAFF_MEAL' ? 'staff' : waiterPaymentType === 'FREE_MEAL' ? 'free' : null;
    const waiterMealReason = waiterMealKind ? mealReason(waiterMealKind, waiterMeal) : '';
    const waiterFreeMealMissing = !!waiterMealKind && !waiterMealReason;
    // cash received (empty = exact), card / transfer reference, customer loyalty; More shows the other ways to pay
    const [waiterCash, setWaiterCash] = useState('');
    const [waiterRef, setWaiterRef] = useState('');
    const [waiterLast4, setWaiterLast4] = useState('');   // card: last 4 digits, printed as **** 1234 (owner 12 Nov)
    const [waiterLoyalty, setWaiterLoyalty] = useState(EMPTY_LOYALTY);
    const [waiterMore, setWaiterMore] = useState(false);
    const resetWaiterPay = () => { setWaiterMeal(EMPTY_MEAL); setWaiterCash(''); setWaiterRef(''); setWaiterLast4(''); setWaiterLoyalty(EMPTY_LOYALTY); };
    const [printData, setPrintData] = useState(null);
    const [showWaiterDiscountModal, setShowWaiterDiscountModal] = useState(false);
    const [waiterDiscountAmount, setWaiterDiscountAmount] = useState('0');
    const [waiterDiscountReason, setWaiterDiscountReason] = useState('');

    // Uber / PickMe waiter bill: each item at the product's Uber / PickMe price (owner 12 Nov), as the server bills it
    const waiterCh = appChannel(waiterPaymentType);
    const waiterUnpaid = (waiterDetails?.unpaidItems || []).map(it => {
        const p = waiterCh ? appPrice(products.find(x => x.id === it.productId), waiterCh, null) : null;
        return p == null ? it : { ...it, unitPrice: p, totalPrice: p * (it.qty ?? it.quantity ?? 0) };
    });
    const selectedSubTotal = waiterUnpaid
        ? waiterUnpaid
            .filter(item => selectedWaiterItemIds.includes(item.id))
            .reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
        : 0;
    const waiterBillTotal = selectedSubTotal - (parseFloat(waiterDiscountAmount) || 0);
    const waiterRedemption = loyaltyRedemption(waiterBillTotal, waiterLoyalty);   // taken off by the server
    const waiterToPay = waiterBillTotal - waiterRedemption;
    const waiterPayBlocked = waiterFreeMealMissing
        || ((waiterPaymentType === 'CARD') && (!waiterRef.trim() || !/^\d{4}$/.test(waiterLast4)))
        || (waiterPaymentType === 'CASH' && waiterCash !== '' && !(parseFloat(waiterCash) >= waiterToPay));

    const fetchWaiters = async () => {
        try {
            const outletId = localStorage.getItem("outletId");
            const response = await axios.get(`/api/pos/v1/waiter-billing/waiters?outletId=${outletId}`);
            const mappedData = response.data.map(item => ({
                id: item.userId,
                userId: item.userId,
                name: item.firstName + ' ' + item.lastName,
                username: item.username,
                status: 'available'
            }));
            setWaiters(mappedData);
        } catch (error) {
            console.error("Error fetching waiters:", error);
        }
    };

    const fetchWaiterDetails = async (waiterId) => {
        try {
            const response = await axios.get(`/api/pos/v1/waiter-billing/waiter-details/${waiterId}`);
            setWaiterDetails(response.data);
            if (response.data && response.data.unpaidItems) {
                setSelectedWaiterItemIds(response.data.unpaidItems.map(item => item.id));
            } else {
                setSelectedWaiterItemIds([]);
            }
        } catch (error) {
            console.error("Error fetching waiter details:", error);
            setWaiterDetails(null);
            setSelectedWaiterItemIds([]);
        }
    };

    const toggleWaiterItemSelection = (itemId) => {
        setSelectedWaiterItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const clearWaiter = () => {
        setSelectedWaiter(null);
        setWaiterDetails(null);
        setSelectedWaiterItemIds([]);
    };

    const handleWaiterClick = (waiter) => {
        if (selectedWaiter?.userId === waiter.userId) { clearWaiter(); return; } // tap again to unselect
        setSelectedWaiter(waiter);
        fetchWaiterDetails(waiter.userId);
        setWaiterDiscountAmount('0');
        setWaiterDiscountReason('');
        setWaiterDiscountManagerCode('');
    };

    // Waiter settlement paid and the bill sent to the customer's phone as an SMS (instead of printed)
    const settleWaiterWithEBill = async (phone) => {
        const discountVal = parseFloat(waiterDiscountAmount) || 0;
        try {
            const selectedItems = waiterUnpaid.filter(item => selectedWaiterItemIds.includes(item.id));
            const finished = await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, {
                waiterId: selectedWaiter.userId,
                itemIdsToPay: selectedWaiterItemIds,
                finalTotal: selectedSubTotal - discountVal,
                paymentType: waiterPaymentType,
                discountAmount: discountVal,
                discountReason: (waiterPaymentType === 'FREE_MEAL' || waiterPaymentType === 'STAFF_MEAL') ? waiterMealReason : waiterDiscountReason,
                manualDiscount: discountVal > 0,
                managerCode: waiterPaymentType === 'FREE_MEAL' ? (waiterMeal.approvalCode || '').trim() : (discountVal > 0 ? waiterDiscountManagerCode : null),
                outletId: parseInt(localStorage.getItem("outletId") || "1"),
                paymentReference: waiterPaymentType === 'CARD' ? `${waiterRef.trim()} (card **** ${waiterLast4})` : waiterPaymentType === 'BANK_TRANSFER' ? waiterRef.trim() : null,
                ...loyaltyRequest(waiterLoyalty),
                invoicePrinted: false
            });
            toast.success("Payment successful! Sale completed.");
            sendEBill(phone, posBill({
                transactionId: finished.data?.data?.billNumber,
                items: selectedItems.map(item => ({ productName: item.productName, qty: item.quantity || item.qty, unitPrice: item.unitPrice })),
                subTotal: selectedSubTotal,
                discount: discountVal + waiterRedemption,
                finalTotal: selectedSubTotal - discountVal - waiterRedemption,
                paymentMethod: waiterPaymentType
            }, outlet)).then((m) => toast.success(m)).catch((e) => toast.error(e.message));
            setWaiterDiscountAmount('0');
            setWaiterDiscountReason('');
            setWaiterFreeMealReason(''); resetWaiterPay();
            fetchWaiterDetails(selectedWaiter.userId); onChanged && onChanged();
        } catch (e) {
            console.error(e);
            toast.error("Failed to process payment");
        }
    };

    const handleTransferWaiter = async () => {
        if (!selectedWaiter || !targetWaiterId) return;
        try {
            await axios.post(`/api/pos/v1/waiter-billing/transfer`, null, {
                params: {
                    fromWaiterId: selectedWaiter.userId,
                    toWaiterId: targetWaiterId
                }
            });
            toast.success("Items transferred successfully!");
            setSelectedWaiter(null);
            setWaiterDetails(null);
            setTargetWaiterId('');
            onChanged && onChanged();
        } catch (error) {
            console.error("Error transferring items:", error);
            toast.error("Failed to transfer items");
        }
    };

    const getLoggedInCashierName = (apiCashierName) => {
        if (apiCashierName && typeof apiCashierName === 'string' && apiCashierName.trim()) {
            return apiCashierName.trim();
        }
        const first = localStorage.getItem("firstName");
        const last = localStorage.getItem("lastName");
        if (first || last) {
            return `${first || ''} ${last || ''}`.trim();
        }
        return localStorage.getItem("userName") || localStorage.getItem("username") || "Cashier";
    };


    useEffect(() => {
        fetchWaiters();
        if (waiter) fetchWaiterDetails(waiter.userId);
        // eslint-disable-next-line
    }, []);

    return (
        <>
                                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[18px] font-[600] text-fg">Waiter Billing</h3>
                                                <button aria-label="Close" onClick={() => setShowWaiterPanel(false)} className="p-1 text-fg-secondary hover:bg-subtle rounded">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Waiter Selection Grid */}
                                            <div className="mb-4">
                                                <h4 className="text-[13px] font-[500] text-fg mb-2">Select Waiter</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {waiters.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => handleWaiterClick(w)}
                                                            className={`p-2 rounded-lg border-2 transition-all text-left ${selectedWaiter?.userId === w.userId
                                                                ? 'border-brand-fg bg-brand/5'
                                                                : 'border-line hover:border-brand-fg/30'
                                                                }`}
                                                        >
                                                            <p className="text-[13px] font-[600] text-fg truncate">{w.name}</p>
                                                            <p className="text-[12px] text-fg-secondary truncate">@{w.username}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedWaiter && (
                                                <>
                                                    <div className="mb-4">
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={targetWaiterId}
                                                                onChange={(e) => setTargetWaiterId(e.target.value)}
                                                                className="flex-1 px-3 py-2 border border-line rounded-lg text-[14px]"
                                                            >
                                                                <option value="">Transfer to Waiter...</option>
                                                                {waiters.filter(w => w.userId !== selectedWaiter.userId).map(w => (
                                                                    <option key={w.userId} value={w.userId}>{w.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={handleTransferWaiter}
                                                                disabled={!targetWaiterId}
                                                                className="px-4 py-2 bg-brand text-on-brand rounded-lg disabled:opacity-50 transition-colors text-[14px]"
                                                            >
                                                                Transfer
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {waiterDetails && waiterUnpaid.length > 0 && (
                                                        <div className="flex items-center justify-between mb-3 px-1">
                                                            <label className="flex items-center gap-2 cursor-pointer text-[14px] text-fg font-[500]">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedWaiterItemIds.length === waiterUnpaid.length}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedWaiterItemIds(waiterUnpaid.map(item => item.id));
                                                                        } else {
                                                                            setSelectedWaiterItemIds([]);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 text-brand-fg border-line rounded focus:ring-brand-fg cursor-pointer"
                                                                />
                                                                Select All ({waiterUnpaid.length})
                                                            </label>
                                                            <span className="text-[12px] text-fg-secondary">
                                                                {selectedWaiterItemIds.length} selected
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="mb-4">
                                                        {!waiterDetails || waiterUnpaid.length === 0 ? (
                                                            <p className="text-fg-secondary text-[14px] text-center py-4">No active items.</p>
                                                        ) : (() => {
                                                            const groupedBills = {};
                                                            waiterUnpaid.forEach(item => {
                                                                const key = item.billId || "UNGROUPED";
                                                                if (!groupedBills[key]) {
                                                                    groupedBills[key] = [];
                                                                }
                                                                groupedBills[key].push(item);
                                                            });

                                                            return (
                                                                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                                                                    {Object.entries(groupedBills).map(([billKey, items], index) => {
                                                                        const allSelected = items.every(item => selectedWaiterItemIds.includes(item.id));
                                                                        const billSubTotal = items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
                                                                        const displayTitle = billKey.startsWith("BILL-")
                                                                            ? `Bill #${index + 1}`
                                                                            : billKey === "UNGROUPED" ? "Separate Items" : billKey;

                                                                        return (
                                                                            <div key={billKey} className={`border border-line border-l-4 ${tileColor(index).edge} rounded-xl bg-surface shadow-sm overflow-hidden`}>
                                                                                {/* Bill Header: its own colour, so each bill stands apart */}
                                                                                <div className={`flex items-center justify-between border-b border-line p-3 ${tileColor(index).tint}`}>
                                                                                    <label className="flex items-center gap-2 cursor-pointer font-[600] text-fg text-[14px]">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={allSelected}
                                                                                            onChange={(e) => {
                                                                                                const itemIds = items.map(item => item.id);
                                                                                                if (e.target.checked) {
                                                                                                    setSelectedWaiterItemIds(prev => [...new Set([...prev, ...itemIds])]);
                                                                                                } else {
                                                                                                    setSelectedWaiterItemIds(prev => prev.filter(id => !itemIds.includes(id)));
                                                                                                }
                                                                                            }}
                                                                                            className="w-4 h-4 text-brand-fg border-line rounded focus:ring-brand-fg cursor-pointer"
                                                                                        />
                                                                                        {displayTitle} ({items.length} {items.length === 1 ? 'item' : 'items'})
                                                                                    </label>
                                                                                    <span className="text-[14px] font-[700] text-brand-fg">Rs. {billSubTotal.toLocaleString()}</span>
                                                                                </div>

                                                                                {/* Bill Items: indented under their bill */}
                                                                                <div className="space-y-1.5 py-2 pr-2 pl-6 bg-surface">
                                                                                    {items.map(item => {
                                                                                        const isChecked = selectedWaiterItemIds.includes(item.id);
                                                                                        return (
                                                                                            <div
                                                                                                key={item.id}
                                                                                                role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => toggleWaiterItemSelection(item.id)}
                                                                                                className={`flex justify-between p-2.5 rounded-lg items-center cursor-pointer transition-colors border ${isChecked ? 'bg-brand/5 border-brand-fg' : 'bg-surface border-line hover:border-brand-fg/30'
                                                                                                    }`}
                                                                                            >
                                                                                                <div className="flex items-center gap-2.5">
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        checked={isChecked}
                                                                                                        onChange={() => { }}
                                                                                                        className="w-3.5 h-3.5 text-brand-fg border-line-strong rounded focus:ring-brand-fg cursor-pointer"
                                                                                                    />
                                                                                                    <div>
                                                                                                        <p className="text-[13px] font-[500] text-fg">{item.productName}</p>
                                                                                                        <p className="text-[12px] text-fg-secondary">{item.qty || item.quantity} x Rs. {item.unitPrice}</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <p className="text-[14px] font-[600] text-brand-fg">Rs. {item.totalPrice}</p>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    {waiterDetails && waiterUnpaid.length > 0 && (
                                                        <div className="border-t border-line pt-4 mt-auto">
                                                            <div className="space-y-1.5 mb-4">
                                                                <div className="flex justify-between text-[14px] text-fg-secondary">
                                                                    <span>Subtotal Selected:</span>
                                                                    <span>Rs. {selectedSubTotal.toLocaleString()}</span>
                                                                </div>
                                                                {parseFloat(waiterDiscountAmount) > 0 && (
                                                                    <div className="flex justify-between text-[14px] text-warning font-[500]">
                                                                        <span>Discount ({waiterDiscountReason || "No Reason"}):</span>
                                                                        <span>- Rs. {parseFloat(waiterDiscountAmount).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                {waiterRedemption > 0 && (
                                                                    <div className="flex justify-between text-[14px] text-success font-[500]">
                                                                        <span>Loyalty points:</span>
                                                                        <span>- Rs. {waiterRedemption.toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between text-[18px] font-[600] text-fg border-t border-dashed pt-1">
                                                                    <span>Total Selected:</span>
                                                                    <span className="text-error">Rs. {waiterToPay.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            {/* how the bill is paid: Cash / Card, the rest under More */}
                                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                                <button type="button" onClick={() => setWaiterPaymentType('CASH')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'CASH' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}><Banknote size={14} /> Cash</button>
                                                                <button type="button" onClick={() => setWaiterPaymentType('CARD')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'CARD' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}><CreditCard size={14} /> Card</button>
                                                                <button type="button" onClick={() => setWaiterMore(m => !m)}
                                                                    className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterMore ? 'border-brand-fg text-brand-fg' : 'border-line hover:bg-subtle'}`}>
                                                                    <MoreHorizontal size={14} /> More
                                                                </button>
                                                            </div>
                                                            {(waiterMore || !['CASH', 'CARD'].includes(waiterPaymentType)) && (
                                                                <div className="mb-3 space-y-3 p-3 border border-dashed border-line rounded-lg">
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                        <button type="button" onClick={() => setWaiterPaymentType('BANK_TRANSFER')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'BANK_TRANSFER' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}>Bank Transfer</button>
                                                                        <button type="button" onClick={() => setWaiterPaymentType('PICKME')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'PICKME' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}><DeliveryAppLogo app="PICKME" /> PickMe</button>
                                                                        <button type="button" onClick={() => setWaiterPaymentType('UBER')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'UBER' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}><DeliveryAppLogo app="UBER" /> Uber</button>
                                                                        <button type="button" onClick={() => setWaiterPaymentType('STAFF_MEAL')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'STAFF_MEAL' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}>Staff Meal</button>
                                                                        <button type="button" onClick={() => setWaiterPaymentType('FREE_MEAL')}
                                                                        className={`px-3 py-2 rounded-lg border text-[13px] font-[500] flex items-center justify-center gap-1.5 ${waiterPaymentType === 'FREE_MEAL' ? 'border-brand-fg bg-brand/10 text-brand-fg' : 'border-line hover:bg-subtle'}`}>Free Meal</button>
                                                                        <button type="button" onClick={() => setShowWaiterDiscountModal(true)}
                                                                            className="px-3 py-2 rounded-lg border border-brand/20 bg-hover text-brand-fg text-[13px] font-[500]">Discount</button>
                                                                    </div>
                                                                    <LoyaltyBox payable={waiterBillTotal} value={waiterLoyalty} onChange={setWaiterLoyalty} />
                                                                </div>
                                                            )}
                                                            {waiterPaymentType === 'CASH' && (
                                                                <div className="mb-3">
                                                                    <label className="block text-[13px] font-[500] text-fg mb-1">Cash Received</label>
                                                                    <CashQuickButtons total={waiterToPay} selected={waiterCash} onPick={setWaiterCash} />
                                                                    <input type="number" min="0" value={waiterCash} onChange={(e) => setWaiterCash(e.target.value)}
                                                                        placeholder={`Exact: Rs. ${waiterToPay.toLocaleString()}`}
                                                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none" />
                                                                    {waiterCash !== '' && parseFloat(waiterCash) >= waiterToPay && (
                                                                        <div className="mt-2 p-2 bg-hover rounded-lg">
                                                                            <p className="text-[14px] text-error font-[700]">Change: Rs. {(parseFloat(waiterCash) - waiterToPay).toLocaleString()}</p>
                                                                        </div>
                                                                    )}
                                                                    {waiterCash !== '' && !(parseFloat(waiterCash) >= waiterToPay) && (
                                                                        <p className="text-[12px] text-warning mt-1">Cash received is less than the total.</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {['CARD', 'BANK_TRANSFER'].includes(waiterPaymentType) && (
                                                                <div className="mb-3">
                                                                    <label className="block text-[13px] font-[500] text-fg mb-1">{waiterPaymentType === 'CARD' ? 'Card transaction reference *' : 'Bank transfer reference'}</label>
                                                                    <input type="text" value={waiterRef} onChange={(e) => setWaiterRef(e.target.value)}
                                                                        placeholder={waiterPaymentType === 'CARD' ? 'Enter card transaction reference' : 'Reference (optional)'}
                                                                        className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:border-brand-fg focus:outline-none ${waiterPaymentType === 'CARD' && !waiterRef.trim() ? 'border-warning' : 'border-line'}`} />
                                                                    {waiterPaymentType === 'CARD' && (
                                                                        <>
                                                                            <label className="block text-[13px] font-[500] text-fg mt-2 mb-1">Card last 4 digits *</label>
                                                                            <input type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 1234" value={waiterLast4}
                                                                                onChange={(e) => setWaiterLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                                                className={`w-full px-3 py-2 border rounded-lg text-[14px] focus:border-brand-fg focus:outline-none ${!/^\d{4}$/.test(waiterLast4) ? 'border-warning' : 'border-line'}`} />
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {waiterMealKind && (
                                                                <div className="mb-3">
                                                                    <MealDetails kind={waiterMealKind} value={waiterMeal} onChange={setWaiterMeal} />
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                                <button
                                                                    disabled={selectedWaiterItemIds.length === 0 || waiterPayBlocked}
                                                                    onClick={async () => {
                                                                        const discountVal = parseFloat(waiterDiscountAmount) || 0;
                                                                        if (await confirmDialog(`Process payment and complete sale (without printing) for the ${selectedWaiterItemIds.length} selected items?`, { confirmText: "Process payment" })) {
                                                                            try {
                                                                                const payload = {
                                                                                    waiterId: selectedWaiter.userId,
                                                                                    itemIdsToPay: selectedWaiterItemIds,
                                                                                    finalTotal: selectedSubTotal - discountVal,
                                                                                    paymentType: waiterPaymentType,
                                                                                    discountAmount: discountVal,
                                                                                    discountReason: (waiterPaymentType === 'FREE_MEAL' || waiterPaymentType === 'STAFF_MEAL') ? waiterMealReason : waiterDiscountReason,
                                                                                    manualDiscount: discountVal > 0,
                                                                                    managerCode: waiterPaymentType === 'FREE_MEAL' ? (waiterMeal.approvalCode || '').trim() : (discountVal > 0 ? waiterDiscountManagerCode : null),
                                                                                    outletId: parseInt(localStorage.getItem("outletId") || "1"),
                paymentReference: waiterPaymentType === 'CARD' ? `${waiterRef.trim()} (card **** ${waiterLast4})` : waiterPaymentType === 'BANK_TRANSFER' ? waiterRef.trim() : null,
                ...loyaltyRequest(waiterLoyalty),
                                                                                    invoicePrinted: false
                                                                                };
                                                                                await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, payload);

                                                                                toast.success("Payment successful! Sale completed.");
                                                                                setWaiterDiscountAmount('0');
                                                                                setWaiterDiscountReason('');
                                                                                setWaiterFreeMealReason(''); resetWaiterPay();
                                                                                fetchWaiterDetails(selectedWaiter.userId); onChanged && onChanged();
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                                toast.error("Failed to process payment");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full py-3 border border-line-strong bg-surface text-fg rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed font-[500] flex justify-center items-center gap-2"
                                                                >
                                                                    Pay without Receipt
                                                                </button>
                                                                <button
                                                                    disabled={selectedWaiterItemIds.length === 0 || waiterPayBlocked}
                                                                    onClick={async () => {
                                                                        const discountVal = parseFloat(waiterDiscountAmount) || 0;
                                                                        if (await confirmDialog(`Process payment and print invoice for the ${selectedWaiterItemIds.length} selected items?`, { confirmText: "Process payment" })) {
                                                                            try {
                                                                                const selectedItems = waiterUnpaid.filter(item => selectedWaiterItemIds.includes(item.id));
                                                                                const payload = {
                                                                                    waiterId: selectedWaiter.userId,
                                                                                    itemIdsToPay: selectedWaiterItemIds,
                                                                                    finalTotal: selectedSubTotal - discountVal,
                                                                                    paymentType: waiterPaymentType,
                                                                                    discountAmount: discountVal,
                                                                                    discountReason: (waiterPaymentType === 'FREE_MEAL' || waiterPaymentType === 'STAFF_MEAL') ? waiterMealReason : waiterDiscountReason,
                                                                                    manualDiscount: discountVal > 0,
                                                                                    managerCode: waiterPaymentType === 'FREE_MEAL' ? (waiterMeal.approvalCode || '').trim() : (discountVal > 0 ? waiterDiscountManagerCode : null),
                                                                                    outletId: parseInt(localStorage.getItem("outletId") || "1"),
                paymentReference: waiterPaymentType === 'CARD' ? `${waiterRef.trim()} (card **** ${waiterLast4})` : waiterPaymentType === 'BANK_TRANSFER' ? waiterRef.trim() : null,
                ...loyaltyRequest(waiterLoyalty),
                                                                                    invoicePrinted: true
                                                                                };
                                                                                const finished = await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, payload);

                                                                                const printPayload = {
                                                                                    type: 'ACTUAL',
                                                                                    transactionId: finished.data?.data?.billNumber,
                                                                                    waiterName: selectedWaiter.name,
                                                                                    cashierName: getLoggedInCashierName(),
                                                                                    items: selectedItems.map(item => ({
                                                                                        productName: item.productName,
                                                                                        qty: item.quantity || item.qty,
                                                                                        unitPrice: item.unitPrice
                                                                                    })),
                                                                                    subTotal: selectedSubTotal,
                                                                                    discount: discountVal + waiterRedemption,
                                                                                    finalTotal: selectedSubTotal - discountVal - waiterRedemption,
                                                                                    paymentMethod: waiterPaymentType,
                                                                                    cardLast4: waiterPaymentType === 'CARD' ? waiterLast4 : null,
                                                                                    cashGiven: waiterPaymentType === 'CASH' ? (parseFloat(waiterCash) || waiterToPay) : 0,
                                                                                    change: waiterPaymentType === 'CASH' ? Math.max(0, (parseFloat(waiterCash) || waiterToPay) - waiterToPay) : 0
                                                                                };
                                                                                setPrintData(printPayload);
                                                                                setTimeout(() => {
                                                                                    window.print();
                                                                                    setPrintData(null);
                                                                                }, 150);

                                                                                toast.success("Payment successful! Actual invoice printed.");
                                                                                setWaiterDiscountAmount('0');
                                                                                setWaiterDiscountReason('');
                                                                                setWaiterFreeMealReason(''); resetWaiterPay();
                                                                                fetchWaiterDetails(selectedWaiter.userId); onChanged && onChanged();
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                                toast.error("Failed to process payment");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed font-[600] flex justify-center items-center gap-2"
                                                                >
                                                                    Pay &amp; Print Receipt
                                                                </button>

                                                            </div>
                                                            <div className="mt-3">
                                                                <EBillPayButton
                                                                    disabled={selectedWaiterItemIds.length === 0 || waiterPayBlocked}
                                                                    onPay={settleWaiterWithEBill}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

            {/* Waiter Discount Modal */}
            {showWaiterDiscountModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                        <div className="p-6">
                            <h3 className="text-[18px] font-[600] text-fg mb-4">Apply Waiter Discount</h3>

                            <div className="mb-4">
                                <label className="block text-[14px] font-[500] text-fg mb-1">Discount Amount (Rs.)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={selectedSubTotal}
                                    step="0.01"
                                    value={waiterDiscountAmount}
                                    onChange={(e) => setWaiterDiscountAmount(e.target.value)}
                                    placeholder="Enter discount amount"
                                    className="w-full px-3 py-2 border border-line rounded-lg focus:border-brand-fg focus:outline-none"
                                />
                                <p className="text-[12px] text-fg-secondary mt-1">Maximum discount: Rs. {selectedSubTotal.toLocaleString()}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[14px] font-[500] text-fg mb-1">Discount Reason</label>
                                <textarea
                                    value={waiterDiscountReason}
                                    onChange={(e) => setWaiterDiscountReason(e.target.value)}
                                    placeholder="Enter reason for discount..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-line rounded-lg focus:border-brand-fg focus:outline-none resize-none text-[14px]"
                                />
                            </div>

                            {(parseFloat(waiterDiscountAmount) || 0) > 0 && (
                                <div className="mb-6">
                                    <label className="block text-[14px] font-[500] text-fg mb-1">Manager's code *</label>
                                    <input
                                        type="text" autoComplete="off" data-lpignore="true" style={{ WebkitTextSecurity: "disc" }}
                                        value={waiterDiscountManagerCode}
                                        onChange={(e) => setWaiterDiscountManagerCode(e.target.value)}
                                        placeholder="A Manager enters their code to approve"
                                        className="w-full px-3 py-2 border border-line rounded-lg focus:border-brand-fg focus:outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowWaiterDiscountModal(false);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const amount = parseFloat(waiterDiscountAmount) || 0;
                                        if (amount < 0) {
                                            toast.error("Discount amount cannot be negative");
                                            return;
                                        }
                                        if (amount > selectedSubTotal) {
                                            toast.error("Discount amount cannot exceed the subtotal");
                                            return;
                                        }
                                        if (amount > 0 && !waiterDiscountReason.trim()) {
                                            toast.error("Please enter a reason for the discount");
                                            return;
                                        }
                                        if (amount > 0 && !waiterDiscountManagerCode.trim()) {
                                            toast.error("A Manager must enter their code to approve this discount");
                                            return;
                                        }
                                        setShowWaiterDiscountModal(false);
                                        toast.success("Discount applied");
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-lg hover:bg-brand-hover font-[500] transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {printData && <PosPrintout printData={printData} outlet={outlet} />}
        </>
    );
}
