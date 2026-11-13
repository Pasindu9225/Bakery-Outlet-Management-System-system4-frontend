import React, { useState, useEffect, useRef } from "react";
import { appChannel, appPrice } from "../utils/appPrice";
import { LoyaltyBox, EMPTY_LOYALTY, loyaltyRedemption, loyaltyRequest } from "../component/BillExtras";
import EBillPayButton from "../component/EBillPayButton";
import { tileColor } from "../utils/tileColors";
import MealDetails, { EMPTY_MEAL, mealReason } from "../component/MealDetails";
import { isMobile, posBill, sendEBill } from "../utils/eBill";
import { DeliveryAppLogo, deliveryAppOf } from "../component/AppLogos";
import { onEnterClick } from "../utils/a11y";
import { friendlyError } from "../utils/friendlyError";
import ButtonHint from "../component/ButtonHint.jsx";
import { confirmDialog } from "../component/ConfirmDialog";
import {
    MoreHorizontal,
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    CreditCard,
    Building2,
    Gift,
    Users,
    User,
    Calculator,
    Receipt,
    Printer,
    X,
    AlertTriangle,
    Zap,
    ChefHat,
    Send,
    Loader2,
    Coins,
    Check,
    Banknote,
    MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { extractNicDetails } from "../utils/nicParser";
import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import Loader from "../component/Loader.jsx";
import CashQuickButtons from "../component/CashQuickButtons.jsx";
import ExpiryTag, { expiryStatus, isExpired } from "../component/ExpiryTag.jsx";
import ReportWastageModal from "../component/ReportWastageModal.jsx";
import posService from "../services/posService";

import managerService from "../services/managerService";
import { Tag as TagIcon, Clock as ClockIcon } from "lucide-react";
import toast from "react-hot-toast";
import useOutletInfo from "../utils/useOutletInfo";
import { PosPrintout } from "../component/print/ThermalPrint";
import WaiterBillingPopup from "./WaiterBillingPopup";
import SplitPayment, { splitMethods, startSplit, splitProblem, splitPayload, splitText } from "../component/SplitPayment";

export default function POSSales() {
    const outlet = useOutletInfo(); // outlet name/address printed on bills
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('New Sale');
    const searchInputRef = useRef(null);

    const cashInputRef = useRef(null);

    // Cart state
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState('');
    const [cashReceived, setCashReceived] = useState('');
    // split payment: one bill over several methods (e.g. cash + card)
    const [splitMode, setSplitMode] = useState(false);
    const [splitParts, setSplitParts] = useState([]);
    const [splitCashGiven, setSplitCashGiven] = useState('');
    // a discount typed by the cashier needs a Manager's code
    const [cardRef, setCardRef] = useState('');
    const [cardLast4, setCardLast4] = useState(''); // printed on the invoice as **** 1234
    const [bankName, setBankName] = useState('');
    const [bankRef, setBankRef] = useState('');
    const [freeMealReason, setFreeMealReason] = useState('');
    const [staffId, setStaffId] = useState('');
    const [staffReason, setStaffReason] = useState('');
    const [meal, setMeal] = useState(EMPTY_MEAL);   // staff meal: checked Staff ID; free meal: requested by + reason
    const [deliveryOption, setDeliveryOption] = useState(null);

    // Customer Loyalty States
    const [customerPhone, setCustomerPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [regName, setRegName] = useState('');
    const [regOtp, setRegOtp] = useState('');   // code sent to the customer's phone: needed to register
    const [regOtpSent, setRegOtpSent] = useState(false);
    const [regNIC, setRegNIC] = useState('');
    const [regError, setRegError] = useState('');
    const [redeemPoints, setRedeemPoints] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

    // Modal states
    const [showInsufficientStock, setShowInsufficientStock] = useState(false);
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null);
    const [pendingQty, setPendingQty] = useState('1');
    const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(-1);
    const qtyInputRef = useRef(null);
    const [insufficientItem, setInsufficientItem] = useState('');
    const [kotTimestamp, setKotTimestamp] = useState(null);
    const [kotNumber, setKotNumber] = useState('');

    // Promo & discounts
    const [promoCode, setPromoCode] = useState('');
    // direct discount typed in the payment popup: % or Rs. off the bill, approved with a Manager's code
    const [directType, setDirectType] = useState('PERCENTAGE');
    const [directValue, setDirectValue] = useState('');
    const [directManagerCode, setDirectManagerCode] = useState('');
    // promo codes valid right now, picked from a dropdown instead of typed
    const [activePromos, setActivePromos] = useState([]);
    useEffect(() => {
        axios.get('/api/pos/v1/promotions/active')
            .then((res) => setActivePromos(Array.isArray(res.data) ? res.data : []))
            .catch(() => setActivePromos([]));
    }, []);
    const [appliedPromo, setAppliedPromo] = useState(null); // { code, type:'percent', value }
    const [selectedPromoItems, setSelectedPromoItems] = useState([]); // Array of product/item IDs
    const [promoScope, setPromoScope] = useState('EVERY'); // EVERY, SELECTED, TOTAL

    // Auto-discounts (FR-POS-12)
    const [activeRules, setActiveRules] = useState([]);
    const [removedAutoDiscounts, setRemovedAutoDiscounts] = useState({}); // { cartItemId: [discountIds] }
    const [appliedDiscountsMeta, setAppliedDiscountsMeta] = useState({}); // { itemId: ruleObject }
    const [appliedDiscounts, setAppliedDiscounts] = useState({}); // { itemId: discountPerItem }


    // Sales items from backend
    const [products, setProducts] = useState([]);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const [productionCenters, setProductionCenters] = useState([]);
    const [selectedPcs, setSelectedPcs] = useState({}); // { cartItemId: pcId }
    const [kotSentMap, setKotSentMap] = useState({}); // { cartItemId: true }

    // Waiter Management State
    const [waiters, setWaiters] = useState([]);
    const [selectedWaiter, setSelectedWaiter] = useState(null);
    const [printData, setPrintData] = useState(null);

    const [showWaiterPanel, setShowWaiterPanel] = useState(false);

    const [categories, setCategories] = useState([
        { id: 'all', name: 'All Items', code: '' },
        { id: 'fast', name: 'Fast Moving', code: '0' }
    ]);
    const [highlightedItemId, setHighlightedItemId] = useState(null);

    const fastMovingProducts = products.filter(p => p.fastMoving && p.stock > 0);

    const activeCategory = categories.find(c => c.id === selectedCategory);
    // each category shows its own items (as S1-S3)
    const defaultViewProducts = selectedCategory === 'all'
        ? products.filter(p => p.stock > 0)
        : selectedCategory === 'fast'
            ? fastMovingProducts
            : products.filter(p => activeCategory && p.category === activeCategory.name && p.stock > 0);

    // a category click (or its number typed in the search box) switches the grid and clears the search box (owner 13 Nov)
    const switchToCategory = (categoryId) => {
        setSelectedCategory(categoryId);
        setSearchQuery('');
        setSearchResults([]);
        setHighlightedSearchIndex(-1);
    };


    // Focus search input on page load
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Fetch items from backend
    // other POS logins at this outlet sell and add items too: reload every 10 s (not while the bill is being paid)
    const liveRefresh = useRef(null);
    liveRefresh.current = () => { fetchTodayItems(); };
    useEffect(() => {
        const id = setInterval(() => { if (!document.hidden) liveRefresh.current(); }, 10000);
        return () => clearInterval(id);
    }, []);

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
                uberPrice: item.uberPrice,     // empty = the normal price
                pickmePrice: item.pickmePrice,
                receivedQty: item.receivedQty,
                currentQty: item.currentQty,
                stock: item.currentQty,
                category: item.categoryName,
                fastMoving: item.isFastMoving,
                kotBased: item.isKotEnabled || false,
                pcId: item.productionCenterId || null, // the dish's own kitchen / MPC (Admin MPC menu)
                expiryDate: item.expiryDate || null
            }));
            setProducts(mappedData);

            // Dynamically build categories from backend data
            const uniqueCategoryNames = [...new Set(data.map(item => item.categoryName))].filter(Boolean);
            uniqueCategoryNames.sort((a, b) => a.localeCompare(b));

            const dynamicCategories = uniqueCategoryNames.map((name, index) => ({
                id: name.toLowerCase().replace(/\s+/g, '_'),
                name: name,
                code: (index + 1).toString()
            }));

            setCategories([
                { id: 'all', name: 'All Items', code: '' },
                { id: 'fast', name: 'Fast Moving', code: '0' },
                ...dynamicCategories
            ]);


        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    useEffect(() => {
        fetchTodayItems();
        fetchActiveRules();
        fetchWaiters();
        posService.getProductionCenters()
            .then(data => setProductionCenters(data || []))
            .catch(err => console.error("Error fetching production centers:", err));
    }, []);

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

    // the waiter's bill is settled in WaiterBillingPopup (the same popup as Waiter Billing, owner 12 Nov)
    const clearWaiter = () => setSelectedWaiter(null);
    const handleWaiterClick = (waiter) => {
        if (selectedWaiter?.userId === waiter.userId) { clearWaiter(); return; } // tap again to unselect
        setSelectedWaiter(waiter);
    };

    const handleSaveToWaiter = async () => {
        if (!selectedWaiter || cart.length === 0) return;
        const saved = []; // cart lines already on the waiter bill
        try {
            const billId = "BILL-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
            for (const item of cart) {
                const requestBody = {
                    waiterId: selectedWaiter.userId,
                    productId: item.id,
                    qty: item.quantity,
                    unitPrice: linePrice(item),
                    instructions: item.specialInstructions || null,
                    productionCenterId: (item.pcId || selectedPcs[item.id] || productionCenters[0]?.id) ? Number(item.pcId || selectedPcs[item.id] || productionCenters[0]?.id) : null,
                    billId: billId
                };
                await axios.post(`/api/pos/v1/waiter-billing/add-item`, requestBody);
                saved.push(item);
            }

            const printPayload = {
                type: 'PROFORMA',
                waiterName: selectedWaiter.name,
                cashierName: getLoggedInCashierName(),
                items: cart.map(item => ({
                    productName: item.name,
                    qty: item.quantity,
                    unitPrice: linePrice(item)
                })),
                subTotal: subtotal,
                discount: totalDiscount,
                finalTotal: total,
                kotItems: cart.filter(item => item.kotBased).map(item => ({
                    productName: item.name,
                    qty: item.quantity,
                    specialInstructions: item.specialInstructions || ""
                }))
            };

            setPrintData(printPayload);
            setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 150);

            toast.success(`Items assigned to ${selectedWaiter.name} successfully!`);
            setCart([]);
        } catch (error) {
            const errMsg = error.response?.data?.message || error.response?.data || "Failed to save items to waiter bill";
            const text = typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg;
            if (saved.length > 0) {
                // those lines are on the waiter bill now; keep only the rest so Save again does not add them twice
                setCart(prev => prev.filter(line => !saved.includes(line)));
                toast.error(`${text} ${saved.length} item(s) before it were saved to ${selectedWaiter.name}; the rest are still in the cart.`, { duration: 8000 });
            } else {
                toast.error(text);
            }
        }
    };

    const fetchActiveRules = async () => {
        try {
            const rules = await managerService.getDiscounts();
            setActiveRules(rules || []);
        } catch (error) {
            console.error("Error fetching discount rules:", error);
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

    // Fetch payment methods
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                // the free-meal reason box and the Staff Meal button go by category ("Free Meal" -> FREE_MEAL if unset)
                const loaded = (await posService.getPaymentMethods() || []).map(m => ({ ...m, category: m.category || String(m.name || '').trim().toUpperCase().replace(/\s+/g, '_') }));
                // payment popup order: Card, Bank Transfer, Staff Meal, the rest as set up (Free Meal, Uber, PickMe...), Cash last
                const rank = (m) => {
                    const key = m.category === 'CASH' ? 'cash' : m.category === 'STAFF_MEAL' ? 'staff' : getPaymentConfig(m.name).key;
                    if (key === 'cash') return 4;
                    const i = ['card', 'bank', 'staff'].indexOf(key);
                    return i < 0 ? 3 : i;
                };
                const data = [...loaded].sort((x, y) => rank(x) - rank(y));
                setAvailablePaymentMethods(data);

                // Card is selected by default (cash sales use the cart's Cash button)
                if (data && data.length > 0) {
                    const cardMethod = data.find(m => getPaymentConfig(m.name).key === 'card') || data[0];
                    setPaymentMethod(getPaymentConfig(cardMethod.name).key);
                    setPaymentMethodId(cardMethod.paymentMethodId);
                }
            } catch (error) {
                console.error("Error fetching payment methods:", error);
            }
        };
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        const currentTime = new Date();
        const currentHourMin = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const currentDay = dayNames[currentTime.getDay()];

        const discounts = {};
        const cartDiscountsMeta = {}; // To store info about which rule was applied

        cart.forEach(item => {
            let itemDiscount = 0;
            let appliedRule = null;

            // 1. Check for manual/promo selection (takes precedence)
            if (appliedPromo) {
                const isPromoApplicable = promoScope === 'EVERY' ||
                    (promoScope === 'SELECTED' && selectedPromoItems.includes(item.id)) ||
                    (promoScope === 'TOTAL');

                if (isPromoApplicable) {
                    if (appliedPromo.type === 'PERCENTAGE') {
                        itemDiscount = parseFloat(((item.price * appliedPromo.value) / 100).toFixed(2));
                    } else {
                        itemDiscount = appliedPromo.value;
                    }
                }
            }

            // 2. If no promo, check for auto-discounts (if not manually removed)
            if (itemDiscount === 0) {
                const applicableRules = activeRules.filter(rule => {
                    // Check if removed by user
                    if (removedAutoDiscounts[item.id]?.includes(rule.discountId)) return false;

                    // Check product applicability
                    const isProductMatch = rule.appliedToAllProducts ||
                        rule.applicableProducts?.some(p => p.id === item.id);
                    if (!isProductMatch) return false;

                    // Check time-based
                    if (rule.ruleType === 'TIME_BASED') {
                        const isDayMatch = rule.daysOfWeek?.includes(currentDay);
                        if (!isDayMatch) return false;
                        if (currentHourMin < rule.startTime || currentHourMin > rule.endTime) return false;
                    }

                    return true;
                });

                if (applicableRules.length > 0) {
                    // Pick the best discount (highest value)
                    let bestDiscount = 0;
                    let bestRule = null;

                    applicableRules.forEach(rule => {
                        let potentialDiscount = 0;
                        if (rule.discountType === 'PERCENTAGE') {
                            potentialDiscount = parseFloat(((item.price * rule.discountValue) / 100).toFixed(2));
                        } else {
                            potentialDiscount = rule.discountValue;
                        }

                        if (potentialDiscount > bestDiscount) {
                            bestDiscount = potentialDiscount;
                            bestRule = rule;
                        }
                    });

                    itemDiscount = bestDiscount;
                    appliedRule = bestRule;
                }
            }

            discounts[item.id] = itemDiscount;
            cartDiscountsMeta[item.id] = appliedRule;
        });

        setAppliedDiscounts(discounts);
        setAppliedDiscountsMeta(cartDiscountsMeta);
    }, [cart, appliedPromo, promoScope, selectedPromoItems, activeRules, removedAutoDiscounts]);

    const handleRemoveAutoDiscount = (itemId, ruleId) => {
        setRemovedAutoDiscounts(prev => ({
            ...prev,
            [itemId]: [...(prev[itemId] || []), ruleId]
        }));
    };

    useEffect(() => {
        if (showPayment && paymentMethod === 'cash') {
            setTimeout(() => cashInputRef.current?.focus(), 100);
        }
    }, [showPayment, paymentMethod]);

    // Search functionality
    useEffect(() => {
        if (searchQuery.trim()) {
            // Check if it's a category code
            const categoryCode = searchQuery.trim();
            const category = categories.find(cat => cat.code === categoryCode);

            if (category) {
                switchToCategory(category.id);
                return;
            }

            // Regular product search
            const filtered = products.filter(product =>
                (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
                product.stock > 0
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, products, categories]);

    const openQtyModal = (product) => {
        setPendingProduct(product);
        setPendingQty('1');
        setShowQtyModal(true);
        setTimeout(() => {
            qtyInputRef.current?.focus();
            qtyInputRef.current?.select();
        }, 50);
    };

    const confirmQtyModal = () => {
        const qty = parseInt(pendingQty) || 1;
        if (pendingProduct) {
            addToCart(pendingProduct, qty);
        }
        setShowQtyModal(false);
        setPendingProduct(null);
        setPendingQty('1');
        setSearchQuery('');
        setSearchResults([]);
        setHighlightedSearchIndex(-1);
        setTimeout(() => searchInputRef.current?.focus(), 50);
    };

    // Add product to cart
    const [reportItem, setReportItem] = useState(null);
    const openWastageReport = (product) => setReportItem({
        stage: "POS", locationType: "OUTLET",
        locationId: Number(localStorage.getItem("outletId")) || null,
        itemType: "FINISHED", itemId: product.id, itemName: product.name,
        expiryDate: product.expiryDate, stockRef: `day_production_items:${product.dayProductionItemId}`,
        available: product.stock,
    });

    const addToCart = async (product, quantity = 1) => {
        if (isExpired(product.expiryDate)) {
            toast.error(`${product.name} expired on ${product.expiryDate} and cannot be sold.`);
            return;
        }
        if (product.stock < quantity) {
            setInsufficientItem(product.name);
            setShowInsufficientStock(true);
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                setInsufficientItem(product.name);
                setShowInsufficientStock(true);
                return;
            }

            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            // store a copy of the product with quantity and special instructions
            setCart([...cart, { ...product, quantity, specialInstructions: "" }]);
        }

        // Visual feedback
        setHighlightedItemId(product.id);
        setTimeout(() => setHighlightedItemId(null), 1000);
    };

    // Update cart item quantity
    const updateQuantity = (id, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(id);
            return;
        }

        const product = products.find(p => p.id === id);
        if (product && newQuantity > product.stock) {
            setInsufficientItem(product.name);
            setShowInsufficientStock(true);
            return;
        }

        setCart(cart.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ));
    };

    // Update special instructions for cart item
    const updateSpecialInstructions = (id, instructions) => {
        setCart(cart.map(item =>
            item.id === id ? { ...item, specialInstructions: instructions } : item
        ));
    };
    // Remove from cart
    // Removing a line can be undone for a few seconds (mis-taps on a touch screen).
    const removeFromCart = (id) => {
        const index = cart.findIndex(item => item.id === id);
        if (index === -1) return;
        const removed = cart[index];
        setCart(prev => prev.filter(item => item.id !== id));
        toast((t) => (
            <span className="flex items-center gap-3">
                <span>Removed {removed.name}</span>
                <button
                    onClick={() => {
                        setCart(prev => prev.some(item => item.id === id)
                            ? prev
                            : [...prev.slice(0, index), removed, ...prev.slice(index)]);
                        toast.dismiss(t.id);
                    }}
                    className="px-3 py-1.5 rounded-md bg-brand text-on-brand text-[13px] font-[600]"
                >
                    Undo
                </button>
            </span>
        ), { duration: 5000 });
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setSearchQuery('');
        setSearchResults([]);
        setAppliedPromo(null);
        setPromoCode('');
        setAppliedDiscounts({});
        setKotSentMap({});
        setSelectedPcs({});
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Send standalone KOT for a single cart item
    const sendKotForItem = async (item) => {
        const pcId = item.pcId || selectedPcs[item.id] || (productionCenters[0]?.id);
        if (!pcId) {
            toast.error("No production center available. Please configure outlet MPCs first.");
            return;
        }
        try {
            const kot = await posService.sendStandaloneKot({
                dayProductionItemId: item.dayProductionItemId,
                qty: item.quantity,
                productionCenterId: Number(pcId),
                specialInstructions: item.specialInstructions || "",
            });
            setKotSentMap(prev => ({ ...prev, [item.id]: true }));
            toast.success("KOT sent successfully");

            // print this item's KOT slip only (no bill)
            setPrintData({
                printBill: false,
                cashierName: getLoggedInCashierName(),
                kotItems: [{
                    productName: item.name,
                    qty: item.quantity,
                    specialInstructions: item.specialInstructions || "",
                    kotNumber: kot?.orderNumber,
                }],
            });
            setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 150);
        } catch (err) {
            console.error("Error sending KOT:", err);
            toast.error(friendlyError(err, { fallback: "Failed to send KOT. Please try again." }));
        }
    };

    // Promo verification
    const verifyPromo = async (picked) => {
        const code = (typeof picked === 'string' ? picked : (promoCode || '')).trim().toUpperCase();
        if (!code) return toast.error('Pick a promo code');

        try {
            const promo = await posService.validatePromo(code);

            // Response: { id, discountType, discountValue, maximumDiscountValue }
            setAppliedPromo({
                id: promo.id,
                code: code,
                type: promo.discountType,         // 'PERCENTAGE' or 'FIXED'
                value: promo.discountValue,
                maxCap: promo.maximumDiscountValue ?? null  // null = no cap
            });
            const capMsg = (promo.maximumDiscountValue != null)
                ? ` (max cap: Rs. ${promo.maximumDiscountValue})`
                : '';
            toast.success(`Promo applied: ${promo.discountValue}${promo.discountType === 'PERCENTAGE' ? '%' : ' Rs.'} discount${capMsg}`);
        } catch (error) {
            console.error("Error validating promo:", error);
            toast.error(friendlyError(error, { fallback: "Promotion Expired or Invalid" }));
            removePromo();
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setAppliedDiscounts({});
    };




    // Calculate totals
    // Uber / PickMe bill: each line at the product's Uber / PickMe price (owner 12 Nov), as the server bills it
    const saleChannel = appChannel((availablePaymentMethods.find(m => m.paymentMethodId === paymentMethodId) || {}).name, deliveryOption);
    const linePrice = (item) => appPrice(item, saleChannel, item.price);
    const subtotal = cart.reduce((sum, item) => sum + (linePrice(item) * item.quantity), 0);
    // Raw discount before any cap
    const rawDiscount = cart.reduce((sum, item) => sum + ((appliedDiscounts[item.id] || 0) * item.quantity), 0);
    // Apply Max Discount Cap from promo (if set)
    const promoDiscount = (appliedPromo?.maxCap != null)
        ? Math.min(rawDiscount, appliedPromo.maxCap)
        : rawDiscount;
    // direct discount comes off what is left after the promo / auto discounts
    const afterPromo = Math.max(0, subtotal - promoDiscount);
    const directNum = Math.max(0, parseFloat(directValue) || 0);
    const directDiscount = Math.min(afterPromo, directType === 'PERCENTAGE'
        ? Math.round(afterPromo * Math.min(directNum, 100)) / 100
        : directNum);
    const totalDiscount = promoDiscount + directDiscount;
    const redemptionDiscount = (customer && redeemPoints && otpVerified) ? Math.min(1000.00, Math.max(0, subtotal - totalDiscount)) : 0.00;
    const total = subtotal - totalDiscount - redemptionDiscount;

    const selectedPaymentMethodObj = availablePaymentMethods.find(m => m.paymentMethodId === paymentMethodId) || {};
    const isFreeMeal = selectedPaymentMethodObj.category === 'FREE_MEAL';
    const isStaffMeal = selectedPaymentMethodObj.category === 'STAFF_MEAL';

    // Uber / PickMe payments are app orders: the order channel is the same app, so it is set for the cashier.
    const channelFromMethod = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('uber')) return 'UBER';
        if (n.includes('pickme') || n.includes('pick me') || n.includes('picme')) return 'PICKME';
        return null;
    };
    const impliedChannel = channelFromMethod(selectedPaymentMethodObj.name);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        eBillPhoneRef.current = null;
        // the Others popup opens on Card
        const cardMethod = availablePaymentMethods.find(m => getPaymentConfig(m.name).key === 'card') || availablePaymentMethods[0];
        if (cardMethod) {
            setPaymentMethod(getPaymentConfig(cardMethod.name).key);
            setPaymentMethodId(cardMethod.paymentMethodId);
        }
        setShowPayment(true);
    };

    // Cash (cart button): pays cash with the amount typed in the cart (empty = exact), receipt printed;
    // anything else goes through More (the popup). quickCheckout holds the cash amount being paid.
    const [quickCheckout, setQuickCheckout] = useState(false);
    const [cartCash, setCartCash] = useState('');
    // E-Bill: paid like Cash, the bill goes to this phone as an SMS instead of being printed
    const [eBillOpen, setEBillOpen] = useState(false);
    const [eBillPhone, setEBillPhone] = useState('');
    const eBillPhoneRef = useRef(null);
    // a loyalty customer on the bill: the e-bill goes to their registered number without asking again
    const loyaltyPhone = customer && isMobile(customer.contactNumber) ? customer.contactNumber : null;
    useEffect(() => { if (cart.length === 0) { setCartCash(''); setEBillOpen(false); setEBillPhone(''); } }, [cart.length]);
    const [noteOpen, setNoteOpen] = useState({});
    const handleEBill = () => {
        if (!isMobile(eBillPhone)) {
            toast.error('Enter the customer\'s mobile number, e.g. 0771234567.');
            return;
        }
        handleQuickCheckout(eBillPhone);
    };
    const handleQuickCheckout = (eBillTo = null) => {
        if (cart.length === 0 || quickCheckout) return;
        eBillPhoneRef.current = typeof eBillTo === 'string' ? eBillTo : null;
        const cashMethod = availablePaymentMethods.find(m => m.category === 'CASH')
            || availablePaymentMethods.find(m => getPaymentConfig(m.name).key === 'cash');
        if (!cashMethod) {
            toast.error('No Cash payment method is set up. Use More to choose how to pay.');
            return;
        }
        const amount = cartCash === '' ? total : parseFloat(cartCash);
        if (!(amount >= total)) {
            toast.error(`Cash received must be at least Rs. ${total.toLocaleString()}`);
            return;
        }
        setSplitMode(false);
        setPaymentMethod('cash');
        setPaymentMethodId(cashMethod.paymentMethodId);
        setCashReceived(String(amount));
        setQuickCheckout(String(amount));
    };
    useEffect(() => {
        // runs once the cash method and amount above are in place
        if (!quickCheckout || paymentMethod !== 'cash' || !paymentMethodId || cashReceived !== quickCheckout) return;
        setQuickCheckout(false);
        processPayment(!eBillPhoneRef.current);   // an e-bill is sent, not printed
        // eslint-disable-next-line
    }, [quickCheckout, paymentMethod, paymentMethodId, cashReceived]);

    // Cart payment buttons, one per row: Cash (prints), E-Bill (cash, bill sent by SMS), More (the payment popup)
    const cartPayButtons = (
        <div className="space-y-2">
            <button
                onClick={() => handleQuickCheckout()}
                disabled={!!quickCheckout}
                title="Cash: the amount received above (empty = exact), prints the receipt"
                className="w-full bg-brand text-on-brand py-3 rounded-lg font-[500] hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Banknote size={16} />
                Cash
            </button>
            {eBillOpen ? (
                <div className="flex gap-2">
                    <input
                        type="tel"
                        autoFocus
                        value={eBillPhone}
                        onChange={(e) => setEBillPhone(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleEBill(); }
                            if (e.key === 'Escape') setEBillOpen(false);
                        }}
                        placeholder="Customer mobile, e.g. 0771234567"
                        className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                    />
                    <button
                        onClick={handleEBill}
                        disabled={!!quickCheckout}
                        title="Cash (amount above), the bill is sent to this number as an SMS"
                        className="px-4 bg-plum-solid text-on-brand rounded-lg text-[14px] font-[500] flex items-center gap-2 disabled:opacity-50"
                    >
                        <MessageSquare size={16} />
                        Send
                    </button>
                    <button onClick={() => setEBillOpen(false)} aria-label="Cancel e-bill" className="px-3 border border-line rounded-lg text-fg-secondary hover:bg-subtle">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => (loyaltyPhone ? handleQuickCheckout(loyaltyPhone) : setEBillOpen(true))}
                    disabled={!!quickCheckout}
                    title="Cash, and the bill is sent to the customer's phone as an SMS (no printed bill)"
                    className="w-full border border-plum text-plum py-3 rounded-lg font-[500] hover:bg-plum/10 transition-colors flex items-center justify-center gap-2"
                >
                    <MessageSquare size={16} />
                    {loyaltyPhone ? `E-Bill to ${loyaltyPhone}` : 'E-Bill'}
                </button>
            )}
            <button
                onClick={handleCheckout}
                title="Card, staff meal, discount, split payment..."
                className="w-full border border-line text-fg py-3 rounded-lg font-[500] hover:bg-subtle transition-colors flex items-center justify-center gap-2"
            >
                <MoreHorizontal size={16} />
                More
            </button>
        </div>
    );

    // Process payment
    // one payment at a time: a double click or a second Enter must not make a second bill
    const payingRef = useRef(false);
    const processPayment = async (shouldPrint = false) => {
        if (payingRef.current) return;
        payingRef.current = true;
        try {
            return await processPaymentNow(shouldPrint);
        } finally {
            payingRef.current = false;
        }
    };
    const processPaymentNow = async (shouldPrint = false) => {
        // an Uber / PickMe-only dish (no normal price) is sold only on an Uber / PickMe bill (owner 12 Nov)
        const appOnly = !saleChannel && cart.find(item => !(item.price > 0) && (item.uberPrice > 0 || item.pickmePrice > 0));
        if (appOnly) {
            toast.error(`${appOnly.name} is sold only on Uber / PickMe: choose Uber or PickMe in More.`);
            return;
        }
        if (splitMode) {
            const problem = splitProblem(splitParts, availablePaymentMethods, total, splitCashGiven);
            if (problem) {
                toast.error(problem);
                return;
            }
        }
        if (!paymentMethod || !paymentMethodId) {
            toast.error('Please select a valid payment method');
            return;
        }

        const selectedMethodObj = availablePaymentMethods.find(m => m.paymentMethodId === paymentMethodId) || null;
        if (!selectedMethodObj) {
            toast.error('Payment method configuration mismatch. Please select again.');
            return;
        }
        const isFreeMeal = selectedMethodObj.category === 'FREE_MEAL';
        const isStaffMeal = selectedMethodObj.category === 'STAFF_MEAL';

        // Validation based on payment method
        if (!splitMode && paymentMethod === 'cash' && (!isFreeMeal) && (!cashReceived || parseFloat(cashReceived) < total)) {
            toast.error('Please enter valid cash amount');
            return;
        }

        if (!splitMode && paymentMethod === 'card' && !cardRef.trim()) {
            toast.error('Please enter card transaction reference');
            return;
        }
        if (!splitMode && paymentMethod === 'card' && !/^\d{4}$/.test(cardLast4)) {
            toast.error('Enter the last 4 digits of the card');
            return;
        }

        if (!splitMode && paymentMethod === 'bank' && (!bankName.trim() || !bankRef.trim())) {
            toast.error('Please enter bank details');
            return;
        }

        const effectiveReason = mealReason(isStaffMeal ? 'staff' : isFreeMeal ? 'free' : null, meal);

        if (isFreeMeal && !effectiveReason) {
            toast.error('Enter who requested the free meal, the reason and the approval code');
            return;
        }

        if (isStaffMeal && !effectiveReason) {
            toast.error('Enter a valid Staff ID and press Check');
            return;
        }

        if (directDiscount > 0 && !directManagerCode.trim()) {
            toast.error("A direct discount needs a Manager's code");
            return;
        }
        const lineLeft = cart.map(item => Math.max(0, linePrice(item) * item.quantity - (appliedDiscounts[item.id] || 0) * item.quantity));
        const leftTotal = lineLeft.reduce((x, y) => x + y, 0);
        let directLeft = Math.round(directDiscount * 100);
        const directShares = lineLeft.map((left, i) => {
            const share = i === lineLeft.length - 1 ? directLeft : Math.round(directDiscount * 100 * left / (leftTotal || 1));
            directLeft -= share;
            return share / 100;
        });

        const cashierId = localStorage.getItem("userId");
        const outletId = localStorage.getItem("outletId");
        const baseUrl = process.env.REACT_APP_BASE_URL;

        const saleData = {
            cashierId: cashierId,
            outletId: outletId ? parseInt(outletId) : 1,
            globalPromotionId: null, // Global promo not currently used in this UI flow
            deliveryOption: deliveryOption,
            customerPhoneNumber: customer ? customer.contactNumber : null,
            redeemPoints: redeemPoints && otpVerified,
            otp: otpVerified ? otp : null,
            invoicePrinted: shouldPrint,
            payments: splitMode ? splitPayload(splitParts) : null,
            managerCode: isFreeMeal ? (meal.approvalCode || '').trim() : (directDiscount > 0 ? directManagerCode.trim() : null),
            items: cart.map((item, i) => ({
                dayProductionItemId: item.dayProductionItemId,
                qty: item.quantity,
                unitPrice: linePrice(item),
                paymentMethodId: splitMode ? Number(splitParts[0].methodId) : paymentMethodId, // split: the parts are in payments
                promotionId: appliedPromo?.id || null,
                discountId: appliedDiscountsMeta[item.id]?.discountId || null,
                manualDiscount: directShares[i],
                freeMealReason: (isFreeMeal || isStaffMeal) ? effectiveReason : null,
                bankTransferCode: splitMode ? null : ((paymentMethod === 'bank' || paymentMethod === 'bank transfer') ? bankRef : (paymentMethod === 'card' ? `${cardRef.trim()} (card **** ${cardLast4})` : null)),
                specialInstructions: item.specialInstructions || ""
            }))
        };

        try {
            const data = await posService.submitSale(saleData);

            const realSaleId = data.data?.saleId || data.saleId;
            const billNumber = data.data?.billNumber || (realSaleId ? `BILL-${String(realSaleId).padStart(6, '0')}` : `BILL-${Date.now()}`);
            const transactionId = billNumber;
            const kotNumbers = data.data?.kotNumbers || data.kotNumbers || [];

            // Filter KOT-enabled items from cart
            const kotItems = cart.filter(item => item.kotBased || item.isKotEnabled).map(item => ({
                // one KOT slip per kitchen / MPC, with its name on it
                mpcName: productionCenters.find(pc => String(pc.id) === String(item.pcId))?.centerName || "",
                productName: item.name,
                qty: item.quantity,
                specialInstructions: item.specialInstructions || ""
            }));

            const hasKotItems = kotItems.length > 0;

            const optionStr = `${deliveryOption || ''} ${selectedMethodObj?.name || ''} ${selectedMethodObj?.category || ''}`.toLowerCase();
            const isUberOrPickMe = optionStr.includes('uber') || optionStr.includes('pickme') || optionStr.includes('picme');

            // Prepare print payload for Main Invoice & KOT tokens
            const printPayload = {
                type: 'ACTUAL',
                transactionId: transactionId,
                cashierName: getLoggedInCashierName(data.data?.cashierName),
                deliveryOption: deliveryOption,
                items: cart.map(item => ({
                    productName: item.name,
                    qty: item.quantity,
                    unitPrice: linePrice(item)
                })),
                subTotal: subtotal,
                discount: totalDiscount,
                finalTotal: data.data?.totalAmount ?? total,
                paymentMethod: splitMode ? splitText(splitParts, availablePaymentMethods) : selectedMethodObj.name,
                cardLast4: !splitMode && paymentMethod === 'card' ? cardLast4 : null,
                cardRef: !splitMode && paymentMethod === 'card' ? cardRef.trim() : null,
                cashGiven: !splitMode && paymentMethod === 'cash' ? (parseFloat(cashReceived) || 0) : 0,
                change: !splitMode && paymentMethod === 'cash' ? calculateChange() : 0,
                kotItems: kotItems,
                printBill: shouldPrint,
                isUberOrPickMe: isUberOrPickMe
            };

            if (eBillPhoneRef.current) {
                const phone = eBillPhoneRef.current;
                eBillPhoneRef.current = null;
                sendEBill(phone, posBill(printPayload, outlet)).then((m) => toast.success(m)).catch((e) => toast.error(e.message));
            }

            if (shouldPrint || hasKotItems) {
                setPrintData(printPayload);
                // A fixed delay isn't enough once there's a full invoice AND KOT slips to lay out -
                // on a slower render the print snapshot could be taken before the KOT section (which
                // comes after the invoice in the DOM) has actually painted. Wait for React to commit,
                // then wait a full paint cycle (double rAF) before printing, so nothing gets cut off.
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            window.print();
                            setPrintData(null);
                        });
                    });
                }, 150);
            }

            // Clear everything and show success
            setCart([]);
            setShowPayment(false);
            resetPaymentForm();
            removePromo();

            // RE-FETCH ITEMS TO UPDATE STOCK LEVELS
            await fetchTodayItems();

            let successMsg = `Transaction completed successfully!\nTransaction ID: ${transactionId}`;
            if (kotNumbers.length > 0) {
                successMsg += `\n\nGenerated KOT Numbers:\n${kotNumbers.join(', ')}`;
            }

            toast.success(successMsg, { duration: 5000 });

            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        } catch (error) {
            console.error("Error saving sale:", error);
            if (error.response?.status === 400 && error.response.data?.message?.includes("Opening balance must be declared")) {
                toast.error("Opening balance must be declared before processing sales.");
                navigate('/posDashboard');
            } else {
                toast.error(friendlyError(error, { fallback: "Failed to save sale. Please try again." }));
            }
        }
    };

    const resetPaymentForm = () => {
        setSplitMode(false);
        setSplitParts([]);
        setSplitCashGiven('');
        setPaymentMethod('');
        setPaymentMethodId(null);
        setCashReceived('');
        setCardRef('');
        setCardLast4('');
        setBankName('');
        setBankRef('');
        setFreeMealReason('');
        setStaffId('');
        setStaffReason(''); setMeal(EMPTY_MEAL);
        setDeliveryOption(null);
        setDirectValue('');
        setDirectManagerCode('');

        // Reset Customer loyalty states
        setCustomer(null);
        setCustomerPhone('');
        setRedeemPoints(false);
        setOtpSent(false);
        setOtpVerified(false);
        setOtp('');
    };

    const handleRemoveCustomer = async () => {
        const isConfirmed = await confirmDialog("Are you sure you want to remove this customer?", { confirmText: "Remove", danger: true });
        if (isConfirmed) {
            setCustomer(null);
            setCustomerPhone('');
            setRedeemPoints(false);
            setOtpSent(false);
            setOtpVerified(false);
            setOtp('');
            toast.success("Customer removed from sale");
        }
    };

    const handleCustomerLookup = async () => {
        if (!customerPhone.trim()) return;
        setLookupLoading(true);
        try {
            const response = await axios.get(`/api/pos/v1/customers/lookup?phone=${customerPhone.trim()}`);
            setCustomer(response.data);
            setRedeemPoints(false);
            setOtpSent(false);
            setOtpVerified(false);
            setOtp("");
            toast.success("Customer verified successfully!");
        } catch (error) {
            if (error.response?.status === 404) {
                // Customer not found, open registration modal
                setRegName("");
                setRegNIC("");
                setRegError("");
                setShowRegModal(true);
            } else {
                toast.error("Error verifying customer. Please try again.");
            }
        } finally {
            setLookupLoading(false);
        }
    };

    const handlePOSRegisterCustomer = async (e) => {
        e.preventDefault();
        setRegError("");
        if (!regName.trim() || !customerPhone.trim()) {
            setRegError("Name and Phone Number are required.");
            return;
        }

        const phoneClean = customerPhone.trim();
        if (!/^\d{10}$/.test(phoneClean)) {
            setRegError("Phone number must be exactly 10 digits.");
            return;
        }

        const nicClean = regNIC.trim();
        if (nicClean) {
            const parsed = extractNicDetails(nicClean);
            if (!parsed) {
                setRegError("Invalid Sri Lankan NIC number format. Old format should have 9 numbers and letter V/X, new format should have 12 numbers.");
                return;
            }
        }

        if (!regOtp.trim()) {
            setRegError("Send the code to the customer's phone and enter it.");
            return;
        }

        try {
            const response = await axios.post("/api/pos/v1/customers/register", {
                name: regName.trim(),
                contactNumber: phoneClean,
                idCardNumber: nicClean || null,
                otp: regOtp.trim()
            });
            setRegOtp('');
            setRegOtpSent(false);
            toast.success("Customer registered successfully!");
            setCustomer(response.data);
            setShowRegModal(false);
        } catch (error) {
            setRegError(friendlyError(error, { fallback: "Failed to register customer." }));
        }
    };

    const handleClearCustomer = () => {
        setCustomer(null);
        setCustomerPhone('');
        setRedeemPoints(false);
        setOtpSent(false);
        setOtpVerified(false);
        setOtp('');
    };

    const handleSendOtp = async () => {
        if (!customer) return;
        try {
            await axios.post("/api/pos/v1/customers/send-otp", {
                phone: customer.contactNumber
            });
            setOtpSent(true);
            toast.success("OTP sent to customer mobile.");
        } catch (error) {
            toast.error("Failed to send OTP.");
        }
    };

    const handleVerifyOtp = async () => {
        if (!customer || !otp.trim()) return;
        try {
            const response = await axios.post("/api/pos/v1/customers/verify-otp", {
                phone: customer.contactNumber,
                otp: otp.trim()
            });
            if (response.data?.success) {
                setOtpVerified(true);
                toast.success("OTP verified successfully!");
            } else {
                toast.error("Invalid OTP code.");
            }
        } catch (error) {
            toast.error(friendlyError(error, { fallback: "Invalid or expired OTP." }));
        }
    };

    const calculateChange = () => {
        if (paymentMethod === 'cash' && cashReceived) {
            return Math.max(0, parseFloat(cashReceived) - total);
        }
        return 0;
    };

    const getPaymentConfig = (name) => {
        const upperName = (name || '').toUpperCase();
        const configs = {
            'CASH': { key: 'cash', icon: Banknote, color: 'text-success' },
            'CARD': { key: 'card', icon: CreditCard, color: 'text-brand-fg' },
            'BANK TRANSFER': { key: 'bank', icon: Building2, color: 'text-plum' },
            'ONLINE TRANSFER': { key: 'bank', icon: Building2, color: 'text-plum' },
            'FREE MEAL': { key: 'free', icon: Gift, color: 'text-warning' },
            'STAFF MEAL': { key: 'staff', icon: Users, color: 'text-brand-fg' },
            'CREDIT': { key: 'credit', icon: Receipt, color: 'text-warning' }
        };

        // Find match by key
        if (configs[upperName]) return configs[upperName];

        // Fuzzy match for common variants
        if (upperName.includes('CASH')) return configs['CASH'];
        if (upperName.includes('CARD')) return configs['CARD'];
        if (upperName.includes('BANK') || upperName.includes('ONLINE')) return configs['BANK TRANSFER'];
        if (upperName.includes('CREDIT')) return configs['CREDIT'];

        return { key: 'other', icon: Receipt, color: 'text-fg-secondary' };
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

                {/* Main POS Interface */}
                <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* Left Panel - Product Search & Selection */}
                        <div className="lg:col-span-8 bg-surface rounded-lg shadow-sm border border-line p-4 flex flex-col">

                            {/* Search Header */}
                            <div className="mb-4">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <h2 className="text-[20px] font-[600] text-fg shrink-0">Product Selection</h2>
                                {/* Search Input: next to the title, not full width (owner 13 Nov) */}
                                <div className="relative flex-1 min-w-[200px] max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary" size={20} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search by name, code, or category number..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setHighlightedSearchIndex(-1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                                        autoComplete="off"
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedSearchIndex(prev => Math.max(prev - 1, 0));
                                            } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const results = searchResults.length > 0 ? searchResults : fastMovingProducts;
                                                if (highlightedSearchIndex >= 0 && results[highlightedSearchIndex]) {
                                                    openQtyModal(results[highlightedSearchIndex]);
                                                } else if (searchResults.length === 1) {
                                                    openQtyModal(searchResults[0]);
                                                }
                                            } else if (e.key === 'F2') {
                                                e.preventDefault();
                                                if (cart.length > 0) handleCheckout();
                                            }
                                        }}
                                    />
                                    {searchQuery && (
                                        <button aria-label="Close"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                                searchInputRef.current?.focus();
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-secondary hover:text-fg"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                    <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
                                    {/* every waiter is a button: tap one to select them and open their settlement */}
                                    {waiters.length > 0 ? waiters.map(w => (
                                        <button
                                            key={w.userId}
                                            onClick={() => {
                                                if (selectedWaiter?.userId !== w.userId) handleWaiterClick(w);
                                                setShowWaiterPanel(true);
                                            }}
                                            title={`Settle ${w.name}'s bill`}
                                            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-[500] ${selectedWaiter?.userId === w.userId
                                                ? 'border-brand-fg bg-brand/10 text-brand-fg'
                                                : 'bg-subtle border-line text-fg hover:bg-line'}`}
                                        >
                                            <Users size={14} className="text-brand-fg" />
                                            {w.name}
                                        </button>
                                    )) : (
                                        <button
                                            onClick={() => setShowWaiterPanel(true)}
                                            className="flex items-center gap-2 px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] font-[500] text-fg hover:bg-line"
                                        >
                                            <Users size={16} className="text-brand-fg" />
                                            Waiter Billing
                                        </button>
                                    )}
                                    {selectedWaiter && (
                                        <button aria-label="Unselect waiter" title="Unselect waiter" onClick={clearWaiter}
                                            className="p-2 border border-line rounded-lg text-fg-secondary hover:bg-line">
                                            <X size={16} />
                                        </button>
                                    )}
                                    </div>
                                </div>

                                {/* Category Quick Access: wraps to the next line (owner 13 Nov; the categories are merged into ~13 groups) */}
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => switchToCategory(category.id)}
                                            className={`px-3 py-1 text-[12px] rounded-full transition-colors ${selectedCategory === category.id
                                                ? 'bg-brand text-on-brand'
                                                : 'bg-subtle text-fg-secondary hover:bg-line'
                                                }`}>
                                            {/* name only (client 11 Nov); the shortcut number still works when typed in the search box */}
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-[14px] font-[500] text-fg mb-2 flex items-center gap-2">
                                        <Search size={16} />
                                        Search Results ({searchResults.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                        {searchResults.map((product, index) => (
                                            <div
                                                key={product.id}
                                                role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => openQtyModal(product)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${tileColor(index).edge} ${searchResults.indexOf(product) === highlightedSearchIndex
                                                    ? 'bg-brand/10 ring-1 ring-brand-fg'
                                                    : `${tileColor(index).tint} hover:bg-line`
                                                    }`}
                                            >
                                                {/* compact tile (owner 13 Nov): price by the name, qty by the code; Report wastage is in the quantity popup */}
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="text-[14px] font-[500] text-fg leading-tight">{product.name}</p>
                                                    <p className="text-[14px] font-[600] text-brand-fg whitespace-nowrap">{product.price > 0 ? `Rs. ${product.price}` : `U/P Rs. ${product.uberPrice || product.pickmePrice || 0}`}</p>
                                                </div>
                                                <div className="flex justify-between items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <span className="text-[12px] text-fg-secondary">{product.code}</span>
                                                        {["EXPIRED", "EXPIRING"].includes(expiryStatus(product.expiryDate, 1)) && (
                                                            <ExpiryTag expiryDate={product.expiryDate} warnDays={1} />
                                                        )}
                                                    </div>
                                                    <span className="text-[12px] text-fg-secondary whitespace-nowrap">Qty: {product.currentQty}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fast Moving Products */}
                            <div className="flex-1 overflow-y-auto">
                                <h3 className="text-[14px] font-[500] text-fg mb-3 flex items-center gap-2">
                                    <Zap size={16} className="text-warning" />
                                    {selectedCategory === 'all' ? 'All Items' : selectedCategory === 'fast' ? 'Fast Moving Products' : (activeCategory?.name || 'Items')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {defaultViewProducts.map((product, index) => (
                                        <div
                                            key={product.id}
                                            role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => openQtyModal(product)}
                                            className={`p-3 ${tileColor(index).tint} rounded-lg cursor-pointer hover:bg-line transition-all hover:shadow-sm border border-l-4 ${tileColor(index).edge}`}
                                        >
                                            {/* compact tile (owner 13 Nov): price by the name, qty by the code; Report wastage is in the quantity popup */}
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="text-[14px] font-[500] text-fg leading-tight">{product.name}</h4>
                                                <p className="text-[15px] font-[600] text-brand-fg whitespace-nowrap">{product.price > 0 ? `Rs. ${product.price}` : `U/P Rs. ${product.uberPrice || product.pickmePrice || 0}`}</p>
                                            </div>
                                            <div className="flex justify-between items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <span className="text-[12px] text-fg-secondary">{product.code}</span>
                                                    {product.fastMoving && (
                                                        <span className="text-[11px] bg-warning-solid text-on-brand px-2 rounded-full">FAST</span>
                                                    )}
                                                    {["EXPIRED", "EXPIRING"].includes(expiryStatus(product.expiryDate, 1)) && (
                                                        <ExpiryTag expiryDate={product.expiryDate} warnDays={1} />
                                                    )}
                                                </div>
                                                <span className="text-[12px] text-fg-secondary whitespace-nowrap">Qty: {product.currentQty}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>



                            {/* Waiter Current Order: the shared waiter bill popup (also on Waiter Billing, owner 12 Nov) */}
                            {showWaiterPanel && (
                                <WaiterBillingPopup products={products} waiter={selectedWaiter} onSelect={setSelectedWaiter}
                                    onClose={() => setShowWaiterPanel(false)} onChanged={() => { fetchTodayItems(); fetchWaiters(); }} />
                            )}
                        </div>

                        {/* Right Panel - Shopping Cart */}
                        <div className="lg:col-span-4 bg-surface rounded-lg shadow-sm border border-line p-4 flex flex-col h-fit">

                            {/* Cart Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[18px] font-[600] text-fg flex items-center gap-2">
                                    <ShoppingCart size={20} />
                                    Cart ({cart.length})
                                </h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={async () => {
                                            const n = cart.reduce((sum, item) => sum + item.quantity, 0);
                                            const ok = await confirmDialog(`Remove all ${n} item${n === 1 ? "" : "s"} from the cart?`,
                                                { title: "Clear the cart?", confirmText: "Clear cart", danger: true });
                                            if (ok) clearCart();
                                        }}
                                        className="text-[12px] text-error hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto mb-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart size={48} className="text-fg-muted mx-auto mb-3" />
                                        <p className="text-fg-secondary text-[14px]">Cart is empty</p>
                                        <p className="text-fg-secondary text-[12px]">Search and add products to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.id} className={`px-2 py-2 rounded-lg transition-all ${highlightedItemId === item.id ? 'pulse-item bg-brand/10 border border-brand-fg' : 'bg-subtle'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="flex-1 min-w-0 text-[14px] font-[500] text-fg leading-snug break-normal" title={item.name}>{item.name}</p>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            aria-label={`One less ${item.name}`}
                                                            className="w-7 h-7 flex items-center justify-center border border-line text-fg-secondary hover:bg-hover rounded-lg"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-6 text-center text-[14px] font-[600]">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            aria-label={`One more ${item.name}`}
                                                            className="w-7 h-7 flex items-center justify-center border border-line text-fg-secondary hover:bg-hover rounded-lg"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="min-w-[60px] text-right text-[14px] font-[600] text-fg whitespace-nowrap">Rs. {(linePrice(item) * item.quantity).toLocaleString()}</p>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        aria-label={`Remove ${item.name}`}
                                                        title="Remove from cart"
                                                        className="p-1.5 text-error hover:bg-error/10 rounded shrink-0"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {/* a note for the kitchen / MPC: KOT items only; it shows on the KOT ticket */}
                                                {(item.kotBased || item.isKotEnabled || item.isMpcDish) && (
                                                    noteOpen[item.id] || item.specialInstructions ? (
                                                        <input
                                                            type="text"
                                                            aria-label={`Note for ${item.name}`}
                                                            placeholder="Note for the kitchen (e.g. no chilli)"
                                                            value={item.specialInstructions || ""}
                                                            onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                                                            className="mt-1.5 w-full px-2 py-1 bg-surface border border-line rounded text-[12px] text-fg focus:outline-none focus:border-brand-fg"
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setNoteOpen(prev => ({ ...prev, [item.id]: true }))}
                                                            className="mt-1 text-[12px] text-brand-fg hover:underline"
                                                        >
                                                            + Add note for the kitchen
                                                        </button>
                                                    )
                                                )}

                                                {/* Per-item KOT (kotBased items only) */}
                                                {item.kotBased && productionCenters.length > 0 && (
                                                    <div className="mt-2 flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded">
                                                        <ChefHat size={14} className="text-warning shrink-0" />
                                                        {item.pcId ? (
                                                            // the dish belongs to one kitchen / MPC: its KOT goes there (as S1-S3)
                                                            <span className="flex-1 text-[12px] text-fg">
                                                                {productionCenters.find(pc => String(pc.id) === String(item.pcId))?.centerName || "Kitchen"}
                                                            </span>
                                                        ) : (
                                                        <select
                                                            value={selectedPcs[item.id] || productionCenters[0]?.id || ""}
                                                            onChange={(e) => setSelectedPcs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            disabled={kotSentMap[item.id]}
                                                            className="flex-1 text-[12px] border border-warning/30 rounded px-1 py-0.5 bg-surface focus:outline-none"
                                                        >
                                                            {productionCenters.map(pc => (
                                                                <option key={pc.id} value={pc.id}>{pc.centerName}</option>
                                                            ))}
                                                        </select>
                                                        )}
                                                        <button
                                                            onClick={() => sendKotForItem(item)}
                                                            disabled={kotSentMap[item.id]}
                                                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium transition-colors ${kotSentMap[item.id]
                                                                ? "bg-success/10 text-success cursor-not-allowed"
                                                                : "bg-warning-solid text-on-brand hover:bg-warning-solid"
                                                                }`}
                                                        >
                                                            <Send size={11} />
                                                            {kotSentMap[item.id] ? "KOT Sent" : "Send KOT"}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Per-item auto-discount remove button (no label shown here – discount shown at bill level) */}
                                                {appliedDiscounts[item.id] > 0 && appliedDiscountsMeta[item.id] && (
                                                    <div className="mt-2 flex items-center gap-1 p-1.5 bg-hover/40 rounded border border-success/20">
                                                        {appliedDiscountsMeta[item.id]?.ruleType === 'TIME_BASED' ? (
                                                            <ClockIcon size={12} className="text-brand-fg shrink-0" />
                                                        ) : (
                                                            <TagIcon size={12} className="text-success shrink-0" />
                                                        )}
                                                        <span className="text-[12px] text-success font-[500] flex-1">
                                                            {appliedDiscountsMeta[item.id]?.name || 'Discount'} applied
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveAutoDiscount(item.id, appliedDiscountsMeta[item.id].discountId)}
                                                            className="p-0.5 hover:bg-surface rounded-full text-fg-secondary transition-colors"
                                                            title="Remove discount"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Summary */}
                            {cart.length > 0 && (
                                <div className="border-t border-line pt-4">
                                    <div className="flex justify-between items-baseline mb-4">
                                        <span className="text-[16px] font-[600] text-fg">Total</span>
                                        <span className="text-right">
                                            <span className="block text-[20px] font-[700] text-brand-fg">Rs. {total.toLocaleString()}</span>
                                            {totalDiscount > 0 && (
                                                <span className="block text-[12px] text-success">incl. Rs. {totalDiscount.toLocaleString()} discount</span>
                                            )}
                                        </span>
                                    </div>

                                    {/* loyalty number at the end of the bill (same customer as in More; redeeming points is in More) */}
                                    <div className="mb-3">
                                        <label className="block text-[14px] font-[500] text-fg mb-2">Loyalty Number</label>
                                        {customer ? (
                                            <div className="flex items-center justify-between p-2 bg-subtle border border-line rounded-lg text-[13px]">
                                                <span><span className="font-[600] text-fg">{customer.name}</span> <span className="text-fg-secondary">{customer.contactNumber}</span></span>
                                                <span className="flex items-center gap-2">
                                                    <span className="flex items-center gap-0.5 text-warning font-[600]"><Coins size={12} /> {Number(customer.loyaltyPoints || 0).toFixed(2)}</span>
                                                    <button type="button" onClick={handleRemoveCustomer} aria-label="Remove loyalty customer" className="p-0.5 text-fg-secondary hover:text-error"><X size={14} /></button>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="tel"
                                                    placeholder="Customer mobile (optional)"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomerLookup(); } }}
                                                    className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCustomerLookup}
                                                    disabled={lookupLoading || !customerPhone.trim()}
                                                    className="px-4 bg-hover text-fg rounded-lg text-[14px] font-[500] disabled:opacity-50"
                                                >
                                                    {lookupLoading ? "..." : "Verify"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="block text-[14px] font-[500] text-fg mb-2">Cash Received</label>
                                        <CashQuickButtons total={total} selected={cartCash} onPick={setCartCash} />
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder={`Exact: Rs. ${total.toLocaleString()}`}
                                            value={cartCash}
                                            onChange={(e) => setCartCash(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickCheckout(); } }}
                                            className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                        />
                                        {cartCash !== '' && parseFloat(cartCash) >= total && (
                                            <div className="mt-2 p-2 bg-hover rounded-lg">
                                                <p className="text-[14px] text-error font-[700]">Change: Rs. {(parseFloat(cartCash) - total).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>



                                    {selectedWaiter ? (
                                        <div className="space-y-2">
                                            <button
                                                onClick={handleSaveToWaiter}
                                                className="w-full bg-plum-solid text-on-brand py-3 rounded-lg font-[500] hover:bg-plum-solid transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Calculator size={16} />
                                                Save to Waiter & Print Proforma
                                            </button>
                                            {cartPayButtons}
                                        </div>
                                    ) : (
                                        cartPayButtons
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>




            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Payment</h3>
                                <button aria-label="Close"
                                    onClick={() => {
                                        setShowPayment(false);
                                        resetPaymentForm();
                                    }}
                                    className="p-1 text-fg-secondary hover:bg-subtle rounded"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    {(() => {
                                        return (
                                            <>
                                                {/* Promotion Scope Selection */}
                                                {appliedPromo && (
                                                    <div className="mb-6">
                                                        <h4 className="text-[14px] font-[500] text-fg mb-3">Discount Scope</h4>
                                                        <div className="flex gap-2 p-1 bg-subtle rounded-lg">
                                                            {[
                                                                { id: 'EVERY', label: 'Every Item' },
                                                                { id: 'TOTAL', label: 'Full Total' },
                                                                { id: 'SELECTED', label: 'Selected' }
                                                            ].map(scope => (
                                                                <button
                                                                    key={scope.id}
                                                                    onClick={() => setPromoScope(scope.id)}
                                                                    className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-[500] transition-all ${promoScope === scope.id
                                                                        ? 'bg-surface text-brand-fg shadow-sm'
                                                                        : 'text-fg-secondary hover:text-fg'
                                                                        }`}
                                                                >
                                                                    {scope.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {promoScope === 'SELECTED' && selectedPromoItems.length === 0 && (
                                                            <p className="text-[12px] text-warning mt-2 italic">* Please select items above to apply discount</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Split payment: one bill over several methods */}
                                                {!isFreeMeal && splitMethods(availablePaymentMethods).length > 1 && (
                                                    <div className="mb-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const on = !splitMode;
                                                                setSplitMode(on);
                                                                setSplitParts(on ? startSplit(availablePaymentMethods, total) : []);
                                                                setSplitCashGiven('');
                                                            }}
                                                            className={`w-full p-3 border rounded-lg text-left text-[14px] transition-colors ${splitMode ? 'border-brand-fg bg-brand/5 text-brand-fg font-[500]' : 'border-line hover:border-brand-fg/30 text-fg'}`}
                                                        >
                                                            {splitMode ? 'Split payment is on (tap to pay with one method)' : 'Split payment (e.g. cash + card)'}
                                                        </button>
                                                    </div>
                                                )}
                                                {splitMode && (
                                                    <SplitPayment
                                                        methods={availablePaymentMethods}
                                                        total={total}
                                                        parts={splitParts}
                                                        onChange={setSplitParts}
                                                        cashGiven={splitCashGiven}
                                                        onCashGiven={setSplitCashGiven}
                                                    />
                                                )}

                                                {!splitMode && (<>
                                                {/* Payment Methods */}
                                                <div className="mb-6">
                                                    <h4 className="text-[14px] font-[500] text-fg mb-3">Payment Method</h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {availablePaymentMethods
                                                            .filter(method => {
                                                                const isCreditCategory = method.category === 'CREDIT' || method.name.toUpperCase().includes('CREDIT');
                                                                if (isCreditCategory) {
                                                                    return customer && customer.isCreditAllowed;
                                                                }
                                                                return true;
                                                            })
                                                            .map((method) => {
                                                                const config = getPaymentConfig(method.name);
                                                                const Icon = config.icon;
                                                                return (
                                                                    <button
                                                                        key={method.paymentMethodId}
                                                                        onClick={() => {
                                                                            setPaymentMethod(config.key);
                                                                            setPaymentMethodId(method.paymentMethodId);
                                                                            setDeliveryOption(channelFromMethod(method.name));
                                                                            setFreeMealReason('');
                                                                            setStaffId('');
                                                                            setStaffReason(''); setMeal(EMPTY_MEAL);
                                                                        }}
                                                                        className={`p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${paymentMethodId === method.paymentMethodId
                                                                            ? 'border-brand-fg bg-brand/5'
                                                                            : 'border-line hover:border-brand-fg/30'
                                                                            }`}
                                                                    >
                                                                        {deliveryAppOf(method.name)
                                                                            ? <DeliveryAppLogo app={deliveryAppOf(method.name)} />
                                                                            : <Icon size={16} className={config.color} />}
                                                                        <span className="text-[14px]">{method.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* Payment Method Specific Fields */}
                                                {paymentMethod === 'cash' && !isFreeMeal && (
                                                    <div className="mb-6">
                                                        <label className="block text-[14px] font-[500] text-fg mb-2">Cash Received *</label>
                                                        <CashQuickButtons total={total} selected={cashReceived} onPick={setCashReceived} />
                                                        <input
                                                            ref={cashInputRef}
                                                            type="number"
                                                            placeholder="Enter amount received"
                                                            value={cashReceived}
                                                            onChange={(e) => setCashReceived(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (parseFloat(cashReceived) >= total) {
                                                                        processPayment(true); // prints invoice, like pressing "Pay & Print Receipt"
                                                                    } else {
                                                                        toast.error('Enter valid cash amount');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                        />
                                                        {cashReceived && parseFloat(cashReceived) >= total && (
                                                            <div className="mt-2 p-2 bg-hover rounded-lg">
                                                                <p className="text-[14px] text-error font-[700]">Change: Rs. {calculateChange().toLocaleString()}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {paymentMethod === 'card' && !isFreeMeal && (
                                                    <div className="mb-6">
                                                        <label className="block text-[14px] font-[500] text-fg mb-2">Transaction Reference *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter card transaction reference"
                                                            value={cardRef}
                                                            onChange={(e) => setCardRef(e.target.value)}
                                                            className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                        />
                                                        <label className="block text-[14px] font-[500] text-fg mt-3 mb-2">Card last 4 digits *</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            maxLength={4}
                                                            placeholder="e.g. 1234"
                                                            value={cardLast4}
                                                            onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                            className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {paymentMethod === 'bank' && !isFreeMeal && (
                                                    <div className="mb-6 space-y-3">
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-fg mb-2">Bank Name *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter bank name"
                                                                value={bankName}
                                                                onChange={(e) => setBankName(e.target.value)}
                                                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-fg mb-2">Transaction Reference *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter transaction reference"
                                                                value={bankRef}
                                                                onChange={(e) => setBankRef(e.target.value)}
                                                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {(isFreeMeal || isStaffMeal) && (
                                                    <div className="mb-6">
                                                        <MealDetails kind={isStaffMeal ? 'staff' : 'free'} value={meal} onChange={setMeal} />
                                                    </div>
                                                )}

                                                </>)}

                                                {/* Order Channel Selection Checkboxes - hidden: the channel follows an Uber / PickMe payment method */}
                                                <div className="mb-6" hidden>
                                                    <label className="block text-[14px] font-[500] text-fg mb-2">Order Channel (Optional)</label>
                                                    {impliedChannel ? (
                                                    <p className="p-3 border border-line rounded-lg bg-subtle text-[14px] text-fg">
                                                        {impliedChannel === 'UBER' ? 'Uber' : 'PickMe'} order <span className="text-fg-secondary">(set by the payment method)</span>
                                                    </p>
                                                    ) : (
                                                    <div className="flex gap-4 p-3 border border-line rounded-lg bg-subtle">
                                                        {[
                                                            { id: 'UBER', label: 'Uber' },
                                                            { id: 'PICKME', label: 'PickMe' },
                                                            { id: 'OTHER', label: 'Other' }
                                                        ].map(option => (
                                                            <label key={option.id} className="flex items-center gap-2 cursor-pointer text-[14px] text-fg font-[500]">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={deliveryOption === option.id}
                                                                    onChange={() => {
                                                                        setDeliveryOption(deliveryOption === option.id ? null : option.id);
                                                                    }}
                                                                    className="w-4 h-4 text-brand-fg border-line-strong rounded focus:ring-brand-fg cursor-pointer"
                                                                />
                                                                {option.label}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    )}
                                                </div>


                                            </>
                                        );
                                    })()}
                                </div>

                                <div>

                            {/* Promo code: chosen here, in the payment popup (More) */}
                            {cart.length > 0 && (
                                <div className="mb-3">
                                    {/* promo-code dropdown hidden: the popup offers the direct discount only */}
                                    <div hidden>
                                    <label htmlFor="promo-pick" className="block text-[14px] text-fg mb-1">Discount (promo code)</label>
                                    <select
                                        id="promo-pick"
                                        value={appliedPromo ? appliedPromo.code : promoCode}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            setPromoCode(code);
                                            if (code) verifyPromo(code);
                                            else removePromo();
                                        }}
                                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] bg-surface text-fg"
                                    >
                                        <option value="">{activePromos.length ? 'No discount' : 'No promo codes available'}</option>
                                        {activePromos.map((p) => (
                                            <option key={p.code} value={String(p.code).toUpperCase()}>
                                                {p.code} — {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% off` : `Rs.${p.discountValue} off`}
                                                {p.maximumDiscountValue != null ? ` (max Rs.${p.maximumDiscountValue})` : ''}
                                                {p.description ? ` · ${p.description}` : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {appliedPromo && (
                                        <div className="mt-2 p-2 bg-hover rounded-lg flex items-center justify-between">
                                            <div className="text-[13px]">
                                                <strong>{appliedPromo.code}</strong> applied{' '}
                                                {appliedPromo.type === 'PERCENTAGE'
                                                    ? `(${appliedPromo.value}% off)`
                                                    : appliedPromo.type === 'FIXED'
                                                        ? `(Rs.${appliedPromo.value} off)`
                                                        : ''}
                                                {appliedPromo.maxCap != null && (
                                                    <span className="ml-1 text-warning font-[500]">
                                                        · max cap Rs. {appliedPromo.maxCap}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={removePromo} className="text-[12px] text-error">Remove</button>
                                        </div>
                                    )}

                                    </div>

                                    <label htmlFor="direct-discount" className="block text-[14px] text-fg mb-1">Direct discount</label>
                                    <div className="flex gap-2">
                                        <div className="flex bg-subtle p-1 rounded-lg shrink-0">
                                            {[['PERCENTAGE', '%'], ['FLAT', 'Rs.']].map(([t, label]) => (
                                                <button key={t} type="button" onClick={() => setDirectType(t)}
                                                    className={`px-3 py-1 rounded-md text-[13px] font-[500] ${directType === t ? 'bg-surface text-brand-fg shadow-sm' : 'text-fg-secondary hover:text-fg'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            id="direct-discount"
                                            type="number"
                                            min="0"
                                            max={directType === 'PERCENTAGE' ? 100 : undefined}
                                            value={directValue}
                                            onChange={(e) => setDirectValue(e.target.value)}
                                            placeholder={directType === 'PERCENTAGE' ? 'e.g. 10 (%)' : 'e.g. 100 (Rs.)'}
                                            className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] bg-surface text-fg focus:border-brand-fg focus:outline-none"
                                        />
                                    </div>
                                    {directDiscount > 0 && (
                                        <>
                                            <p className="mt-1 text-[12px] text-success">Rs. {directDiscount.toLocaleString()} off the bill</p>
                                            <input
                                                type="text" autoComplete="off" data-lpignore="true" style={{ WebkitTextSecurity: "disc" }}
                                                aria-label="Manager's code"
                                                value={directManagerCode}
                                                onChange={(e) => setDirectManagerCode(e.target.value)}
                                                placeholder="Manager's code to approve *"
                                                className="mt-2 w-full px-3 py-2 border border-line rounded-lg text-[14px] bg-surface text-fg focus:border-brand-fg focus:outline-none"
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                                    {/* Order Summary */}
                                    <div className="mb-6 p-4 bg-subtle rounded-lg">
                                        <h4 className="text-[14px] font-[500] text-fg mb-2">Order Summary</h4>
                                        <div className="space-y-1 mb-3">
                                            {cart.map((item) => (
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
                                                            className="w-3 h-3 accent-brand"
                                                        />
                                                    )}
                                                    <span className="flex-1 text-fg-secondary">{item.quantity}x {item.name}</span>
                                                    <span className="text-fg">Rs. {(linePrice(item) * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-line pt-2 pb-2">
                                            <div className="flex justify-between text-[14px]">
                                                <span className="text-fg-secondary">Subtotal:</span>
                                                <span className="text-fg">Rs. {subtotal.toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between text-[14px]">
                                                <span className="text-fg-secondary">Discount:</span>
                                                <span className="text-fg">Rs. {totalDiscount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-line pt-2">
                                            <div className="flex justify-between text-[16px] font-[600]">
                                                <span className="text-fg">Total:</span>
                                                <span className="text-brand-fg">Rs. {total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Loyalty Section */}
                                    <div className="mb-6 p-4 border border-dashed border-brand-fg/30 bg-subtle/40 rounded-lg">
                                        <h4 className="text-[14px] font-[600] text-fg mb-3 flex items-center gap-1.5">
                                            <Users size={16} className="text-brand-fg" />
                                            Customer Loyalty
                                        </h4>

                                        {!customer ? (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter phone number..."
                                                        value={customerPhone}
                                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 border border-line rounded-lg text-[13px] outline-none focus:border-brand-fg bg-surface"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCustomerLookup}
                                                        disabled={lookupLoading || !customerPhone.trim()}
                                                        className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-on-brand text-[13px] font-[500] rounded-lg transition-colors disabled:bg-line disabled:text-fg-muted flex items-center justify-center min-w-[70px]"
                                                    >
                                                        {lookupLoading ? <Loader variant="inline" /> : "Verify"}
                                                    </button>
                                                </div>
                                                <p className="text-[12px] text-fg-secondary">Enter registered mobile number to award/redeem points.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 text-[13px]">
                                                <div className="flex justify-between items-center bg-surface p-2.5 rounded-lg border border-line">
                                                    <div>
                                                        <p className="font-[600] text-fg">{customer.name}</p>
                                                        <p className="text-[12px] text-fg-secondary">
                                                            {customer.contactNumber} {customer.idCardNumber ? `• NIC: ${customer.idCardNumber}` : ""}
                                                            {customer.idCardNumber && (() => {
                                                                const nicInfo = extractNicDetails(customer.idCardNumber);
                                                                return nicInfo ? ` • DOB: ${nicInfo.birthdate} (${nicInfo.gender})` : "";
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[12px] text-fg-secondary">Points</p>
                                                        <p className="font-[700] text-warning flex items-center gap-0.5 justify-end">
                                                            <Coins size={12} /> {customer.loyaltyPoints?.toFixed(3) || '0.000'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Redemption Checkbox */}
                                                {customer.loyaltyPoints >= 1000 ? (
                                                    <div className="p-2.5 bg-subtle border border-warning/20 rounded-lg space-y-2">
                                                        <label className="flex items-center gap-2 font-[500] cursor-pointer text-fg">
                                                            <input
                                                                type="checkbox"
                                                                checked={redeemPoints}
                                                                onChange={(e) => {
                                                                    setRedeemPoints(e.target.checked);
                                                                    if (!e.target.checked) {
                                                                        setOtpSent(false);
                                                                        setOtpVerified(false);
                                                                        setOtp("");
                                                                    }
                                                                }}
                                                                className="w-4 h-4 accent-brand cursor-pointer"
                                                            />
                                                            Redeem 1000 Points (Rs. 1000.00 Discount)
                                                        </label>

                                                        {redeemPoints && !otpVerified && (
                                                            <div className="space-y-2 pt-1.5 border-t border-dashed border-warning/20">
                                                                {!otpSent ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleSendOtp}
                                                                        className="w-full py-1.5 bg-warning-solid hover:bg-warning-solid text-on-brand text-[12px] font-[600] rounded-md transition-colors"
                                                                    >
                                                                        Send SMS Verification OTP
                                                                    </button>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Enter 6-digit OTP..."
                                                                                value={otp}
                                                                                onChange={(e) => setOtp(e.target.value)}
                                                                                className="flex-1 px-2.5 py-1 border border-line rounded text-[12px] bg-surface"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleVerifyOtp}
                                                                                className="px-3 py-1 bg-success-solid hover:bg-success-solid text-on-brand text-[12px] font-[600] rounded"
                                                                            >
                                                                                Verify
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-[12px] text-success">✓ OTP sent to mobile. Enter code to confirm discount.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {otpVerified && (
                                                            <div className="text-[12px] text-success font-[600] bg-success/10 p-2 rounded flex items-center gap-1.5">
                                                                <Check size={14} /> Point verification successful. Rs. 1000.00 discount applied!
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-[12px] text-fg-secondary italic bg-surface p-2 rounded border border-line">
                                                        * Needs at least 1000 points to redeem. Points to earn from this order: +{(total / 1000.0).toFixed(3)}
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCustomer}
                                                    className="text-[12px] text-error hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    Remove Customer
                                                </button>
                                            </div>
                                        )}
                                    </div>


                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                setShowPayment(false);
                                                resetPaymentForm();
                                            }}
                                            className="flex-1 px-4 py-3 border border-line text-fg-secondary rounded-lg hover:bg-subtle transition-colors font-[500]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => processPayment(false)}
                                            disabled={!paymentMethod || ((isFreeMeal || isStaffMeal) && !mealReason(isStaffMeal ? 'staff' : 'free', meal))}
                                            className="flex-1 px-4 py-3 border border-line-strong bg-surface text-fg rounded-lg hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-[500]"
                                        >
                                            <Receipt size={16} />
                                            Pay without Receipt
                                        </button>
                                        <button
                                            onClick={() => processPayment(true)}
                                            disabled={!paymentMethod || ((isFreeMeal || isStaffMeal) && !mealReason(isStaffMeal ? 'staff' : 'free', meal))}
                                            className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors disabled:bg-line disabled:text-fg-secondary flex items-center justify-center gap-2 font-[600] text-[16px]"
                                        >
                                            <Printer size={18} />
                                            Pay &amp; Print Receipt
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                        <EBillPayButton
                                            defaultPhone={loyaltyPhone || ""}
                                            disabled={!paymentMethod || ((isFreeMeal || isStaffMeal) && !mealReason(isStaffMeal ? 'staff' : 'free', meal))}
                                            onPay={(phone) => { eBillPhoneRef.current = phone; processPayment(false); }}
                                        />
                                    </div>
                                    <ButtonHint show={isFreeMeal && !mealReason('free', meal)}>
                                        Enter who requested the free meal, the reason and the approval code to finish.
                                    </ButtonHint>
                                    <ButtonHint show={isStaffMeal && !mealReason('staff', meal)}>
                                        Enter a valid Staff ID and press Check to finish.
                                    </ButtonHint>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quantity Input Modal */}
            {showQtyModal && pendingProduct && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-6">
                            <h3 className="text-[16px] font-[600] text-fg mb-1">{pendingProduct.name}</h3>
                            <p className="text-[13px] text-fg-secondary mb-1">{pendingProduct.code}</p>
                            <p className="text-[14px] font-[600] text-brand-fg mb-4">Rs. {pendingProduct.price} each</p>
                            <p className="text-[12px] text-fg-secondary mb-4">Stock available: {pendingProduct.stock}</p>
                            {pendingProduct.dayProductionItemId && pendingProduct.stock > 0 && !pendingProduct.isMpcDish && (
                                <button type="button" onClick={() => { setShowQtyModal(false); openWastageReport(pendingProduct); }}
                                    className="-mt-3 mb-4 text-[12px] text-error hover:underline">
                                    Report wastage
                                </button>
                            )}

                            <label className="block text-[14px] font-[500] text-fg mb-2">Quantity</label>
                            <input
                                ref={qtyInputRef}
                                type="number"
                                min="1"
                                max={pendingProduct.stock}
                                value={pendingQty}
                                onChange={(e) => setPendingQty(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmQtyModal();
                                    if (e.key === 'Escape') {
                                        setShowQtyModal(false);
                                        setTimeout(() => searchInputRef.current?.focus(), 50);
                                    }
                                }}
                                className="w-full px-3 py-3 border border-line rounded-lg text-[18px] font-[600] text-center focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/10"
                            />
                            <p className="text-[12px] text-fg-secondary mt-2 text-center">Press Enter to add · Esc to cancel</p>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowQtyModal(false);
                                        setTimeout(() => searchInputRef.current?.focus(), 50);
                                    }}
                                    className="flex-1 px-4 py-2 border border-line text-fg-secondary rounded-lg hover:bg-subtle"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmQtyModal}
                                    className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover font-[500]"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Insufficient Stock Alert */}
            {showInsufficientStock && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-error" />
                            </div>
                            <h3 className="text-[18px] font-[600] text-fg mb-2">Insufficient Stock</h3>
                            <p className="text-[14px] text-fg-secondary mb-6">Not enough stock available for <strong>{insufficientItem}</strong></p>
                            <button
                                onClick={() => setShowInsufficientStock(false)}
                                className="w-full px-4 py-3 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Hidden Print Receipt Template */}
            {printData && <PosPrintout printData={printData} outlet={outlet} />}

            {/* Customer Registration Modal */}
            {showRegModal && (
                <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-elevated rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-line bg-subtle flex justify-between items-center">
                            <h3 className="font-[600] text-[15px] text-fg flex items-center gap-1.5">
                                <User size={18} className="text-brand-fg" />
                                Register Customer
                            </h3>
                            <button aria-label="Close"
                                onClick={() => setShowRegModal(false)}
                                className="text-fg-secondary hover:bg-hover p-1 rounded transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePOSRegisterCustomer}>
                            <div className="p-5 space-y-4">
                                {regError && (
                                    <div className="p-2.5 bg-error/10 border border-error/30 rounded text-[12px] text-error font-[500]">
                                        {regError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[12px] font-[500] text-fg mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter full name"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        className="w-full px-3 py-2 border border-line rounded-lg text-[13px] outline-none focus:border-brand-fg bg-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-[500] text-fg mb-1">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled
                                        value={customerPhone}
                                        className="w-full px-3 py-2 border border-line rounded-lg text-[13px] bg-subtle text-fg-secondary cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-[500] text-fg mb-1">ID Card Number (NIC) (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter identity card number"
                                        value={regNIC}
                                        onChange={(e) => setRegNIC(e.target.value)}
                                        className="w-full px-3 py-2 border border-line rounded-lg text-[13px] outline-none focus:border-brand-fg bg-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-[500] text-fg mb-1">Code sent to the phone *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            placeholder="6-digit code"
                                            value={regOtp}
                                            onChange={(e) => setRegOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="flex-1 px-3 py-2 border border-line rounded-lg text-[13px] outline-none focus:border-brand-fg bg-surface"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setRegError('');
                                                try {
                                                    await axios.post("/api/pos/v1/customers/send-otp", { phone: customerPhone.trim() });
                                                    setRegOtpSent(true);
                                                    toast.success(`Code sent to ${customerPhone.trim()}`);
                                                } catch (error) {
                                                    setRegError(friendlyError(error, { fallback: "The code could not be sent." }));
                                                }
                                            }}
                                            className="px-3 py-2 border border-brand-fg text-brand-fg hover:bg-brand/10 rounded-lg text-[12px] font-[500] whitespace-nowrap"
                                        >
                                            {regOtpSent ? "Send again" : "Send code"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-subtle border-t border-line flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRegModal(false)}
                                    className="px-3 py-1.5 border border-line text-fg-secondary hover:bg-surface rounded text-[13px] font-[500] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-brand text-on-brand hover:bg-brand-hover rounded text-[13px] font-[500] transition-colors"
                                >
                                    Register & Verify
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {reportItem && (
                <ReportWastageModal
                    item={reportItem}
                    onClose={() => setReportItem(null)}
                    onDone={(entry) => {
                        setReportItem(null);
                        toast.success(`${entry?.entryNo || "Wastage"} sent to the Admin for review.`);
                    }}
                />
            )}
        </div>
    );
}
