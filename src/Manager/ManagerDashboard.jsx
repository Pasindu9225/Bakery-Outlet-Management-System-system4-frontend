import React, { useState } from "react";
import { friendlyError } from "../utils/friendlyError";
import {
    Calendar,
    TrendingUp,
    Package,
    Clock,
    Users,
    BarChart3,
    CheckCircle,
    XCircle,
    Eye,
    FileText,
    Factory,
    Store,
    ChefHat,
    ArrowRight
} from "lucide-react";
import { NavLink } from "react-router-dom";

import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function ManagerDashboard({ onBackToDashboard }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Manager Dashboard');


    const quickActions = [
        {
            name: "Production Planning",
            icon: <Calendar size={20} />,
            path: "/managerProductionPlanning",
            description: "Create daily production plans",
            color: "bg-brand",
            hoverColor: "hover:bg-brand-hover"
        },
        {
            name: "Kitchen Requests",
            icon: <ChefHat size={20} />,
            path: "/managerKitchenRequests",
            description: "Manage kitchen production",
            color: "bg-success-solid",
            hoverColor: "hover:bg-success-solid"
        },
        {
            name: "Bakery Requests",
            icon: <Factory size={20} />,
            path: "/managerBakeryRequests",
            description: "Manage bakery production",
            color: "bg-warning-solid",
            hoverColor: "hover:bg-warning-solid"
        },
        {
            name: "Outlet Distribution",
            icon: <Store size={20} />,
            path: "/managerOutletDistribution",
            description: "Plan product distribution",
            color: "bg-plum-solid",
            hoverColor: "hover:bg-plum-solid"
        },
        {
            name: "Actual Production",
            icon: <Store size={20} />,
            path: "/managerActualProduction",
            description: "Manage stored items",
            color: "bg-plum-solid",
            hoverColor: "hover:bg-plum-solid"
        }
    ];

    const [recentPlans, setRecentPlans] = useState([]);
    const [requestsOverview, setRequestsOverview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("authToken");
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/manager/production-plans`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error("Failed to fetch plans");
                const data = await response.json();

                // Process Recent Plans (take first 4)
                const processedRecentPlans = data.slice(0, 4).map(plan => {
                    console.log("Processing plan:", plan); // DEBUG LOG
                    return {
                        originalId: plan.id,
                        planName: plan.planName || `Plan #${plan.id}`,
                        id: `PLAN-${plan.id.toString().padStart(3, '0')}`,
                        date: plan.planDate ? new Date(plan.planDate).toLocaleDateString() : 'N/A',
                        totalProducts: plan.productionItems?.length || 0,
                        totalQty: plan.productionItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
                        status: plan.status === 'COMPLETED' || plan.status === 'DISTRIBUTED' ? 'Completed' : 
                                plan.status === 'DRAFT' ? 'Draft' : 'In Progress'
                    };
                });
                setRecentPlans(processedRecentPlans);

                // Process Requests Overview
                // A plan is considered a Bakery/Kitchen request if it has raw material requirements for that center
                const bakeryPlans = data.filter(plan => 
                    plan.rawMaterialRequirements?.some(req => req.productionCenterName?.toLowerCase().includes('bakery'))
                );
                const kitchenPlans = data.filter(plan => 
                    plan.rawMaterialRequirements?.some(req => req.productionCenterName?.toLowerCase().includes('kitchen'))
                );

                const getStats = (plans, type, icon, bgColor, path) => {
                    const total = plans.length;
                    const completed = plans.filter(p => p.status === 'COMPLETED' || p.status === 'DISTRIBUTED').length;
                    const pending = total - completed;
                    return { type, total, completed, pending, icon, bgColor, path };
                };

                setRequestsOverview([
                    getStats(bakeryPlans, "Bakery Requests", <Factory size={20} className="text-warning" />, "bg-warning/10", "/managerBakeryRequests"),
                    getStats(kitchenPlans, "Kitchen Requests", <ChefHat size={20} className="text-success" />, "bg-success/10", "/managerKitchenRequests")
                ]);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(friendlyError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <div className="flex bg-app h-screen overflow-hidden">
            <ManagerSidebar
                sidebarOpen={sidebarOpen}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <ManagerNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                {/* Manager Dashboard Content */}
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
                        {/* Recent Production Plans */}
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Recent Production Plans</h3>
                                <NavLink
                                    to={"/managerProductionPlanning"}
                                    className="text-[14px] text-brand-fg hover:underline flex items-center gap-1 transition-colors"
                                >
                                    View All <ArrowRight size={14} />
                                </NavLink>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    <Loader variant="section" text="Loading recent plans..." />
                                ) : error ? (
                                    <div className="text-center py-12 text-error">
                                        <p>{error}</p>
                                    </div>
                                ) : recentPlans.length === 0 ? (
                                    <div className="text-center py-12 bg-subtle rounded-lg">
                                        <Package className="mx-auto text-fg-secondary mb-2" size={32} />
                                        <p className="text-[14px] text-fg-secondary">No recent production plans</p>
                                    </div>
                                ) : (
                                    recentPlans.map((plan) => (
                                        <NavLink
                                            key={plan.id}
                                            to={`/managerProductionPlanning?id=${plan.originalId}`}
                                            className="flex items-center justify-between p-4 bg-subtle rounded-lg border border-transparent hover:border-brand-fg hover:bg-brand/10 transition-all cursor-pointer group"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[14px] font-[600] text-fg group-hover:text-brand-fg transition-colors block">
                                                        {plan.planName}
                                                    </span>
                                                    <span className="text-[12px] text-fg-secondary font-[400] block">
                                                        ID: {plan.id}
                                                    </span>
                                                    <span className={`text-[12px] px-2 py-0.5 rounded-full ${
                                                        plan.status === 'Completed' ? 'bg-hover text-success' : 
                                                        plan.status === 'Draft' ? 'bg-app text-fg-secondary' : 'bg-hover text-warning'
                                                    }`}>
                                                        {plan.status}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-fg-secondary">
                                                    {plan.date} • {plan.totalProducts} products • {plan.totalQty} quantity
                                                </p>
                                            </div>
                                            <ArrowRight size={16} className="text-fg-secondary opacity-0 group-hover:opacity-100 group-hover:text-brand-fg transition-all transform translate-x-2 group-hover:translate-x-0" />
                                        </NavLink>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Requests Overview */}
                        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[18px] font-[600] text-fg">Production Requests</h3>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-subtle rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-line rounded-lg"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-24 bg-line rounded"></div>
                                                        <div className="h-3 w-32 bg-line rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : requestsOverview.map((request, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-subtle rounded-lg border border-transparent hover:border-line transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg ${request.bgColor}`}>
                                                {request.icon}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-[600] text-fg">{request.type}</p>
                                                <p className="text-[12px] text-fg-secondary">
                                                    Total: <span className="font-[500] text-fg">{request.total}</span> | 
                                                    Completed: <span className="font-[500] text-success">{request.completed}</span> | 
                                                    Pending: <span className="font-[500] text-warning">{request.pending}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <NavLink
                                            to={request.path}
                                            className="text-brand-fg hover:bg-surface p-2 rounded-lg transition-all"
                                        >
                                            <ArrowRight size={18} />
                                        </NavLink>
                                    </div>
                                ))}
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