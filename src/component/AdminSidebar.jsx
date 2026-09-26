import React, { useState } from "react";
import SidebarCollapseButton from "./SidebarCollapseButton";
import {
  ScrollText,
  TrendingUp,
  FileText,
  Package,
  BookOpen,
  Boxes,
  UserPlus,
  BarChart3,
  FileBarChart,
  Truck,
  ArrowLeft,
  LogOut,
  Factory,
  Store,
  Tag,
  Percent,
  ShieldCheck,
  CreditCard,
  Trash2,
  UserCircle2,
  Layers,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function AdminSidebar({ sidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };
  const adminNavigationItems = [
    {
      name: "Create Users",
      icon: UserPlus,
      path: "/adminCreateUser",
      color: "text-success",
    },
    {
      name: "View Trends",
      icon: TrendingUp,
      path: "/adminViewTrends",
      color: "text-plum",
    },
    {
      name: "Generate Reports",
      icon: FileBarChart,
      path: "/adminGenerateReports",
      color: "text-warning",
    },
    {
      name: "Wastage",
      icon: Trash2,
      path: "/adminWastage",
      color: "text-error",
    },
    {
      name: "Audit Log",
      icon: ScrollText,
      path: "/adminAuditLog",
      color: "text-fg",
    },
    {
      name: "Customer Ledgers",
      icon: CreditCard,
      path: "/adminCustomers",
      color: "text-brand-fg",
    },
    {
      name: "Promo Codes",
      icon: Tag,
      path: "/adminPromoCodes",
      color: "text-brand-fg",
    },
    {
      name: "Discount Rules",
      icon: Percent,
      path: "/adminDiscountRules",
      color: "text-plum",
    },
    {
      name: "Stock & Item Entry",
      icon: Package,
      path: "/adminStockEntry",
      color: "text-success",
    },
    {
      name: "MPC Material Requests",
      icon: Layers,
      path: "/adminMpcRequests",
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
            to={"/adminDashboard"}
            className="p-2 text-fg-secondary hover:bg-app rounded-lg transition-colors"
            title="Admin Dashboard"
          >
            <ArrowLeft size={18} />
          </NavLink>
        </div>

        {/* Module Title */}
        <div className="sb-hide px-4 py-3 bg-gradient-to-r from-brand to-brand-hover text-on-brand">
          <h2 className="text-[16px] font-[600]">Admin Module</h2>
          <p className="text-[12px] text-on-brand/80">
            System Management & Control
          </p>
        </div>

        {/* Quick Actions */}
        <div className="sb-hide px-4 py-3 bg-subtle border-b border-line">
          <p className="text-[12px] font-[600] text-fg-secondary uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/adminCreateUser"}
              className="flex items-center gap-2 p-2 text-[12px] bg-surface rounded border hover:bg-success/10 hover:border-success/30 transition-colors"
            >
              <UserPlus size={14} className="text-success" />
              <span>Add User</span>
            </NavLink>
            <NavLink
              to={"/adminGenerateReports"}
              className="flex items-center gap-2 p-2 text-[12px] bg-surface rounded border hover:bg-warning/10 hover:border-warning/30 transition-colors"
            >
              <FileText size={14} className="text-warning" />
              <span>Reports</span>
            </NavLink>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    title={item.name}
                    className={({ isActive }) =>
                      `sb-center flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] ${
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

        {/* Admin Profile */}
        <SidebarCollapseButton />
        <div className="sb-pad p-4 border-t border-line">
          <div className="sb-center flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="sb-hide flex-1">
              <p className="text-[14px] font-[500] text-fg">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Admin"}
              </p>
              <p className="text-[12px] text-fg-secondary">
                {getRoleName(localStorage.getItem("userRole")) || "Administrator"}
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
