import React from "react";
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
      color: "text-blue-600",
    },
    {
      id: "deliveries",
      name: "Deliveries & Acceptance",
      icon: Package,
      badge: issuedCount,
      color: "text-orange-600",
    },
    {
      id: "storeInventory",
      name: "MPC Store Inventory",
      icon: Layers,
      color: "text-emerald-600",
    },
    {
      id: "kots",
      name: "Live KOT Queue",
      icon: Clock,
      badge: pendingKotCount,
      color: "text-purple-600",
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

        {/* MPC Worker Module Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F50AA] to-[#1E40AF] text-white">
          <h2 className="text-[16px] font-[600]">MPC Worker Module</h2>
          <p className="text-[12px] text-blue-100">Mini Production Center</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-[11px] font-[600] text-[#667085] uppercase tracking-wider mb-2 px-1">
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
                    className={`flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] text-left ${
                      isActive
                        ? "bg-[#0F50AA] text-white shadow-sm"
                        : "text-[#667085] hover:bg-[#F0F1F3] hover:text-[#383E49]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : item.color}
                    />
                    <span className="font-[500] flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                          isActive
                            ? "bg-white text-[#0F50AA]"
                            : "bg-[#0F50AA] text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-[#383E49]">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "MPC Worker"}
              </p>
              <p className="text-[12px] text-[#667085]">
                {getRoleName(localStorage.getItem("userRole")) || "MPC Staff"}
              </p>
            </div>
            <button
              className="p-1 text-[#667085] hover:text-red-500 transition-colors"
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
