import React from "react";
import SidebarCollapseButton from "./SidebarCollapseButton";
import {
  Calculator,
  Settings,
  FileText,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  Users,
  LogOut,
  BarChart3,
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
      color: "text-brand-fg",
    },
    {
      name: "Credit Orders",
      icon: CreditCard,
      path: "/managerCreditOrders",
      color: "text-plum",
    },
    {
      name: "Discount Management",
      icon: Tag,
      path: "/managerDiscountRules",
      color: "text-plum",
    },
    {
      name: "Promo Codes",
      icon: Tag,      
      path: "/managerPromoCodes",
      color: "text-success",
    },
    {
      name: "Cash Advances (IOU)",
      icon: FileText,
      path: "/managerIouApprovals",
      color: "text-warning",
    },
    {
      name: "Customers",
      icon: Users,
      path: "/managerCustomers",
      color: "text-brand-fg",
    },
  ];
  return (
    <div
      className={`fixed md:static z-[9999] top-0 left-0 h-screen transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="app-sidebar w-64 bg-surface shadow-lg h-screen flex flex-col">
        {/* Logo & Back Button */}
        <div className="sb-pad p-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="logo" className="logo-plate h-14 w-auto" />
          </div>
          <NavLink
            to={"/mainDashboard"}

            className="p-2 text-fg-secondary hover:bg-app rounded-lg transition-colors"
            title="Back to Main Dashboard"
          >
            <ArrowLeft size={18} />
          </NavLink>
        </div>

        {/* Manager Module Title */}
        <div className="sb-hide px-4 py-3 bg-gradient-to-r from-brand to-brand-hover text-on-brand">
          <h2 className="text-[16px] font-[600]">Manager Module</h2>
          <p className="text-[12px] text-on-brand/80">
            Approvals & Discount Management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="sb-hide px-4 py-3 bg-subtle border-b border-line">
          <p className="text-[12px] font-[600] text-fg-secondary uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/managerDiscountRules"}
              className="flex items-center gap-2 p-2 text-[12px] bg-surface rounded border hover:bg-success/10 hover:border-success/30 transition-colors"
            >
              <Tag size={14} className="text-success" />
              <span>Discounts</span>
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
                    title={item.name}
                    className={({ isActive }) =>
                      `sb-center flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] text-left ${
                        isActive
                          ? "bg-brand text-on-brand shadow-sm"
                          : "text-fg-secondary hover:bg-app hover:text-fg"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={isActive ? "text-on-brand" : item.color}
                        />
                        <span className="sb-hide font-[500]">{item.name}</span>
                        {isActive && (
                          <div className="sb-hide ml-auto w-2 h-2 bg-surface rounded-full"></div>
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
        <SidebarCollapseButton />
        <div className="sb-pad p-4 border-t border-line">
          <div className="sb-center flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="sb-hide flex-1 overflow-hidden">
              <p className="text-[14px] font-[600] text-fg truncate">
                {localStorage.getItem("firstName") && localStorage.getItem("firstName") !== "null"
                  ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Manager"}
              </p>
              <p className="text-[12px] text-fg-secondary font-[500]">
                {getRoleName(localStorage.getItem("userRole")) || "Manager"}
              </p>
            </div>
            <button
              className="sb-hide p-1 text-fg-secondary hover:text-error transition-colors"
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
