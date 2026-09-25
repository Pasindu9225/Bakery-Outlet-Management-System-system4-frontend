import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./SignIn";
import MainDashboard from "./MainDashboard";

import POSDashboard from "./POS/POSDashboard";
import POSGoodsEntry from "./POS/POSGoodsEntry";
import POSSales from "./POS/POSSales";
import POSReturns from "./POS/POSReturns";
import POSDayEnd from "./POS/POSDayEnd";
import POSReturnToStore from "./POS/POSReturnToStore";
import POSSpecialOrders from "./POS/POSSpecialOrders";
import POSTableBilling from "./POS/POSTableBilling";

import ManagerDashboard from "./Manager/ManagerDashboard";
import ManagerProductionPlanning from "./Manager/ManagerProductionPlanning";
import ManagerCreditOrders from "./Manager/ManagerCreditOrders";
import ManagerBakeryRequests from "./Manager/ManagerBakeryRequests";
import ManagerKitchenRequests from "./Manager/ManagerKitchenRequests";
import ManagerOutletDistribution from "./Manager/ManagerOutletDistribution";
import ManagerActualProduction from "./Manager/ManagerActualProduction";
import ManagerOutletStock from "./Manager/ManagerOutletStock";
import ManagerStockAdjustments from "./Manager/ManagerStockAdjustments";
import ManagerApprovalRequests from "./Manager/ManagerApprovalRequests";
import ManagerDiscountRules from "./Manager/ManagerDiscountRules";
import ManagerPromoCodes from "./Manager/ManagerPromoCodes";
import ManagerInformationBase from "./Manager/ManagerInformationBase";
import ManagerIouApprovals from "./Manager/ManagerIouApprovals";
import CustomerManagement from "./component/CustomerManagement";

import StorekeeperDashboard from "./Storekeeper/StorekeeperDashboard";
import StorekeeperManagerRequests from "./Storekeeper/StorekeeperManagerRequests";
import StorekeeperViewStore from "./Storekeeper/StorekeeperViewStore";
import StorekeeperCreatePO from "./Storekeeper/StorekeeperCreatePO";
import StorekeeperIngredientRequests from "./Storekeeper/StorekeeperIngredientRequests";
import StorekeeperGRN from "./Storekeeper/StorekeeperGRN";
import StorekeeperReturnMaterials from "./Storekeeper/StorekeeperReturnMaterials";
import StorekeeperStockAdjustments from "./Storekeeper/StorekeeperStockAdjustments";
import StorekeeperIouRequests from "./Storekeeper/StorekeeperIouRequests";

import AdminDashboard from "./Admin/AdminDashboard";
import AdminCreateUser from "./Admin/AdminCreateUser";
import AdminViewTrends from "./Admin/AdminViewTrends";
import AdminGenerateReports from "./Admin/AdminGenerateReports";
import AdminManageSuppliers from "./Admin/AdminManageSuppliers";
import AdminRawMaterials from "./Admin/AdminRawMaterials";
import AdminManageProducts from "./Admin/AdminManageProducts";
import AdminManageRecipes from "./Admin/AdminManageRecipes";
import AdminCreateBOM from "./Admin/AdminCreateBOM";
import AdminProductionCenter from "./Admin/AdminProductionCenter";
import AdminOutletManagement from "./Admin/AdminOutletManagement";
import AdminPromoCodes from "./Admin/AdminPromoCodes";
import AdminDiscountRules from "./Admin/AdminDiscountRules";
import AdminVerificationCodes from "./Admin/AdminVerificationCodes";
import AdminWastage from "./Admin/AdminWastage";
import AdminAuditLog from "./Admin/AdminAuditLog";
import AdminStockEntry from "./Admin/AdminStockEntry";
import AdminMpcRequests from "./Admin/AdminMpcRequests";

import BakeryProductionRequests from "./BakeryWorker/BakeryProductionRequests";
import BakeryGetIngredients from "./BakeryWorker/BakeryGetIngredients";
import BakeryPartialProduction from "./BakeryWorker/BakeryPartialProduction";
import BakeryProductionHistory from "./BakeryWorker/BakeryProductionHistory";
import BakeryStoreInventory from "./BakeryWorker/BakeryStoreInventory";

