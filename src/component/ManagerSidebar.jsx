import React from "react";
import {
  Calendar,
  Calculator,
  Factory,
  ChefHat,
  Store,
  History,
  ClipboardCheck,
  Settings,
  FileText,
  ArrowLeft,
  LayoutDashboard,
  Package2,
  TrendingUp,
  Users,
  LogOut,
  BarChart3,
  UserCheck,
  Tag,
  CreditCard
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function ManagerSidebar({ sidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const managerNavigationItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/managerDashboard",
      color: "text-blue-600",
    },
    {
      name: "Production Planning",
      icon: Calendar,
      path: "/managerProductionPlanning",
      color: "text-blue-600",
    },
    {
      name: "Credit Orders",
      icon: CreditCard,
      path: "/managerCreditOrders",
      color: "text-purple-600",
    },
    {
      name: "Bakery Requests",
      icon: Factory,
      path: "/managerBakeryRequests",
      color: "text-orange-600",
    },
    {
      name: "Kitchen Requests",
      icon: ChefHat,
      path: "/managerKitchenRequests",
      color: "text-red-600",
    },
    {
      name: "Outlet Distribution",
      icon: Store,
      path: "/managerOutletDistribution",
      color: "text-purple-600",
    },
    {
      name: "Actual Production",
      icon: Store,
      path: "/managerActualProduction",
      color: "text-green-600",
    },
    {
      name: "Outlet Stock",
      icon: Store,
      path: "/managerOutletStock",
      color: "text-indigo-600",
    },
    {
      name: "Stock Adjustments",
      icon: ClipboardCheck,
      path: "/managerStockAdjustments",
      color: "text-cyan-600",
    },
    {
      name: "Manager Approval",
      icon: UserCheck,
      path: "/managerApprovalRequests",
      color: "text-cyan-600",
    },
    {
      name: "Store Info Base",
      icon: Package2,
      path: "/managerInformationBase",
      color: "text-amber-600",
    },
    {
      name: "Discount Management",
      icon: Tag,
      path: "/managerDiscountRules",
      color: "text-indigo-600",
    },
    {
      name: "Promo Codes",
      icon: Tag,      
      path: "/managerPromoCodes",
      color: "text-green-600",
    },
    {
      name: "IOU Approvals",
      icon: FileText,
      path: "/managerIouApprovals",
      color: "text-amber-600",
    },
    {
      name: "Customers",
      icon: Users,
      path: "/managerCustomers",
      color: "text-blue-600",
    },
  ];
  return (
    <div
      className={`fixed md:static z-[9999] top-0 left-0 h-screen transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
        {/* Logo & Back Button */}
        <div className="p-4 border-b border-[#E4E6EA] flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="logo" className="h-14 w-auto" />
          </div>
          <NavLink
            to={"/mainDashboard"}

            className="p-2 text-[#667085] hover:bg-[#F0F1F3] rounded-lg transition-colors"
            title="Back to Main Dashboard"
          >
            <ArrowLeft size={18} />
          </NavLink>
        </div>

        {/* Manager Module Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F50AA] to-[#1E40AF] text-white">
          <h2 className="text-[16px] font-[600]">Manager Module</h2>
          <p className="text-[12px] text-blue-100">
            Production & Distribution Management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 bg-[#F8F9FA] border-b border-[#E4E6EA]">
          <p className="text-[10px] font-[600] text-[#667085] uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/managerProductionPlanning"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <Calendar size={14} className="text-blue-600" />
              <span>New Plan</span>
            </NavLink>
            <NavLink
              to={"/managerOutletDistribution"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <Store size={14} className="text-green-600" />
              <span>Distribution</span>
            </NavLink>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {managerNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] text-left ${
                        isActive
                          ? "bg-[#0F50AA] text-white shadow-sm"
                          : "text-[#667085] hover:bg-[#F0F1F3] hover:text-[#383E49]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={isActive ? "text-white" : item.color}
                        />
                        <span className="font-[500]">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1 overflow-hidden">
              <p className="text-[14px] font-[600] text-[#383E49] truncate">
                {localStorage.getItem("firstName") && localStorage.getItem("firstName") !== "null"
                  ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Manager"}
              </p>
              <p className="text-[12px] text-[#667085] font-[500]">
                {getRoleName(localStorage.getItem("userRole")) || "Manager"}
              </p>
            </div>
            <button
              className="p-1 text-[#667085] hover:text-red-500 transition-colors"
              onClick={onLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
