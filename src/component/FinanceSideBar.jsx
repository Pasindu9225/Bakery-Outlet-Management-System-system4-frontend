import React from "react";
import {
  BookOpen,
  CreditCard,
  BarChart2,
  FileText,
  ArrowLeft,
  LogOut,
  FileCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function FinanceSideBar({ sidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const financeNavigationItems = [
    {
      name: "IOU Approvals",
      icon: FileCheck,
      path: "/financeIouApprovals",
      color: "text-success",
    },
    {
      name: "Supplier Ledger",
      icon: BookOpen,
      path: "/financeSupplierLedger",
      color: "text-brand-fg",
    },
    {
      name: "Outstanding Summary",
      icon: BarChart2,
      path: "/financeOutstandingSummary",
      color: "text-plum",
    },
    {
      name: "Settle Payments",
      icon: CreditCard,
      path: "/financeSettlePayments",
      color: "text-info",
    },
    {
      name: "Financial Reports",
      icon: FileText,
      path: "/financeReports",
      color: "text-plum",
    },
  ];

  return (
    <div
      className={`fixed md:static z-[9999] top-0 left-0 h-screen transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="w-64 bg-surface shadow-lg h-screen flex flex-col">
        {/* Logo & Back Button */}
        <div className="p-4 border-b border-line flex items-center justify-between">
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

        {/* Finance Module Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-brand to-brand-hover text-on-brand">
          <h2 className="text-[16px] font-[600]">Finance Module</h2>
          <p className="text-[12px] text-on-brand/80">
            Payments & Ledger Management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 bg-subtle border-b border-line">
          <p className="text-[10px] font-[600] text-fg-secondary uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/financeSupplierLedger"}
              className="flex items-center gap-2 p-2 text-[11px] bg-surface rounded border hover:bg-brand/10 hover:border-brand/20 transition-colors"
            >
              <BookOpen size={14} className="text-brand-fg" />
              <span>Ledger</span>
            </NavLink>
            <NavLink
              to={"/financeSettlePayments"}
              className="flex items-center gap-2 p-2 text-[11px] bg-surface rounded border hover:bg-plum/10 hover:border-plum/30 transition-colors"
            >
              <CreditCard size={14} className="text-plum" />
              <span>Payments</span>
            </NavLink>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {financeNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] text-left ${
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
                        <span className="font-[500]">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-surface rounded-full"></div>
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
        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-fg">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Finance Officer"}
              </p>
              <p className="text-[12px] text-fg-secondary">
                {getRoleName(localStorage.getItem("userRole")) || "Finance Department"}
              </p>
            </div>
            <button
              className="p-1 text-fg-secondary hover:text-error transition-colors"
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