import KitchenProductionRequests from "./KitchenWorker/KitchenProductionRequests";
import KitchenGetIngredients from "./KitchenWorker/KitchenGetIngredients";
import KitchenTransferNote from "./KitchenWorker/KitchenTransferNote";
import KitchenReturnToStore from "./KitchenWorker/KitchenReturnToStore";
import KitchenStoreInventory from "./KitchenWorker/KitchenStoreInventory";

import BakeryWorkerDashboard from "./BakeryWorker/BakeryWorkerDashboard";
import KitchenWorkerDashboard from "./KitchenWorker/KitchenWorkerDashboard";
import MPCWorkerDashboard from "./MPCWorker/MPCWorkerDashboard";

import MISWastageDashboard from "./MISAdmin/MISWastageDashboard";
import MISSupplierOverview from "./MISAdmin/MISSupplierOverview";
import MISPurchasingTrends from "./MISAdmin/MISPurchasingTrends";

import FinanceSupplierLedger from "./Finance/FinanceSupplierLedger";
import FinanceOutstandingSummary from "./Finance/FinanceOutstandingSummary";
import FinanceSettlePayments from "./Finance/FinanceSettlePayments";
import FinanceReports from "./Finance/FinanceReports";

import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from "./ProfilePage";

import { Toaster } from "react-hot-toast";
import { toastOptions } from "./utils/toastTheme";

