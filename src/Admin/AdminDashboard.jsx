import React, { useState } from "react";
import {
    Users,
    TrendingUp,
    FileText,
    Package,
    BookOpen,
    Boxes,
    UserPlus,
    Truck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Admin Dashboard');

    // Quick Actions
    const quickActions = [
        {
            name: "Create User",
            icon: <UserPlus size={20} />,
            path: "/adminCreateUser",
            description: "Add new system users",
            color: "bg-blue-500",
            hoverColor: "hover:bg-blue-600"
        },
        {
            name: "Direct Stock Entry",
            icon: <Package size={20} />,
            path: "/adminStockEntry",
            description: "Add items directly to POS",
            color: "bg-teal-500",
            hoverColor: "hover:bg-teal-600"
        },
        {
            name: "View Trends",
            icon: <TrendingUp size={20} />,
            path: "/adminViewTrends",
            description: "Analyze performance metrics",
            color: "bg-green-500",
            hoverColor: "hover:bg-green-600"
        },
        {
            name: "Generate Reports",
            icon: <FileText size={20} />,
            path: "/adminGenerateReports",
            description: "Export detailed reports",
            color: "bg-orange-500",
            hoverColor: "hover:bg-orange-600"
        }
    ];

    // System Statistics
    const systemStats = [
        {
            title: "Total Users",
            value: "47",
            change: "+3 this month",
            icon: <Users size={24} />,
            color: "bg-blue-500",
            textColor: "text-blue-600"
        },
        {
            title: "Active Products",
            value: "156",
            change: "+12 new items",
            icon: <Package size={24} />,
            color: "bg-green-500",
            textColor: "text-green-600"
        },
        {
            title: "Total Suppliers",
            value: "23",
            change: "+2 this month",
            icon: <Truck size={24} />,
            color: "bg-orange-500",
            textColor: "text-orange-600"
        },
        {
            title: "Raw Materials",
            value: "89",
            change: "Inventory items",
            icon: <Boxes size={24} />,
            color: "bg-purple-500",
            textColor: "text-purple-600"
        }
    ];

    // Recent Activities
    const recentActivities = [
        {
            id: 1,
            action: "New user created",
            user: "John Doe - POS Cashier",
            time: "2 hours ago",
            status: "success",
            icon: <UserPlus size={16} />
        },
        {
            id: 2,
            action: "Product added",
            user: "Chocolate Croissant - Rs. 450.00",
            time: "3 hours ago",
            status: "success",
            icon: <Package size={16} />
        },
        {
            id: 3,
            action: "Supplier updated",
            user: "Fresh Supplies Ltd - Contact updated",
            time: "5 hours ago",
            status: "info",
            icon: <Truck size={16} />
        },
        {
            id: 4,
            action: "Recipe modified",
            user: "Bread Dough v1.1 - Cost updated",
            time: "Yesterday",
            status: "warning",
            icon: <BookOpen size={16} />
        }
    ];

    // System Health Indicators
    const systemHealth = [
        {
            module: "POS System",
            status: "Operational",
            outlets: "5/5 Active",
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            module: "Production",
            status: "Running",
            outlets: "3 Centers Active",
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            module: "Inventory",
            status: "Warning",
            outlets: "12 Low Stock Items",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50"
        }
    ];

    // Pending Approvals
    const pendingApprovals = [
        {
            id: "REQ-001",
            type: "User Role Change",
            requester: "Manager - Sarah Wilson",
            description: "Request to upgrade user access level",
            priority: "Medium",
            date: "2025-11-09"
        },
        {
            id: "REQ-002",
            type: "New Supplier",
            requester: "Storekeeper - Mike Chen",
            description: "Add new flour supplier - Quality Mills",
            priority: "High",
            date: "2025-11-09"
        },
        {
            id: "REQ-003",
            type: "Product Deletion",
            requester: "Manager - David Lee",
            description: "Remove discontinued pastry items",
            priority: "Low",
            date: "2025-11-08"
        }
    ];

    return (
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Navbar */}
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                {/* Admin Dashboard Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-[20px] font-[600] text-[#383E49] mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, index) => (
                                <NavLink
                                    to={action.path}
                                    key={index}
                                    className={`${action.color} ${action.hoverColor} text-white p-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-left w-full`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {action.icon}
                                        <h3 className="text-[16px] font-[600]">{action.name}</h3>
                                    </div>
                                    <p className="text-[14px] text-white/80">{action.description}</p>
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-[600] text-[#383E49]">Recent Activities</h3>
                <button className="text-[14px] text-[#0F50AA] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 bg-[#F8F9FA] rounded-lg">
                    <div className={`mt-1 ${
                      activity.status === 'success' ? 'text-green-600' :
                      activity.status === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-[500] text-[#383E49] mb-1">{activity.action}</p>
                      <p className="text-[13px] text-[#667085] mb-1">{activity.user}</p>
                      <p className="text-[12px] text-[#667085]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-[600] text-[#383E49]">Pending Approvals</h3>
                <span className="px-3 py-1 bg-[#FFF4E6] text-[#F4A100] rounded-full text-[12px] font-[500]">
                  {pendingApprovals.length} Pending
                </span>
              </div>

              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="p-4 bg-[#F8F9FA] rounded-lg border-l-4 border-[#F4A100]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-[600] text-[#383E49]">{approval.id}</span>
                          <span className={`text-[12px] px-2 py-1 rounded-full ${
                            approval.priority === 'High' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                            approval.priority === 'Medium' ? 'bg-[#FFF4E6] text-[#F4A100]' :
                            'bg-[#E0F2FE] text-[#0F50AA]'
                          }`}>
                            {approval.priority}
                          </span>
                        </div>
                        <p className="text-[13px] font-[500] text-[#383E49] mb-1">{approval.type}</p>
                        <p className="text-[12px] text-[#667085] mb-2">{approval.description}</p>
                        <p className="text-[11px] text-[#667085]">By: {approval.requester} • {approval.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 px-3 py-2 bg-[#0F50AA] text-white rounded-lg text-[12px] font-[500] hover:bg-[#1366D9]">
                        Approve
                      </button>
                      <button className="flex-1 px-3 py-2 bg-white border border-[#E4E6EA] text-[#667085] rounded-lg text-[12px] font-[500] hover:bg-[#F8F9FA]">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <h3 className="text-[18px] font-[600] text-[#383E49] mb-4">System Health Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemHealth.map((system, index) => (
                <div key={index} className={`p-4 rounded-lg ${system.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[14px] font-[600] text-[#383E49]">{system.module}</h4>
                    <CheckCircle size={18} className={system.color} />
                  </div>
                  <p className={`text-[13px] font-[500] ${system.color} mb-1`}>{system.status}</p>
                  <p className="text-[12px] text-[#667085]">{system.outlets}</p>
                </div>
              ))}
            </div>
          </div> */}

                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
