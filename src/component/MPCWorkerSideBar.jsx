import React from "react";
import SidebarCollapseButton from "./SidebarCollapseButton";
import {
  LayoutDashboard,
  FileText,
  Package,
  Layers,
  Clock,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function MPCWorkerSidebar({
  sidebarOpen,
  activeTab = "requestMaterials",
  setActiveTab,
  issuedCount = 0,
  pendingKotCount = 0,
}) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const mpcWorkerNavigationItems = [
    {
      id: "requestMaterials",
      name: "Production Plan & Request",
      icon: FileText,
      color: "text-brand-fg",
    },
    {
      id: "deliveries",
      name: "Deliveries & Acceptance",
      icon: Package,
      badge: issuedCount,
      color: "text-warning",
    },
    {
      id: "storeInventory",
      name: "MPC Store Inventory",
      icon: Layers,
      color: "text-success",
    },
    {
      id: "kots",
      name: "Kitchen Orders (KOT)",
      icon: Clock,
      badge: pendingKotCount,
      color: "text-plum",
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

        {/* MPC Worker Module Title */}
        <div className="sb-hide sb-hide px-4 py-3 bg-gradient-to-r from-brand to-brand-hover text-on-brand">
          <h2 className="text-[16px] font-[600]">MPC Worker Module</h2>
          <p className="text-[12px] text-on-brand/80">Mini Production Center</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-[12px] font-[600] text-fg-secondary uppercase tracking-wider mb-2 px-1">
            Module Navigation
          </div>
          <ul className="space-y-1">
            {mpcWorkerNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab && setActiveTab(item.id)}
                    title={item.name}
                    className={`sb-center flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] text-left ${
                      isActive
                        ? "bg-brand text-on-brand shadow-sm"
                        : "text-fg-secondary hover:bg-app hover:text-fg"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-on-brand" : item.color}
                    />
                    <span className="sb-hide font-[500] flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[12px] font-bold rounded-full ${
                          isActive
                            ? "bg-surface text-brand-fg"
                            : "bg-brand text-on-brand"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <div className="sb-hide w-2 h-2 bg-surface rounded-full"></div>
                    )}
                  </button>
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
            <div className="sb-hide flex-1">
              <p className="text-[14px] font-[500] text-fg">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "MPC Worker"}
              </p>
              <p className="text-[12px] text-fg-secondary">
                {getRoleName(localStorage.getItem("userRole")) || "MPC Staff"}
              </p>
            </div>
            <button
              className="sb-hide p-1 text-fg-secondary hover:text-error transition-colors"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
