import React, { useState } from "react";
import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import SalesDashboard from "../Finance/SalesDashboard";

/** S4: the Sales Dashboard (client sample 16 Nov) sits in Admin, where S4 keeps its reports. */
export default function AdminSalesDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex bg-app h-screen overflow-hidden">
            <AdminSidebar sidebarOpen={sidebarOpen} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Sales Dashboard" />
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
                    <h1 className="text-[20px] font-[600] text-fg mb-4">Sales Dashboard</h1>
                    <SalesDashboard />
                </main>
            </div>
        </div>
    );
}
