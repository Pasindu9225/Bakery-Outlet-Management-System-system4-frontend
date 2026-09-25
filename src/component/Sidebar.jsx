import React from "react";
import {
  User,
  Settings,
  ShoppingCart,
  LogOut,
  Briefcase,
  LayoutDashboard,
  StoreIcon,
  KeyIcon
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/mainDashboard" },
    { name: "POS", icon: ShoppingCart, path: "/posDashboard" },
    { name: "Manager Dashboard", icon: Briefcase, path: "/managerDashboard" },
    { name: 'Storekeeper Dashboard', icon: StoreIcon, path: '/storekeeperDashboard' },
    { name: 'Admin Dashboard', icon: KeyIcon, path: '/adminDashboard' },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div
      className={`fixed md:static z-[9999] top-0 left-0 h-screen transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="w-64 bg-surface shadow-lg h-screen flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-line flex items-center">
          <img src="/logo.png" alt="logo" className="logo-plate h-14 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => {
                      const isDashboardActive =
                        item.name === "Dashboard" &&
                        (isActive || window.location.pathname === "/");
                      const isOtherActive =
                        item.name !== "Dashboard" && isActive;

                      return `flex items-center gap-3 p-3 rounded-lg w-full transition-colors ${
                        isDashboardActive || isOtherActive
                          ? "bg-brand text-on-brand"
                          : "text-fg-secondary hover:bg-app"
                      }`;
                    }}
                  >
                    <Icon size={20} />
                    <span className="text-[14px] font-[500]">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3">
            <RoleAvatar roleId={localStorage.getItem("userRole")} />
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-fg">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "User"}
              </p>
              <p className="text-[12px] text-fg-secondary">
                {getRoleName(localStorage.getItem("userRole")) || "Manager"}
              </p>
            </div>
            <button
              className="p-1 text-fg-secondary hover:text-[red]"
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
