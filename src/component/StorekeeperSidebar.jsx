import React from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function StorekeeperSidebar({ sidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const storekeeperNavigationItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/storekeeperDashboard",
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

        {/* Module Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F50AA] to-[#1E40AF] text-white">
          <h2 className="text-[16px] font-[600]">Storekeeper Module</h2>
          <p className="text-[12px] text-blue-100">
            Not used in this deployment
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {storekeeperNavigationItems.map((item) => {
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

        {/* Production Status Indicator */}
        {/* <div className="p-4 border-t border-[#E4E6EA] bg-[#F8F9FA]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-[12px] font-[500] text-[#383E49]">Production Active</p>
          </div>
          <p className="text-[10px] text-[#667085]">3 kitchens, 5 outlets operational</p>
        </div> */}

        {/* User Profile */}
        <div className="p-4 border-t border-[#E4E6EA]">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-[#383E49]">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "User"}
              </p>
              <p className="text-[12px] text-[#667085]">
                {getRoleName(localStorage.getItem("userRole")) || "Storekeeper"}
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
