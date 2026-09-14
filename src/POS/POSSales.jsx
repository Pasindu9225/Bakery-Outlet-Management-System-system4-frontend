import React, { useState, useEffect, useRef } from "react";
import {
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
    X,
    AlertTriangle,
    Zap,
    Grid3X3,
    ChefHat,
    Send,
    Loader2,
    Coins,
    Check,
    Banknote
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { extractNicDetails } from "../utils/nicParser";
import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import Loader from "../component/Loader.jsx";
import posService from "../services/posService";

import managerService from "../services/managerService";
import { Tag as TagIcon, Clock as ClockIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function POSSales() {
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
    const [cardRef, setCardRef] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankRef, setBankRef] = useState('');
    const [freeMealReason, setFreeMealReason] = useState('');
    const [staffId, setStaffId] = useState('');
    const [staffReason, setStaffReason] = useState('');
    const [deliveryOption, setDeliveryOption] = useState(null);

    // Customer Loyalty States
    const [customerPhone, setCustomerPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [regName, setRegName] = useState('');
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
    const [waiterDetails, setWaiterDetails] = useState(null);
    const [selectedWaiterItemIds, setSelectedWaiterItemIds] = useState([]);
    const [targetWaiterId, setTargetWaiterId] = useState('');
    const [waiterPaymentType, setWaiterPaymentType] = useState('CASH');
    const [printData, setPrintData] = useState(null);
    const [showWaiterDiscountModal, setShowWaiterDiscountModal] = useState(false);
    const [waiterDiscountAmount, setWaiterDiscountAmount] = useState('0');
    const [waiterDiscountReason, setWaiterDiscountReason] = useState('');

    const [showWaiterPanel, setShowWaiterPanel] = useState(false);

    const [categories, setCategories] = useState([
        { id: 'all', name: 'All Items', code: '' },
        { id: 'fast', name: 'Fast Moving', code: '0' }
    ]);
    const [highlightedItemId, setHighlightedItemId] = useState(null);

    const fastMovingProducts = products.filter(p => p.fastMoving && p.stock > 0);

    const defaultViewProducts = selectedCategory === 'all'
        ? products.filter(p => p.stock > 0)
        : fastMovingProducts;

    const selectedSubTotal = waiterDetails?.unpaidItems
        ? waiterDetails.unpaidItems
            .filter(item => selectedWaiterItemIds.includes(item.id))
            .reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
        : 0;

    // Focus search input on page load
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Fetch items from backend
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
                receivedQty: item.receivedQty,
                currentQty: item.currentQty,
                stock: item.currentQty,
                category: item.categoryName,
                fastMoving: item.isFastMoving,
                kotBased: item.isKotEnabled || false
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

    const handleWaiterClick = (waiter) => {
        setSelectedWaiter(waiter);
        fetchWaiterDetails(waiter.userId);
        setWaiterDiscountAmount('0');
        setWaiterDiscountReason('');
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
        } catch (error) {
            console.error("Error transferring items:", error);
            toast.error("Failed to transfer items");
        }
    };

    const handleSaveToWaiter = async () => {
        if (!selectedWaiter || cart.length === 0) return;
        try {
            const billId = "BILL-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
            for (const item of cart) {
                const requestBody = {
                    waiterId: selectedWaiter.userId,
                    productId: item.id,
                    qty: item.quantity,
                    unitPrice: item.price,
                    instructions: item.specialInstructions || null,
                    productionCenterId: (selectedPcs[item.id] || productionCenters[0]?.id) ? Number(selectedPcs[item.id] || productionCenters[0]?.id) : null,
                    billId: billId
                };
                await axios.post(`/api/pos/v1/waiter-billing/add-item`, requestBody);
            }

            const printPayload = {
                type: 'PROFORMA',
                waiterName: selectedWaiter.name,
                cashierName: getLoggedInCashierName(),
                items: cart.map(item => ({
                    productName: item.name,
                    qty: item.quantity,
                    unitPrice: item.price
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
            fetchWaiterDetails(selectedWaiter.userId);
        } catch (error) {
            const errMsg = error.response?.data?.message || error.response?.data || "Failed to save items to waiter bill";
            toast.error(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
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
                const data = await posService.getPaymentMethods();
                setAvailablePaymentMethods(data);

                // Automatically set Cash as default if available
                if (data && data.length > 0) {
                    const cashMethod = data.find(m => m.category === 'CASH' || m.name.toLowerCase().includes('cash')) || data[0];
                    const config = getPaymentConfig(cashMethod.name);
                    setPaymentMethod(config.key);
                    setPaymentMethodId(cashMethod.paymentMethodId);
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
                setSelectedCategory(category.id);

                if (category.id === 'fast') {
                    setSearchResults(products.filter(p => p.fastMoving && p.stock > 0));
                    return;
                }
                if (category.id === 'all') {
                    setSearchResults(products.filter(p => p.stock > 0));
                    return;
                }
                setSearchResults(products.filter(p => p.category === category.name && p.stock > 0));
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
            setSelectedCategory('all');
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
    const addToCart = async (product, quantity = 1) => {
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
    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
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
        const pcId = selectedPcs[item.id] || (productionCenters[0]?.id);
        if (!pcId) {
            toast.error("No production center available. Please configure outlet MPCs first.");
            return;
        }
        try {
            await posService.sendStandaloneKot({
                dayProductionItemId: item.dayProductionItemId,
                qty: item.quantity,
                productionCenterId: Number(pcId),
                specialInstructions: item.specialInstructions || "",
            });
            setKotSentMap(prev => ({ ...prev, [item.id]: true }));
            toast.success("KOT sent successfully");
        } catch (err) {
            console.error("Error sending KOT:", err);
            toast.error(err.response?.data?.message || "Failed to send KOT. Please try again.");
        }
    };

    // Promo verification
    const verifyPromo = async () => {
        const code = (promoCode || '').trim().toUpperCase();
        if (!code) return toast.error('Enter a promo code');

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
            toast.error(error.response?.data?.message || "Promotion Expired or Invalid");
            removePromo();
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setAppliedDiscounts({});
    };




    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Raw discount before any cap
    const rawDiscount = cart.reduce((sum, item) => sum + ((appliedDiscounts[item.id] || 0) * item.quantity), 0);
    // Apply Max Discount Cap from promo (if set)
    const totalDiscount = (appliedPromo?.maxCap != null)
        ? Math.min(rawDiscount, appliedPromo.maxCap)
        : rawDiscount;
    const redemptionDiscount = (customer && redeemPoints && otpVerified) ? Math.min(1000.00, Math.max(0, subtotal - totalDiscount)) : 0.00;
    const total = subtotal - totalDiscount - redemptionDiscount;

    const selectedPaymentMethodObj = availablePaymentMethods.find(m => m.paymentMethodId === paymentMethodId) || {};
    const isFreeMeal = selectedPaymentMethodObj.category === 'FREE_MEAL';

    const handleCheckout = () => {
        if (cart.length === 0) return;
        const cashMethod = availablePaymentMethods.find(m => getPaymentConfig(m.name).key === 'cash');
        if (cashMethod) {
            setPaymentMethod('cash');
            setPaymentMethodId(cashMethod.paymentMethodId);
        }
        setShowPayment(true);
    };

    // Process payment
    const processPayment = async (shouldPrint = false) => {
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

        // Validation based on payment method
        if (paymentMethod === 'cash' && (!isFreeMeal) && (!cashReceived || parseFloat(cashReceived) < total)) {
            toast.error('Please enter valid cash amount');
            return;
        }

        if (paymentMethod === 'card' && !cardRef.trim()) {
            toast.error('Please enter card transaction reference');
            return;
        }

        if (paymentMethod === 'bank' && (!bankName.trim() || !bankRef.trim())) {
            toast.error('Please enter bank details');
            return;
        }

        const effectiveReason = freeMealReason.trim() || (staffId.trim() ? `Staff ID: ${staffId.trim()}${staffReason.trim() ? ` - ${staffReason.trim()}` : ''}` : '');

        if (isFreeMeal && effectiveReason.length < 10) {
            toast.error('Please enter a valid staff ID or reason (minimum 10 characters)');
            return;
        }

        if (paymentMethod === 'staff' && !staffId.trim()) {
            toast.error('Please enter valid staff ID');
            return;
        }

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
            items: cart.map(item => ({
                dayProductionItemId: item.dayProductionItemId,
                qty: item.quantity,
                unitPrice: item.price,
                paymentMethodId: paymentMethodId, // Explicitly using the ID resolved from backend
                promotionId: appliedPromo?.id || null,
                discountId: appliedDiscountsMeta[item.id]?.discountId || null,
                manualDiscount: 0,
                freeMealReason: isFreeMeal ? effectiveReason : null,
                bankTransferCode: (paymentMethod === 'bank' || paymentMethod === 'bank transfer') ? bankRef : (paymentMethod === 'card' ? cardRef : null),
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
                    unitPrice: item.price
                })),
                subTotal: subtotal,
                discount: totalDiscount,
                finalTotal: total,
                paymentMethod: selectedMethodObj.name,
                kotItems: kotItems,
                printBill: shouldPrint,
                isUberOrPickMe: isUberOrPickMe
            };

            if (shouldPrint || hasKotItems) {
                setPrintData(printPayload);
                setTimeout(() => {
                    window.print();
                    setPrintData(null);
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
                toast.error(error.response?.data?.message || "Failed to save sale. Please try again.");
            }
        }
    };

    const resetPaymentForm = () => {
        setPaymentMethod('');
        setPaymentMethodId(null);
        setCashReceived('');
        setCardRef('');
        setBankName('');
        setBankRef('');
        setFreeMealReason('');
        setStaffId('');
        setStaffReason('');
        setDeliveryOption(null);

        // Reset Customer loyalty states
        setCustomer(null);
        setCustomerPhone('');
        setRedeemPoints(false);
        setOtpSent(false);
        setOtpVerified(false);
        setOtp('');
    };

    const handleRemoveCustomer = () => {
        const isConfirmed = window.confirm("Are you sure you want to remove this customer?");
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

        try {
            const response = await axios.post("/api/pos/v1/customers/register", {
                name: regName.trim(),
                contactNumber: phoneClean,
                idCardNumber: nicClean || null
            });
            toast.success("Customer registered successfully!");
            setCustomer(response.data);
            setShowRegModal(false);
        } catch (error) {
            setRegError(error.response?.data?.message || "Failed to register customer.");
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
            toast.error(error.response?.data?.message || "Invalid or expired OTP.");
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
            'CASH': { key: 'cash', icon: Banknote, color: 'text-[#51CC5D]' },
            'CARD': { key: 'card', icon: CreditCard, color: 'text-[#1366D9]' },
            'BANK TRANSFER': { key: 'bank', icon: Building2, color: 'text-[#B3A5FF]' },
            'ONLINE TRANSFER': { key: 'bank', icon: Building2, color: 'text-[#B3A5FF]' },
            'FREE MEAL': { key: 'free', icon: Gift, color: 'text-[#F97316]' },
            'STAFF MEAL': { key: 'staff', icon: Users, color: 'text-[#60A5FA]' },
            'CREDIT': { key: 'credit', icon: Receipt, color: 'text-[#E09400]' }
        };

        // Find match by key
        if (configs[upperName]) return configs[upperName];

        // Fuzzy match for common variants
        if (upperName.includes('CASH')) return configs['CASH'];
        if (upperName.includes('CARD')) return configs['CARD'];
        if (upperName.includes('BANK') || upperName.includes('ONLINE')) return configs['BANK TRANSFER'];
        if (upperName.includes('CREDIT')) return configs['CREDIT'];

        return { key: 'other', icon: Receipt, color: 'text-[#667085]' };
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

                {/* Main POS Interface */}
                <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* Left Panel - Product Search & Selection */}
                        <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 flex flex-col">

                            {/* Search Header */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h2 className="text-[20px] font-[600] text-[#383E49]">Product Selection</h2>
                                    <button
                                        onClick={() => setShowWaiterPanel(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FA] border border-[#E4E6EA] rounded-lg text-[13px] font-[500] text-[#383E49] hover:bg-[#E4E6EA]"
                                    >
                                        <Users size={16} className="text-[#0F50AA]" />
                                        Waiter Billing
                                        {selectedWaiter && <span className="text-[#0F50AA]">({selectedWaiter.name})</span>}
                                    </button>
                                </div>
                                {/* Search Input */}
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={20} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search by name, code, or category number..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setHighlightedSearchIndex(-1);
                                        }}
                                        className="w-full pl-10 pr-4 py-3 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]/10"
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
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                                searchInputRef.current?.focus();
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#667085] hover:text-[#383E49]"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Category Quick Access */}
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => {
                                                if (category.id === 'fast' || category.id === 'all') {
                                                    setSelectedCategory(category.id);
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                } else {
                                                    setSelectedCategory(category.id);
                                                    setSearchQuery(category.code);
                                                }
                                            }}
                                            className={`px-3 py-1 text-[12px] rounded-full transition-colors ${selectedCategory === category.id
                                                ? 'bg-[#0F50AA] text-white'
                                                : 'bg-[#F8F9FA] text-[#667085] hover:bg-[#E4E6EA]'
                                                }`}>
                                            <div className="flex items-center gap-1">
                                                <Grid3X3 size={12} />
                                                {category.name} {category.code && `(${category.code})`}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-[14px] font-[500] text-[#383E49] mb-2 flex items-center gap-2">
                                        <Search size={16} />
                                        Search Results ({searchResults.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {searchResults.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => openQtyModal(product)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 border-[#0F50AA] ${searchResults.indexOf(product) === highlightedSearchIndex
                                                    ? 'bg-[#0F50AA]/10 ring-1 ring-[#0F50AA]'
                                                    : 'bg-[#F8F9FA] hover:bg-[#E4E6EA]'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-[14px] font-[500] text-[#383E49]">{product.name}</p>
                                                        <p className="text-[12px] text-[#667085]">{product.code}</p>
                                                        <p className="text-[14px] font-[600] text-[#0F50AA]">Rs. {product.price}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-[#667085]">Received QTY: {product.receivedQty}</p>
                                                        <p className="text-[10px] text-[#667085]">Current QTY: {product.currentQty}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fast Moving Products */}
                            <div className="flex-1 overflow-y-auto">
                                <h3 className="text-[14px] font-[500] text-[#383E49] mb-3 flex items-center gap-2">
                                    <Zap size={16} className="text-[#F4A100]" />
                                    {selectedCategory === 'all' ? 'All Items' : 'Fast Moving Products'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {defaultViewProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => openQtyModal(product)}
                                            className="p-4 bg-[#F8F9FA] rounded-lg cursor-pointer hover:bg-[#E4E6EA] transition-all hover:shadow-sm border"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-[14px] font-[500] text-[#383E49] leading-tight">{product.name}</h4>
                                                {product.fastMoving && (
                                                    <span className="text-[10px] bg-[#F4A100] text-white px-2 py-1 rounded-full">FAST</span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-[#667085] mb-1">{product.code}</p>
                                            <div className="flex border-t border-[#E4E6EA] mt-2 pt-2 justify-between items-center">
                                                <p className="text-[16px] font-[600] text-[#0F50AA]">Rs. {product.price}</p>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-[#667085]">Received QTY: {product.receivedQty}</p>
                                                    <p className="text-[10px] text-[#667085]">Current QTY: {product.currentQty}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>



                            {/* Waiter Current Order */}
                            {showWaiterPanel && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-[18px] font-[600] text-[#383E49]">Waiter Billing</h3>
                                                <button onClick={() => setShowWaiterPanel(false)} className="p-1 text-[#667085] hover:bg-[#F8F9FA] rounded">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Waiter Selection Grid */}
                                            <div className="mb-4">
                                                <h4 className="text-[13px] font-[500] text-[#383E49] mb-2">Select Waiter</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {waiters.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => handleWaiterClick(w)}
                                                            className={`p-2 rounded-lg border-2 transition-all text-left ${selectedWaiter?.userId === w.userId
                                                                ? 'border-[#0F50AA] bg-[#0F50AA]/5'
                                                                : 'border-[#E4E6EA] hover:border-[#0F50AA]/30'
                                                                }`}
                                                        >
                                                            <p className="text-[13px] font-[600] text-[#383E49] truncate">{w.name}</p>
                                                            <p className="text-[10px] text-[#667085] truncate">@{w.username}</p>
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
                                                                className="flex-1 px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px]"
                                                            >
                                                                <option value="">Transfer to Waiter...</option>
                                                                {waiters.filter(w => w.userId !== selectedWaiter.userId).map(w => (
                                                                    <option key={w.userId} value={w.userId}>{w.name}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={handleTransferWaiter}
                                                                disabled={!targetWaiterId}
                                                                className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg disabled:opacity-50 transition-colors text-[14px]"
                                                            >
                                                                Transfer
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {waiterDetails && waiterDetails.unpaidItems.length > 0 && (
                                                        <div className="flex items-center justify-between mb-3 px-1">
                                                            <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#383E49] font-[500]">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedWaiterItemIds.length === waiterDetails.unpaidItems.length}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedWaiterItemIds(waiterDetails.unpaidItems.map(item => item.id));
                                                                        } else {
                                                                            setSelectedWaiterItemIds([]);
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 text-[#0F50AA] border-[#E4E6EA] rounded focus:ring-[#0F50AA] cursor-pointer"
                                                                />
                                                                Select All ({waiterDetails.unpaidItems.length})
                                                            </label>
                                                            <span className="text-[12px] text-[#667085]">
                                                                {selectedWaiterItemIds.length} selected
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="mb-4">
                                                        {!waiterDetails || waiterDetails.unpaidItems.length === 0 ? (
                                                            <p className="text-[#667085] text-[14px] text-center py-4">No active items.</p>
                                                        ) : (() => {
                                                            const groupedBills = {};
                                                            waiterDetails.unpaidItems.forEach(item => {
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
                                                                            <div key={billKey} className="border border-[#E4E6EA] rounded-xl bg-white shadow-sm overflow-hidden">
                                                                                {/* Bill Header */}
                                                                                <div className="flex items-center justify-between border-b border-[#E4E6EA] p-3 bg-[#F8F9FA]">
                                                                                    <label className="flex items-center gap-2 cursor-pointer font-[600] text-[#383E49] text-[14px]">
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
                                                                                            className="w-4 h-4 text-[#0F50AA] border-[#E4E6EA] rounded focus:ring-[#0F50AA] cursor-pointer"
                                                                                        />
                                                                                        {displayTitle} ({items.length} {items.length === 1 ? 'item' : 'items'})
                                                                                    </label>
                                                                                    <span className="text-[14px] font-[700] text-[#0F50AA]">Rs. {billSubTotal.toLocaleString()}</span>
                                                                                </div>

                                                                                {/* Bill Items */}
                                                                                <div className="space-y-1.5 p-2 bg-white">
                                                                                    {items.map(item => {
                                                                                        const isChecked = selectedWaiterItemIds.includes(item.id);
                                                                                        return (
                                                                                            <div
                                                                                                key={item.id}
                                                                                                onClick={() => toggleWaiterItemSelection(item.id)}
                                                                                                className={`flex justify-between p-2.5 rounded-lg items-center cursor-pointer transition-colors border ${isChecked ? 'bg-[#0F50AA]/5 border-[#0F50AA]' : 'bg-[#F8F9FA] border-transparent hover:border-[#E4E6EA]'
                                                                                                    }`}
                                                                                            >
                                                                                                <div className="flex items-center gap-2.5">
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        checked={isChecked}
                                                                                                        onChange={() => { }}
                                                                                                        className="w-3.5 h-3.5 text-[#0F50AA] border-gray-300 rounded focus:ring-[#0F50AA] cursor-pointer"
                                                                                                    />
                                                                                                    <div>
                                                                                                        <p className="text-[13px] font-[500] text-[#383E49]">{item.productName}</p>
                                                                                                        <p className="text-[11px] text-[#667085]">{item.qty || item.quantity} x Rs. {item.unitPrice}</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <p className="text-[14px] font-[600] text-[#0F50AA]">Rs. {item.totalPrice}</p>
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

                                                    {waiterDetails && waiterDetails.unpaidItems.length > 0 && (
                                                        <div className="border-t border-[#E4E6EA] pt-4 mt-auto">
                                                            <div className="space-y-1.5 mb-4">
                                                                <div className="flex justify-between text-[14px] text-[#667085]">
                                                                    <span>Subtotal Selected:</span>
                                                                    <span>Rs. {selectedSubTotal.toLocaleString()}</span>
                                                                </div>
                                                                {parseFloat(waiterDiscountAmount) > 0 && (
                                                                    <div className="flex justify-between text-[14px] text-[#D97706] font-[500]">
                                                                        <span>Discount ({waiterDiscountReason || "No Reason"}):</span>
                                                                        <span>- Rs. {parseFloat(waiterDiscountAmount).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between text-[18px] font-[600] text-[#383E49] border-t border-dashed pt-1">
                                                                    <span>Total Selected:</span>
                                                                    <span className="text-[#EF4444]">Rs. {(selectedSubTotal - (parseFloat(waiterDiscountAmount) || 0)).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3 mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-[500] text-[#383E49]">Pay Type:</span>
                                                                    <select
                                                                        value={waiterPaymentType}
                                                                        onChange={(e) => setWaiterPaymentType(e.target.value)}
                                                                        className="px-3 py-1.5 border border-[#E4E6EA] rounded-lg text-sm bg-white"
                                                                    >
                                                                        <option value="CASH">Cash</option>
                                                                        <option value="CARD">Card</option>
                                                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                                                        <option value="FREE_MEAL">Free Meal</option>
                                                                    </select>
                                                                </div>
                                                                <button
                                                                    onClick={() => setShowWaiterDiscountModal(true)}
                                                                    className="px-3 py-1.5 bg-[#EFF6FF] text-[#0F50AA] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg text-sm font-[500] transition-colors"
                                                                >
                                                                    Discount
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                                <button
                                                                    disabled={selectedWaiterItemIds.length === 0}
                                                                    onClick={async () => {
                                                                        const discountVal = parseFloat(waiterDiscountAmount) || 0;
                                                                        if (window.confirm(`Process payment and complete sale (without printing) for the ${selectedWaiterItemIds.length} selected items?`)) {
                                                                            try {
                                                                                const payload = {
                                                                                    waiterId: selectedWaiter.userId,
                                                                                    itemIdsToPay: selectedWaiterItemIds,
                                                                                    finalTotal: selectedSubTotal - discountVal,
                                                                                    paymentType: waiterPaymentType,
                                                                                    discountAmount: discountVal,
                                                                                    discountReason: waiterDiscountReason,
                                                                                    outletId: parseInt(localStorage.getItem("outletId") || "1"),
                                                                                    invoicePrinted: false
                                                                                };
                                                                                await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, payload);

                                                                                toast.success("Payment successful! Sale completed.");
                                                                                setWaiterDiscountAmount('0');
                                                                                setWaiterDiscountReason('');
                                                                                fetchWaiterDetails(selectedWaiter.userId);
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                                toast.error("Failed to process payment");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed font-[500] flex justify-center items-center gap-2"
                                                                >
                                                                    Complete Sale
                                                                </button>
                                                                <button
                                                                    disabled={selectedWaiterItemIds.length === 0}
                                                                    onClick={async () => {
                                                                        const discountVal = parseFloat(waiterDiscountAmount) || 0;
                                                                        if (window.confirm(`Process payment and print invoice for the ${selectedWaiterItemIds.length} selected items?`)) {
                                                                            try {
                                                                                const selectedItems = waiterDetails.unpaidItems.filter(item => selectedWaiterItemIds.includes(item.id));
                                                                                const payload = {
                                                                                    waiterId: selectedWaiter.userId,
                                                                                    itemIdsToPay: selectedWaiterItemIds,
                                                                                    finalTotal: selectedSubTotal - discountVal,
                                                                                    paymentType: waiterPaymentType,
                                                                                    discountAmount: discountVal,
                                                                                    discountReason: waiterDiscountReason,
                                                                                    outletId: parseInt(localStorage.getItem("outletId") || "1"),
                                                                                    invoicePrinted: true
                                                                                };
                                                                                await axios.post(`/api/pos/v1/waiter-billing/finish-billing`, payload);

                                                                                const printPayload = {
                                                                                    type: 'ACTUAL',
                                                                                    waiterName: selectedWaiter.name,
                                                                                    cashierName: getLoggedInCashierName(),
                                                                                    items: selectedItems.map(item => ({
                                                                                        productName: item.productName,
                                                                                        qty: item.quantity || item.qty,
                                                                                        unitPrice: item.unitPrice
                                                                                    })),
                                                                                    subTotal: selectedSubTotal,
                                                                                    discount: discountVal,
                                                                                    finalTotal: selectedSubTotal - discountVal,
                                                                                    paymentMethod: waiterPaymentType
                                                                                };
                                                                                setPrintData(printPayload);
                                                                                setTimeout(() => {
                                                                                    window.print();
                                                                                    setPrintData(null);
                                                                                }, 150);

                                                                                toast.success("Payment successful! Actual invoice printed.");
                                                                                setWaiterDiscountAmount('0');
                                                                                setWaiterDiscountReason('');
                                                                                fetchWaiterDetails(selectedWaiter.userId);
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                                toast.error("Failed to process payment");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] disabled:opacity-50 disabled:cursor-not-allowed font-[500] flex justify-center items-center gap-2"
                                                                >
                                                                    Print Invoice
                                                                </button>

                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Shopping Cart */}
                        <div className="lg:col-span-4 bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-4 flex flex-col h-fit">

                            {/* Cart Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[18px] font-[600] text-[#383E49] flex items-center gap-2">
                                    <ShoppingCart size={20} />
                                    Cart ({cart.length})
                                </h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-[12px] text-[#EF4444] hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Promo Code Entry */}
                            {cart.length > 0 && (
                                <div className="mb-3">
                                    <label className="block text-[14px] text-[#383E49] mb-1">Promo Code</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            placeholder="Enter code"
                                            className="flex-1 px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px]"
                                        />
                                        <button
                                            onClick={verifyPromo}
                                            className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494]"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    {appliedPromo && (
                                        <div className="mt-2 p-2 bg-[#EFF6FF] rounded-lg flex items-center justify-between">
                                            <div className="text-[13px]">
                                                <strong>{appliedPromo.code}</strong> applied{' '}
                                                {appliedPromo.type === 'PERCENTAGE'
                                                    ? `(${appliedPromo.value}% off)`
                                                    : appliedPromo.type === 'FIXED'
                                                        ? `(Rs.${appliedPromo.value} off)`
                                                        : ''}
                                                {appliedPromo.maxCap != null && (
                                                    <span className="ml-1 text-[#D97706] font-[500]">
                                                        · max cap Rs. {appliedPromo.maxCap}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={removePromo} className="text-[12px] text-[#EF4444]">Remove</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto mb-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingCart size={48} className="text-[#E4E6EA] mx-auto mb-3" />
                                        <p className="text-[#667085] text-[14px]">Cart is empty</p>
                                        <p className="text-[#667085] text-[12px]">Search and add products to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.id} className={`p-3 rounded-lg transition-all ${highlightedItemId === item.id ? 'pulse-item bg-[#0F50AA]/10 border border-[#0F50AA]' : 'bg-[#F8F9FA]'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="text-[14px] font-[500] text-[#383E49]">{item.name}</p>
                                                        <p className="text-[12px] text-[#667085]">{item.code}</p>
                                                        <p className="text-[14px] font-[600] text-[#0F50AA]">Rs. {item.price} each</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-1 text-[#EF4444] hover:bg-red-100 rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="p-1 text-[#667085] hover:bg-white rounded"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-12 text-center text-[14px] font-[500]">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1 text-[#667085] hover:bg-white rounded"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="text-[16px] font-[600] text-[#383E49]">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                                                </div>

                                                {/* Special Instructions Input */}
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Special instructions (e.g. No sugar, pack separately)"
                                                        value={item.specialInstructions || ""}
                                                        onChange={(e) => updateSpecialInstructions(item.id, e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white border border-[#E4E6EA] rounded text-[11px] text-[#383E49] focus:outline-none focus:ring-1 focus:ring-[#0F50AA]/20 focus:border-[#0F50AA]"
                                                    />
                                                </div>

                                                {/* Per-item KOT (kotBased items only) */}
                                                {item.kotBased && productionCenters.length > 0 && (
                                                    <div className="mt-2 flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                                        <ChefHat size={14} className="text-orange-500 shrink-0" />
                                                        <select
                                                            value={selectedPcs[item.id] || productionCenters[0]?.id || ""}
                                                            onChange={(e) => setSelectedPcs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            disabled={kotSentMap[item.id]}
                                                            className="flex-1 text-[11px] border border-orange-200 rounded px-1 py-0.5 bg-white focus:outline-none"
                                                        >
                                                            {productionCenters.map(pc => (
                                                                <option key={pc.id} value={pc.id}>{pc.centerName}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => sendKotForItem(item)}
                                                            disabled={kotSentMap[item.id]}
                                                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${kotSentMap[item.id]
                                                                ? "bg-green-100 text-green-700 cursor-not-allowed"
                                                                : "bg-orange-500 text-white hover:bg-orange-600"
                                                                }`}
                                                        >
                                                            <Send size={11} />
                                                            {kotSentMap[item.id] ? "KOT Sent" : "Send KOT"}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Per-item auto-discount remove button (no label shown here – discount shown at bill level) */}
                                                {appliedDiscounts[item.id] > 0 && appliedDiscountsMeta[item.id] && (
                                                    <div className="mt-2 flex items-center gap-1 p-1.5 bg-[#DDFFE0]/40 rounded border border-[#199D26]/20">
                                                        {appliedDiscountsMeta[item.id]?.ruleType === 'TIME_BASED' ? (
                                                            <ClockIcon size={12} className="text-[#0F50AA] shrink-0" />
                                                        ) : (
                                                            <TagIcon size={12} className="text-[#199D26] shrink-0" />
                                                        )}
                                                        <span className="text-[10px] text-[#199D26] font-[500] flex-1">
                                                            {appliedDiscountsMeta[item.id]?.name || 'Discount'} applied
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveAutoDiscount(item.id, appliedDiscountsMeta[item.id].discountId)}
                                                            className="p-0.5 hover:bg-white rounded-full text-[#667085] transition-colors"
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
                                <div className="border-t border-[#E4E6EA] pt-4">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-[14px]">
                                            <span className="text-[#667085]">Subtotal:</span>
                                            <span className="text-[#383E49]">Rs. {subtotal.toLocaleString()}</span>
                                        </div>

                                        {totalDiscount > 0 ? (
                                            <div className="flex justify-between text-[14px] p-2 bg-[#DDFFE0]/50 rounded border border-[#199D26]/20">
                                                <span className="text-[#199D26] font-[500] flex items-center gap-1">
                                                    <TagIcon size={13} />
                                                    Discount{appliedPromo ? ` (${appliedPromo.code})` : ''}:
                                                </span>
                                                <span className="text-[#199D26] font-[600]">- Rs. {totalDiscount.toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-[14px]">
                                                <span className="text-[#667085]">Discount:</span>
                                                <span className="text-[#383E49]">Rs. 0</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-[16px] font-[600]">
                                            <span className="text-[#383E49]">Total:</span>
                                            <span className="text-[#0F50AA]">Rs. {total.toLocaleString()}</span>
                                        </div>
                                    </div>



                                    {selectedWaiter ? (
                                        <div className="space-y-2">
                                            <button
                                                onClick={handleSaveToWaiter}
                                                className="w-full bg-[#6366F1] text-white py-3 rounded-lg font-[500] hover:bg-[#4F46E5] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Calculator size={16} />
                                                Save to Waiter & Print Proforma
                                            </button>
                                            <button
                                                onClick={handleCheckout}
                                                className="w-full border border-[#0F50AA] text-[#0F50AA] py-2 rounded-lg text-sm font-[500] hover:bg-[#0F50AA]/5 transition-colors flex items-center justify-center gap-2"
                                            >
                                                Normal Checkout
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckout}
                                            className="w-full bg-[#0F50AA] text-white py-3 rounded-lg font-[500] hover:bg-[#0D4494] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Calculator size={16} />
                                            Checkout
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>




            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-[#383E49]">Payment</h3>
                                <button
                                    onClick={() => {
                                        setShowPayment(false);
                                        resetPaymentForm();
                                    }}
                                    className="p-1 text-[#667085] hover:bg-[#F8F9FA] rounded"
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
                                                        <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Discount Scope</h4>
                                                        <div className="flex gap-2 p-1 bg-[#F8F9FA] rounded-lg">
                                                            {[
                                                                { id: 'EVERY', label: 'Every Item' },
                                                                { id: 'TOTAL', label: 'Full Total' },
                                                                { id: 'SELECTED', label: 'Selected' }
                                                            ].map(scope => (
                                                                <button
                                                                    key={scope.id}
                                                                    onClick={() => setPromoScope(scope.id)}
                                                                    className={`flex-1 py-1.5 px-2 rounded-md text-[12px] font-[500] transition-all ${promoScope === scope.id
                                                                        ? 'bg-white text-[#0F50AA] shadow-sm'
                                                                        : 'text-[#667085] hover:text-[#383E49]'
                                                                        }`}
                                                                >
                                                                    {scope.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {promoScope === 'SELECTED' && selectedPromoItems.length === 0 && (
                                                            <p className="text-[11px] text-[#F97316] mt-2 italic">* Please select items above to apply discount</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Payment Methods */}
                                                <div className="mb-6">
                                                    <h4 className="text-[14px] font-[500] text-[#383E49] mb-3">Payment Method</h4>
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
                                                                            setFreeMealReason('');
                                                                            setStaffId('');
                                                                            setStaffReason('');
                                                                        }}
                                                                        className={`p-3 border rounded-lg text-left transition-colors flex items-center gap-3 ${paymentMethod === config.key
                                                                            ? 'border-[#0F50AA] bg-[#0F50AA]/5'
                                                                            : 'border-[#E4E6EA] hover:border-[#0F50AA]/30'
                                                                            }`}
                                                                    >
                                                                        <Icon size={16} className={config.color} />
                                                                        <span className="text-[14px]">{method.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* Payment Method Specific Fields */}
                                                {paymentMethod === 'cash' && !isFreeMeal && (
                                                    <div className="mb-6">
                                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Cash Received *</label>
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
                                                                        processPayment(true); // prints invoice, like pressing "Print Invoice"
                                                                    } else {
                                                                        toast.error('Enter valid cash amount');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                        />
                                                        {cashReceived && parseFloat(cashReceived) >= total && (
                                                            <div className="mt-2 p-2 bg-[#DDFFE0] rounded-lg">
                                                                <p className="text-[14px] text-[#199D26]">Change: Rs. {calculateChange().toLocaleString()}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {paymentMethod === 'card' && !isFreeMeal && (
                                                    <div className="mb-6">
                                                        <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Transaction Reference *</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter card transaction reference"
                                                            value={cardRef}
                                                            onChange={(e) => setCardRef(e.target.value)}
                                                            className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {paymentMethod === 'bank' && !isFreeMeal && (
                                                    <div className="mb-6 space-y-3">
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Bank Name *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter bank name"
                                                                value={bankName}
                                                                onChange={(e) => setBankName(e.target.value)}
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Transaction Reference *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter transaction reference"
                                                                value={bankRef}
                                                                onChange={(e) => setBankRef(e.target.value)}
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {isFreeMeal && (
                                                    <div className="mb-6">
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
                                                )}

                                                {paymentMethod === 'staff' && !isFreeMeal && (
                                                    <div className="mb-6 space-y-3">
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Staff ID *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter staff ID"
                                                                value={staffId}
                                                                onChange={(e) => setStaffId(e.target.value)}
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Reason (Optional)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Optional reason"
                                                                value={staffReason}
                                                                onChange={(e) => setStaffReason(e.target.value)}
                                                                className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:border-[#0F50AA] focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Order Channel Selection Checkboxes */}
                                                <div className="mb-6">
                                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Order Channel (Optional)</label>
                                                    <div className="flex gap-4 p-3 border border-[#E4E6EA] rounded-lg bg-[#F8F9FA]">
                                                        {[
                                                            { id: 'UBER', label: 'Uber' },
                                                            { id: 'PICKME', label: 'PickMe' },
                                                            { id: 'OTHER', label: 'Other' }
                                                        ].map(option => (
                                                            <label key={option.id} className="flex items-center gap-2 cursor-pointer text-[14px] text-[#383E49] font-[500]">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={deliveryOption === option.id}
                                                                    onChange={() => {
                                                                        setDeliveryOption(deliveryOption === option.id ? null : option.id);
                                                                    }}
                                                                    className="w-4 h-4 text-[#0F50AA] border-gray-300 rounded focus:ring-[#0F50AA] cursor-pointer"
                                                                />
                                                                {option.label}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>


                                            </>
                                        );
                                    })()}
                                </div>

                                <div>

                                    {/* Order Summary */}
                                    <div className="mb-6 p-4 bg-[#F8F9FA] rounded-lg">
                                        <h4 className="text-[14px] font-[500] text-[#383E49] mb-2">Order Summary</h4>
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
                                                            className="w-3 h-3 accent-[#0F50AA]"
                                                        />
                                                    )}
                                                    <span className="flex-1 text-[#667085]">{item.quantity}x {item.name}</span>
                                                    <span className="text-[#383E49]">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-[#E4E6EA] pt-2 pb-2">
                                            <div className="flex justify-between text-[14px]">
                                                <span className="text-[#667085]">Subtotal:</span>
                                                <span className="text-[#383E49]">Rs. {subtotal.toLocaleString()}</span>
                                            </div>

                                            <div className="flex justify-between text-[14px]">
                                                <span className="text-[#667085]">Discount:</span>
                                                <span className="text-[#383E49]">Rs. {totalDiscount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-[#E4E6EA] pt-2">
                                            <div className="flex justify-between text-[16px] font-[600]">
                                                <span className="text-[#383E49]">Total:</span>
                                                <span className="text-[#0F50AA]">Rs. {total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Loyalty Section */}
                                    <div className="mb-6 p-4 border border-dashed border-[#0F50AA]/30 bg-[#F0F5FF]/40 rounded-lg">
                                        <h4 className="text-[14px] font-[600] text-[#383E49] mb-3 flex items-center gap-1.5">
                                            <Users size={16} className="text-[#0F50AA]" />
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
                                                        className="flex-1 px-3 py-1.5 border border-[#E4E6EA] rounded-lg text-[13px] outline-none focus:border-[#0F50AA] bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCustomerLookup}
                                                        disabled={lookupLoading || !customerPhone.trim()}
                                                        className="px-3 py-1.5 bg-[#0F50AA] hover:bg-[#0C438F] text-white text-[13px] font-[500] rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center min-w-[70px]"
                                                    >
                                                        {lookupLoading ? <Loader variant="inline" /> : "Verify"}
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-[#667085]">Enter registered mobile number to award/redeem points.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 text-[13px]">
                                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#E4E6EA]">
                                                    <div>
                                                        <p className="font-[600] text-[#383E49]">{customer.name}</p>
                                                        <p className="text-[11px] text-[#667085]">
                                                            {customer.contactNumber} {customer.idCardNumber ? `• NIC: ${customer.idCardNumber}` : ""}
                                                            {customer.idCardNumber && (() => {
                                                                const nicInfo = extractNicDetails(customer.idCardNumber);
                                                                return nicInfo ? ` • DOB: ${nicInfo.birthdate} (${nicInfo.gender})` : "";
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[11px] text-[#667085]">Points</p>
                                                        <p className="font-[700] text-[#F4A100] flex items-center gap-0.5 justify-end">
                                                            <Coins size={12} /> {customer.loyaltyPoints?.toFixed(3) || '0.000'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Redemption Checkbox */}
                                                {customer.loyaltyPoints >= 1000 ? (
                                                    <div className="p-2.5 bg-[#FFFDF5] border border-[#F4A100]/20 rounded-lg space-y-2">
                                                        <label className="flex items-center gap-2 font-[500] cursor-pointer text-[#383E49]">
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
                                                                className="w-4 h-4 accent-[#0F50AA] cursor-pointer"
                                                            />
                                                            Redeem 1000 Points (Rs. 1000.00 Discount)
                                                        </label>

                                                        {redeemPoints && !otpVerified && (
                                                            <div className="space-y-2 pt-1.5 border-t border-dashed border-[#F4A100]/20">
                                                                {!otpSent ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleSendOtp}
                                                                        className="w-full py-1.5 bg-[#F4A100] hover:bg-[#E09400] text-white text-[12px] font-[600] rounded-md transition-colors"
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
                                                                                className="flex-1 px-2.5 py-1 border border-[#E4E6EA] rounded text-[12px] bg-white"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleVerifyOtp}
                                                                                className="px-3 py-1 bg-[#199D26] hover:bg-[#14821E] text-white text-[12px] font-[600] rounded"
                                                                            >
                                                                                Verify
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-[11px] text-[#199D26]">✓ OTP sent to mobile. Enter code to confirm discount.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {otpVerified && (
                                                            <div className="text-[12px] text-[#199D26] font-[600] bg-green-50 p-2 rounded flex items-center gap-1.5">
                                                                <Check size={14} /> Point verification successful. Rs. 1000.00 discount applied!
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-[11px] text-[#667085] italic bg-white p-2 rounded border border-[#E4E6EA]">
                                                        * Needs at least 1000 points to redeem. Points to earn from this order: +{(total / 1000.0).toFixed(3)}
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCustomer}
                                                    className="text-[12px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
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
                                            className="flex-1 px-4 py-3 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors font-[500]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => processPayment(false)}
                                            disabled={!paymentMethod || (isFreeMeal && freeMealReason.trim().length < 10)}
                                            className="flex-1 px-4 py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors disabled:bg-[#E4E6EA] disabled:text-[#667085] flex items-center justify-center gap-2 font-[500]"
                                        >
                                            <Receipt size={16} />
                                            Complete Sale
                                        </button>
                                        <button
                                            onClick={() => processPayment(true)}
                                            disabled={!paymentMethod || (isFreeMeal && freeMealReason.trim().length < 10)}
                                            className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors disabled:bg-[#E4E6EA] disabled:text-[#667085] flex items-center justify-center gap-2 font-[500]"
                                        >
                                            <Receipt size={16} />
                                            Print Invoice
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quantity Input Modal */}
            {showQtyModal && pendingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-6">
                            <h3 className="text-[16px] font-[600] text-[#383E49] mb-1">{pendingProduct.name}</h3>
                            <p className="text-[13px] text-[#667085] mb-1">{pendingProduct.code}</p>
                            <p className="text-[14px] font-[600] text-[#0F50AA] mb-4">Rs. {pendingProduct.price} each</p>
                            <p className="text-[12px] text-[#667085] mb-4">Stock available: {pendingProduct.stock}</p>

                            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">Quantity</label>
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
                                className="w-full px-3 py-3 border border-[#E4E6EA] rounded-lg text-[18px] font-[600] text-center focus:border-[#0F50AA] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]/10"
                            />
                            <p className="text-[11px] text-[#667085] mt-2 text-center">Press Enter to add · Esc to cancel</p>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowQtyModal(false);
                                        setTimeout(() => searchInputRef.current?.focus(), 50);
                                    }}
                                    className="flex-1 px-4 py-2 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmQtyModal}
                                    className="flex-1 px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] font-[500]"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">Insufficient Stock</h3>
                            <p className="text-[14px] text-[#667085] mb-6">Not enough stock available for <strong>{insufficientItem}</strong></p>
                            <button
                                onClick={() => setShowInsufficientStock(false)}
                                className="w-full px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiter Discount Modal */}
            {showWaiterDiscountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                        <div className="p-6">
                            <h3 className="text-[18px] font-[600] text-[#383E49] mb-4">Apply Waiter Discount</h3>

                            <div className="mb-4">
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Discount Amount (Rs.)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={selectedSubTotal}
                                    step="0.01"
                                    value={waiterDiscountAmount}
                                    onChange={(e) => setWaiterDiscountAmount(e.target.value)}
                                    placeholder="Enter discount amount"
                                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:border-[#0F50AA] focus:outline-none"
                                />
                                <p className="text-[11px] text-[#667085] mt-1">Maximum discount: Rs. {selectedSubTotal.toLocaleString()}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-1">Discount Reason</label>
                                <textarea
                                    value={waiterDiscountReason}
                                    onChange={(e) => setWaiterDiscountReason(e.target.value)}
                                    placeholder="Enter reason for discount..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg focus:border-[#0F50AA] focus:outline-none resize-none text-[14px]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowWaiterDiscountModal(false);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA] transition-colors"
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
                                        setShowWaiterDiscountModal(false);
                                        toast.success("Discount applied");
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] font-[500] transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Hidden Print Receipt Template */}
            {printData && (
                <div id="print-receipt" className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-black font-mono w-[80mm] text-xs">
                    <style dangerouslySetInnerHTML={{
                        __html: `
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

                    {/* Main Receipt Content (Rendered only if printBill is true) */}
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
                                        {printData.transactionId && <div>Bill ID: {printData.transactionId}</div>}
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
                                        {printData.type === 'PROFORMA'
                                            ? 'THIS IS A PROFORMA INVOICE. PLEASE SETTLE AT CASHIER TO GENERATE THE TAX INVOICE.'
                                            : 'THANK YOU! COME AGAIN.'
                                        }
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Separate KOT Token Slips for Each KOT Item */}
                    {printData.kotItems && printData.kotItems.length > 0 && printData.kotItems.map((item, idx) => (
                        <div key={idx} className={`${(printData.printBill !== false || idx > 0) ? 'page-break pt-4' : 'pt-2'}`}>
                            <div className="text-center font-bold text-sm mb-0.5">KITCHEN ORDER TICKET (KOT)</div>
                            <div className="text-center text-[10px] font-bold mb-1">SLIP #{idx + 1} OF {printData.kotItems.length}</div>
                            <div className="text-center text-[10px] mb-2">ANURADHAPURA OUTLET</div>
                            <div className="border-t border-dashed my-1"></div>
                            <div className="text-[10px] space-y-0.5 mb-2">
                                <div>Date: {new Date().toLocaleDateString()} Time: {new Date().toLocaleTimeString()}</div>
                                {printData.transactionId && <div>Txn ID: {printData.transactionId}</div>}
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

            {/* Customer Registration Modal */}
            {showRegModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-[#E4E6EA] bg-[#F8F9FA] flex justify-between items-center">
                            <h3 className="font-[600] text-[15px] text-[#383E49] flex items-center gap-1.5">
                                <User size={18} className="text-[#0F50AA]" />
                                Register Customer
                            </h3>
                            <button
                                onClick={() => setShowRegModal(false)}
                                className="text-[#667085] hover:bg-gray-100 p-1 rounded transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handlePOSRegisterCustomer}>
                            <div className="p-5 space-y-4">
                                {regError && (
                                    <div className="p-2.5 bg-red-50 border border-red-200 rounded text-[12px] text-red-600 font-[500]">
                                        {regError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[12px] font-[500] text-[#383E49] mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter full name"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] outline-none focus:border-[#0F50AA] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-[500] text-[#383E49] mb-1">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled
                                        value={customerPhone}
                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-[500] text-[#383E49] mb-1">ID Card Number (NIC) (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter identity card number"
                                        value={regNIC}
                                        onChange={(e) => setRegNIC(e.target.value)}
                                        className="w-full px-3 py-2 border border-[#E4E6EA] rounded-lg text-[13px] outline-none focus:border-[#0F50AA] bg-white"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-[#F8F9FA] border-t border-[#E4E6EA] flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRegModal(false)}
                                    className="px-3 py-1.5 border border-[#E4E6EA] text-[#667085] hover:bg-white rounded text-[13px] font-[500] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-[#0F50AA] text-white hover:bg-[#0C438F] rounded text-[13px] font-[500] transition-colors"
                                >
                                    Register & Verify
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
