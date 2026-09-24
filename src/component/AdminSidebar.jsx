import React, { useState } from "react";
import {
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
      color: "text-green-600",
    },
    {
      name: "View Trends",
      icon: TrendingUp,
      path: "/adminViewTrends",
      color: "text-purple-600",
    },
    {
      name: "Generate Reports",
      icon: FileBarChart,
      path: "/adminGenerateReports",
      color: "text-orange-600",
    },
    {
      name: "Wastage",
      icon: Trash2,
      path: "/adminWastage",
      color: "text-red-600",
    },
    {
      name: "Customer Ledgers",
      icon: CreditCard,
      path: "/adminCustomers",
      color: "text-blue-600",
    },
    {
      name: "Promo Codes",
      icon: Tag,
      path: "/adminPromoCodes",
      color: "text-[#1366D9]",
    },
    {
      name: "Discount Rules",
      icon: Percent,
      path: "/adminDiscountRules",
      color: "text-[#7C3AED]",
    },
    {
      name: "Stock & Item Entry",
      icon: Package,
      path: "/adminStockEntry",
      color: "text-teal-600",
    },
    {
      name: "MPC Material Requests",
      icon: Layers,
      path: "/adminMpcRequests",
      color: "text-[#0F50AA]",
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
            to={"/adminDashboard"}
            className="p-2 text-[#667085] hover:bg-[#F0F1F3] rounded-lg transition-colors"
            title="Admin Dashboard"
          >
            <ArrowLeft size={18} />
          </NavLink>
        </div>

        {/* Module Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F50AA] to-[#1E40AF] text-white">
          <h2 className="text-[16px] font-[600]">Admin Module</h2>
          <p className="text-[12px] text-blue-100">
            System Management & Control
          </p>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 bg-[#F8F9FA] border-b border-[#E4E6EA]">
          <p className="text-[10px] font-[600] text-[#667085] uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/adminCreateUser"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <UserPlus size={14} className="text-green-600" />
              <span>Add User</span>
            </NavLink>
            <NavLink
              to={"/adminGenerateReports"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <FileText size={14} className="text-orange-600" />
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
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] ${
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

        {/* Admin Profile */}
        <div className="p-4 border-t border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-[#383E49]">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Admin"}
              </p>
              <p className="text-[12px] text-[#667085]">
                {getRoleName(localStorage.getItem("userRole")) || "Administrator"}
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
