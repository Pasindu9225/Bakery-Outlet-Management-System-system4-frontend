import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { confirmDialog } from "../component/ConfirmDialog";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  ChefHat,
  Send,
  Eye,
  Edit3,
  Save,
  RefreshCw,
  Download,
  FileText,
  Printer,
  Search,
  Filter,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  History,
  PlayCircle,
  PauseCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Truck,
  Store,
  User,
  Bell,
  Utensils,
  Receipt,
  ShoppingCart,
  MapPin,
  Building2,
  ArrowRight,
  CheckSquare,
} from "lucide-react";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function ManagerOutletDistribution() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Outlet Distribution");
  const [showEditSection, setShowEditSection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [distributions, setDistributions] = useState([]);
  const [loadingDistributions, setLoadingDistributions] = useState(true);
  const [distributionsError, setDistributionsError] = useState(null);

  // Production plans from backend
  const [productionPlans, setProductionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Outlets from backend
  const [outlets, setOutlets] = useState([]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [outletsError, setOutletsError] = useState(null);

  // Distribution quantities state
  const [distributionQty, setDistributionQty] = useState({});

  const [showProductListModal, setShowProductListModal] = useState(false);
  const [selectedDistributionForEdit, setSelectedDistributionForEdit] =
    useState(null);
  const [showOutletDistributionModal, setShowOutletDistributionModal] =
    useState(false);
  const [selectedProductForOutletEdit, setSelectedProductForOutletEdit] =
    useState(null);
  const [outletDistributions, setOutletDistributions] = useState({});
  const [tempOutletId, setTempOutletId] = useState("");
  const [tempQty, setTempQty] = useState("");

  // Open product list modal for editing distribution
  const openProductListModal = (distribution) => {
    setSelectedDistributionForEdit(distribution);
    setShowProductListModal(true);
  };

  // Open outlet distribution modal for specific product
  const openOutletDistributionModal = (product) => {
    setSelectedProductForOutletEdit(product);
    setShowOutletDistributionModal(true);
  };

  // Get total distributed quantity for a product across all outlets
  const getTotalDistributedQty = (productId) => {
    const distributions = outletDistributions[productId] || [];
    return distributions.reduce((sum, dist) => sum + dist.qty, 0);
  };

  // Get remaining quantity for outlet distribution
  const getRemainingQtyForDistribution = (product) => {
    return (
      product.distributedQty -
      getTotalDistributedQty(product.id || product.productId)
    );
  };

  // Add outlet distribution
  const addOutletDistribution = () => {
    console.log("Button clicked!");
    console.log("tempOutletId:", tempOutletId);
    console.log("tempQty:", tempQty);

    if (!tempOutletId || !tempQty || tempQty <= 0) {
      console.log("Validation failed: missing outlet or quantity");
      toast.error("Please select outlet and enter valid quantity");
      return;
    }

    const selectedOutlet = outlets.find(
      (outlet) => outlet.outletId == tempOutletId
    );
    console.log("selectedOutlet:", selectedOutlet);

    if (!selectedOutlet) {
      console.log("Outlet not found");
      toast.error("Outlet not found");
      return;
    }

    const remaining = getRemainingQtyForDistribution(
      selectedProductForOutletEdit
    );
    console.log("remaining:", remaining);

    if (parseInt(tempQty) > remaining) {
      toast.error(`Cannot exceed remaining quantity of ${remaining}`);
      return;
    }

    console.log("Adding distribution...");

    const newDistribution = {
      outletId: selectedOutlet.outletId,
      outletName: selectedOutlet.name,
      qty: parseInt(tempQty),
    };

    const productKey =
      selectedProductForOutletEdit.id || selectedProductForOutletEdit.productId;

    setOutletDistributions((prev) => ({
      ...prev,
      [productKey]: [...(prev[productKey] || []), newDistribution],
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

  const [filterDate, setFilterDate] = useState("");

  const getFilteredDistributions = () => {
    if (!filterDate) {
      return distributions; // Return all distributions if no filter date
    }

    return distributions.filter((distribution) => {
      const distributionDate = new Date(distribution.date).toDateString();
      const selectedDate = new Date(filterDate).toDateString();
      return distributionDate === selectedDate;
    });
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

        // Filter for APPROVED and SUBMITTED plans only
        const approvedPlans = plans.filter(
          (plan) => plan.status === "APPROVED" || plan.status === "SUBMITTED"
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

        console.log(
          `Fetching outlets from: ${process.env.REACT_APP_BASE_URL}/api/manager/distribution/outlets`
        );

        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/distribution/outlets`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

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

          // Throw error instead of using fallback data
          throw new Error(errorMessage);
        }

        const outletsData = await response.json();
        console.log("Outlet data structure:", outletsData);
        console.log("First outlet object:", outletsData[0]);
        setOutlets(outletsData);
        setOutletsError(null); // Clear any previous errors
      } catch (err) {
        console.error("Error fetching outlets:", err);

        // Set error state for network errors
        setOutletsError("Network error: " + err.message);
      } finally {
        setOutletsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  // Fetch distribution plans from backend
  useEffect(() => {
    const fetchDistributionPlans = async () => {
      try {
        setLoadingDistributions(true);
        setDistributionsError(null);

        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/manager/distribution/plans`,
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
        console.log("Distribution plans fetched:", plans);

        // Map backend response to match existing frontend structure
        const mappedDistributions = plans.map((plan) => ({
          id: `DIST-${plan.dpId}`,
          planId: plan.dpId,
          planName: plan.name,
          outletId: plan.outletId,
          outletName: plan.outletName,
          outletLocation: plan.outletName, // Using outletName as location since it contains the address
          date: plan.date,
          status: plan.status,
          isActive: plan.isActive,
          products: plan.items.map((item) => ({
            id: item.dpiId,
            productId: item.productId,
            productName: item.productName,
            distributedQty: item.qty,
            remainingQty: 0, // Not available in backend response
            quantity: item.qty, // For compatibility
          })),
          createdAt: new Date(plan.date),
          createdBy: "Manager", // Not available in backend response
        }));

        setDistributions(mappedDistributions);
      } catch (err) {
        console.error("Error fetching distribution plans:", err);
        setDistributionsError(err.message);
      } finally {
        setLoadingDistributions(false);
      }
    };

    fetchDistributionPlans();
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
      toast.error("Please select a production plan");
      return;
    }
    console.log(outlet);
    if (!outlet) {
      toast.error("Please select an outlet");
      return;
    }

    // Prepare data for backend POST request
    const distributionData = {
      name: `${plan.planName || "Unknown Plan"} - ${
        outlet.name || "Unknown Outlet"
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
      toast.success("Distribution plan saved successfully!");
    } catch (err) {
      toast.error(`Error saving distribution plan: ${err.message}`);
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

  // Delete distribution plan
  const deleteDistributionPlan = async (dpId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/distribution/plans/${dpId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Remove the deleted distribution from the distributions state
      setDistributions((prev) => prev.filter((dist) => dist.planId !== dpId));
      toast.success("Distribution plan deleted successfully!");
    } catch (error) {
      console.error("Failed to delete distribution plan:", error);
      toast.error("Failed to delete distribution plan. Please try again.");
    }
  };

  // Update distribution plan
  const updateDistributionPlan = async (dpId, updatedData) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/manager/distribution/plans/${dpId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      // Update the distribution in the state
      setDistributions((prev) =>
        prev.map((dist) =>
          dist.planId === dpId ? { ...dist, ...updatedData } : dist
        )
      );

      toast.success("Distribution plan updated successfully!");
      setShowProductListModal(false);
      return result;
    } catch (error) {
      console.error("Failed to update distribution plan:", error);
      toast.error("Failed to update distribution plan. Please try again.");
    }
  };



  // Product List Modal Component
  const ProductListModal = () => {
    if (!showProductListModal || !selectedDistributionForEdit) return null;

    return (
      <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-[600] text-fg">
                Edit Distribution
              </h3>
              <button
                onClick={() => setShowProductListModal(false)}
                className="p-2 hover:bg-app rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center gap-4 text-[14px] text-fg-secondary">
                <span>Outlet: {selectedDistributionForEdit.outletName}</span>
                <span>Date: {selectedDistributionForEdit.date}</span>
                <span>ID: {selectedDistributionForEdit.id}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-line rounded-lg">
                <thead className="bg-subtle">
                  <tr>
                    <th className="text-left py-3 px-4 text-[14px] font-[500] text-fg">
                      Product Name
                    </th>
                    <th className="text-center py-3 px-4 text-[14px] font-[500] text-fg">
                      Distributed Quantity
                    </th>
                    <th className="text-center py-3 px-4 text-[14px] font-[500] text-fg">
                      Unit
                    </th>
                    <th className="text-center py-3 px-4 text-[14px] font-[500] text-fg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDistributionForEdit.products.map((product) => (
                    <tr
                      key={product.id || product.productId}
                      className="border-t border-line"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-subtle">
                            <Package size={16} className="text-brand-fg" />
                          </div>
                          <div>
                            <p className="text-[14px] font-[500] text-fg">
                              {product.productName}
                            </p>
                            <p className="text-[12px] text-fg-secondary">
                              ID: {product.productId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-[600] text-fg">
                          {product.distributedQty || product.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] text-fg-secondary">
                          pieces
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openOutletDistributionModal(product)}
                          className="p-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Update Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  // Prepare update data in the exact format expected by backend
                  const items = selectedDistributionForEdit.products
                    .map((product) => {
                      const productKey = product.id || product.productId;
                      const dists = outletDistributions[productKey] || [];
                      const totalQty = dists.reduce(
                        (sum, dist) => sum + (parseInt(dist.qty) || 0),
                        0
                      );
                      const qtyToSend =
                        totalQty > 0
                          ? totalQty
                          : product.distributedQty || product.quantity || 0;
                      return {
                        productId: product.productId,
                        qty: qtyToSend,
                      };
                    })
                    .filter((item) => item.qty > 0);

                  const updateData = {
                    name: selectedDistributionForEdit.planName,
                    outletId: selectedDistributionForEdit.outletId,
                    date: selectedDistributionForEdit.date,
                    isActive: selectedDistributionForEdit.isActive,
                    status:
                      selectedDistributionForEdit.status || "not-received",
                    items,
                  };

                  console.log("Update Distribution PUT body:", updateData);
                  updateDistributionPlan(
                    selectedDistributionForEdit.planId,
                    updateData
                  );
                }}
                className="px-6 py-3 bg-success-solid text-on-brand rounded-lg hover:bg-success-solid transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Update Distribution Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Outlet Distribution Modal Component
  const OutletDistributionModal = () => {
    if (!showOutletDistributionModal || !selectedProductForOutletEdit)
      return null;

    return (
      <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-line">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-[600] text-fg">
                Manage Outlet Distribution -{" "}
                {selectedProductForOutletEdit?.productName}
              </h3>
              <button
                onClick={() => setShowOutletDistributionModal(false)}
                className="p-2 hover:bg-app rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Add Distribution Form */}
            <div className="bg-subtle rounded-lg p-4 mb-6">
              <h4 className="text-[16px] font-[600] text-fg mb-4">
                Add New Distribution
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-2">
                    Select Outlet
                  </label>
                  <select
                    value={tempOutletId}
                    onChange={(e) => setTempOutletId(e.target.value)}
                    className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg"
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
                  <label className="block text-[14px] font-[500] text-fg mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      selectedProductForOutletEdit
                        ? getRemainingQtyForDistribution(
                            selectedProductForOutletEdit
                          )
                        : 0
                    }
                    value={tempQty}
                    onChange={(e) => setTempQty(e.target.value)}
                    className="w-full px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-2">
                    Available
                  </label>
                  <div className="flex items-center h-10 px-4 py-2 bg-surface border border-line rounded-lg">
                    <span className="text-[14px] font-[600] text-success">
                      {selectedProductForOutletEdit
                        ? getRemainingQtyForDistribution(
                            selectedProductForOutletEdit
                          )
                        : 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addOutletDistribution}
                    className="w-full px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Distributions Table */}
            <div>
              <h4 className="text-[16px] font-[600] text-fg mb-4">
                Current Distributions
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-line rounded-lg">
                  <thead className="bg-subtle">
                    <tr>
                      <th className="text-left py-3 px-4 text-[14px] font-[500] text-fg">
                        Outlet
                      </th>
                      <th className="text-center py-3 px-4 text-[14px] font-[500] text-fg">
                        Quantity
                      </th>
                      <th className="text-center py-3 px-4 text-[14px] font-[500] text-fg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductForOutletEdit &&
                      outletDistributions[
                        selectedProductForOutletEdit.id ||
                          selectedProductForOutletEdit.productId
                      ]?.map((dist, index) => (
                        <tr key={index} className="border-t border-line">
                          <td className="py-3 px-4 text-[14px] text-fg">
                            {dist.outletName}
                          </td>
                          <td className="py-3 px-4 text-[14px] text-fg text-center">
                            {dist.qty}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() =>
                                removeOutletDistribution(
                                  selectedProductForOutletEdit.id ||
                                    selectedProductForOutletEdit.productId,
                                  index
                                )
                              }
                              className="p-1 text-error hover:bg-error/10 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {!selectedProductForOutletEdit ||
                      (!outletDistributions[
                        selectedProductForOutletEdit.id ||
                          selectedProductForOutletEdit.productId
                      ]?.length && (
                        <tr>
                          <td
                            colSpan="3"
                            className="py-6 text-center text-fg-secondary"
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
  };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg mb-1">
                Outlet Distribution
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Distribute production quantities to various outlets
              </p>
            </div>
          </div>

          {/* Distribution History */}

          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-hover">
                  <History size={20} className="text-warning" />
                </div>
                <h3 className="text-[18px] font-[600] text-fg">
                  Distribution History
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg focus:border-transparent outline-none text-[14px]"
                  placeholder="Filter by date"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="px-3 py-2 border border-line rounded-lg text-fg-secondary hover:bg-subtle flex items-center gap-1 transition-colors text-[13px] font-[500]"
                    title="Clear filter"
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {loadingDistributions ? (
                <Loader variant="section" text="Loading distribution plans..." />
              ) : distributionsError ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-error">
                    <AlertTriangle size={20} />
                    <span className="text-[14px]">
                      Error loading distributions: {distributionsError}
                    </span>
                  </div>
                </div>
              ) : getFilteredDistributions().length > 0 ? (
                getFilteredDistributions().map((distribution) => (
                  <div
                    key={distribution.id}
                    className="border border-line rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                      <div>
                        <h4 className="text-[16px] font-[600] text-fg">
                          {distribution.planName}
                        </h4>
                        <div className="flex items-center gap-4 text-[12px] text-fg-secondary mt-1">
                          <span>ID: {distribution.id}</span>
                          <span>Date: {distribution.date}</span>
                          <span>By: {distribution.createdBy}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-[500] ${
                              distribution.status === "not-received"
                                ? "bg-warning/10 text-warning"
                                : distribution.status === "received"
                                ? "bg-success/10 text-success"
                                : "bg-hover text-fg"
                            }`}
                          >
                            {distribution.status}
                          </span>
                        </div>
                      </div>

                      {/* Right-side controls */}
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        {/* Outlet */}
                        <div className="flex items-center gap-2 text-[14px] font-[500] text-fg">
                          <Store size={16} className="text-brand-fg" />
                          {distribution.outletName}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Edit
                            size={18}
                            className="text-brand-fg cursor-pointer"
                            onClick={() => openProductListModal(distribution)}
                          />
                          <Trash2
                            size={18}
                            className="text-error cursor-pointer"
                            onClick={async () => {
                              if (
                                await confirmDialog(
                                  "Are you sure you want to delete this distribution?", { confirmText: "Delete", danger: true }
                                )
                              ) {
                                deleteDistributionPlan(distribution.planId);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-subtle rounded p-3">
                      <p className="text-[12px] text-fg-secondary mb-2">
                        Distributed Products:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {distribution.products.map((product, index) => (
                          <span
                            key={index}
                            className="text-[12px] bg-surface px-2 py-1 rounded border"
                          >
                            {product.productName}: {product.distributedQty}{" "}
                            pieces
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-fg-secondary">
                  <p className="text-[14px]">
                    {filterDate
                      ? `No distributions found for ${new Date(
                          filterDate
                        ).toLocaleDateString()}`
                      : "No distribution history available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>



      {/* Product List Modal */}
      <ProductListModal />

      {/* Outlet Distribution Modal */}
      <OutletDistributionModal />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