function App() {
  useEffect(() => {
    // 1. Keyboard shortcut listener
    const handleKeyDown = (e) => {
      const isK = e.key === "k" || e.key === "K" || e.code === "KeyK" || e.keyCode === 75;
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        
        const isVisible = (el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
          return el.offsetParent !== null || el.getBoundingClientRect().width > 0;
        };

        const allInputs = document.querySelectorAll("input");
        const searchInput = Array.from(allInputs).find((input) => {
          if (input.disabled || input.readOnly || !isVisible(input)) return false;
          
          const placeholder = input.getAttribute("placeholder") || "";
          if (placeholder.toLowerCase().includes("search")) return true;
          
          const id = input.id || "";
          const name = input.name || "";
          const type = input.type || "";
          const className = input.className || "";
          
          return (
            id.toLowerCase().includes("search") ||
            name.toLowerCase().includes("search") ||
            type.toLowerCase() === "search" ||
            className.toLowerCase().includes("search") ||
            (input.getAttribute("aria-label") && input.getAttribute("aria-label").toLowerCase().includes("search"))
          );
        });

        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 2. Dynamic Search Placeholder Updater
    const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
    const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

    const updatePlaceholders = () => {
      const allInputs = document.querySelectorAll("input");
      allInputs.forEach((input) => {
        const placeholder = input.getAttribute("placeholder");
        if (!placeholder) return;
        
        const isSearch = 
          placeholder.toLowerCase().includes("search") ||
          (input.id && input.id.toLowerCase().includes("search")) ||
          (input.name && input.name.toLowerCase().includes("search")) ||
          input.type === "search" ||
          (input.className && input.className.toLowerCase().includes("search"));

        if (isSearch) {
          if (!placeholder.includes("Ctrl+K") && !placeholder.includes("⌘K") && !placeholder.includes("Ctrl + K")) {
            const cleaned = placeholder.endsWith("...") 
              ? placeholder.slice(0, -3).trim() 
              : placeholder.trim();
            input.setAttribute("placeholder", `${cleaned} (${shortcutLabel})`);
          }
        }
      });
    };

    updatePlaceholders();

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          shouldUpdate = true;
          break;
        }
        if (mutation.type === "attributes" && mutation.attributeName === "placeholder") {
          const target = mutation.target;
          if (target && target.tagName === "INPUT") {
            const val = target.getAttribute("placeholder") || "";
            if (!val.includes("Ctrl+K") && !val.includes("⌘K") && !val.includes("Ctrl + K")) {
              shouldUpdate = true;
              break;
            }
          }
        }
      }
      if (shouldUpdate) {
        observer.disconnect();
        updatePlaceholders();
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["placeholder"],
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["placeholder"],
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <Toaster toastOptions={toastOptions} containerStyle={{ zIndex: 2147483647 }} position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* Module-Specific Login Portals */}
          <Route path="/" element={<Navigate to="/POS" replace />} />
          <Route path="/POS" element={<SignIn targetModule="POS" />} />
          <Route path="/pos" element={<SignIn targetModule="POS" />} />
          <Route path="/manager" element={<SignIn targetModule="MANAGER" />} />
          <Route path="/MANAGER" element={<SignIn targetModule="MANAGER" />} />
          <Route path="/admin" element={<SignIn targetModule="ADMIN" />} />
          <Route path="/ADMIN" element={<SignIn targetModule="ADMIN" />} />
          <Route path="/storekeeper" element={<SignIn targetModule="STOREKEEPER" />} />
          <Route path="/STOREKEEPER" element={<SignIn targetModule="STOREKEEPER" />} />
          <Route path="/bakery" element={<SignIn targetModule="BAKERY" />} />
          <Route path="/BAKERY" element={<SignIn targetModule="BAKERY" />} />
          <Route path="/kitchen" element={<SignIn targetModule="KITCHEN" />} />
          <Route path="/KITCHEN" element={<SignIn targetModule="KITCHEN" />} />
          <Route path="/mpc" element={<SignIn targetModule="MPC" />} />
          <Route path="/MPC" element={<SignIn targetModule="MPC" />} />
          <Route path="/finance" element={<SignIn targetModule="FINANCE" />} />
          <Route path="/FINANCE" element={<SignIn targetModule="FINANCE" />} />
          <Route path="/mis" element={<SignIn targetModule="MIS" />} />
          <Route path="/MIS" element={<SignIn targetModule="MIS" />} />
          
          {/* POS Routes (role '8') */}
          <Route
            path="/posDashboard"
            element={
              <ProtectedRoute allowedRoles={["8"]}>
                <POSDashboard />
              </ProtectedRoute>
            }
          />
          {/* ... other routes remain the same ... */}

        {/* Main Dashboard requires login for any user */}
        {/* <Route
          path="/mainDashboard"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="/mainDashboard"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        />

        {/* POS Routes (role '8') */}
        <Route
          path="/posDashboard"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posGoodsEntry"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSGoodsEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posSales"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSSales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posReturns"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSReturns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posDayEnd"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSDayEnd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posReturnToStore"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSReturnToStore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posSpecialOrders"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSSpecialOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posTableBilling"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <POSTableBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posCustomers"
          element={
            <ProtectedRoute allowedRoles={["8"]}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes (role '10') */}
        <Route
          path="/managerDashboard"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerProductionPlanning"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerProductionPlanning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerCreditOrders"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerCreditOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerActualProduction"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerActualProduction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerOutletStock"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerOutletStock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerBakeryRequests"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerBakeryRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerKitchenRequests"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerKitchenRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerOutletDistribution"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerOutletDistribution />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerStockAdjustments"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerStockAdjustments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerApprovalRequests"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerApprovalRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerInformationBase"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerInformationBase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerPromoCodes"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerPromoCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerIouApprovals"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerIouApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerCustomers"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />

        {/* Storekeeper Routes (role '09') */}
        <Route
          path="/storekeeperDashboard"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperDashboard />
            </ProtectedRoute>
          }
        // element={<StorekeeperDashboard />}
        />


        <Route
          path="/StorekeeperManagerRequests"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperManagerRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperViewStore"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperViewStore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperCreatePO"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperCreatePO />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperGRN"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperGRN />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperReturnMaterials"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperReturnMaterials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperStockAdjustments"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperStockAdjustments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/StorekeeperIOUPurchase"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperIouRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/storekeeperIngredientRequests"
          element={
            <ProtectedRoute allowedRoles={["9"]}>
              <StorekeeperIngredientRequests />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (role '##') */}
        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCreateUser"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminCreateUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminViewTrends"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminViewTrends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminGenerateReports"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminGenerateReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminManageSuppliers"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminManageSuppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminRawMaterials"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminRawMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminManageProducts"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminManageProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminManageRecipes"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminManageRecipes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCreateBOM"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminCreateBOM />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminProductionCenter"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminProductionCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminOutletManagement"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminOutletManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminPromoCodes"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminPromoCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminDiscountRules"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminDiscountRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminVerificationCodes"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminVerificationCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminWastage"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminWastage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminAuditLog"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminAuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCustomers"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminStockEntry"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminStockEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminMpcRequests"
          element={
            <ProtectedRoute allowedRoles={["1"]}>
              <AdminMpcRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/managerDiscountRules"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerDiscountRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managerPromoCodes"
          element={
            <ProtectedRoute allowedRoles={["10"]}>
              <ManagerPromoCodes />
            </ProtectedRoute>
          }
        />

        {/* BakeryWorker Module */}
        <Route path="/bakeryProductionRequests" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryProductionRequests /></ProtectedRoute>
        } />
        <Route path="/bakeryGetIngredients" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryGetIngredients /></ProtectedRoute>
        } />
        <Route path="/bakeryStoreInventory" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryStoreInventory /></ProtectedRoute>
        } />
        <Route path="/bakeryPartialProduction" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryPartialProduction /></ProtectedRoute>
        } />
        <Route path="/bakeryProductionHistory" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryProductionHistory /></ProtectedRoute>
        } />

        {/* KitchenWorker Module */}
        <Route path="/kitchenProductionRequests" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenProductionRequests /></ProtectedRoute>
        } />
        <Route path="/kitchenGetIngredients" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenGetIngredients /></ProtectedRoute>
        } />
        <Route path="/kitchenStoreInventory" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenStoreInventory /></ProtectedRoute>
        } />
        <Route path="/kitchenTransferNote" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenTransferNote /></ProtectedRoute>
        } />
        <Route path="/kitchenReturnToStore" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenReturnToStore /></ProtectedRoute>
        } />

        {/* Worker Dashboards */}
        <Route path="/bakeryWorkerDashboard" element={
          <ProtectedRoute allowedRoles={["12"]}><BakeryWorkerDashboard /></ProtectedRoute>
        } />
        <Route path="/kitchenWorkerDashboard" element={
          <ProtectedRoute allowedRoles={["13"]}><KitchenWorkerDashboard /></ProtectedRoute>
        } />
        <Route path="/mpcWorkerDashboard" element={
          <ProtectedRoute allowedRoles={["14"]}><MPCWorkerDashboard /></ProtectedRoute>
        } />

        {/* MISAdmin Module (role 1 = Admin; dedicated MIS Admin role can be added later) */}
        <Route path="/misWastageDashboard" element={
          <ProtectedRoute allowedRoles={["1", "20"]}><MISWastageDashboard /></ProtectedRoute>
        } />
        <Route path="/misSupplierOverview" element={
          <ProtectedRoute allowedRoles={["1", "20"]}><MISSupplierOverview /></ProtectedRoute>
        } />
        <Route path="/misPurchasingTrends" element={
          <ProtectedRoute allowedRoles={["1", "20"]}><MISPurchasingTrends /></ProtectedRoute>
        } />

        {/* Finance Module (role 15 = Finance Officer; 11 collides with WAITER sentinel in AdminUserService) */}
        <Route path="/financeIouApprovals" element={
          <ProtectedRoute allowedRoles={["1", "15", "FINANCE"]}><ManagerIouApprovals /></ProtectedRoute>
        } />
        <Route path="/financeSupplierLedger" element={
          <ProtectedRoute allowedRoles={["1", "15", "FINANCE"]}><FinanceSupplierLedger /></ProtectedRoute>
        } />
        <Route path="/financeOutstandingSummary" element={
          <ProtectedRoute allowedRoles={["1", "15"]}><FinanceOutstandingSummary /></ProtectedRoute>
        } />
        <Route path="/financeSettlePayments" element={
          <ProtectedRoute allowedRoles={["1", "15"]}><FinanceSettlePayments /></ProtectedRoute>
        } />
        <Route path="/financeReports" element={
          <ProtectedRoute allowedRoles={["1", "15"]}><FinanceReports /></ProtectedRoute>
        } />

        {/* Profile — accessible to all authenticated users */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["1", "8", "9", "10", "11", "12", "13", "14", "15", "20"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
