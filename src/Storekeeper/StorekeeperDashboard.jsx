import React, { useState, useEffect } from "react";
import { formatQuantity } from "../utils/quantityFormatter";
import { onEnterClick } from "../utils/a11y";
import { ChevronDown, ChevronRight, info } from "lucide-react";
import axios from "axios";
import rawMaterialService from "../services/rawMaterialService";
import {
    ClipboardList,
    Package,
    ShoppingCart,
    AlertTriangle,
    Receipt,
    RotateCcw,
    FileText,
    TrendingUp,
    CheckCircle,
    XCircle,
    Eye,
    ArrowRight,
    Calendar,
    Clock,
    Truck
} from "lucide-react";
import { NavLink } from "react-router-dom";

import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import Loader from "../component/Loader.jsx";
import { pollWhileVisible } from "../utils/poll";


export default function StorekeeperDashboard({ onBackToDashboard }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Storekeeper Dashboard');
    const [aggregatedStock, setAggregatedStock] = useState([]);
    const [expandedGenericId, setExpandedGenericId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const data = await rawMaterialService.getAggregatedStock();
                setAggregatedStock(data);
            } catch (error) {
                console.error("Error fetching aggregated stock:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    const [dashboardStats, setDashboardStats] = useState({
        pendingManagerRequests: [],
        recentTransactions: [],
        stockAlerts: [],
        pendingWorkerRequestsCount: 0
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const baseUrl = process.env.REACT_APP_BASE_URL || '';
                
                const response = await axios.get(
                    `${baseUrl}/STK/v1/dashboard-stats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data) {
                    setDashboardStats(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch Storekeeper dashboard stats:", error);
            }
        };

        fetchDashboardStats();
        // Refresh every 5 minutes
        const interval = pollWhileVisible(fetchDashboardStats, 300000);
        return () => interval();
    }, []);

    const quickActions = [
        {
            name: "Manager Requests",
            icon: <ClipboardList size={20} />,
            path: "/storekeeperManagerRequests",
            description: "Process manager plans",
            color: "bg-brand",
            hoverColor: "hover:bg-brand-hover"
        },
        /* {
            name: "Worker Requests",
            icon: <Truck size={20} />,
            path: "/storekeeperIngredientRequests",
            description: "Issue worker ingredients",
            color: "bg-warning-solid",
            hoverColor: "hover:bg-warning-solid"
        }, */
        {
            name: "Create Purchase Order",
            icon: <ShoppingCart size={20} />,
            path: "/storekeeperCreatePO",
            description: "Generate new purchase orders",
            color: "bg-success-solid",
            hoverColor: "hover:bg-success-solid"
        },
        {
            name: "Goods Received Note",
            icon: <Receipt size={20} />,
            path: "/storekeeperGRN",
            description: "Record incoming materials",
            color: "bg-warning-solid",
            hoverColor: "hover:bg-warning-solid"
        },
        {
            name: "Stock Adjustments",
            icon: <AlertTriangle size={20} />,
            path: "/storekeeperStockAdjustments",
            description: "Adjust inventory levels",
            color: "bg-plum-solid",
            hoverColor: "hover:bg-plum-solid"
        }
    ];

    return (
        <div className="flex bg-app h-screen overflow-hidden">
            <StorekeeperSidebar
                sidebarOpen={sidebarOpen}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <StorekeeperNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                {/* Storekeeper Dashboard Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-[20px] font-[600] text-fg mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                                <NavLink
                                    key={action.path}
                                    to={action.path}
                                    className={`${action.color} ${action.hoverColor} text-on-brand p-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-left w-full`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {action.icon}
                                        <h3 className="text-[16px] font-[600]">{action.name}</h3>
                                    </div>
                                    <p className="text-[14px] text-on-brand/80">{action.description}</p>
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Pending Manager Requests */}
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Pending Manager Requests</h3>
                                <NavLink
                                    to={"/storekeeperManagerRequests"}
                                    className="text-[14px] text-brand-fg hover:underline flex items-center gap-1 transition-colors"
                                >
                                    View All <ArrowRight size={14} />
                                </NavLink>
                            </div>

                            <div className="space-y-3">
                                {dashboardStats.pendingManagerRequests.map((request) => (
                                    <div key={request.planId} className="flex items-center justify-between p-4 bg-subtle rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[14px] font-[600] text-fg">PLN-{request.planId}</span>
                                                <span className={`text-[12px] px-2 py-1 rounded-full ${
                                                    request.status === 'APPROVED' ? 'bg-hover text-success' : 
                                                    'bg-hover text-warning'
                                                }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-fg font-[500] mb-1">{request.planName}</p>
                                            <p className="text-[12px] text-fg-secondary">
                                                {request.planDate} • {request.totalEstimatedCost} • Created: {request.createdAt}
                                            </p>
                                        </div>
                                        <NavLink
                                            to={"/storekeeperManagerRequests"}
                                            className="text-brand-fg hover:bg-surface p-2 rounded-lg transition-colors"
                                        >
                                            <Eye size={16} />
                                        </NavLink>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pending Worker Requests
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Pending Worker Requests</h3>
                                <NavLink
                                    to={"/storekeeperIngredientRequests"}
                                    className="text-[14px] text-brand-fg hover:underline flex items-center gap-1 transition-colors"
                                >
                                    View All <ArrowRight size={14} />
                                </NavLink>
                            </div>

                            <div className="flex flex-col items-center justify-center py-8 text-center bg-subtle rounded-xl border border-dashed border-line">
                                <div className="p-3 bg-surface rounded-full shadow-sm mb-3">
                                    <ClipboardList size={24} className="text-fg-secondary" />
                                </div>
                                <p className="text-[14px] font-[500] text-fg">
                                    {dashboardStats.pendingWorkerRequestsCount > 0 
                                        ? `${dashboardStats.pendingWorkerRequestsCount} Pending Worker Requests` 
                                        : "No Pending Worker Requests"}
                                </p>
                                <p className="text-[12px] text-fg-secondary max-w-[200px] mt-1">Worker requests for additional materials appear here.</p>
                                <NavLink
                                    to={"/storekeeperIngredientRequests"}
                                    className="mt-4 px-4 py-2 bg-surface border border-line rounded-lg text-[13px] font-[500] text-fg hover:bg-app transition-colors"
                                >
                                    Go to Worker Requests
                                </NavLink>
                            </div>
                        </div>
                        */}

                        {/* Recent Transactions */}
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Recent Transactions</h3>
                            </div>

                            <div className="space-y-3">
                                {dashboardStats.recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-subtle rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[14px] font-[600] text-fg">{transaction.id}</span>
                                                <span className={`text-[12px] px-2 py-1 rounded-full ${
                                                    transaction.status === 'Completed' || transaction.status === 'RECEIVED' ? 'bg-hover text-success' : 
                                                    transaction.status === 'Pending' || transaction.status === 'PENDING' ? 'bg-hover text-warning' : 
                                                    'bg-hover text-brand-fg'
                                                }`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-fg font-[500] mb-1">{transaction.type}</p>
                                            <p className="text-[12px] text-fg-secondary">
                                                {transaction.supplier} • {transaction.date} • {transaction.items} items • {transaction.amount}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stock Alerts */}
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Stock Alerts</h3>
                                <NavLink
                                    to={"/storekeeperViewStore"}
                                    className="text-[14px] text-brand-fg hover:underline flex items-center gap-1 transition-colors"
                                >
                                    Manage Inventory <ArrowRight size={14} />
                                </NavLink>
                            </div>

                            <div className="space-y-4">
                                {dashboardStats.stockAlerts.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-subtle rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.status === 'Critical' ? 'bg-error/10' : 'bg-warning/10'
                                                }`}>
                                                <AlertTriangle size={16} className={item.status === 'Critical' ? 'text-error' : 'text-warning'} />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-[500] text-fg">{item.materialName}</p>
                                                <p className="text-[12px] text-fg-secondary">
                                                    Current: {formatQuantity(item.currentStock)} {item.unit} | Min: {formatQuantity(item.minLevel)} {item.unit}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {dashboardStats.stockAlerts.length === 0 && (
                                    <p className="text-center text-fg-secondary py-4">No low stock alerts</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aggregated Stock Overview */}
                    <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[18px] font-[600] text-fg flex items-center gap-2">
                                <Package size={20} className="text-brand-fg" />
                                Aggregated Stock Overview
                            </h3>
                            <NavLink
                                to={"/storekeeperViewStore"}
                                className="text-[14px] text-brand-fg hover:underline flex items-center gap-1 transition-colors"
                            >
                                View Detailed Inventory <ArrowRight size={14} />
                            </NavLink>
                        </div>

                        {loading ? (
                            <Loader variant="section" text="Gathering stock levels..." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-line text-[13px] font-[600] text-fg-secondary uppercase tracking-wider">
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Generic Name</th>
                                            <th className="px-4 py-3 text-right">Total Stock</th>
                                            <th className="px-4 py-3">Unit</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {aggregatedStock.map((generic) => (
                                            <React.Fragment key={generic.genericMaterialId}>
                                                <tr 
                                                    className="hover:bg-subtle cursor-pointer transition-colors"
                                                    role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setExpandedGenericId(expandedGenericId === generic.genericMaterialId ? null : generic.genericMaterialId)}
                                                >
                                                    <td className="px-4 py-4 text-[14px] text-fg-secondary">{generic.category}</td>
                                                    <td className="px-4 py-4 text-[14px] font-[500] text-fg">{generic.genericMaterialName}</td>
                                                    <td className="px-4 py-4 text-[14px] font-[600] text-fg text-right">
                                                        {formatQuantity(generic.totalStock)}
                                                    </td>
                                                    <td className="px-4 py-4 text-[14px] text-fg-secondary">{generic.unit}</td>
                                                    <td className="px-4 py-4 text-fg-secondary">
                                                        {expandedGenericId === generic.genericMaterialId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </td>
                                                </tr>
                                                {expandedGenericId === generic.genericMaterialId && (
                                                    <tr className="bg-subtle">
                                                        <td colSpan="5" className="px-8 py-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                {(generic.brandBreakdown || []).map((brand, bIdx) => (
                                                                    <div key={bIdx} className="bg-surface p-3 rounded border border-line shadow-sm">
                                                                        <p className="text-[12px] text-fg-secondary mb-1">Brand</p>
                                                                        <p className="text-[14px] font-[600] text-fg">{brand?.brandName || 'N/A'}</p>
                                                                        <div className="flex justify-between items-center mt-2">
                                                                            <p className="text-[12px] text-fg-secondary">Stock:</p>
                                                                            <p className={`text-[13px] font-[600] ${(brand?.stockLevel || 0) <= 10 ? 'text-error' : 'text-success'}`}>
                                                                                {brand?.stockLevel || 0} {generic.unit || ''}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!generic.brandBreakdown || generic.brandBreakdown.length === 0) && (
                                                                    <p className="text-[13px] text-fg-secondary col-span-full py-2">No brand details available for this generic material.</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {aggregatedStock.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-fg-secondary text-[14px]">
                                                    No stock data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
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