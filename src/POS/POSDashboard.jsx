import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  RotateCcw,
  Clock,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Eye,
  Plus
} from "lucide-react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../services/api";
import toast from "react-hot-toast";
import Skeleton, { DashboardSkeleton } from "../component/Skeleton";

// Import POS components
import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import CashFloatPopup from "./CashFloatPopup.jsx";

export default function POSDashboard({ onBackToDashboard }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('POS Dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Add these lines after: const [activeSection, setActiveSection] = useState('POS Dashboard');
  const [isCashFloatOpen, setIsCashFloatOpen] = useState(false); // Default to false until checked
  const [cashFloatData, setCashFloatData] = useState(null);

  const cashierInfo = {
    id: localStorage.getItem("userId") || 'CSH001',
    name: localStorage.getItem("userName") || 'John Doe'
  };

  useEffect(() => {
    const checkFloatStatus = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("authToken");
        const baseUrl = process.env.REACT_APP_BASE_URL || '';
        
        if (!userId || !token) return;

        const response = await axios.get(
          `${baseUrl}/api/pos/v1/cash-float/status?cashierId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.opened === false) {
          setIsCashFloatOpen(true);
        }
      } catch (error) {
        console.error("Failed to check cash float status:", error);
      }
    };

    checkFloatStatus();
  }, []);
  // Add this function
  const handleConfirm = (data) => {
    setCashFloatData(data);
    setIsCashFloatOpen(false);
    console.log('Cash float recorded:', data);
  };

  const [dashboardStats, setDashboardStats] = useState({
    totalSalesToday: 0,
    totalOrdersToday: 0,
    cashSalesToday: 0,
    cardSalesToday: 0,
    returnsToday: 0,
    recentTransactions: [],
    lowStockItems: []
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const outletId = localStorage.getItem("outletId");
        
        const response = await axiosInstance.get(
          `/api/pos/v1/dashboard-stats${outletId ? `?outletId=${outletId}` : ''}`
        );

        if (response.data) {
          setDashboardStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch POS dashboard stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      name: "New Sale",
      icon: <ShoppingCart size={20} />,
      path: "/posSales",
      description: "Process customer purchase",
      color: "bg-brand",
      hoverColor: "hover:bg-brand-hover"
    },
    {
      name: "Goods Entry",
      icon: <Package size={20} />,
      path: "/posGoodsEntry",
      description: "Record stock received",
      color: "bg-success-solid",
      hoverColor: "hover:bg-success-solid"
    },
    {
      name: "Returns",
      icon: <RotateCcw size={20} />,
      path: "/posReturns",
      description: "Process product returns",
      color: "bg-warning-solid",
      hoverColor: "hover:bg-warning-solid"
    },
    {
      name: "Day-End",
      icon: <Clock size={20} />,
      path: "/posDayEnd",
      description: "Complete daily closing",
      color: "bg-plum-solid",
      hoverColor: "hover:bg-plum-solid"
    }
  ];

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <POSSidebar
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <POSNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        {/* POS Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">

          <CashFloatPopup
            isOpen={isCashFloatOpen}
            onConfirm={handleConfirm}
            cashierInfo={cashierInfo}
          />

          {/* Top Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height="120px" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Sales Card */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-[500] text-fg-secondary">Today's Sales</p>
                  <div className="p-2 bg-hover rounded-lg">
                    <DollarSign className="w-5 h-5 text-brand-fg" />
                  </div>
                </div>
                <h3 className="text-[24px] font-[600] text-fg">
                  Rs. {dashboardStats.totalSalesToday?.toLocaleString() || '0'}
                </h3>
              </div>

              {/* Total Orders Card */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-[500] text-fg-secondary">Total Orders</p>
                  <div className="p-2 bg-hover rounded-lg">
                    <Package className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <h3 className="text-[24px] font-[600] text-fg">
                  {dashboardStats.totalOrdersToday || '0'}
                </h3>
              </div>

              {/* Low Stock Items Card */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-[500] text-fg-secondary">Low Stock Alerts</p>
                  <div className="p-2 bg-hover rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-error" />
                  </div>
                </div>
                <h3 className="text-[24px] font-[600] text-fg">
                  {dashboardStats.lowStockItems?.length || '0'}
                </h3>
              </div>

              {/* Avg Order Value Card */}
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-[500] text-fg-secondary">Avg. Order Value</p>
                  <div className="p-2 bg-subtle rounded-lg">
                    <CreditCard className="w-5 h-5 text-brand-fg" />
                  </div>
                </div>
                <h3 className="text-[24px] font-[600] text-fg">
                  Rs. {dashboardStats.totalOrdersToday > 0 
                    ? Math.round(dashboardStats.totalSalesToday / dashboardStats.totalOrdersToday).toLocaleString() 
                    : '0'}
                </h3>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-[20px] font-[600] text-fg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <NavLink
                  key={action.path}
                  to={action.path}
                  className={`${action.color} ${action.hoverColor} text-on-brand p-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {action.icon}
                    <h3 className="text-[16px] font-[600]">{action.name}</h3>
                  </div>
                  <p className="text-[14px] text-on-brand/80 text-left">{action.description}</p>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-[600] text-fg">Recent Transactions</h3>
                <button className="text-[14px] text-brand-fg hover:underline">View All</button>
              </div>

              <div className="space-y-4">
                {dashboardStats.recentTransactions && dashboardStats.recentTransactions.length > 0 ? (
                  dashboardStats.recentTransactions.map((transaction) => (
                    <div key={transaction.saleId} className="flex items-center justify-between p-4 bg-subtle rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-[600] text-fg">TXN-{transaction.saleId}</span>
                          <span className="text-[12px] text-fg-secondary">{transaction.saleTime}</span>
                        </div>
                        <p className="text-[13px] text-fg-secondary mb-1">{transaction.itemCount} items</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-[600] text-fg">
                            Rs. {transaction.totalAmount.toLocaleString()}
                          </span>
                          <span className="text-[12px] bg-hover text-success px-2 py-1 rounded-full">
                            {transaction.cashierName}
                          </span>
                        </div>
                      </div>
                      <button aria-label="View details" className="p-2 text-fg-secondary hover:bg-surface rounded-lg">
                        <Eye size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-subtle rounded-lg border border-dashed border-line">
                    <Clock size={32} className="mx-auto text-fg-secondary mb-2 opacity-50" />
                    <p className="text-[14px] text-fg-secondary">No recent transactions today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-[600] text-fg">Stock Alerts</h3>
                <button className="text-[14px] text-brand-fg hover:underline">Manage Inventory</button>
              </div>

              <div className="space-y-4">
                {dashboardStats.lowStockItems && dashboardStats.lowStockItems.length > 0 ? (
                  dashboardStats.lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-subtle rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.status === 'critical' ? 'bg-error/10' : 'bg-warning/10'
                          }`}>
                          {item.status === 'critical' ? (
                            <AlertTriangle size={16} className="text-error" />
                          ) : (
                            <AlertTriangle size={16} className="text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-[500] text-fg">{item.name}</p>
                          <p className="text-[12px] text-fg-secondary">
                            Current: {item.current} | Min: {item.minimum}
                          </p>
                        </div>
                      </div>
                      <button aria-label="Increase quantity" className="p-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-subtle rounded-lg border border-dashed border-line">
                    <Package size={32} className="mx-auto text-fg-secondary mb-2 opacity-50" />
                    <p className="text-[14px] text-fg-secondary">All stock levels are healthy</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods Summary */}
          <div className="mt-8 bg-surface rounded-lg shadow-sm border border-line p-6">
            <h3 className="text-[18px] font-[600] text-fg mb-6">Today's Payment Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-subtle rounded-lg">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={20} className="text-success" />
                </div>
                <p className="text-[24px] font-[600] text-fg">
                  Rs. {dashboardStats.cashSalesToday.toLocaleString()}
                </p>
                <p className="text-[14px] text-fg-secondary">Cash Payments</p>
              </div>

              <div className="text-center p-4 bg-subtle rounded-lg">
                <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard size={20} className="text-brand-fg" />
                </div>
                <p className="text-[24px] font-[600] text-fg">
                  Rs. {dashboardStats.cardSalesToday.toLocaleString()}
                </p>
                <p className="text-[14px] text-fg-secondary">Card Payments</p>
              </div>

              <div className="text-center p-4 bg-subtle rounded-lg">
                <div className="w-12 h-12 bg-plum/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RotateCcw size={20} className="text-plum" />
                </div>
                <p className="text-[24px] font-[600] text-fg">
                  Rs. {dashboardStats.returnsToday.toLocaleString()}
                </p>
                <p className="text-[14px] text-fg-secondary">Returns & Refunds</p>
              </div>
            </div>
          </div>

        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}