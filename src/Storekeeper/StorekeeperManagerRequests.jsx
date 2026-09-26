import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Eye,
  Save,
  X,
  Calendar,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Printer,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Report printing
import GINReport from "../component/report/GINReport";
import { printReactReport } from "../component/report/PrintHelper";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader";

export default function StorekeeperManagerRequests() {
  const [activeTab, setActiveTab] = useState("");
  const [productionCenters, setProductionCenters] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Manager Requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showWorkflowTree, setShowWorkflowTree] = useState(true);
  const [issuedQtyByMaterial, setIssuedQtyByMaterial] = useState({});

  // Manager requests from backend
  const [managerRequests, setManagerRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved production plans on mount
  useEffect(() => {
    const fetchApprovedPlans = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/STK/v1/approved-plans/material-summary`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        const plans = Array.isArray(data.productionPlans)
          ? data.productionPlans
          : [];

        // Map backend data to existing UI structure
        const mappedRequests = plans.map((plan, index) => {
          const planDate = new Date(plan.productionDate);

          // Create empty items array since we're using the new structure
          const allItems = [];

          const rawStatus = (plan.status || "").toUpperCase();
          const isIssued = rawStatus === "IN_PROGRESS" || rawStatus === "ISSUED" || rawStatus === "COMPLETED" || rawStatus === "DISTRIBUTED";
          const uiStatus = isIssued ? "Issued" : "Pending";

          return {
            id: `REQ-${plan.planId}`,
            requestType: "Production Material Request",
            requestDate: planDate.toISOString().split("T")[0],
            managerName: "",
            status: uiStatus,
            rawStatus: rawStatus,
            priority: null,
            totalItems: allItems.length,
            description: `${plan.planName} - Materials for production`,
            items: allItems,
            createdAt: plan.productionDate,
            // Add production plan details
            planId: plan.planId,
            planName: plan.planName,
            productionDate: plan.productionDate,
            createdBy: plan.createdBy || "Manager",
            remarks: plan.remarks || "",
            totalEstimatedCost: plan.totalEstimatedCost || 0,
            // Add new structure data
            summaryProducts: plan.summaryProducts || [],
            consolidatedProducts: plan.consolidatedProducts || [],
            // Keep old structure for backward compatibility
            products: plan.products || [],
            rawMaterials: plan.rawMaterials || [],
          };
        });

        // Sort by planId descending (latest first)
        const sortedRequests = mappedRequests.sort((a, b) => b.planId - a.planId);

        setManagerRequests(sortedRequests);
      } catch (error) {
        console.error("Error fetching approved plans:", error);
        setManagerRequests([]);
      } finally { setLoading(false); }
    };

    fetchApprovedPlans();
  }, []);

  // Fetch all production centers from dynamic endpoint
  useEffect(() => {
    const fetchProductionCenters = async () => {
      try {
        const baseUrl = process.env.REACT_APP_BASE_URL;
        const response = await fetch(`${baseUrl}/STK/v1/production-centers`);
        if (!response.ok) throw new Error("Failed to fetch production centers");
        const data = await response.json();
        setProductionCenters(data);

        // Initialize activeTab with the first center name if not already set
        if (data.length > 0 && !activeTab) {
          setActiveTab(data[0].centerName);
        }
      } catch (error) {
        console.error("Error loading production centers:", error);
      }
    };
    fetchProductionCenters();
  }, [activeTab]);

  // Filter requests based on search term and status
  const filteredRequests = managerRequests.filter((request) => {
    const matchesSearch =
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // const handleViewDetails = (request) => {
  //   // Auto-select FIFO batches for each item
  //   const updatedItems = request.items.map((item) => ({
  //     ...item,
  //     selectedBatch:
  //       item.availableBatches.length > 0 ? item.availableBatches[0] : null,
  //     issuedQty: item.requestedQty,
  //   }));

  //   setSelectedRequest({
  //     ...request,
  //     items: updatedItems,
  //   });
  //   setShowDetailsModal(true);
  // };

  const handleViewDetails = (request) => {
    // Pre-fill issued quantities from the required quantities across all centers
    const initialIssuedQtys = {};
    const centerNames = productionCenters.map(c => c.centerName);

    centerNames.forEach(center => {
      const centerRaws = request.consolidatedProducts
        ? getRawMaterialsFromConsolidatedProducts(request.consolidatedProducts, center)
        : getRawMaterialsByCenter(request.products, center);

      centerRaws.forEach(material => {
        if (material.childItemId) {
          initialIssuedQtys[material.childItemId] = material.quantity;
        }
      });
    });

    setIssuedQtyByMaterial(initialIssuedQtys);
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleItemChange = (itemId, field, value) => {
    setSelectedRequest((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleBatchChange = (itemId, batchNo) => {
    setSelectedRequest((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const selectedBatch = item.availableBatches.find(
            (batch) => batch.batchNo === batchNo
          );
          return { ...item, selectedBatch };
        }
        return item;
      }),
    }));
  };

  const handleIssueMaterials = async () => {
    try {
      // Extract production plan ID
      const productionPlanId = selectedRequest.planId;

      // Helper to map production center to mini store id using fetched data
      const getMiniStoreIdForCenter = (centerName) => {
        const center = productionCenters.find(
          (c) =>
            (c.centerName || "").toLowerCase() === (centerName || "").toLowerCase()
        );
        const id = center ? (center.mini_store_id ?? center.miniStoreId) : null;
        if (id !== null && id !== undefined) {
          return Number(id);
        }
        const fallbackCenter = productionCenters.find(
          (c) => (c.mini_store_id ?? c.miniStoreId) != null
        );
        const fallbackId = fallbackCenter
          ? (fallbackCenter.mini_store_id ?? fallbackCenter.miniStoreId)
          : 26;
        return Number(fallbackId || 26);
      };

      // Collect raw materials by centers dynamically from fetched data
      const allProductionCenters = productionCenters.map(c => c.centerName);

      const allMaterials = [];
      allProductionCenters.forEach((center) => {
        const materials = selectedRequest.consolidatedProducts
          ? getRawMaterialsFromConsolidatedProducts(
            selectedRequest.consolidatedProducts,
            center
          )
          : getRawMaterialsByCenter(selectedRequest.products, center);
        allMaterials.push(...materials.map((m) => ({ ...m, center })));
      });

      // Filter and validate materials being issued (issuedQty > 0)
      const itemsToIssue = [];
      for (const material of allMaterials) {
        const key = material.childItemId;
        const rawVal = issuedQtyByMaterial[key];
        const qty =
          rawVal === undefined ||
            rawVal === null ||
            String(rawVal).trim() === ""
            ? 0
            : Number(rawVal);

        if (qty > 0) {
          if (
            material.currentStock != null &&
            qty > Number(material.currentStock)
          ) {
            toast.error(
              `Issued quantity for ${material.childName} exceeds available stock (${material.currentStock}).`
            );
            return;
          }
          itemsToIssue.push({ ...material, issuedQty: qty });
        }
      }

      if (itemsToIssue.length === 0) {
        toast.error("Please specify an issued quantity greater than 0 for at least one raw material.");
        return;
      }

      // Group by miniStoreId only for items that have issuedQty > 0
      const grouped = new Map();
      for (const material of itemsToIssue) {
        const miniStoreId = getMiniStoreIdForCenter(material.center);
        const list = grouped.get(miniStoreId) || [];
        list.push({
          rawMaterialId: material.childItemId,
          materialName: material.childName,
          unitOfMeasure: material.unit || "pcs",
          issuedQty: material.issuedQty,
          unitCost: Number(material.unitCost || 0),
        });
        grouped.set(miniStoreId, list);
      }

      const miniStoreMaterials = Array.from(grouped.entries())
        .filter(([_, issuedMaterials]) => issuedMaterials.length > 0)
        .map(([miniStoreId, issuedMaterials]) => ({ miniStoreId, issuedMaterials }));

      if (miniStoreMaterials.length === 0) {
        toast.error("No valid materials to issue.");
        return;
      }

      const requestPayload = { productionPlanId, miniStoreMaterials };

      console.log("Sending POST request to backend:", requestPayload);

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/STK/v1/approved-plans/issue-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = await response.json();
          console.error("Backend error response:", errorData);

          // Extract the specific error message from backend response
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If JSON parsing fails, try to get text response
          const errorText = await response.text();
          console.error("Backend error response (text):", errorText);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Backend response:", responseData);

      // Update the main requests array
      setManagerRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? { ...selectedRequest, status: "Issued" }
            : req
        )
      );

      setShowDetailsModal(false);
      setSelectedRequest(null);
      setIssuedQtyByMaterial({});

      // Show success message
      toast.success(
        "Materials issued successfully! Raw material issued document is ready for printing."
      );
    } catch (error) {
      console.error("Error issuing materials:", error);

      // Show user-friendly error message
      const errorMessage = error.message.includes("Insufficient stock")
        ? error.message
        : `Error issuing materials: ${error.message}`;

      toast.error(errorMessage);
    }
  };

  const calculateTotalCost = (items) => {
    return items
      .reduce((total, item) => {
        if (item.selectedBatch && item.issuedQty > 0) {
          return total + item.issuedQty * item.selectedBatch.unitCost;
        }
        return total;
      }, 0)
      .toFixed(2);
  };

  // Helper function to get center name from active tab (handles slugs and direct names)
  const getCenterNameFromTab = (tab) => {
    const tabToCenterMap = {
      kitchen: "Kitchen",
      bakery: "Bakery",
      store: "Store",
      "cake-production": "Cake production",
      "short-eats": "Short eats",
      "roti-corner": "Roti corner",
      "rice-and-curry": "Rice and curry",
      "hot-kitchen": "Hot kitchen",
      "gateau-and-icing-cakes": "Gateau and icing cakes",
      "hopper-corner": "Hopper corner",
      "juice-corner": "Juice corner",
      "tea-corner": "Tea corner",
      pizza: "Pizza",
    };
    return tabToCenterMap[tab] || tab;
  };

  // Helper function to get mini store name for a production center
  const getMiniStoreNameForCenter = (center) => {
    const centerToStoreMap = {
      Kitchen: "Kitchen Mini Store",
      Bakery: "Bakery Mini Store",
      Store: "POS Mini Store",
    };
    return centerToStoreMap[center] || `${center} Mini Store`;
  };

  // Helper function to get mini store quantity for a specific production center
  const getMiniStoreQuantityForCenter = (material, center) => {
    if (!material || !material.miniStoreAvailability || material.miniStoreAvailability.length === 0) {
      return 0;
    }
    // 1. Match by miniStoreId from productionCenters state
    const matchedCenter = productionCenters.find(
      (c) => (c.centerName || "").toLowerCase() === (center || "").toLowerCase()
    );
    if (matchedCenter) {
      const targetStoreId = matchedCenter.miniStoreId ?? matchedCenter.mini_store_id;
      if (targetStoreId != null) {
        const match = material.miniStoreAvailability.find(
          (ms) => Number(ms.miniStoreId) === Number(targetStoreId)
        );
        if (match && match.availableQty != null) {
          return match.availableQty;
        }
      }
    }
    // 2. Match miniStoreName with center name
    const miniStoreName = getMiniStoreNameForCenter(center);
    const matchByName = material.miniStoreAvailability.find(
      (ms) => (ms.miniStoreName || "").toLowerCase() === miniStoreName.toLowerCase() ||
              (ms.miniStoreName || "").toLowerCase().includes((center || "").toLowerCase()) ||
              (center || "").toLowerCase().includes((ms.miniStoreName || "").toLowerCase())
    );
    if (matchByName && matchByName.availableQty != null) {
      return matchByName.availableQty;
    }
    // 3. Fallback to first mini store's quantity
    return material.miniStoreAvailability[0]?.availableQty ?? 0;
  };

  // Priority helper to ensure Dough A appears first, Bread Roll second, buns after
  const getPriorityScore = (name) => {
    if (!name) return 99;
    const n = name.toString().toLowerCase();
    if (n.includes("dough a")) return 1;
    if (n.includes("bread roll") || n.includes("breadroll")) return 2;
    if (n.includes("bun") || n.includes("sausage")) return 3;
    return 99;
  };

  const getNodeLabel = (node) =>
    node.productName || node.childName || node.semiProductName || "";

  // Helper function to extract and flatten tree data for printing (only nodes for the active center)
  const extractTreeData = (products, activeTab) => {
    if (!products || products.length === 0) return [];

    const centerName = getCenterNameFromTab(activeTab);

    const result = [];

    // Recursive function to traverse and collect ONLY nodes that belong to the center
    const traverse = (node, level = 0, parentName = "") => {
      const nodeCenter = node.productionCenter || "-";
      const isMatch = nodeCenter === centerName;

      if (isMatch) {
        const entry = {
          level: level,
          code: node.childItemId || node.productId || "-",
          description: node.childName || node.productName,
          type: node.childType || "product",
          parentProduct: parentName,
          productionCenter: nodeCenter,
          unit: node.unit || "pcs",
          qty: node.quantity || node.plannedQuantity || 0,
          unitCost: node.unitCost || 0,
          totalCost: node.totalCost || 0,
          isRawMaterial: node.childType === "raw_material",
        };
        result.push(entry);
      }

      // Traverse children recursively
      if (node.children && node.children.length > 0) {
        const currentName = node.childName || node.productName;
        node.children.forEach((child) => {
          traverse(child, level + 1, currentName);
        });
      }
    };

    // Process each product tree - traverse fully, but only collect nodes that match the center
    products.forEach((product) => {
      if (hasProductionCenter(product, centerName)) {
        traverse(product, 0, "");
      }
    });

    return result;
  };

  // Helper function to extract tree data for specific production center from new structure
  const extractTreeDataForCenter = (selectedRequest, targetCenter) => {
    const result = [];

    // Helper to find plannedQuantity from summaryProducts or consolidatedProducts by product name
    const findPlannedQuantity = (productName) => {
      if (!productName) return null;
      // First check summaryProducts (for products)
      if (selectedRequest.summaryProducts) {
        const product = selectedRequest.summaryProducts.find(
          (p) => p.productName === productName
        );
        if (product) return product.plannedQuantity;
      }
      // Then check consolidatedProducts (for semi-products)
      if (selectedRequest.consolidatedProducts) {
        const semiProduct = selectedRequest.consolidatedProducts.find(
          (sp) => sp.semiProductName === productName
        );
        if (semiProduct) return semiProduct.totalRequiredQty;
      }
      return null;
    };

    // Prefer a consistent, meaningful unit for semi-products
    const deriveUnitForSemiProduct = (semiProduct) => {
      // If usage breakdown provides units (e.g., kg), prefer the first non-empty
      if (
        semiProduct &&
        Array.isArray(semiProduct.usageBreakdown) &&
        semiProduct.usageBreakdown.length > 0
      ) {
        const u = semiProduct.usageBreakdown.find(
          (u) => u && typeof u.unit === "string" && u.unit.trim() !== ""
        )?.unit;
        if (u) return u;
      }
      // Fallback to the semi-product's own unit
      if (
        semiProduct &&
        typeof semiProduct.unit === "string" &&
        semiProduct.unit.trim() !== ""
      ) {
        return semiProduct.unit;
      }
      return "pcs";
    };

    // Helper function to recursively traverse and collect raw materials
    const traverseRawMaterials = (node, level = 0, parentName = "") => {
      if (node.childType === "raw_material") {
        const entry = {
          level: level,
          code: node.childItemId || "-",
          description: node.childName || "",
          type: "raw_material",
          category: node.category, // raw materials usually don't have category
          parentProduct: parentName,
          productionCenter: node.productionCenter || targetCenter,
          unit: node.unit || "pcs",
          qty: node.quantity || 0,
          unitCost: node.unitCost || 0,
          totalCost: node.totalCost || 0,
          isRawMaterial: true,
          plannedQuantity: null, // Raw materials don't have plannedQuantity
        };
        result.push(entry);
      }

      // Traverse children recursively
      if (node.children && node.children.length > 0) {
        const currentName =
          node.childName || node.productName || node.semiProductName;
        node.children.forEach((child) => {
          traverseRawMaterials(child, level + 1, currentName);
        });
      }
    };

    // Process consolidated products for the target center
    if (selectedRequest.consolidatedProducts) {
      selectedRequest.consolidatedProducts.forEach((semiProduct) => {
        if (semiProduct.productionCenter === targetCenter) {
          // Add the semi-product itself
          const semiProductEntry = {
            level: 0,
            code: semiProduct.semiProductId,
            description: semiProduct.semiProductName,
            type: "semi-product",
            category: semiProduct.category,
            parentProduct: "",
            productionCenter: semiProduct.productionCenter,
            unit: deriveUnitForSemiProduct(semiProduct),
            qty: semiProduct.totalRequiredQty || 0,
            unitCost: 0,
            totalCost: 0,
            isRawMaterial: false,
            plannedQuantity: semiProduct.totalRequiredQty || null,
          };
          result.push(semiProductEntry);

          // Add usage breakdown for this semi-product
          if (
            semiProduct.usageBreakdown &&
            semiProduct.usageBreakdown.length > 0
          ) {
            semiProduct.usageBreakdown.forEach((usage, index) => {
              // Find plannedQuantity from summaryProducts for the product that uses this
              const plannedQty = findPlannedQuantity(usage.usedFor);
              const usageEntry = {
                level: 1,
                code: `USAGE-${semiProduct.semiProductId}-${index}`,
                description: usage.usedFor,
                type: "usage",
                category: usage.semiProduct?.category,
                parentProduct: semiProduct.semiProductName,
                productionCenter: semiProduct.productionCenter,
                unit: usage.unit || "pcs",
                qty: usage.quantityUsed || 0,
                unitCost: 0,
                totalCost: 0,
                isRawMaterial: false,
                plannedQuantity: plannedQty,
              };
              result.push(usageEntry);
            });
          }

          // Add raw materials for this semi-product (no separate header)
          if (semiProduct.children && semiProduct.children.length > 0) {
            // Directly add the raw materials under the semi-product
            semiProduct.children.forEach((child) => {
              traverseRawMaterials(child, 2, semiProduct.semiProductName);
            });
          }
        }
      });
    }

    // Process summary products for the target center
    if (selectedRequest.summaryProducts) {
      selectedRequest.summaryProducts.forEach((product) => {
        if (product.productionCenter === targetCenter) {
          const productEntry = {
            level: 0,
            code: product.productId || "-",
            description: product.productName,
            type: "product",
            category: product.category,
            parentProduct: "",
            productionCenter: product.productionCenter,
            unit: "ea",
            qty: product.plannedQuantity || 0,
            unitCost: 0,
            totalCost: 0,
            isRawMaterial: false,
            plannedQuantity: product.plannedQuantity || null,
          };
          result.push(productEntry);

          // Add raw materials for this product
          if (product.children && product.children.length > 0) {
            product.children.forEach(child => traverseRawMaterials(child, 1, product.productName));
          }
        }
      });
    }

    // Fallback to old structure if new structure is not available
    if (selectedRequest.products && result.length === 0) {
      selectedRequest.products.forEach((product) => {
        if (hasProductionCenter(product, targetCenter)) {
          traverseRawMaterials(product, 0, "");
        }
      });
    }

    return result;
  };

  const handlePrint = (centerName) => {
    if (!selectedRequest) {
      toast.error("No request selected for printing");
      return;
    }

    // Use the passed centerName or fallback to activeTab
    const targetCenter = centerName || getCenterNameFromTab(activeTab);

    // Build report rows per target center
    let reportData = [];
    if (targetCenter === "Store") {
      const prods = getAllProductsByCenter(
        selectedRequest.products,
        targetCenter
      );
      reportData = prods.map((p) => ({
        code: p.productId,
        description: p.parentProductName
          ? `${p.parentProductName} -> ${p.productName}`
          : p.productName,
        brand: "Product",
        unit: "pcs",
        qty: p.plannedQuantity || 0,
        issuedTo: "", // Empty as requested
        actualProduction: "", // Empty as requested
        wastage: "", // Empty as requested
        purpose: `${selectedRequest.planName || "Production Plan"
          } - ${targetCenter}`,
      }));
    } else {
      // Use new structure if available, fallback to old structure
      const raws = selectedRequest.consolidatedProducts
        ? getRawMaterialsFromConsolidatedProducts(
          selectedRequest.consolidatedProducts,
          targetCenter
        )
        : getRawMaterialsByCenter(selectedRequest.products, targetCenter);

      // Determine the corresponding mini store name for the target center
      const miniStoreNameForCenter = getMiniStoreNameForCenter(targetCenter);

      reportData = raws.map((m) => {
        const miniStoreQty = Array.isArray(m.miniStoreAvailability)
          ? m.miniStoreAvailability.find(
            (ms) => ms.miniStoreName === miniStoreNameForCenter
          )?.availableQty ?? 0
          : 0;

        return {
          code: m.childItemId,
          description: m.childName,
          brand: "Raw Material",
          unit: m.unit || "pcs",
          qty: m.quantity || 0,
          miniStoreQty, // For printing Mini Store QTY column
          issuedTo: "", // Empty as requested
          actualProduction: "", // Empty as requested
          wastage: "", // Empty as requested
          purpose: `${selectedRequest.planName || "Production Plan"
            } - ${targetCenter}`,
        };
      });
    }

    // Extract tree data for the specific center
    const treeData = extractTreeDataForCenter(selectedRequest, targetCenter);

    const currentDate = new Date().toLocaleDateString();

    const receivingDept = `${targetCenter} Department`;

    const report = (
      <GINReport
        dept_name="Store Department"
        date={currentDate}
        receiving={receivingDept}
        title="Goods Issue Note"
        companyName="Bakery Outlet"
        data={reportData}
        treeData={treeData}
      />
    );

    console.log("Printing report for center:", targetCenter);
    console.log("Report data:", reportData);
    console.log("Tree data:", treeData);

    printReactReport(
      report,
      `Goods Issue Note - ${selectedRequest.id} - ${targetCenter}`
    );
  };

  // Helper function to recursively get all production centers
  const getProductionCenters = (node) => {
    const centers = new Set();

    const traverse = (item) => {
      if (item.productionCenter) {
        centers.add(item.productionCenter);
      }
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(traverse);
      }
    };

    traverse(node);
    return Array.from(centers);
  };

  // Helper function to check if tree contains any items for a production center
  const hasProductionCenter = (node, center) => {
    // Check if this node matches
    if (node.productionCenter === center) {
      return true;
    }

    // Check children recursively
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => hasProductionCenter(child, center));
    }

    return false;
  };

  // Helper function to extract ALL product nodes by production center (top-level and nested)
  const getAllProductsByCenter = (products, center) => {
    if (!products || products.length === 0) return [];

    const results = [];

    const collect = (node, parentProductName = null) => {
      const isProductNode = node.childType === "product" || !!node.productId;
      const nodeCenter = node.productionCenter;

      if (isProductNode && nodeCenter === center) {
        results.push({
          productId: node.productId || node.childItemId,
          productName: node.productName || node.childName,
          plannedQuantity: node.plannedQuantity ?? node.quantity ?? 0,
          productionCenter: nodeCenter,
          expireDate: node.expireDate || node.expiryDate || null,
          currentStock: node.currentStock ?? null,
          miniStoreAvailability: node.miniStoreAvailability || [],
          unitCost: node.unitCost ?? null,
          totalCost: node.totalCost ?? null,
          parentProductName: parentProductName,
        });
      }

      if (node.children && Array.isArray(node.children)) {
        const nextParentName = isProductNode
          ? node.productName || node.childName || parentProductName
          : parentProductName;
        node.children.forEach((child) => collect(child, nextParentName));
      }
    };

    products.forEach((p) => collect(p, null));
    return results;
  };

  // Helper function to get summary products by production center (new structure)
  const getSummaryProductsByCenter = (summaryProducts, center) => {
    if (!summaryProducts || summaryProducts.length === 0) return [];

    return summaryProducts.filter(
      (product) => product.productionCenter === center
    );
  };

  // Helper function to extract raw materials by production center with consolidation
  const getRawMaterialsByCenter = (products, center) => {
    if (!products || products.length === 0) return [];

    const rawMaterialsMap = new Map();

    const extractRawMaterials = (node) => {
      if (
        node.childType === "raw_material" &&
        node.productionCenter === center
      ) {
        const key = node.childItemId;

        if (rawMaterialsMap.has(key)) {
          // Consolidate with existing raw material
          const existing = rawMaterialsMap.get(key);
          existing.quantity = (existing.quantity || 0) + (node.quantity || 0);
          existing.totalCost =
            (existing.totalCost || 0) + (node.totalCost || 0);

          // Update miniStoreAvailability by summing quantities
          if (node.miniStoreAvailability && existing.miniStoreAvailability) {
            const availabilityMap = new Map();

            // Add existing availability
            existing.miniStoreAvailability.forEach((ms) => {
              availabilityMap.set(ms.miniStoreId, ms.availableQty || 0);
            });

            // Add new availability
            node.miniStoreAvailability.forEach((ms) => {
              const currentQty = availabilityMap.get(ms.miniStoreId) || 0;
              availabilityMap.set(
                ms.miniStoreId,
                currentQty + (ms.availableQty || 0)
              );
            });

            // Convert back to array
            existing.miniStoreAvailability = Array.from(
              availabilityMap.entries()
            ).map(([miniStoreId, availableQty]) => ({
              miniStoreId,
              miniStoreName:
                existing.miniStoreAvailability.find(
                  (ms) => ms.miniStoreId === miniStoreId
                )?.miniStoreName ||
                node.miniStoreAvailability.find(
                  (ms) => ms.miniStoreId === miniStoreId
                )?.miniStoreName ||
                "Unknown Store",
              availableQty,
            }));
          }
        } else {
          // Add new raw material
          const totalBatchStock = Array.isArray(node.batches)
            ? node.batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
            : 0;

          rawMaterialsMap.set(key, {
            childItemId: node.childItemId,
            childName: node.childName,
            childType: node.childType,
            quantity: node.quantity,
            unit: node.unit,
            unitCost: node.unitCost,
            totalCost: node.totalCost,
            productionCenter: node.productionCenter,
            miniStoreAvailability: node.miniStoreAvailability || [],
            expireDate: node.expireDate || node.expiryDate || null,
            currentStock: Math.max(node.currentStock || 0, totalBatchStock),
            batches: node.batches || [],
          });
        }
      }

      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => extractRawMaterials(child));
      }
    };

    products.forEach((product) => {
      extractRawMaterials(product);
    });

    return Array.from(rawMaterialsMap.values());
  };

  // Helper function to get raw materials from consolidated products by production center (new structure)
  const getRawMaterialsFromConsolidatedProducts = (
    consolidatedProducts,
    center
  ) => {
    if ((!consolidatedProducts || consolidatedProducts.length === 0) && (!selectedRequest?.rawMaterials || selectedRequest.rawMaterials.length === 0)) return [];

    const rawMaterialsMap = new Map();

    // Recursive function to extract raw materials from nested children
    const extractRawMaterials = (node) => {
      if (node.childType === "raw_material" && node.childItemId) {
        const key = node.childItemId;

        if (rawMaterialsMap.has(key)) {
          // Consolidate with existing raw material
          const existing = rawMaterialsMap.get(key);
          existing.quantity = (existing.quantity || 0) + (node.quantity || 0);
          existing.totalCost =
            (existing.totalCost || 0) + (node.totalCost || 0);
        } else {
          // Add new raw material
          const totalBatchStock = Array.isArray(node.batches)
            ? node.batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
            : 0;

          rawMaterialsMap.set(key, {
            childItemId: node.childItemId,
            childName: node.childName,
            childType: node.childType,
            quantity: node.quantity,
            unit: node.unit,
            unitCost: node.unitCost,
            totalCost: node.totalCost,
            productionCenter: node.productionCenter || center,
            miniStoreAvailability: node.miniStoreAvailability || [],
            expireDate: node.expireDate || null,
            currentStock: Math.max(node.currentStock || 0, totalBatchStock),
            batches: node.batches || [],
          });
        }
      }

      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => extractRawMaterials(child));
      }
    };

    if (consolidatedProducts && Array.isArray(consolidatedProducts)) {
      consolidatedProducts.forEach((semiProduct) => {
        const matchesCenter = !semiProduct.productionCenter || 
                              semiProduct.productionCenter === center || 
                              semiProduct.productionCenter === "Unknown";
        if (matchesCenter && semiProduct.children) {
          semiProduct.children.forEach((child) => {
            extractRawMaterials(child);
          });
        }
      });
    }

    if (selectedRequest?.rawMaterials && Array.isArray(selectedRequest.rawMaterials)) {
      selectedRequest.rawMaterials.forEach((rm) => {
        const matchesCenter = !rm.productionCenter || rm.productionCenter === center;
        if (matchesCenter) {
          const key = rm.rawMaterialId || rm.childItemId;
          if (key && !rawMaterialsMap.has(key)) {
            const totalBatchStock = Array.isArray(rm.batches)
              ? rm.batches.reduce((sum, b) => sum + (b.currentStock || 0), 0)
              : 0;
            rawMaterialsMap.set(key, {
              childItemId: key,
              childName: rm.rawMaterialName || rm.childName,
              childType: "raw_material",
              quantity: rm.plannedQuantity || rm.quantity || 0,
              unit: rm.unitOfMeasure || rm.unit || "pcs",
              unitCost: rm.unitCost || 0,
              totalCost: rm.totalCost || 0,
              productionCenter: rm.productionCenter || center,
              miniStoreAvailability: rm.miniStoreAvailability || [],
              expireDate: rm.expireDate || null,
              currentStock: Math.max(rm.currentStock || 0, totalBatchStock),
              batches: rm.batches || [],
            });
          }
        }
      });
    }

    return Array.from(rawMaterialsMap.values());
  };

  // Production Center Content Component
  const ProductionCenterContent = ({ centerName, activeTab }) => {
    // Combine summary products (top-level) and consolidated products (semi-finished products like curry & dough)
    const summaryProds = selectedRequest.summaryProducts
      ? getSummaryProductsByCenter(selectedRequest.summaryProducts, centerName)
      : [];

    const consolidatedProds = selectedRequest.consolidatedProducts
      ? selectedRequest.consolidatedProducts
          .filter((sp) => !sp.productionCenter || sp.productionCenter === centerName || sp.productionCenter === "Unknown")
          .map((sp) => ({
            productId: sp.semiProductId,
            productName: sp.semiProductName,
            plannedQuantity: sp.totalRequiredQty,
            unit: sp.unit || "pcs",
            productionCenter: sp.productionCenter || centerName,
            category: sp.category,
          }))
      : [];

    let products = [];
    if (selectedRequest.summaryProducts || selectedRequest.consolidatedProducts) {
      const combinedMap = new Map();
      summaryProds.forEach((p) => combinedMap.set(p.productId, p));
      consolidatedProds.forEach((sp) => {
        if (!combinedMap.has(sp.productId)) {
          combinedMap.set(sp.productId, sp);
        }
      });
      products = Array.from(combinedMap.values());
    } else {
      products = getAllProductsByCenter(selectedRequest.products, centerName);
    }

    const rawMaterials = selectedRequest.consolidatedProducts
      ? getRawMaterialsFromConsolidatedProducts(
        selectedRequest.consolidatedProducts,
        centerName
      )
      : getRawMaterialsByCenter(selectedRequest.products, centerName);

    const miniStoreName = getMiniStoreNameForCenter(centerName);

    // Sort products so Dough A shows first, then Bread Roll, then buns
    const sortedProducts = products
      .slice()
      .sort(
        (a, b) =>
          getPriorityScore(getNodeLabel(a)) - getPriorityScore(getNodeLabel(b))
      );

    // For workflow tree show selectedRequest.products sorted as well
    const sortedWorkflowProducts = (selectedRequest.products || [])
      .slice()
      .sort(
        (a, b) =>
          getPriorityScore(getNodeLabel(a)) - getPriorityScore(getNodeLabel(b))
      );

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[18px] font-[600] text-fg">
            {centerName} Materials
          </h3>
          <button
            onClick={() => handlePrint(centerName)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-[500] text-brand-fg bg-hover hover:bg-line rounded-md transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
        </div>

        {/* Products Table */}
        {products.length > 0 && (
          <div className="overflow-x-auto border border-line rounded-lg mb-4">
            <div className="bg-subtle px-4 py-3 border-b border-line">
              <h4 className="text-[16px] font-[600] text-fg">
                {centerName} Products
              </h4>
            </div>
            <table className="w-full">
              <thead className="bg-subtle">
                <tr>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Product ID
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Product Name
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Planned Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Production Center
                  </th>
                  {activeTab?.toLowerCase() === "store" && (
                    <>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                        Unit Cost
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                        Total Cost
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                        Expiry Date
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                        Store Available QTY
                      </th>
                      <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                        Issued QTY
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedProducts.map((product) => (
                  <tr key={product.productId} className="hover:bg-subtle">
                    <td className="py-3 px-4 text-[14px] text-fg font-[500]">
                      {product.productId}
                    </td>
                    <td className="py-3 px-4 text-[14px] text-fg font-[500]">
                      {product.parentProductName
                        ? `${product.parentProductName} -> ${product.productName}`
                        : product.productName}
                    </td>
                    <td className="py-3 px-4 text-[14px] text-fg font-[600]">
                      {product.plannedQuantity} {product.unit || "pcs"}
                    </td>
                    <td className="py-3 px-4 text-[14px] text-brand-fg font-[500]">
                      {product.productionCenter}
                    </td>
                    {activeTab?.toLowerCase() === "store" && (
                      <>
                        <td className="py-3 px-4 text-[14px] text-fg">
                          Rs. {Number(product.unitCost || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[14px] text-success font-[700]">
                          Rs. {Number(product.totalCost || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[14px] text-fg">
                          {product.expireDate || product.expiryDate || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-[14px] text-fg font-[600]">
                          {product.currentStock ?? 0}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={
                              product.miniStoreAvailability?.find((ms) =>
                                ms.miniStoreName?.toLowerCase().includes("pos")
                              )?.availableQty ?? 0
                            }
                            className="w-20 p-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] text-center"
                            placeholder="0"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Raw Materials Table */}
        {rawMaterials.length > 0 && (
          <div className="overflow-x-auto border border-line rounded-lg mb-4">
            <div className="bg-subtle px-4 py-3 border-b border-line">
              <h4 className="text-[16px] font-[600] text-fg">
                {centerName} Raw Materials
              </h4>
            </div>
            <table className="w-full">
              <thead className="bg-subtle">
                <tr>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Material ID
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Material Name
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Available Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Requested Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Mini Store Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] text-fg uppercase">
                    Issued QTY
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rawMaterials.map((material) => (
                  <React.Fragment key={material.childItemId}>
                    <tr className="hover:bg-subtle">
                      <td className="py-3 px-4 text-[14px] text-fg font-[500]">
                        {material.childItemId}
                      </td>
                      <td className="py-3 px-4 text-[14px] text-fg font-[500]">
                        {material.childName}
                      </td>
                      <td className="py-3 px-4 text-[14px] text-fg font-[600]">
                        {(Number(material.currentStock ?? 0)).toFixed(2)} {material.unit}
                      </td>
                      <td className="py-3 px-4 text-[14px] text-fg font-[600]">
                        {material.quantity} {material.unit}
                      </td>
                      <td className="py-3 px-4 text-[14px] text-fg font-[600]">
                        {getMiniStoreQuantityForCenter(material, centerName)} {material.unit}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max={material.currentStock ?? 0}
                          value={issuedQtyByMaterial[material.childItemId] ?? ""}
                          onChange={(e) =>
                            setIssuedQtyByMaterial((prev) => ({
                              ...prev,
                              [material.childItemId]: e.target.value,
                            }))
                          }
                          className="w-20 p-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] text-center"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Summary */}
        <div className="bg-subtle p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[16px] font-[600] text-fg">
              {centerName} Total Cost:
            </span>
            <span className="text-[18px] font-[700] text-success">
              Rs.
              {(
                rawMaterials.length > 0
                  ? rawMaterials.reduce((sum, m) => sum + (Number(m.totalCost) || ((Number(m.quantity) || 0) * (Number(m.unitCost) || 0)) || 0), 0)
                  : products.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Workflow Tree */}
        {selectedRequest.products && selectedRequest.products.length > 0 && (
          <div className="mt-6 space-y-6">
            {sortedWorkflowProducts.map((product) => {
              const hasCenterItems = hasProductionCenter(product, centerName);
              if (!hasCenterItems) return null;

              return (
                <div
                  key={product.productId}
                  className="border border-line rounded-lg overflow-hidden"
                >
                  <div className="bg-subtle px-4 py-3 border-b border-line">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[16px] font-[600] text-fg">
                        📋 {getNodeLabel(product)}
                      </h4>
                      <span className="text-[14px] font-[600] text-brand-fg">
                        Target: {product.plannedQuantity} pcs
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-surface">
                    <TreeNode node={product} level={0} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Recursive Tree Node Component
  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);

    const getIcon = () => {
      if (node.childType === "raw_material") return "📦";
      if (node.childType === "product") return "🎯";
      return "📋";
    };

    const getColor = () => {
      if (node.childType === "raw_material") return "text-success";
      return "text-brand-fg";
    };

    const nodeQuantity = node.quantity || node.plannedQuantity || 0;
    const nodeName = node.childName || node.productName;
    const nodeUnit = node.unit || "pcs";

    return (
      <div className="relative">
        <div
          className={`flex items-center gap-2 py-2 hover:bg-subtle border-l-2 ${level > 0 ? "border-line" : "border-transparent"
            }`}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-line rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-fg-secondary" />
              ) : (
                <ChevronRight size={16} className="text-fg-secondary" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <span className="text-[16px]">{getIcon()}</span>

          <div className="flex-1">
            <span className={`text-[14px] font-[500] ${getColor()}`}>
              {nodeName}
            </span>
            {node.productionCenter && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[12px] font-[500] bg-hover text-brand-fg">
                {node.productionCenter}
              </span>
            )}
          </div>

          <div className="flex gap-4 text-[13px] mr-4">
            <span className="font-[600] text-fg">
              {nodeQuantity} {nodeUnit}
            </span>
            {node.totalCost && (
              <span className="font-[600] text-success min-w-[100px] text-right">
                Rs. {Number(node.totalCost).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Render children recursively */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child, index) => (
              <TreeNode
                key={`${child.childItemId || child.productId}-${index}`}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Nested Material Component for Production Flow Structure
  const NestedMaterialComponent = ({ material, level = 0 }) => {
    const hasChildren = material.children && material.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);
    const [showBatchInfo, setShowBatchInfo] = useState(false);

    const getIcon = () => {
      if (material.childType === "raw_material") return "📦";
      if (material.childType === "product") return "🎯";
      return "📋";
    };

    const getBackgroundColor = () => {
      if (level === 0) return "bg-subtle";
      if (level === 1) return "bg-subtle";
      return "bg-hover";
    };

    const getBorderColor = () => {
      if (level === 0) return "border-line";
      if (level === 1) return "border-brand/20";
      return "border-brand/20";
    };

    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between p-2 rounded border ${getBackgroundColor()} ${getBorderColor()}`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-line rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-fg-secondary" />
                ) : (
                  <ChevronRight size={14} className="text-fg-secondary" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}

            <span className="text-[14px]">{getIcon()}</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-[500] text-fg">
                  {material.childName}
                </span>
                <span className="text-[12px] text-fg-secondary">
                  ({material.childItemId})
                </span>
                {material.productionCenter && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[12px] font-[500] bg-hover text-brand-fg">
                    {material.productionCenter}
                  </span>
                )}
              </div>

              {/* Added: Mini Store and Batch info toggle for raw materials */}
              {material.childType === "raw_material" && (
                <div className="flex items-center gap-3 mt-0.5">
                  <button
                    onClick={() => setShowBatchInfo(!showBatchInfo)}
                    className="text-[12px] text-brand-fg hover:underline font-[500]"
                  >
                    {showBatchInfo ? "Hide Details" : "Show Availability & Batches"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="font-[600] text-fg">
              {material.quantity} {material.unit}
            </span>
            {material.totalCost > 0 && (
              <span className="font-[600] text-success">
                Rs. {Number(material.totalCost).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Added: Expanded Details Section */}
        {showBatchInfo && material.childType === "raw_material" && (
          <div className="ml-8 p-3 bg-surface border border-line rounded-lg shadow-sm space-y-3" style={{ marginLeft: `${(level * 16) + 24}px` }}>
            {/* Mini Store Availability */}
            {material.miniStoreAvailability && material.miniStoreAvailability.some(ms => ms.availableQty > 0) && (
              <div>
                <p className="text-[12px] font-[700] text-fg-secondary uppercase mb-1">Local Store Availability:</p>
                <div className="flex flex-wrap gap-2">
                  {material.miniStoreAvailability.filter(ms => ms.availableQty > 0).map((ms, idx) => (
                    <span key={idx} className="text-[12px] bg-hover text-success border border-line px-2 py-0.5 rounded-full">
                      {ms.miniStoreName}: {ms.availableQty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Info */}
            {material.batches && material.batches.length > 0 && (
              <div>
                <p className="text-[12px] font-[700] text-fg-secondary uppercase mb-1">Batches:</p>
                <div className="space-y-1">
                  {material.batches.map((batch, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[12px] p-1.5 bg-subtle rounded border border-line">
                      <div className="flex items-center gap-3">
                        <span className="font-[600]">BN: {batch.batchNo || "N/A"}</span>
                        <span className="text-fg-secondary">|</span>
                        <span>Stock: <span className="font-[600] text-fg">{batch.currentStock}</span></span>
                      </div>
                      {batch.expireDate && (
                        <span className="text-error font-[500]">Exp: {new Date(batch.expireDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!material.batches || material.batches.length === 0) && (!material.miniStoreAvailability || !material.miniStoreAvailability.some(ms => ms.availableQty > 0)) && (
              <p className="text-[12px] text-fg-secondary italic">No detailed availability or batch info available</p>
            )}
          </div>
        )}

        {/* Render children recursively */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {material.children.map((child, index) => (
              <NestedMaterialComponent
                key={`${child.childItemId}-${index}`}
                material={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <StorekeeperSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StorekeeperNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              Manager Requests
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Process ingredient issuance and material transfer requests from
              managers
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by Request ID, Manager Name, or Type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px]"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                  size={16}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent text-[14px] bg-surface min-w-[120px]"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Issued">Issued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-fg">
                Manager Requests List
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-[12px] text-fg-secondary">
                  Showing {filteredRequests.length} of {managerRequests.length}{" "}
                  requests
                </span>
              </div>
            </div>

            {loading ? (
                <Loader variant="section" text="Loading requests..." />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-fg-secondary mb-4" />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  No requests found
                </p>
                <p className="text-[14px] text-fg-secondary">
                  {searchTerm || filterStatus !== "All"
                    ? "Try adjusting your search or filter criteria"
                    : "Manager requests will appear here when submitted"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Request Details
                      </th>
                      <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Request Type
                      </th>
                      <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Request Date
                      </th>
                      <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Time
                      </th>
                      {/* <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Priority
                      </th> */}
                      <th className="text-left py-3 text-[14px] font-[500] text-fg">
                        Status
                      </th>
                      <th className="text-center py-3 text-[14px] font-[500] text-fg">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-line hover:bg-subtle"
                      >
                        <td className="py-3">
                          <div>
                            <p className="text-[14px] font-[500] text-fg">
                              {request.planName || request.description || "Production Plan"}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              Plan ID: {request.planId || request.id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-[14px] font-[500] text-fg">
                            {request.requestType}
                          </p>
                          <p className="text-[12px] text-fg-secondary">
                            {request.createdBy || "Manager"}
                          </p>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-[14px] font-[500] text-fg">
                                {new Date(
                                  request.productionDate || request.requestDate
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-[12px] text-fg-secondary">
                                Cost: Rs.{" "}
                                {Number(
                                  request.totalEstimatedCost || 0
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-[14px] font-[500] text-fg">
                            {request.createdAt &&
                              request.createdAt.includes("T")
                              ? request.createdAt.split("T")[1].split(".")[0]
                              : "N/A"}
                          </p>
                        </td>
                        {/* <td className="py-3">
                          Priority hidden as requested
                        </td> */}
                        <td className="py-3">
                          <span
                            className={`text-[12px] px-3 py-1 rounded-full font-[500] flex items-center gap-1 w-fit ${request.status === "Pending"
                              ? "bg-hover text-warning"
                              : request.status === "Issued"
                                ? "bg-hover text-success"
                                : "bg-hover text-brand-fg"
                              }`}
                          >
                            {request.status === "Pending" && (
                              <Clock size={12} />
                            )}
                            {request.status === "Issued" && (
                              <CheckCircle size={12} />
                            )}
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-brand text-on-brand text-[12px] font-[500] rounded-lg hover:bg-brand-hover transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div>
                <h2 className="text-[20px] font-[600] text-fg">
                  {selectedRequest.planName || selectedRequest.description || "Production Plan Details"}
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  Plan ID: {selectedRequest.planId || selectedRequest.id}
                </p>
                <p className="text-[12px] text-fg-secondary mt-1">
                  Created by: {selectedRequest.createdBy || "Manager"} | Total
                  Cost: Rs.{" "}
                  {Number(selectedRequest.totalEstimatedCost || 0).toFixed(2)}
                </p>
              </div>
              <button aria-label="Close"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-subtle rounded-lg transition-colors"
              >
                <X size={20} className="text-fg-secondary" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Production Plan Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-subtle rounded-lg">
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Production Date
                  </p>
                  <p className="text-[14px] font-[600] text-fg">
                    {new Date(
                      selectedRequest.productionDate ||
                      selectedRequest.requestDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Created By
                  </p>
                  <p className="text-[14px] font-[600] text-fg">
                    {selectedRequest.createdBy || "Manager"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Total Estimated Cost
                  </p>
                  <p className="text-[14px] font-[600] text-success">
                    Rs.{" "}
                    {Number(selectedRequest.totalEstimatedCost || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-[500] text-fg-secondary mb-1">
                    Status
                  </p>
                  <p className="text-[14px] font-[600] text-brand-fg">
                    {selectedRequest.status}
                  </p>
                </div>
              </div>

              {/* Added: Remarks Section */}
              {/* {selectedRequest.remarks && (
                <div className="mb-6 p-4 bg-warning/10 border-l-4 border-warning/30 rounded-r-lg">
                  <p className="text-[12px] font-[700] text-warning uppercase mb-1 flex items-center gap-2">
                    <FileText size={16} /> Remarks/Notes
                  </p>
                  <p className="text-[14px] text-warning italic leading-relaxed">
                    "{selectedRequest.remarks}"
                  </p>
                </div>
              )} */}

              {/* Tabs Section */}
              <div className="mb-6">
                {/* Tab Headers */}
                <div className="border-b border-line mb-6">
                  <div className="flex gap-2 overflow-x-auto">
                    {productionCenters.map((center) => (
                      <button
                        key={center.id}
                        onClick={() => setActiveTab(center.centerName)}
                        className={`px-4 py-3 text-[12px] font-[500] border-b-2 transition-colors whitespace-nowrap ${activeTab === center.centerName
                          ? "border-brand-fg text-brand-fg bg-hover"
                          : "border-transparent text-fg-secondary hover:text-fg hover:bg-subtle"
                          }`}
                      >
                        {center.centerName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Tab Content */}
                {activeTab && (
                  <ProductionCenterContent
                    centerName={getCenterNameFromTab(activeTab)}
                    activeTab={activeTab}
                  />
                )}
              </div>

              {/* Production Flow Structure - NEW SECTION */}
              <div className="mb-6">
                <div className="bg-subtle px-4 py-3 border-b border-line rounded-t-lg">
                  <h4 className="text-[16px] font-[600] text-fg">
                    📋 Production Flow Structure -{" "}
                    {getCenterNameFromTab(activeTab)}
                  </h4>
                  <p className="text-[12px] text-fg-secondary mt-1">
                    Detailed breakdown of products and semi-products for{" "}
                    {getCenterNameFromTab(activeTab)}
                  </p>
                </div>

                <div className="border border-line rounded-b-lg p-4">
                  {(() => {
                    const currentCenter = getCenterNameFromTab(activeTab);

                    // Get summary products for this center and sort for priority
                    const centerProducts =
                      selectedRequest.summaryProducts?.filter(
                        (product) => product.productionCenter === currentCenter
                      ) || [];
                    const sortedCenterProducts = centerProducts
                      .slice()
                      .sort(
                        (a, b) =>
                          getPriorityScore(getNodeLabel(a)) -
                          getPriorityScore(getNodeLabel(b))
                      );

                    // Get consolidated products for this center and sort for priority
                    const centerConsolidatedProducts =
                      selectedRequest.consolidatedProducts?.filter(
                        (product) => product.productionCenter === currentCenter
                      ) || [];
                    const sortedCenterConsolidatedProducts =
                      centerConsolidatedProducts
                        .slice()
                        .sort(
                          (a, b) =>
                            getPriorityScore(getNodeLabel(a)) -
                            getPriorityScore(getNodeLabel(b))
                        );

                    return (
                      <div className="space-y-6">
                        {/* Summary Products */}
                        {sortedCenterProducts.map((product) => (
                          <div
                            key={product.productId}
                            className="border border-line rounded-lg overflow-hidden"
                          >
                            <div className="bg-subtle px-4 py-3 border-b border-line">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <h5 className="text-[16px] font-[600] text-fg">
                                    📋 {product.productName}
                                  </h5>
                                  <span className="text-[12px] text-fg-secondary font-[500]">
                                    Category: {product.category || "General"} | ID: {product.productId}
                                  </span>
                                </div>
                                <span className="text-[14px] font-[600] text-brand-fg">
                                  Target: {product.plannedQuantity}{" "}
                                  {product.unit}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-surface">
                              {/* Required Semi Products */}
                              {product.requiredSemiProducts &&
                                product.requiredSemiProducts.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="text-[14px] font-[600] text-fg mb-2">
                                      Required Semi Products:
                                    </h6>
                                    <div className="space-y-2">
                                      {product.requiredSemiProducts.map(
                                        (semiProduct, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center gap-4 p-2 bg-subtle rounded"
                                          >
                                            <span className="text-[14px] font-[500] text-fg">
                                              🎯 {semiProduct.semiProductName}
                                            </span>
                                            <span className="text-[14px] font-[600] text-brand-fg">
                                              {semiProduct.quantityUsed}{" "}
                                              {semiProduct.unit}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}

                        {/* Consolidated Products (Semi Products) */}
                        {sortedCenterConsolidatedProducts.map((semiProduct) => (
                          <div
                            key={semiProduct.semiProductId}
                            className="border border-line rounded-lg overflow-hidden"
                          >
                            <div className="bg-subtle px-4 py-3 border-b border-line">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <h5 className="text-[16px] font-[600] text-fg">
                                    🎯 {semiProduct.semiProductName}
                                  </h5>
                                  <span className="text-[12px] text-fg-secondary font-[500]">
                                    Category: {semiProduct.category || "General"} | ID: {semiProduct.semiProductId}
                                  </span>
                                </div>
                                <span className="text-[14px] font-[600] text-brand-fg">
                                  Total Required: {semiProduct.totalRequiredQty}{" "}
                                  {semiProduct.unit}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-surface">
                              {/* Usage Breakdown */}
                              {semiProduct.usageBreakdown &&
                                semiProduct.usageBreakdown.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="text-[14px] font-[600] text-fg mb-2">
                                      Usage Breakdown:
                                    </h6>
                                    <div className="space-y-1">
                                      {semiProduct.usageBreakdown.map(
                                        (usage, index) => (
                                          <div
                                            key={index}
                                            className="text-[13px] text-fg-secondary"
                                          >
                                            Used for: {usage.usedFor} -{" "}
                                            {usage.quantityUsed} {usage.unit}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Raw Materials and Nested Children */}
                              {semiProduct.children &&
                                semiProduct.children.length > 0 && (
                                  <div>
                                    <h6 className="text-[14px] font-[600] text-fg mb-2">
                                      Raw Materials:
                                    </h6>
                                    <div className="space-y-2">
                                      {semiProduct.children.map(
                                        (material, index) => (
                                          <NestedMaterialComponent
                                            key={index}
                                            material={material}
                                            level={0}
                                          />
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}

                        {centerProducts.length === 0 &&
                          centerConsolidatedProducts.length === 0 && (
                            <div className="text-center py-8 text-fg-secondary">
                              No products or materials found for {currentCenter}
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-t border-line">
              {/* FIFO Info */}
              <div className="flex items-center gap-2 text-[14px] text-fg-secondary">
                <AlertCircle size={16} />
                <span className="text-sm">
                  Materials will be issued based on FIFO (First In, First Out)
                  principle
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line hover:bg-subtle rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIssueMaterials}
                  disabled={selectedRequest?.status === "Issued" || selectedRequest?.rawStatus === "IN_PROGRESS"}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-[500] text-on-brand rounded-md transition-colors ${
                    selectedRequest?.status === "Issued" || selectedRequest?.rawStatus === "IN_PROGRESS"
                      ? "bg-neutral-solid cursor-not-allowed"
                      : "bg-brand hover:bg-brand-hover"
                  }`}
                >
                  <Save size={16} />
                  {selectedRequest?.status === "Issued" || selectedRequest?.rawStatus === "IN_PROGRESS"
                    ? "Materials Already Issued"
                    : "Issue Materials"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
