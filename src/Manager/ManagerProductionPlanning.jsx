import {
  CheckCircle,
  Check,
  Clock,
  Copy,
  Factory,
  History,
  Package,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";

export default function ManagerProductionPlanning() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Production Planning");


  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showLoadPlanModal, setShowLoadPlanModal] = useState(false);
  const [showRawMaterialModal, setShowRawMaterialModal] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [submittedPlanData, setSubmittedPlanData] = useState(null);
  const [draftPlanId, setDraftPlanId] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [planName, setPlanName] = useState("");
  const [planNameError, setPlanNameError] = useState("");
  const [planDate, setPlanDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [isExecutionMode, setIsExecutionMode] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);

  const [productionPlans, setProductionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Outlets from backend
  const [outlets, setOutlets] = useState([]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [outletsError, setOutletsError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [distributions, setDistributions] = useState([]);
  // Distribution quantities state
  const [distributionQty, setDistributionQty] = useState({});
  const [viewMode, setViewMode] = useState("dashboard"); // dashboard, create, execution
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showOutletDistributionModal, setShowOutletDistributionModal] =
    useState(false);
  const [selectedProductForDistribution, setSelectedProductForDistribution] =
    useState(null);
  const [outletDistributions, setOutletDistributions] = useState({}); // {productId: [{outletId, qty, outletName}]}
  const [tempOutletId, setTempOutletId] = useState("");
  const [tempQty, setTempQty] = useState("");
  const [showViewPlanModal, setShowViewPlanModal] = useState(false);
  const [selectedPlanForView, setSelectedPlanForView] = useState(null);

  // Custom Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showNotification = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Open outlet distribution modal
  const startNewPlan = () => {
    if (currentPlan.productionItems.length > 0 && !window.confirm("Are you sure you want to start a new plan? Current changes will be lost.")) {
      return;
    }
    setCurrentPlan({
      id: null,
      planName: "",
      planDate: new Date().toISOString().split("T")[0],
      status: "draft",
      productionItems: [],
      rawMaterials: [],
    });
    setPlanName("");
    setPlanNameError("");
    setPlanDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsExecutionMode(false);
    setIsTemplate(false);
    setOutletDistributions({});
    setDraftPlanId(null);
    setShowComparisonModal(false);
    setComparisonData(null);
    // NOTE: Do NOT clear availableProducts here — we keep the fetched list for the modal
    setViewMode("create");
    console.log("Started a new production plan (Template Mode)");
  };

  const openOutletDistributionModal = (product) => {
    setSelectedProductForDistribution(product);
    setShowOutletDistributionModal(true);
  };

  // Get total distributed quantity for a product
  const getTotalDistributedQty = (productId) => {
    const distributions = outletDistributions[productId] || [];
    return distributions.reduce((sum, dist) => sum + dist.qty, 0);
  };

  // Get remaining quantity for outlet distribution
  const getRemainingQtyForDistribution = (product) => {
    const totalQty = viewMode === "execution" ? (product.executionQuantity ?? product.quantity) : product.quantity;
    return totalQty - getTotalDistributedQty(product.productId);
  };

  // Add outlet distribution
  const addOutletDistribution = () => {
    console.log("Button clicked!"); // Add this first
    console.log("tempOutletId:", tempOutletId);
    console.log("tempQty:", tempQty);

    if (!tempOutletId || !tempQty || tempQty <= 0) {
      console.log("Validation failed: missing outlet or quantity");
      showNotification("Please select outlet and enter valid quantity", "error");
      return;
    }

    const selectedOutlet = outlets.find(
      (outlet) => outlet.outletId == tempOutletId
    );
    console.log("selectedOutlet:", selectedOutlet);

    if (!selectedOutlet) {
      console.log("Outlet not found");
      showNotification("Outlet not found", "error");
      return;
    }

    const remaining = getRemainingQtyForDistribution(
      selectedProductForDistribution
    );
    console.log("remaining:", remaining);

    if (parseInt(tempQty) > remaining) {
      showNotification(`Cannot exceed remaining quantity of ${remaining}`, "error");
      return;
    }

    console.log("Adding distribution..."); // This should show if function reaches here

    const newDistribution = {
      outletId: selectedOutlet.outletId,
      outletName: selectedOutlet.name,
      qty: parseInt(tempQty),
    };

    setOutletDistributions((prev) => ({
      ...prev,
      [selectedProductForDistribution.productId]: [
        ...(prev[selectedProductForDistribution.productId] || []),
        newDistribution,
      ],
    }));

    setTempOutletId("");
    setTempQty("");

    console.log("Distribution added successfully");
  };

  // Remove outlet distribution
  const removeOutletDistribution = (productId, index) => {
    setOutletDistributions((prev) => ({
      ...prev,
      [productId]: prev[productId].filter((_, i) => i !== index),
    }));
  };

  // Fetch production plans from backend
  useEffect(() => {
    const fetchProductionPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/production-plans`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const plans = await response.json();

        // Filter for APPROVED and SUBMITTED plans that are NOT templates
        const approvedPlans = plans.filter(
          (plan) => (plan.status === "APPROVED" || plan.status === "SUBMITTED") && !plan.isTemplate
        );

        setProductionPlans(approvedPlans);
      } catch (err) {
        console.error("Error fetching production plans:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductionPlans();
  }, []);

  // Fetch outlets from backend
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setOutletsLoading(true);
        setOutletsError(null);

        const baseUrl = process.env.REACT_APP_BASE_URL;
        console.log(`[fetchOutlets] Base URL: ${baseUrl}`);
        
        const token = localStorage.getItem("authToken");
        console.log(`[fetchOutlets] authToken present: ${!!token}`);
        
        const response = await fetch(
          `${baseUrl}/api/manager/distribution/outlets`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("[fetchOutlets] Response status:", response.status);


        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorText = await response.text();
            console.log("Error response body:", errorText);
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch (textError) {
            console.log("Could not read error response as text:", textError);
          }

          // For now, use fallback data instead of throwing error
          console.warn("Using fallback outlet data due to backend error");
          const fallbackOutlets = [
            {
              outletId: 1,
              name: "Main Branch",
              address: "Colombo 03",
            },
            { outletId: 2, name: "Kandy Outlet", address: "Kandy" },
            { outletId: 3, name: "Galle Branch", address: "Galle" },
            { outletId: 4, name: "Negombo Store", address: "Negombo" },
            { outletId: 5, name: "Matara Outlet", address: "Matara" },
          ];
          setOutlets(fallbackOutlets);
          setOutletsError(
            "Using fallback data - Backend error: " + errorMessage
          );
          return;
        }

        const outletsData = await response.json();
        console.log("Outlet data structure:", outletsData);
        console.log("First outlet object:", outletsData[0]);
        setOutlets(outletsData);
        setOutletsError(null); // Clear any previous errors
      } catch (err) {
        console.error("Error fetching outlets:", err);

        // Use fallback data on network errors too
        console.warn("Using fallback outlet data due to network error");
        const fallbackOutlets = [
          { outletId: 1, name: "Main Branch", address: "Colombo 03" },
          { outletId: 2, name: "Kandy Outlet", address: "Kandy" },
          { outletId: 3, name: "Galle Branch", address: "Galle" },
          { outletId: 4, name: "Negombo Store", address: "Negombo" },
          { outletId: 5, name: "Matara Outlet", address: "Matara" },
        ];
        setOutlets(fallbackOutlets);
        setOutletsError("Using fallback data - Network error: " + err.message);
      } finally {
        setOutletsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  // Get selected production plan
  const getSelectedPlan = () => {
    return productionPlans.find((plan) => plan.id == selectedPlan);
  };

  // Get selected outlet
  const getSelectedOutlet = () => {
    return outlets.find((outlet) => outlet.outletId == selectedOutlet);
  };

  // Handle distribution quantity change
  const handleQuantityChange = (productId, quantity) => {
    setDistributionQty((prev) => ({
      ...prev,
      [productId]: Math.max(0, parseInt(quantity) || 0),
    }));
  };

  // Calculate remaining quantity for a product
  const getRemainingQty = (product) => {
    const distributed = distributionQty[product.id] || 0;
    return Math.max(0, product.quantity - distributed);
  };

  // Check if distribution is valid
  const isDistributionValid = () => {
    if (!selectedPlan || !selectedOutlet) return false;

    const plan = getSelectedPlan();
    if (!plan) return false;

    // Check if any quantity is distributed
    const hasDistribution = Object.values(distributionQty).some(
      (qty) => qty > 0
    );
    if (!hasDistribution) return false;

    // Check if any quantity exceeds available
    return plan.productionItems.every((product) => {
      const distributed = distributionQty[product.id] || 0;
      return distributed <= product.quantity;
    });
  };

  // Handle save distribution
  const handleSaveDistribution = async () => {
    if (!isDistributionValid()) return;

    const plan = getSelectedPlan();
    const outlet = getSelectedOutlet();

    // Add null checks
    if (!plan) {
      showNotification("Please select a production plan", "error");
      return;
    }
    console.log(outlet);
    if (!outlet) {
      showNotification("Please select an outlet", "error");
      return;
    }

    // Prepare data for backend POST request
    const distributionData = {
      name: `${plan.planName || "Unknown Plan"} - ${outlet.name || "Unknown Outlet"
        }`,
      outletId: outlet.outletId,
      date: new Date().toISOString().split("T")[0],
      isActive: true,
      items: plan.productionItems
        .filter((product) => distributionQty[product.id] > 0)
        .map((product) => ({
          productId: product.productId,
          qty: distributionQty[product.id],
        })),
    };

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/distribution/plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(distributionData),
        }
      );
      console.log(distributionData);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Create local distribution object for UI display
      const newDistribution = {
        id: "DIST-" + Date.now(),
        planId: selectedPlan,
        planName: plan.planName,
        outletId: selectedOutlet,
        outletName: outlet.name,
        outletLocation: outlet.address,
        date: new Date().toISOString().split("T")[0],
        products: plan.productionItems
          .filter((product) => distributionQty[product.id] > 0)
          .map((product) => ({
            ...product,
            distributedQty: distributionQty[product.id],
            remainingQty: product.quantity - distributionQty[product.id],
          })),
        createdAt: new Date(),
        createdBy: "Manager A",
      };

      setDistributions((prev) => [...prev, newDistribution]);

      // Update remaining quantities in the selected plan
      const planIndex = productionPlans.findIndex((p) => p.id === selectedPlan);
      if (planIndex !== -1) {
        productionPlans[planIndex].productionItems.forEach((product) => {
          if (distributionQty[product.id] > 0) {
            product.quantity -= distributionQty[product.id];
          }
        });
      }

      // Reset form
      setDistributionQty({});
      setSelectedPlan("");
      setSelectedOutlet("");
      setShowSuccessModal(true);

      // Hide success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (err) {
      showNotification(`Error saving distribution plan: ${err.message}`, "error");
    }
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalPlans = productionPlans?.length || 0;
    const totalOutlets = outlets?.length || 0;
    const totalDistributions = distributions?.length || 0;
    const totalProducts =
      productionPlans?.reduce(
        (sum, plan) => sum + (plan.productionItems?.length || 0),
        0
      ) || 0;
    const distributedProducts =
      distributions?.reduce(
        (sum, dist) => sum + (dist.products?.length || 0),
        0
      ) || 0;

    return {
      totalPlans,
      totalOutlets,
      totalDistributions,
      totalProducts,
      distributedProducts,
    };
  };

  const summaryStats = getSummaryStats();

  // Current plan state
  const [currentPlan, setCurrentPlan] = useState({
    id: null,
    planName: "",
    planDate: new Date().toISOString().split("T")[0],
    productionItems: [],
    status: "draft",
  });

  // Available products from backend
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Previous plans from backend for loading
  const [previousPlans, setPreviousPlans] = useState([]);
  const [previousPlansLoading, setPreviousPlansLoading] = useState(false);

  // Fetch templates & previous plans from backend
  const fetchTemplates = async () => {
    try {
      setPreviousPlansLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/production-plan/templates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      let templates = await response.json();
      if (!templates || templates.length === 0) {
        // Fallback to all production plans if no template-specific plans found
        const resAll = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/production-plans`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resAll.ok) {
          templates = await resAll.json();
        }
      }
      setPreviousPlans(templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      showNotification("Failed to load templates. Please try again.", "error");
    } finally {
      setPreviousPlansLoading(false);
    }
  };

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const baseUrl = process.env.REACT_APP_BASE_URL;
        console.log(`[fetchProducts] Base URL: ${baseUrl}`);
        console.log(`[fetchProducts] Fetching products from: ${baseUrl}/api/manager/products`);

        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${baseUrl}/api/manager/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} at ${baseUrl}/api/manager/products`);
        }
        console.log("Fetching products from backend... SUCCESS");
        const products = await response.json();
        setAvailableProducts(products);
        console.log("Products received:", products.length);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        showNotification(`Failed to load products: ${error.message}`, "error");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Production centers mapping
  const productionCenterMapping = {
    Bakery: "Main Bakery Kitchen",
    Kitchen: "Central Kitchen",
    Store: "Main Store",
  };

  // Production centers and product types
  const productionCenterList = [
    "All",
    "Bakery",
    "Kitchen",
  ];

  // Note: Production center IDs are now handled by the backend or rely on IDs from the product data
  const productionCenterIdMapping = {
    Bakery: null,
    Kitchen: null,
  };

  const productTypes = ["All", "Product", "Semi-Finished", "Oilman", "raw_material"];

  // Helper to get unit of measure for an item
  const getItemUnit = (item) => {
    if (!item) return "pcs";
    if (item.unitOfMeasure) return item.unitOfMeasure;
    if (item.unit) return item.unit;
    const availProd = availableProducts.find(
      (p) => p.id === item.productId || p.id === item.id || (p.code && p.code === item.productCode)
    );
    if (availProd?.unitOfMeasure) return availProd.unitOfMeasure;
    if (availProd?.unit) return availProd.unit;
    return "pcs";
  };

  // Add product to plan
  const addProductToPlan = (product, quantity) => {
    const freshProductData = availableProducts.find((p) => p.id === (product.id || product.productId));
    const newItem = {
      id: Date.now(),
      productId: product.id || product.productId,
      productName: product.name || product.productName,
      productCode: product.code || product.productCode,
      category: product.category,
      description: product.description,
      unitPrice: product.unitPrice,
      unitOfMeasure: product.unitOfMeasure || product.unit || freshProductData?.unitOfMeasure || freshProductData?.unit || "pcs",
      productionCenters: product.productionCenters,
      miniStoreAvailability: freshProductData?.miniStoreAvailability || product.miniStoreAvailability || [],
      outletAvailability: freshProductData?.outletAvailability || product.outletAvailability || [],
      isActive: product.isActive,
      quantity: parseInt(quantity),
      addedAt: new Date().toISOString(),
    };

    const updatedItems = [...currentPlan.productionItems, newItem];
    setCurrentPlan((prev) => ({
      ...prev,
      productionItems: updatedItems,
    }));

    setShowAddProductModal(false);
  };

  // Remove item from plan
  const removeFromPlan = (itemId) => {
    const updatedItems = currentPlan.productionItems.filter(
      (item) => item.id !== itemId
    );
    setCurrentPlan((prev) => ({
      ...prev,
      productionItems: updatedItems,
    }));
  };

  // Update quantity
  const updateQuantity = (itemId, newQuantity) => {
    const updatedItems = currentPlan.productionItems.map((item) =>
      item.id === itemId ? { ...item, quantity: parseInt(newQuantity) } : item
    );
    setCurrentPlan((prev) => ({
      ...prev,
      productionItems: updatedItems,
    }));
  };

  // Update destination production center for raw materials
  const updateDestinationCenter = (itemId, destinationCenter) => {
    const updatedItems = currentPlan.productionItems.map((item) =>
      item.id === itemId
        ? { ...item, destinationProductionCenter: destinationCenter }
        : item
    );
    setCurrentPlan((prev) => ({
      ...prev,
      productionItems: updatedItems,
    }));
  };

  // Save as draft (persist to backend with DRAFT status)
  const saveDraft = async () => {
    if (!planName || !planName.trim()) {
      setPlanNameError("Plan Name is required");
      showNotification("Plan Name is required", "error");
      return;
    }
    setPlanNameError("");

    if (currentPlan.productionItems.length === 0) {
      showNotification("Please add at least one product to the production plan", "error");
      return;
    }

    const requestBody = {
      planName: planName.trim(),
      planDate: new Date(planDate).toISOString(),
      notes:
        notes ||
        "Production plan for end-of-month bakery items with shared raw materials",
      status: "APPROVED",
      department: null,
      isTemplate: isTemplate,
      productionItems: currentPlan.productionItems.map((item) => {
        // For raw materials, use destination center; for products, use first available center or default
        let productionCenterId = null;
        if (item.isRawMaterial && item.destinationProductionCenter) {
          productionCenterId =
            productionCenterIdMapping[item.destinationProductionCenter] || null;
        } else if (
          item.productionCenters &&
          item.productionCenters.length > 0
        ) {
          // For regular products, use the first production center
          productionCenterId = item.productionCenters[0].id;
        }

        return {
          productId: item.productId,
          productName: item.productName,
          quantity: viewMode === "execution" ? (item.executionQuantity ?? item.quantity) : item.quantity,
          productionCenterId: productionCenterId,
          type:
            item.category === "raw_material" || item.isRawMaterial
              ? "raw_material"
              : "product",
        };
      }),
    };

    console.log("DEBUG: Saving Draft - Production Plan Request Body:", JSON.stringify(requestBody, null, 2));

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/production-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setCurrentPlan((prev) => ({ ...prev, status: "draft" }));
      showNotification("Production plan saved as draft successfully!", "success");
    } catch (error) {
      console.error("Failed to save draft:", error);
      showNotification("Failed to save draft. Please try again.", "error");
    }
  };

  // Store pending plan request payload while previewing availability modal
  const [pendingPlanPayload, setPendingPlanPayload] = useState(null);

  // Submit/Finalize plan - previews material requirements first and opens modal
  const submitPlan = async () => {
    if (!planName || !planName.trim()) {
      setPlanNameError("Plan Name is required");
      showNotification("Plan Name is required", "error");
      return;
    }
    setPlanNameError("");

    if (currentPlan.productionItems.length === 0) {
      showNotification("Please add at least one product to the production plan", "error");
      return;
    }

    // Validate that raw materials have destination centers selected
    const rawMaterialsWithoutDestination = currentPlan.productionItems.filter(
      (item) =>
        item.isRawMaterial &&
        (!item.destinationProductionCenter ||
          item.destinationProductionCenter === "")
    );

    if (rawMaterialsWithoutDestination.length > 0) {
      showNotification("Please select destination production center for all raw materials before submitting.", "error");
      return;
    }

    // Build request payload with APPROVED status so plan is immediately visible & actionable
    const requestBody = {
      planName: planName.trim(),
      planDate: new Date(planDate).toISOString(),
      notes:
        notes ||
        "Production plan for end-of-month bakery items with shared raw materials",
      status: "APPROVED",
      department: null,
      isTemplate: isTemplate,
      productionItems: currentPlan.productionItems.map((item) => {
        const isRawMaterial =
          item.category === "raw_material" || item.isRawMaterial;

        let productionCenterId = null;
        if (isRawMaterial && item.destinationProductionCenter) {
          productionCenterId =
            productionCenterIdMapping[item.destinationProductionCenter] || null;
        } else if (
          item.productionCenters &&
          item.productionCenters.length > 0
        ) {
          productionCenterId = item.productionCenters[0].id;
        }

        const itemRes = {
          type: isRawMaterial ? "raw_material" : "product",
          productName: item.productName,
          quantity: viewMode === "execution" ? (item.executionQuantity ?? item.quantity) : item.quantity,
          productionCenterId: isRawMaterial ? null : productionCenterId,
        };

        if (isRawMaterial) {
          itemRes.rawMaterialId = item.productId;
        } else {
          itemRes.productId = item.productId;
        }

        return itemRes;
      }),
    };

    setPendingPlanPayload(requestBody);

    const baseUrl = process.env.REACT_APP_BASE_URL;
    const token = localStorage.getItem("authToken");

    try {
      console.log(`[submitPlan] Requesting material availability preview at: ${baseUrl}/api/manager/production-plan/preview-materials`);
      const response = await fetch(
        `${baseUrl}/api/manager/production-plan/preview-materials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error("Server error response body:", errorBody);
        } catch (e) {
          console.error("Could not read error body");
        }
        throw new Error(`Server error: ${response.status}${errorBody ? " - " + errorBody : ""}`);
      }

      let result = await response.json();
      console.log("Material preview fetched successfully:", result);

      setComparisonData(result);
      setShowComparisonModal(true);
    } catch (error) {
      console.error("Failed to preview plan materials:", error);
      showNotification(`Failed to preview plan materials: ${error.message}`, "error");
    }
  };

  // Finalize approval of the draft plan
  const approvePlan = async () => {
    const payload = pendingPlanPayload;
    if (!payload) {
      showNotification("No pending plan to submit", "error");
      return;
    }

    const baseUrl = process.env.REACT_APP_BASE_URL;
    const token = localStorage.getItem("authToken");

    try {
      console.log(`[approvePlan] Submitting production plan to: ${baseUrl}/api/manager/production-plan`);
      let response;
      if (draftPlanId) {
        response = await fetch(
          `${baseUrl}/api/manager/production-plan/${draftPlanId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(
          `${baseUrl}/api/manager/production-plan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error("Server error response body:", errorBody);
        } catch (e) {
          console.error("Could not read error body");
        }
        throw new Error(`Server error: ${response.status}${errorBody ? " - " + errorBody : ""}`);
      }

      const result = await response.json();
      console.log("Plan submitted and approved successfully:", result);

      setShowComparisonModal(false);
      setSubmittedPlanData(result);
      const finalPlanId = result.planId || result.id;
      setCurrentPlan((prev) => ({ ...prev, id: finalPlanId, status: "approved" }));
      setDraftPlanId(null);
      setPendingPlanPayload(null);
      setShowConfirmationPopup(true);
    } catch (error) {
      console.error("Failed to approve plan:", error);
      showNotification(`Failed to approve plan: ${error.message}`, "error");
    }
  };

  // Load previous plan
  const loadPreviousPlan = (plan) => {
    const loadedItems = (plan.productionItems || []).map((item) => {
      // Find the latest stock data for this product
      const liveProduct = availableProducts.find(p => p.id === item.productId);
      
      return {
        id: Date.now() + Math.random(),
        productId: item.productId,
        productName: item.productName || item.name,
        productCode: item.productCode || item.code,
        category: item.category,
        description: item.description,
        unitPrice: item.unitCost || item.unitPrice,
        unitOfMeasure: item.unitOfMeasure || item.unit || liveProduct?.unitOfMeasure || liveProduct?.unit || "pcs",
        productionCenters: item.productionCenters || [],
        // Use live stock data if found, otherwise fallback to saved data
        miniStoreAvailability: liveProduct?.miniStoreAvailability || item.miniStoreAvailability || [],
        outletAvailability: liveProduct?.outletAvailability || item.outletAvailability || [],
        isActive: item.isActive || true,
        quantity: item.quantity,
        addedAt: new Date().toISOString(),
        // Add raw material properties
        isRawMaterial:
          item.category === "raw_material" || item.type === "raw_material",
        destinationProductionCenter: item.isRawMaterial
          ? Object.keys(productionCenterIdMapping).find(
            (key) => productionCenterIdMapping[key] === item.productionCenterId
          ) || ""
          : null,
      };
    });

    // Auto-load coupled distribution plans if they exist
    const newOutletDistributions = {};
    if (plan.distributionPlans && plan.distributionPlans.length > 0) {
      plan.distributionPlans.forEach(dp => {
        if (dp.items && dp.items.length > 0) {
          dp.items.forEach(dpi => {
            if (!newOutletDistributions[dpi.productId]) {
              newOutletDistributions[dpi.productId] = [];
            }
            newOutletDistributions[dpi.productId].push({
              outletId: dp.outletId,
              outletName: dp.outletName,
              qty: dpi.qty
            });
          });
        }
      });
    }

    setOutletDistributions(newOutletDistributions);
    setIsTemplate(plan.isTemplate || false);
    setCurrentPlan({
      ...plan,
      productionItems: loadedItems,
    });
    setPlanName(plan.planName || "");
    setPlanDate(plan.planDate ? plan.planDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(plan.notes || "");
    setViewMode("execution");
  };

  // Clone and Reuse an existing production plan
  const cloneAndReusePlan = async (plan) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      let fullPlan = plan;
      // Fetch details if items are missing
      if (!plan.productionItems || plan.productionItems.length === 0) {
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/production-plans/${plan.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          fullPlan = await res.json();
        }
      }

      const loadedItems = (fullPlan.productionItems || []).map((item) => {
        const liveProduct = availableProducts.find(
          (p) => p.id === item.productId
        );
        const isRawMat =
          item.category === "raw_material" || item.type === "raw_material";
        return {
          id: Date.now() + Math.random(),
          productId: item.productId || item.rawMaterialId,
          productName: item.productName || item.name || "",
          productCode: item.productCode || item.code || "",
          category: item.category || (isRawMat ? "raw_material" : "Product"),
          description: item.description || "",
          unitPrice: item.unitCost || item.unitPrice || 0,
          unitOfMeasure: item.unitOfMeasure || item.unit || liveProduct?.unitOfMeasure || liveProduct?.unit || "pcs",
          productionCenters: item.productionCenters || [],
          miniStoreAvailability:
            liveProduct?.miniStoreAvailability ||
            item.miniStoreAvailability ||
            [],
          outletAvailability:
            liveProduct?.outletAvailability || item.outletAvailability || [],
          isActive: item.isActive ?? true,
          quantity: item.quantity || 1,
          addedAt: new Date().toISOString(),
          isRawMaterial: isRawMat,
          destinationProductionCenter: isRawMat
            ? Object.keys(productionCenterIdMapping).find(
                (key) =>
                  productionCenterIdMapping[key] === item.productionCenterId
              ) || ""
            : null,
        };
      });

      const newOutletDistributions = {};
      if (fullPlan.distributionPlans && fullPlan.distributionPlans.length > 0) {
        fullPlan.distributionPlans.forEach((dp) => {
          if (dp.items && dp.items.length > 0) {
            dp.items.forEach((dpi) => {
              if (!newOutletDistributions[dpi.productId]) {
                newOutletDistributions[dpi.productId] = [];
              }
              newOutletDistributions[dpi.productId].push({
                outletId: dp.outletId,
                outletName: dp.outletName,
                qty: dpi.qty,
              });
            });
          }
        });
      }

      setOutletDistributions(newOutletDistributions);
      setIsTemplate(false);
      const clonedName = fullPlan.planName ? `${fullPlan.planName} (Copy)` : "Cloned Plan";
      setCurrentPlan({
        id: null,
        planName: clonedName,
        planDate: new Date().toISOString().split("T")[0],
        status: "draft",
        productionItems: loadedItems,
      });
      setPlanName(clonedName);
      setPlanNameError("");
      setPlanDate(new Date().toISOString().split("T")[0]);
      setNotes(fullPlan.notes || "");
      setIsExecutionMode(false);
      setDraftPlanId(null);
      setShowComparisonModal(false);
      setComparisonData(null);
      setShowLoadPlanModal(false);
      setShowViewPlanModal(false);
      setSelectedPlanForView(null);
      setViewMode("create");

      showNotification(
        "Production plan cloned! You can now edit and save it as a new plan.",
        "success"
      );
    } catch (e) {
      console.error("Error cloning production plan:", e);
      showNotification("Error cloning plan: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete production plan
  const deletePlan = async (planId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/production-plan/${planId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Remove the deleted plan from the previousPlans state
      setPreviousPlans((prev) => prev.filter((plan) => plan.id !== planId));
      showNotification("Production plan deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete plan:", error);
      showNotification("Failed to delete plan. Please try again.", "error");
    }
  };

  // Add Product Modal
  const AddProductModal = ({ availableProducts, productsLoading, currentPlan, setCurrentPlan, productionCenterList, productTypes, isExecutionMode, setShowAddProductModal }) => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [activeProductionCenter, setActiveProductionCenter] =
      useState("All");
    const [activeProductType, setActiveProductType] = useState("All");
    const [addedItems, setAddedItems] = useState([]); // Track items added to the plan within this modal session
    const [expandedProducts, setExpandedProducts] = useState({});

    const toggleExpand = (productId) => {
      setExpandedProducts(prev => ({
        ...prev,
        [productId]: !prev[productId]
      }));
    };

    // Filter products by production center, product type, and search term
    const filteredProducts = availableProducts.filter((product) => {
      // For raw materials, they are available for all production centers
      const isRawMaterial =
        product.category === "raw_material" || product.type === "raw_material";

      // Check if product belongs to active production center (or is raw material)
      const matchesProductionCenter =
        activeProductionCenter === "All" ||
        isRawMaterial ||
        product.productionCenters?.some(
          (center) => {
            const centerName = String(center.centerName || "").toLowerCase();
            const filterName = activeProductionCenter.toLowerCase();
            // Allow partial matches (e.g. "Bakery" matches "Main Bakery Kitchen")
            return centerName.includes(filterName) || filterName.includes(centerName);
          }
        ) ||
        (product.productionCenterName &&
         String(product.productionCenterName).toLowerCase().includes(activeProductionCenter.toLowerCase()));

      // Check if product matches active product type (All = show everything)
      const matchesProductType =
        activeProductType === "All" ||
        (product.type && String(product.type).toLowerCase() === activeProductType.toLowerCase()) ||
        (product.category && String(product.category).toLowerCase() === activeProductType.toLowerCase());

      // Check search term safely
      const cleanSearch = searchTerm ? String(searchTerm).trim().toLowerCase() : "";
      if (!cleanSearch) {
        return matchesProductionCenter && matchesProductType;
      }

      const productName = String(product.name || product.productName || "").toLowerCase();
      const productCode = String(product.code || product.productCode || "").toLowerCase();
      const productDesc = String(product.description || "").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();
      const productType = String(product.type || "").toLowerCase();

      const matchesSearch =
        productName.includes(cleanSearch) ||
        productCode.includes(cleanSearch) ||
        productDesc.includes(cleanSearch) ||
        productCategory.includes(cleanSearch) ||
        productType.includes(cleanSearch);

      return matchesProductionCenter && matchesProductType && matchesSearch;
    });

    // Handle product selection/deselection
    const toggleProductSelection = (product) => {
      setSelectedProducts((prev) => {
        const isSelected = prev.find((p) => p.id === product.id);
        if (isSelected) {
          // Remove from selection
          const updated = prev.filter((p) => p.id !== product.id);
          // Remove from quantities as well
          setQuantities((prevQty) => {
            const newQty = { ...prevQty };
            delete newQty[product.id];
            return newQty;
          });
          return updated;
        } else {
          // Add to selection
          return [...prev, product];
        }
      });
    };

    // Handle quantity change
    const updateQuantity = (productId, quantity) => {
      setQuantities((prev) => ({
        ...prev,
        [productId]: quantity,
      }));
    };

    // Handle adding selected products to the plan (and modal's added items table)
    const handleAddSelectedProducts = () => {
      const newAddedItems = [];

      selectedProducts.forEach((product) => {
        // Robust check for raw material to match filtering logic
        const isRawMaterial =
          product.category === "raw_material" ||
          product.type === "raw_material";

        // Find fresh stock data from availableProducts global state
        const freshProductData = availableProducts.find(p => p.id === product.id);

        const newItem = {
          id: Date.now() + Math.random(),
          productId: product.id,
          productName: product.name || product.productName,
          productCode: product.code || product.productCode,
          category: product.category,
          description: product.description,
          unitPrice: product.unitPrice,
          productionCenters: product.productionCenters,
          // Use fresh stock data if available
          miniStoreAvailability: freshProductData?.miniStoreAvailability || product.miniStoreAvailability || [],
          outletAvailability: freshProductData?.outletAvailability || product.outletAvailability || [],
          isActive: product.isActive,
          quantity: 1, // Default quantity
          addedAt: new Date().toISOString(),
          // Add destination center for raw materials
          isRawMaterial: isRawMaterial,
          destinationProductionCenter: isRawMaterial ? "" : null,
        };

        // Add to main plan
        setCurrentPlan((prev) => ({
          ...prev,
          productionItems: [...prev.productionItems, newItem],
        }));

        // Add to modal's added items table
        newAddedItems.push(newItem);
      });

      // Update added items in modal
      setAddedItems((prev) => [...prev, ...newAddedItems]);

      // Reset selections for next batch
      setSelectedProducts([]);
      setQuantities({});

      // Show success message
      showNotification(`${newAddedItems.length} product(s) added to plan successfully!`, "success");
      handleCloseModal();
    };

    // Reset modal state when closed
    const handleCloseModal = () => {
      setSelectedProducts([]);
      setQuantities([]);
      setSearchTerm("");
      setActiveProductionCenter("All");
      setActiveProductType("All");
      setAddedItems([]);
      setShowAddProductModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
          <div className="p-6 border-b border-[#E4E6EA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-[20px] font-[600] text-[#383E49]">
                    Add Products to Plan
                  </h3>
                  <p className="text-[12px] text-[#667085] mt-1">
                    {activeProductionCenter} - {activeProductType}
                  </p>
                </div>
                {selectedProducts.length > 0 && (
                  <span className="px-3 py-1 bg-[#0F50AA] text-white text-[12px] rounded-full">
                    {selectedProducts.length} selected
                  </span>
                )}
                {addedItems.length > 0 && (
                  <span className="px-3 py-1 bg-[#199D26] text-white text-[12px] rounded-full">
                    {addedItems.length} added to plan
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#F0F1F3] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 pt-0">
            {/* Product Selection */}
            <div>
                {/* Production Center Tabs */}
                <div className="flex border-b border-[#E4E6EA] mb-4">
                  {productionCenterList.map((center) => (
                    <button
                      key={center}
                      onClick={() => {
                        setActiveProductionCenter(center);
                        if (center === "All") {
                          setActiveProductType("All"); // Show all types in All tab
                        } else {
                          setActiveProductType("Product"); // Reset to default for specific centers
                        }
                      }}
                      className={`px-6 py-3 text-[14px] font-[500] border-b-2 transition-colors ${activeProductionCenter === center
                        ? "border-[#0F50AA] text-[#0F50AA]"
                        : "border-transparent text-[#667085] hover:text-[#383E49]"
                        }`}
                    >
                      {center}
                    </button>
                  ))}
                </div>

                {/* Product Type Filter */}
                <div className="flex gap-2 mb-4">
                  {productTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveProductType(type)}
                      className={`px-4 py-2 text-[12px] font-[500] rounded-lg transition-colors ${activeProductType === type
                        ? "bg-[#0F50AA] text-white"
                        : "bg-[#F8F9FA] text-[#667085] hover:bg-[#E4E6EA]"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder={`Search ${activeProductionCenter} ${activeProductType} products...`}
                      className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {productsLoading ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <div className="text-[14px] text-[#667085]">
                        Loading products...
                      </div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <div className="text-[14px] text-[#667085]">
                        No {activeProductionCenter} {activeProductType} products
                        found
                      </div>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedProducts.find(
                        (p) => p.id === product.id
                      );
                      const isAlreadyAdded =
                        addedItems.find(
                          (item) => item.productId === product.id
                        ) ||
                        currentPlan.productionItems.find(
                          (item) => item.productId === product.id
                        );

                      const isExpanded = expandedProducts[product.id];

                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg transition-all ${isAlreadyAdded
                            ? "border-[#199D26] bg-green-50 opacity-75"
                            : isSelected
                              ? "border-[#0F50AA] bg-blue-50"
                              : "border-[#E4E6EA] hover:border-[#0F50AA]"
                            }`}
                        >
                          {/* Collapsed Header - always visible, clicking selects */}
                          <div
                            className="p-3 cursor-pointer"
                            onClick={() => !isAlreadyAdded && toggleProductSelection(product)}
                          >
                            <div className="flex items-start justify-between mb-0">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-[14px] font-[600] text-[#383E49]">
                                    {product.name || product.productName}
                                  </h4>
                                  {isSelected && (
                                    <CheckCircle
                                      size={16}
                                      className="text-[#0F50AA]"
                                    />
                                  )}
                                  {isAlreadyAdded && (
                                    <CheckCircle
                                      size={16}
                                      className="text-[#199D26]"
                                    />
                                  )}
                                </div>
                                <p className="text-[12px] text-[#667085]">
                                  Code: {product.code || product.productCode}
                                </p>

                                <p className="text-[12px] text-[#667085]">{product.description}</p>
                                <div className="text-[12px] text-[#667085] flex justify-between">
                                  <span>Unit Cost:</span>
                                  <span className="font-[500]">
                                    Rs. {product.unitPrice != null ? (typeof product.unitPrice === 'number' ? product.unitPrice.toFixed(2) : parseFloat(product.unitPrice).toFixed(2)) : "0.00"}
                                  </span>
                                </div>
                                {product.salePrice != null && product.salePrice !== product.unitPrice && (
                                  <div className="text-[12px] text-[#199D26] flex justify-between">
                                    <span>POS Price:</span>
                                    <span className="font-[600]">
                                      Rs. {product.salePrice != null ? (typeof product.salePrice === 'number' ? product.salePrice.toFixed(2) : parseFloat(product.salePrice).toFixed(2)) : "0.00"}
                                    </span>
                                  </div>
                                )}
                                <div className="text-[12px] text-[#0F50AA] flex justify-between mt-1 font-[600]">
                                  <span>Total Available:</span>
                                  <span>
                                    {(product.miniStoreAvailability?.reduce((sum, store) => sum + (parseFloat(store.availableQty) || 0), 0) || 0) +
                                     (product.outletAvailability?.reduce((sum, outlet) => sum + (outlet.availableQty || 0), 0) || 0)}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                {product.category}
                              </span>
                            </div>
                            {/* Production Centers */}
                            {product.productionCenters &&
                              product.productionCenters.length > 0 && (
                                <div className="">
                                  <span className="text-[14px] font-[600] text-[#383E49]">
                                    Production Centers:
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {product.productionCenters.map(
                                      (center, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px]"
                                        >
                                          {center.centerName}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                          </div>

                          {/* Expand / Collapse Button */}
                          {((product.miniStoreAvailability && product.miniStoreAvailability.length > 0) || 
                            (product.outletAvailability && product.outletAvailability.length > 0)) && (
                            <div
                              className="flex items-center justify-center py-1 border-t border-[#E4E6EA] cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(product.id);
                              }}
                            >
                              <span className="text-[10px] text-[#667085] mr-1">
                                {isExpanded ? 'Hide' : 'Store & Outlet Availability'}
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`text-[#667085] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          )}

                          {/* Expanded Store & Outlet Availability */}
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-[#E4E6EA] bg-white rounded-b-lg">
                              {product.miniStoreAvailability && product.miniStoreAvailability.length > 0 && (
                                <>
                                  <p className="text-[11px] font-[600] text-[#383E49] mt-2 mb-1">Store Availability:</p>
                                  <div className="grid grid-cols-1 gap-1 pl-2">
                                    {product.miniStoreAvailability.map((store, idx) => (
                                      <div key={idx} className="flex justify-between text-[10px]">
                                        <span className="text-[#667085]">{store.miniStoreName}:</span>
                                        <span className={`font-[500] ${store.availableQty > 0 ? "text-green-600" : "text-red-600"}`}>
                                          {store.availableQty}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                              {product.outletAvailability && product.outletAvailability.length > 0 && (
                                <>
                                  <p className="text-[11px] font-[600] text-[#383E49] mt-2 mb-1">Outlet Availability:</p>
                                  <div className="grid grid-cols-1 gap-1 pl-2">
                                    {product.outletAvailability.map((outlet, idx) => (
                                      <div key={idx} className="flex justify-between text-[10px]">
                                        <span className="text-[#667085]">{outlet.outletName}:</span>
                                        <span className={`font-[500] ${outlet.availableQty > 0 ? "text-green-600" : "text-red-600"}`}>
                                          {outlet.availableQty}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6 border-t border-[#E4E6EA] mt-6">
                  <div className="text-[14px] text-[#667085]">
                    {selectedProducts.length} product(s) selected
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddSelectedProducts}
                      className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] disabled:opacity-50"
                      disabled={selectedProducts.length === 0}
                    >
                    Add {selectedProducts.length} Products to Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  };

  // Load Previous Plan Modal
  const LoadPlanModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95%] overflow-y-auto">
        <div className="p-6 border-b border-[#E4E6EA]">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-[600] text-[#383E49]">
              Load Previous Plan
            </h3>
            <button
              onClick={() => setShowLoadPlanModal(false)}
              className="p-2 hover:bg-[#F0F1F3] rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {previousPlansLoading ? (
            <div className="text-center text-[14px] text-[#667085] py-6">
              Loading plans...
            </div>
          ) : previousPlans.length === 0 ? (
            <div className="text-center text-[14px] text-[#667085] py-6">
              No previous plans found
            </div>
          ) : (
            <div className="space-y-3">
              {previousPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-[#E4E6EA] rounded-lg p-4 hover:border-[#0F50AA] cursor-pointer"
                  onClick={() => loadPreviousPlan(plan)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[14px] font-[600] text-[#383E49] flex items-center gap-2">
                        {plan.planName}
                        {plan.isTemplate && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">
                            Template
                          </span>
                        )}
                      </h4>
                      <p className="text-[12px] text-[#667085]">
                        Date: {plan.planDate?.split("T")[0]}
                      </p>
                      <p className="text-[12px] text-[#667085]">
                        {(plan.productionItems || []).length} items
                      </p>
                      <p className="text-[12px] text-[#667085]">
                        Status: {plan.status}
                      </p>
                      <p className="text-[12px] text-[#667085]">
                        Total: Rs. {plan.totalEstimatedCost}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cloneAndReusePlan(plan);
                        }}
                        className="px-3 py-1.5 bg-[#0F50AA] text-white text-[12px] font-[500] rounded-md hover:bg-[#0D4494] flex items-center gap-1"
                        title="Clone and reuse plan"
                      >
                        <Copy size={14} />
                        Clone & Reuse
                      </button>
                      <Trash2
                        size={18}
                        className="text-[#EF4444] hover:text-red-700 cursor-pointer transition-colors"
                        title="Delete Template"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Are you sure you want to delete this plan?"
                            )
                          ) {
                            deletePlan(plan.id);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // View Plan Details Modal
  const ViewPlanModal = ({ plan, onClose, onExecute }) => {
    const items = plan.productionItems || [];
    const rawMaterials = plan.rawMaterialRequirements || [];
    const distributions = plan.distributionPlans || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-65 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E4E6EA]">
          {/* Header */}
          <div className="p-6 border-b border-[#E4E6EA] bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
            <div>
              <h3 className="text-[20px] font-[700] text-[#383E49] flex items-center gap-2">
                <Factory className="text-[#0F50AA]" size={24} />
                Production Plan Details: {plan.planName}
              </h3>
              <p className="text-[13px] text-[#667085] mt-1">
                Preview plan items, raw material needs, and distribution allocations.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#667085]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Meta Stats info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-[#E4E6EA]">
              <div>
                <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wider">Status</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[12px] font-[600] ${
                  plan.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {plan.status}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wider">Plan Date</p>
                <p className="text-[14px] font-[600] text-[#383E49] mt-1">
                  {plan.planDate ? new Date(plan.planDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wider">Total Est. Cost</p>
                <p className="text-[14px] font-[600] text-[#383E49] mt-1">
                  Rs. {plan.totalEstimatedCost?.toLocaleString() || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-[600] text-[#667085] uppercase tracking-wider">Raw Material Cost</p>
                <p className="text-[14px] font-[600] text-[#383E49] mt-1">
                  Rs. {plan.totalRawMaterialCost?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>

            {plan.notes && (
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                <p className="text-[12px] font-[600] text-[#0F50AA] uppercase tracking-wider">Notes</p>
                <p className="text-[14px] text-[#383E49] mt-1">{plan.notes}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Production Items Section */}
              <div>
                <h4 className="text-[15px] font-[700] text-[#383E49] mb-2 flex items-center gap-2">
                  <Package size={18} className="text-[#0F50AA]" />
                  Planned Production Items ({items.length})
                </h4>
                <div className="border border-[#E4E6EA] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#667085] text-[12px] font-[600] uppercase tracking-wider border-b border-[#E4E6EA]">
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4 text-center">Type</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Unit Cost</th>
                        <th className="py-3 px-4 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-3 px-4 text-[14px] font-[600] text-[#383E49]">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-[500] uppercase ${
                              item.type === "raw_material" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-[#0F50AA]"
                            }`}>
                              {item.type || "product"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#383E49]">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right text-[14px] text-[#667085]">
                            Rs. {item.unitCost?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#383E49]">
                            Rs. {item.totalCost?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-[#667085] italic text-[13px]">
                            No items planned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw Material Requirements Section */}
              <div>
                <h4 className="text-[15px] font-[700] text-[#383E49] mb-2 flex items-center gap-2">
                  <Factory size={18} className="text-[#0F50AA]" />
                  Raw Material Requirements & Stock Check ({rawMaterials.length})
                </h4>
                <div className="border border-[#E4E6EA] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#667085] text-[12px] font-[600] uppercase tracking-wider border-b border-[#E4E6EA]">
                        <th className="py-3 px-4">Material Name</th>
                        <th className="py-3 px-4">Production Center</th>
                        <th className="py-3 px-4 text-right">Required Qty</th>
                        <th className="py-3 px-4 text-right">Available Stock</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {rawMaterials.map((mat, idx) => {
                        const isShortage = mat.stockDeficit > 0;
                        return (
                          <tr key={idx} className={`hover:bg-gray-50/30 transition-colors ${isShortage ? "bg-red-50/20" : ""}`}>
                            <td className="py-3 px-4">
                              <p className="text-[14px] font-[600] text-[#383E49]">{mat.rawMaterialName}</p>
                              {mat.materialCode && <p className="text-[11px] text-[#667085]">Code: {mat.materialCode}</p>}
                            </td>
                            <td className="py-3 px-4 text-[13px] text-[#383E49]">
                              {mat.productionCenterName || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-right text-[14px] font-[600] text-[#383E49]">
                              {mat.requiredQuantity} <span className="text-[12px] font-[400] text-[#667085]">{mat.unitOfMeasure}</span>
                            </td>
                            <td className={`py-3 px-4 text-right text-[14px] font-[600] ${isShortage ? "text-red-600" : "text-green-600"}`}>
                              {mat.availableStock} <span className="text-[12px] font-[400] text-[#667085]">{mat.unitOfMeasure}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isShortage ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  Shortage: {mat.stockDeficit} {mat.unitOfMeasure}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {rawMaterials.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-[#667085] italic text-[13px]">
                            No raw materials required.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coupled Distribution Section */}
              {distributions.length > 0 && (
                <div>
                  <h4 className="text-[15px] font-[700] text-[#383E49] mb-2 flex items-center gap-2">
                    <History size={18} className="text-[#0F50AA]" />
                    Coupled Outlet Distributions ({distributions.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {distributions.map((dist, idx) => (
                      <div key={idx} className="border border-[#E4E6EA] rounded-xl p-4 bg-gray-50/50 space-y-2">
                        <div className="flex justify-between items-center border-b border-[#E4E6EA] pb-2">
                          <span className="font-[600] text-[14px] text-[#383E49]">{dist.outletName}</span>
                          <span className="text-[12px] text-[#667085]">{dist.date ? new Date(dist.date).toLocaleDateString() : ""}</span>
                        </div>
                        <div className="space-y-1">
                          {dist.items?.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-[13px] text-[#383E49]">
                              <span>{item.productName}</span>
                              <span className="font-[600]">Qty: {item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#E4E6EA] bg-[#F8F9FA] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-[#E4E6EA] text-[#383E49] font-[600] rounded-xl hover:bg-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                cloneAndReusePlan(plan);
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white font-[600] rounded-xl hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2"
            >
              <Copy size={18} />
              Clone & Reuse
            </button>
            <button
              onClick={onExecute}
              className="px-8 py-2.5 bg-[#0F50AA] text-white font-[600] rounded-xl hover:bg-[#0D4494] shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
            >
              <Copy size={18} />
              Execute Plan
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Material Stock Comparison Modal before final approval
  const ComparisonModal = () => {
    const requirements = comparisonData?.rawMaterialRequirements || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E4E6EA]">
          {/* Header */}
          <div className="p-6 border-b border-[#E4E6EA] bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
            <div>
              <h3 className="text-[20px] font-[700] text-[#383E49] flex items-center gap-2">
                <Package className="text-[#0F50AA]" size={24} />
                Material Stock Availability Check
              </h3>
              <p className="text-[13px] text-[#667085] mt-1">
                Verify available inventory before finalizing the production plan.
              </p>
            </div>
            <button
              onClick={() => setShowComparisonModal(false)}
              className="p-2 hover:bg-[#F0F1F3] rounded-lg transition-colors"
            >
              <X size={20} className="text-[#667085]" />
            </button>
          </div>

          {/* Content (Table) */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="border border-[#E4E6EA] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] text-[#667085] text-[12px] font-[600] uppercase tracking-wider border-b border-[#E4E6EA]">
                    <th className="py-4 px-6">Raw Material</th>
                    <th className="py-4 px-6 text-center">Needed Material</th>
                    <th className="py-4 px-6 text-center">Available Material</th>
                    <th className="py-4 px-6 text-center">Status / Deficit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E6EA]">
                  {requirements.map((mat, idx) => {
                    const isInsufficient = mat.stockDeficit > 0;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          isInsufficient ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* Material Name */}
                        <td className="py-4 px-6">
                          <p className="text-[14px] font-[600] text-[#383E49]">
                            {mat.rawMaterialName}
                          </p>
                          <p className="text-[11px] text-[#667085]">
                            Code: {mat.materialCode || "-"} | Center: {mat.productionCenterName}
                          </p>
                        </td>

                        {/* Needed Qty */}
                        <td className="py-4 px-6 text-center text-[14px] font-[600] text-[#383E49]">
                          {mat.requiredQuantity} <span className="text-[12px] font-[400] text-[#667085]">{mat.unitOfMeasure}</span>
                        </td>

                        {/* Available Qty */}
                        <td className={`py-4 px-6 text-center text-[14px] font-[600] ${
                          isInsufficient ? "text-red-600 font-[700]" : "text-green-600"
                        }`}>
                          {mat.availableStock} <span className="text-[12px] font-[400] text-[#667085]">{mat.unitOfMeasure}</span>
                        </td>

                        {/* Deficit / Status */}
                        <td className="py-4 px-6 text-center">
                          {isInsufficient ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
                              Shortage: {mat.stockDeficit} {mat.unitOfMeasure}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-[#667085] italic text-[14px]">
                        No materials required for the selected products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[#E4E6EA] bg-[#F8F9FA] flex items-center justify-end gap-3">
            <button
              onClick={() => setShowComparisonModal(false)}
              className="px-6 py-2.5 border border-[#E4E6EA] text-[#383E49] font-[600] rounded-xl hover:bg-white transition-colors"
            >
              Change Quantity
            </button>
            <button
              onClick={approvePlan}
              className="px-8 py-2.5 bg-[#0F50AA] text-white font-[600] rounded-xl hover:bg-[#0D4494] shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Approve & Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  // // Raw Material Request Modal
  // const RawMaterialModal = () => (
  //   <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
  //     <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
  //       <div className="p-6 border-b border-[#E4E6EA]">
  //         <div className="flex items-center justify-between">
  //           <h3 className="text-[20px] font-[600] text-[#383E49]">
  //             Request Raw Material
  //           </h3>
  //           <button
  //             onClick={() => setShowRawMaterialModal(false)}
  //             className="p-2 hover:bg-[#F0F1F3] rounded-lg"
  //           >
  //             <X size={20} />
  //           </button>
  //         </div>
  //       </div>

  //       <div className="p-6">
  //         <p className="text-[14px] text-[#667085] mb-4">
  //           Request additional raw materials from store
  //         </p>
  //         <div className="space-y-3">
  //           <input
  //             type="text"
  //             placeholder="Material name"
  //             className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
  //           />
  //           <input
  //             type="number"
  //             placeholder="Quantity"
  //             className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
  //           />
  //           <textarea
  //             placeholder="Reason (optional for KOT kitchens)"
  //             className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
  //             rows="3"
  //           />
  //         </div>
  //         <div className="flex gap-3 mt-6">
  //           <button
  //             onClick={() => setShowRawMaterialModal(false)}
  //             className="flex-1 px-4 py-2 border border-[#E4E6EA] text-[#667085] rounded-lg hover:bg-[#F8F9FA]"
  //           >
  //             Cancel
  //           </button>
  //           <button
  //             onClick={() => {
  //               setShowRawMaterialModal(false);
  //               alert("Raw material request submitted to store");
  //             }}
  //             className="flex-1 px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494]"
  //           >
  //             Submit Request
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  // Confirmation Popup after submission
  const ConfirmationPopup = ({
    submittedPlanData,
    setShowConfirmationPopup,
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E4E6EA]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-[#199D26]" />
              <h3 className="text-[20px] font-[600] text-[#383E49]">
                Production Plan Submitted
              </h3>
            </div>
            <button
              onClick={() => setShowConfirmationPopup(false)}
              className="p-2 hover:bg-[#F0F1F3] rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {submittedPlanData && (
          <div className="p-6 space-y-6">
            {/* Production Plan Summary */}
            <div>
              <h4 className="text-[16px] font-[600] text-[#383E49] mb-3">
                Production Plan Summary
              </h4>
              <div className="bg-[#F8F9FA] rounded-lg p-4 space-y-2">
                <p>
                  <span className="font-[500]">Plan Name:</span>{" "}
                  {submittedPlanData.planName}
                </p>
                <p>
                  <span className="font-[500]">Date:</span>{" "}
                  {submittedPlanData.planDate}
                </p>
                <p>
                  <span className="font-[500]">Status:</span>{" "}
                  {submittedPlanData.status}
                </p>
                <p>
                  <span className="font-[500]">Total Items:</span>{" "}
                  {submittedPlanData.productionItems?.length || 0}
                </p>
                <p>
                  <span className="font-[500]">Total Estimated Cost:</span> Rs.{" "}
                  {submittedPlanData.totalEstimatedCost || 0}
                </p>
                <p>
                  <span className="font-[500]">Total Raw Material Cost:</span>{" "}
                  Rs. {submittedPlanData.totalRawMaterialCost || 0}
                </p>
              </div>

              <div className="mt-4">
                <h5 className="text-[14px] font-[500] text-[#383E49] mb-2">
                  Selected Products:
                </h5>
                <div className="space-y-2">
                  {(submittedPlanData.productionItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-[#E4E6EA]"
                    >
                      <span className="text-[14px] text-[#383E49]">
                        {item.productName}
                      </span>
                      <span className="text-[14px] text-[#383E49]">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-[14px] text-[#383E49]">
                        Unit Cost: Rs. {item.unitCost}
                      </span>
                      <span className="text-[14px] font-[500] text-[#383E49]">
                        Total: Rs. {item.totalCost}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw Material Requirements */}
            <div>
              <h4 className="text-[16px] font-[600] text-[#383E49] mb-3">
                Raw Material Requirements
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-[#E4E6EA] rounded-lg">
                  <thead className="bg-[#F8F9FA]">
                    <tr>
                      <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Material
                      </th>
                      <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Code
                      </th>
                      <th className="text-right py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Required Qty
                      </th>
                      <th className="text-right py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Unit
                      </th>
                      <th className="text-right py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Unit Cost
                      </th>
                      <th className="text-right py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Total Cost
                      </th>
                      <th className="text-right py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Available
                      </th>

                      <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                        Center
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(submittedPlanData.rawMaterialRequirements || []).map(
                      (material, index) => (
                        <tr key={index} className="border-t border-[#E4E6EA]">
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {material.rawMaterialName}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {material.materialCode}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-right">
                            {material.requiredQuantity}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-right">
                            {material.unitOfMeasure}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-right">
                            Rs. {material.unitCost}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-right">
                            Rs. {material.totalCost}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-right">
                            {material.availableStock}
                          </td>

                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {material.productionCenterName}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  const materialsByCenter = {};
                  (submittedPlanData.rawMaterialRequirements || []).forEach(mat => {
                    const centerName = mat.productionCenterName || "Unknown Center";
                    if (!materialsByCenter[centerName]) {
                      materialsByCenter[centerName] = [];
                    }
                    materialsByCenter[centerName].push(mat);
                  });

                  const printWindow = window.open('', '_blank');
                  let html = `
                    <html>
                      <head>
                        <title>Production Plan Bills</title>
                        <style>
                          body { font-family: 'Inter', sans-serif; padding: 20px; color: #383E49; }
                          .bill { border: 2px solid #E4E6EA; border-radius: 12px; padding: 25px; margin-bottom: 40px; page-break-after: always; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                          .bill:last-child { page-break-after: avoid; }
                          .header { text-align: center; border-bottom: 2px dashed #E4E6EA; padding-bottom: 15px; margin-bottom: 20px; }
                          .title { font-size: 20px; font-weight: bold; color: #0F50AA; margin-bottom: 5px; }
                          .plan-name { font-size: 14px; color: #667085; }
                          .meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
                          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                          .table th { border-bottom: 2px solid #383E49; text-align: left; padding: 8px; font-size: 13px; font-weight: 600; }
                          .table td { border-bottom: 1px solid #E4E6EA; padding: 8px; font-size: 13px; }
                          .total { border-top: 2px dashed #E4E6EA; padding-top: 15px; margin-top: 20px; text-align: right; font-weight: bold; font-size: 15px; }
                        </style>
                      </head>
                      <body>
                  `;

                  Object.entries(materialsByCenter).forEach(([centerName, materials]) => {
                    let totalCost = 0;
                    html += `
                      <div class="bill">
                        <div class="header">
                          <div class="title">MATERIAL REQUIREMENT BILL</div>
                          <div class="plan-name">${submittedPlanData.planName}</div>
                          <div style="font-weight: 600; font-size: 16px; margin-top: 10px; color: #0F50AA;">CENTER: ${centerName}</div>
                        </div>
                        <div class="meta-row">
                          <span><strong>Date:</strong> ${new Date(submittedPlanData.planDate).toLocaleDateString()}</span>
                          <span><strong>Status:</strong> ${submittedPlanData.status}</span>
                        </div>
                        <table class="table">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Code</th>
                              <th style="text-align: right;">Qty</th>
                              <th>Unit</th>
                              <th style="text-align: right;">Total Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                    `;

                    materials.forEach(mat => {
                      totalCost += mat.totalCost || 0;
                      html += `
                        <tr>
                          <td>${mat.rawMaterialName}</td>
                          <td>${mat.materialCode || '-'}</td>
                          <td style="text-align: right;">${mat.requiredQuantity}</td>
                          <td>${mat.unitOfMeasure}</td>
                          <td style="text-align: right;">Rs. ${(mat.totalCost || 0).toFixed(2)}</td>
                        </tr>
                      `;
                    });

                    html += `
                          </tbody>
                        </table>
                        <div class="total">
                          Total Estimated Cost: Rs. ${totalCost.toFixed(2)}
                        </div>
                      </div>
                    `;
                  });

                  html += `
                      </body>
                    </html>
                  `;
                  
                  printWindow.document.write(html);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 500);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-[#199D26] text-white rounded-lg hover:bg-[#157A1E] font-[500]"
              >
                Print Bills
              </button>
              <button
                onClick={() => setShowConfirmationPopup(false)}
                className="px-6 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] font-[500]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Outlet Distribution Modal
  const OutletDistributionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E4E6EA]">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-[600] text-[#383E49]">
              Manage Outlet Distribution -{" "}
              {selectedProductForDistribution?.productName}
            </h3>
            <button
              onClick={() => setShowOutletDistributionModal(false)}
              className="p-2 hover:bg-[#F0F1F3] rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Distribution Form */}
          <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6">
            <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
              Add New Distribution
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Select Outlet
                </label>
                <select
                  value={tempOutletId}
                  onChange={(e) => setTempOutletId(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]"
                >
                  <option value="">Select Outlet</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.outletId} value={outlet.outletId}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    selectedProductForDistribution
                      ? getRemainingQtyForDistribution(
                        selectedProductForDistribution
                      )
                      : 0
                  }
                  value={tempQty}
                  onChange={(e) => setTempQty(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA]"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                  Available
                </label>
                <div className="flex items-center h-10 px-4 py-2 bg-white border border-[#E4E6EA] rounded-lg">
                  <span className="text-[14px] font-[600] text-[#199D26]">
                    {selectedProductForDistribution
                      ? getRemainingQtyForDistribution(
                        selectedProductForDistribution
                      )
                      : 0}
                  </span>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addOutletDistribution}
                  className="w-full px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494]"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Existing Distributions Table */}
          <div>
            <h4 className="text-[16px] font-[600] text-[#383E49] mb-4">
              Current Distributions
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-[#E4E6EA] rounded-lg">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <th className="text-left py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                      Outlet
                    </th>
                    <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                      Quantity
                    </th>
                    <th className="text-center py-3 px-4 text-[14px] font-[500] text-[#383E49]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductForDistribution &&
                    outletDistributions[selectedProductForDistribution.productId]?.map(
                      (dist, index) => (
                        <tr key={index} className="border-t border-[#E4E6EA]">
                          <td className="py-3 px-4 text-[14px] text-[#383E49]">
                            {dist.outletName}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#383E49] text-center">
                            {dist.qty}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() =>
                                removeOutletDistribution(
                                  selectedProductForDistribution.productId,
                                  index
                                )
                              }
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  {!selectedProductForDistribution ||
                    (!outletDistributions[selectedProductForDistribution.productId]
                      ?.length && (
                        <tr>
                          <td
                            colSpan="3"
                            className="py-6 text-center text-[#667085]"
                          >
                            No distributions added yet
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const loadPlanById = async (planId) => {
    setSelectedPlan(planId);
    setDraftPlanId(null);
    setShowComparisonModal(false);
    setComparisonData(null);
    // Fetch full plan details
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/manager/production-plans/${planId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load plan details");
      const fullPlan = await res.json();
      
      // Update outlet distributions from the loaded plan
      const newOutletDistributions = {};
      if (fullPlan.productionItems) {
        fullPlan.productionItems.forEach(item => {
          if (item.outlets && item.outlets.length > 0) {
            newOutletDistributions[item.productId] = item.outlets.map(o => ({
              outletId: o.outletId,
              outletName: o.outletName,
              qty: o.outletQty
            }));
          }
        });
      }
      setOutletDistributions(newOutletDistributions);

      setCurrentPlan({
        ...fullPlan,
        productionItems: fullPlan.productionItems.map(item => ({
          ...item,
          executionQuantity: item.quantity // Default execution qty to plan qty
        }))
      });
      setPlanName(fullPlan.planName);
      setPlanDate(new Date().toISOString().split("T")[0]);
      setNotes(fullPlan.notes || "");
      setIsExecutionMode(true);
      setViewMode("execution");
    } catch (e) {
      console.error("Error loading plan:", e);
      showNotification("Error loading plan: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load plan from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planId = params.get("id");
    
    if (planId) {
      console.log("Auto-loading plan from URL ID:", planId);
      loadPlanById(planId);
      
      // Clear the ID from URL to prevent re-triggering if user navigates away and back
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {viewMode === "dashboard" ? (
            <div className="space-y-6">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                    Production Planning Dashboard
                  </h1>
                  <p className="text-[14px] text-[#667085]">
                    Select a standard plan to start execution or create a new template
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetchTemplates();
                      setShowLoadPlanModal(true);
                    }}
                    className="px-4 py-3 border border-[#0F50AA] text-[#0F50AA] rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <History size={20} />
                    Load Template
                  </button>
                  <button
                    onClick={startNewPlan}
                    className="px-4 py-3 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add New Plan
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white rounded-lg p-4 border border-[#E4E6EA] flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={18} />
                  <input
                    type="text"
                    placeholder="Search plans by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] outline-none"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  {["All", "Bakery", "Kitchen"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-lg text-[14px] font-[500] whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? "bg-[#0F50AA] text-white"
                          : "bg-[#F8F9FA] text-[#383E49] border border-[#E4E6EA] hover:bg-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Grid/List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productionPlans
                  .filter(plan => {
                    const matchesSearch = plan.planName.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = categoryFilter === "All" || 
                                          plan.department === categoryFilter.toUpperCase() ||
                                          (categoryFilter === "Bakery" && plan.planName.toLowerCase().includes("bakery")) ||
                                          (categoryFilter === "Kitchen" && plan.planName.toLowerCase().includes("kitchen"));
                    return matchesSearch && matchesCategory;
                  })
                  .map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden hover:shadow-md transition-all group">
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-blue-50 rounded-lg text-[#0F50AA]">
                            <Factory size={24} />
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[12px] font-[500] ${
                            plan.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                        <h3 className="text-[17px] font-[600] text-[#383E49] mb-1 group-hover:text-[#0F50AA] transition-colors">{plan.planName}</h3>
                        <p className="text-[13px] text-[#667085] mb-4 flex items-center gap-2">
                          <Clock size={14} />
                          Last Used: {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                           <button
                            onClick={() => loadPlanById(plan.id)}
                            className="flex-1 px-3 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] text-[13px] font-[500] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Copy size={15} />
                            Execute Plan
                           </button>
                           <button
                            onClick={() => cloneAndReusePlan(plan)}
                            className="px-3 py-2 border border-[#0F50AA] text-[#0F50AA] hover:bg-blue-50 rounded-lg text-[13px] font-[500] flex items-center justify-center gap-1.5 transition-colors"
                            title="Clone and reuse this plan"
                          >
                            <Copy size={15} />
                            Clone & Reuse
                           </button>
                           <button 
                             onClick={() => {
                               setSelectedPlanForView(plan);
                               setShowViewPlanModal(true);
                             }}
                             className="p-2 border border-[#E4E6EA] rounded-lg text-[#667085] hover:bg-gray-50 transition-colors"
                             title="View Details"
                            >
                             <Search size={18} />
                            </button>
                        </div>
                      </div>
                      <div className="px-5 py-3 bg-[#F8F9FA] border-t border-[#E4E6EA] flex justify-between items-center">
                        <span className="text-[12px] text-[#667085]">{plan.productionItems?.length || 0} Products</span>
                        <span className="text-[12px] font-[600] text-[#383E49]">Rs. {plan.totalEstimatedCost?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                
                {productionPlans.length === 0 && !loading && (
                  <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-[#E4E6EA]">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History size={32} className="text-[#667085]" />
                    </div>
                    <h3 className="text-[16px] font-[600] text-[#383E49]">No production plans found</h3>
                    <p className="text-[14px] text-[#667085] mt-1">Start by creating a new production template</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Plan/Execution Header */}
              <div className="flex items-center justify-between mb-2">
                 <button 
                  onClick={() => setViewMode("dashboard")}
                  className="text-[#0F50AA] text-[14px] font-[500] flex items-center gap-1 hover:underline"
                 >
                   <History size={16} /> Back to Dashboard
                 </button>
                 <div className="flex gap-2">
                   <button onClick={startNewPlan} className="px-4 py-2 text-[#0F50AA] border border-[#0F50AA] rounded-lg text-[14px] font-[500] hover:bg-blue-50">
                     Reset
                   </button>
                 </div>
              </div>

              {/* Existing Plan/Create Form Content */}
              {/* Plan Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                  <h3 className="text-[18px] font-[600] text-[#383E49]">
                    {viewMode === "execution" ? "Daily Production Execution" : "Create Production Template"}
                  </h3>
                  <div className="px-3 py-1 bg-blue-50 text-[#0F50AA] rounded-full text-[12px] font-[600]">
                    {viewMode === "execution" ? "Execution Mode" : "Format Mode"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[13px] font-[600] text-[#667085] mb-2 uppercase tracking-wider">
                      Target Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] outline-none"
                      value={planDate}
                      onChange={(e) => setPlanDate(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-[600] text-[#667085] mb-2 uppercase tracking-wider">
                      Plan Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Monday Morning Bakery"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F50AA] outline-none ${
                        planNameError ? "border-[#EF4444]" : "border-[#E4E6EA]"
                      }`}
                      value={planName}
                      onChange={(e) => {
                        setPlanName(e.target.value);
                        if (planNameError) setPlanNameError("");
                      }}
                    />
                    {planNameError && (
                      <p className="text-[#EF4444] text-[12px] mt-1">{planNameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-[600] text-[#667085] mb-2 uppercase tracking-wider">
                      Status
                    </label>
                    <div className="flex items-center h-10 px-4 bg-[#F8F9FA] border border-[#E4E6EA] rounded-lg text-[14px] font-[600] text-[#0F50AA]">
                      {currentPlan.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden">
                <div className="p-6 border-b border-[#E4E6EA] flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-[18px] font-[600] text-[#383E49]">Production Items</h3>
                  {(viewMode === "create" || viewMode === "execution") && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="px-4 py-2 bg-[#0F50AA] text-white rounded-lg hover:bg-[#0D4494] text-[14px] font-[500] flex items-center gap-2"
                    >
                      <Plus size={18} /> Add Product
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8F9FA] text-[#667085] text-[12px] font-[600] uppercase tracking-wider">
                        <th className="text-left py-4 px-6">Product</th>
                        <th className="text-center py-4 px-6">Center</th>
                        <th className="text-center py-4 px-6">Current Qty</th>
                        <th className="text-center py-4 px-6">Total Qty</th>
                        <th className="text-right py-4 px-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {currentPlan.productionItems.map((item) => {
                        const availProd = availableProducts.find(
                          (p) => p.id === item.productId || p.id === item.id || (p.code && p.code === item.productCode)
                        );

                        const miniStores = (item.miniStoreAvailability && item.miniStoreAvailability.length > 0)
                          ? item.miniStoreAvailability
                          : (availProd?.miniStoreAvailability || []);

                        const outletsList = (item.outletAvailability && item.outletAvailability.length > 0)
                          ? item.outletAvailability
                          : (availProd?.outletAvailability || []);

                        const miniStoreTotal = miniStores.reduce(
                          (sum, store) => sum + (parseFloat(store.availableQty) || 0),
                          0
                        );
                        const outletTotal = outletsList.reduce(
                          (sum, outletItem) => sum + (parseFloat(outletItem.availableQty) || 0),
                          0
                        );

                        const calculatedTotalStock = miniStoreTotal + outletTotal;

                        const currentStock = (
                          item.currentQty !== undefined && item.currentQty !== null
                            ? item.currentQty
                            : item.totalStock !== undefined && item.totalStock !== null
                            ? item.totalStock
                            : calculatedTotalStock
                        );
                        const centerName = (
                          item.destinationProductionCenter ||
                          (item.productionCenters && item.productionCenters[0]?.centerName) ||
                          (typeof item.productionCenters?.[0] === 'string' ? item.productionCenters[0] : null) ||
                          item.productionCenterName ||
                          item.category ||
                          "Bakery"
                        );

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0F50AA]">
                                  <Package size={20} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-[600] text-[#383E49]">{item.productName}</p>
                                  <p className="text-[12px] text-[#667085]">{item.productCode} | {item.category || 'Product'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {item.isRawMaterial ? (
                                <select
                                  value={item.destinationProductionCenter || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedItems = currentPlan.productionItems.map(p => 
                                      p.id === item.id ? { ...p, destinationProductionCenter: val } : p
                                    );
                                    setCurrentPlan(prev => ({ ...prev, productionItems: updatedItems }));
                                  }}
                                  className="w-full text-[13px] border border-[#E4E6EA] rounded px-2 py-1 focus:ring-1 focus:ring-[#0F50AA] outline-none"
                                >
                                  <option value="">Select Center</option>
                                  {productionCenterList.filter(c => c !== "All").map(center => (
                                    <option key={center} value={center}>{center}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[13px] font-[500] text-[#0F50AA] px-3 py-1 bg-blue-50 rounded-full inline-block">
                                  {centerName}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <span className={`text-[14px] font-[600] px-3 py-1 rounded-full border ${
                                  currentStock > 0 
                                    ? "text-[#199D26] bg-green-50 border-green-200" 
                                    : "text-[#667085] bg-gray-50 border-gray-200"
                                }`}>
                                  {currentStock} {getItemUnit(item)}
                                </span>

                                {((miniStores && miniStores.length > 0) || (outletsList && outletsList.length > 0)) && (
                                  <div className="text-[10px] text-[#667085] mt-1 space-y-0.5 text-left bg-gray-50/80 p-1.5 rounded border border-gray-100 max-w-[180px]">
                                    {miniStores && miniStores.length > 0 && (
                                      <div>
                                        <span className="font-[600] text-[#383E49]">Mini Stores:</span>
                                        {miniStores.map((store, idx) => (
                                          <div key={`ms-${idx}`} className="pl-1 truncate">
                                            • {store.miniStoreName}: <span className="font-[600] text-[#199D26]">{store.availableQty}</span> {getItemUnit(item)}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {outletsList && outletsList.length > 0 && (
                                      <div className={miniStores && miniStores.length > 0 ? "mt-1 pt-0.5 border-t border-gray-200" : ""}>
                                        <span className="font-[600] text-[#383E49]">Outlets:</span>
                                        {outletsList.map((outletItem, idx) => (
                                          <div key={`out-${idx}`} className="pl-1 truncate">
                                            • {outletItem.outletName}: <span className="font-[600] text-[#199D26]">{outletItem.availableQty}</span> {getItemUnit(item)}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={viewMode === "execution" ? (item.executionQuantity ?? item.quantity) : item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updatedItems = currentPlan.productionItems.map(p => 
                                      p.id === item.id ? { 
                                        ...p, 
                                        [viewMode === "execution" ? 'executionQuantity' : 'quantity']: val 
                                      } : p
                                    );
                                    setCurrentPlan(prev => ({ ...prev, productionItems: updatedItems }));
                                  }}
                                  className="w-24 text-center px-3 py-2 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] outline-none font-[600] text-[15px]"
                                />
                                <span className="text-[13px] font-[500] text-[#667085] min-w-[28px]">
                                  {getItemUnit(item)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => removeFromPlan(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {currentPlan.productionItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#667085]">
                            No items added to this plan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Production Plan Summary Section */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-[#E4E6EA] flex justify-between items-center bg-[#F8F9FA]">
                  <div className="flex items-center gap-2">
                    <Factory size={20} className="text-[#0F50AA]" />
                    <h3 className="text-[16px] font-[600] text-[#383E49]">Production Plan Summary</h3>
                  </div>
                  <div className="text-[12px] text-[#667085]">
                    Overview of items grouped by production center
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-[#E4E6EA]">
                      <tr>
                        <th className="text-left py-4 px-6 text-[12px] font-[600] text-[#667085] uppercase tracking-wider">Production Center</th>
                        <th className="text-left py-4 px-6 text-[12px] font-[600] text-[#667085] uppercase tracking-wider">Items</th>
                        <th className="text-center py-4 px-6 text-[12px] font-[600] text-[#667085] uppercase tracking-wider">Plan Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {Object.entries(
                        currentPlan.productionItems.reduce((acc, item) => {
                          const center = item.isRawMaterial 
                            ? (item.destinationProductionCenter || 'Unassigned Destination')
                            : (item.productionCenters && item.productionCenters.length > 0 
                                ? item.productionCenters[0].centerName 
                                : 'Unassigned Center');
                          if (!acc[center]) acc[center] = [];
                          acc[center].push(item);
                          return acc;
                        }, {})
                      ).map(([center, items]) => (
                        <tr key={center} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 px-6 align-top">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#0F50AA]">
                              {center}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-3">
                              {items.map((item) => (
                                <div key={item.id} className="text-[14px] text-[#383E49]">
                                  <p className="font-[600]">{item.productName}</p>
                                  <p className="text-[12px] text-[#667085]">{item.productCode}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center align-top font-[600] text-[#383E49]">
                            <div className="space-y-3 text-[14px]">
                              {items.map((item) => (
                                <div key={item.id} className="h-[34px] flex items-center justify-center gap-1">
                                  <span>{viewMode === "execution" ? (item.executionQuantity ?? item.quantity) : item.quantity}</span>
                                  <span className="text-[12px] font-[500] text-[#667085]">{getItemUnit(item)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentPlan.productionItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#667085] italic text-[14px]">
                            Add items above to see the production plan summary
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-end pt-4">
                <div className="flex items-center gap-2 mr-auto pb-4 sm:pb-0">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    className="w-4 h-4 text-[#0F50AA] border-[#E4E6EA] rounded focus:ring-[#0F50AA]"
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                  />
                  <label htmlFor="isTemplate" className="text-[14px] font-[500] text-[#383E49] cursor-pointer">
                    Save as Unified Template (Couples Production & Distribution)
                  </label>
                </div>
                <button
                  onClick={saveDraft}
                  className="px-8 py-3 border border-[#E4E6EA] text-[#383E49] font-[600] rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {viewMode === "execution" ? "Save Progress" : "Save Template"}
                </button>
                <button
                  onClick={submitPlan}
                  className="px-8 py-3 bg-[#0F50AA] text-white font-[600] rounded-lg hover:bg-[#0D4494] shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {viewMode === "execution" ? "Finalize Execution" : "Submit Template"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showAddProductModal && <AddProductModal
        availableProducts={availableProducts}
        productsLoading={productsLoading}
        currentPlan={currentPlan}
        setCurrentPlan={setCurrentPlan}
        productionCenterList={productionCenterList}
        productTypes={productTypes}
        isExecutionMode={isExecutionMode}
        setShowAddProductModal={setShowAddProductModal}
      />}
      {showLoadPlanModal && <LoadPlanModal />}
      {showRawMaterialModal && <RawMaterialModal />}
      {showComparisonModal && <ComparisonModal />}
      {showConfirmationPopup && (
        <ConfirmationPopup
          submittedPlanData={submittedPlanData}
          setShowConfirmationPopup={setShowConfirmationPopup}
        />
      )}
      {showOutletDistributionModal && <OutletDistributionModal />}
      {showViewPlanModal && selectedPlanForView && (
        <ViewPlanModal
          plan={selectedPlanForView}
          onClose={() => {
            setShowViewPlanModal(false);
            setSelectedPlanForView(null);
          }}
          onExecute={() => {
            loadPlanById(selectedPlanForView.id);
            setShowViewPlanModal(false);
            setSelectedPlanForView(null);
          }}
        />
      )}

      {/* Custom Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`bg-white border-l-4 ${toastType === 'success' ? 'border-[#199D26]' : 'border-[#EF4444]'} rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]`}>
            <div className={`flex-shrink-0 w-8 h-8 ${toastType === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              {toastType === 'success' ? <Check className="w-5 h-5 text-[#199D26]" /> : <X className="w-5 h-5 text-[#EF4444]" />}
            </div>
            <p className="text-[14px] text-[#383E49] font-[500]">{toastMsg}</p>
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
