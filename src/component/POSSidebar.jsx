import React from "react";
import {
  ShoppingCart,
  Package,
  RefreshCw,
  RotateCcw,
  Receipt,
  Clock,
  Settings,
  ArrowLeft,
  CreditCard,
  ChefHat,
  Users,
  Calendar,
  DollarSign,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { performLogout, getRoleName } from "../utils/auth";
import RoleAvatar from "./RoleAvatar";


export default function POSSidebar({ sidebarOpen }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const posNavigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/posDashboard', color: 'text-blue-600' },
    { name: 'Sales/Billing', icon: ShoppingCart, path: '/posSales', color: 'text-blue-600' },
    { name: 'Table Management', icon: Users, path: '/posTableBilling', color: 'text-cyan-600' },
    { name: 'Goods Entry', icon: Package, path: '/posGoodsEntry', color: 'text-green-600' },
    { name: 'Returns', icon: RotateCcw, path: '/posReturns', color: 'text-orange-600' },
    { name: 'Return to Store', icon: RefreshCw, path: '/posReturnToStore', color: 'text-purple-600' },
    { name: 'Credit Orders', icon: Calendar, path: '/posSpecialOrders', color: 'text-pink-600' },
    { name: 'Day End & Finish Shift', icon: Clock, path: '/posDayEnd', color: 'text-yellow-600' },
    { name: 'Customers', icon: Users, path: '/posCustomers', color: 'text-indigo-600' },
  ];

  return (
    <div className={`fixed md:static z-[9999] top-0 left-0 h-screen transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
        {/* Logo & Back Button */}
        <div className="p-4 border-b border-[#E4E6EA] flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="logo"
              className="h-14 w-auto"
            />
          </div>
          <NavLink
            to={"/posDashboard"}
            className="p-2 text-[#667085] hover:bg-[#F0F1F3] rounded-lg transition-colors"
            title="POS Dashboard"
          >
            <ArrowLeft size={18} />
          </NavLink>
        </div>

        {/* POS Title */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F50AA] to-[#1E40AF] text-white">
          <h2 className="text-[16px] font-[600]">POS System</h2>
          <p className="text-[12px] text-blue-100">Point of Sale Operations</p>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 bg-[#F8F9FA] border-b border-[#E4E6EA]">
          <p className="text-[10px] font-[600] text-[#667085] uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to={"/posSales"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors"
            >
              <ShoppingCart size={14} className="text-blue-600" />
              <span>New Sale</span>
            </NavLink>
            <NavLink
              to={"/posGoodsEntry"}
              className="flex items-center gap-2 p-2 text-[11px] bg-white rounded border hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <Package size={14} className="text-green-600" />
              <span>Stock In</span>
            </NavLink>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {posNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-lg w-full transition-all text-[13px] ${isActive
                        ? "bg-[#0F50AA] text-white shadow-sm"
                        : "text-[#667085] hover:bg-[#F0F1F3] hover:text-[#383E49]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={18} className={isActive ? "text-white" : item.color} />
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
            <div className="flex-1">
              <p className="text-[14px] font-[500] text-[#383E49]">
                {localStorage.getItem("firstName") || localStorage.getItem("lastName")
                  ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
                  : localStorage.getItem("userName") || "Cashier"}
              </p>
              <p className="text-[12px] text-[#667085]">
                {getRoleName(localStorage.getItem("userRole")) || "Cashier"}
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