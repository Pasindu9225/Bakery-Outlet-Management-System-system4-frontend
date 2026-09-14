import React, { useState } from "react";
import NavBar from "./component/NavBar.jsx";
import AdminSidebar from "./component/AdminSidebar.jsx";
import ManagerSidebar from "./component/ManagerSidebar.jsx";
import StorekeeperSidebar from "./component/StorekeeperSidebar.jsx";
import POSSidebar from "./component/POSSidebar.jsx";
import BakeryWorkerSideBar from "./component/BakeryWorkerSideBar.jsx";
import KitchenWorkerSideBar from "./component/KitchenWorkerSideBar.jsx";
import MPCWorkerSideBar from "./component/MPCWorkerSideBar.jsx";
import MISAdminSideBar from "./component/MISAdminSideBar.jsx";
import FinanceSideBar from "./component/FinanceSideBar.jsx";
import Sidebar from "./component/Sidebar.jsx";
import UserProfile from "./component/UserProfile.jsx";

function RoleSidebar({ role, sidebarOpen, setSidebarOpen }) {
  const r = String(role || "").trim();
  if (r === "1" || r.toUpperCase() === "ADMIN") {
    return <AdminSidebar sidebarOpen={sidebarOpen} />;
  }
  if (r === "10" || r.toUpperCase() === "MANAGER") {
    return <ManagerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "9" || r.toUpperCase() === "STOREKEEPER") {
    return <StorekeeperSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "8" || r.toUpperCase() === "POS") {
    return <POSSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "12" || r.toUpperCase() === "BAKERY") {
    return <BakeryWorkerSideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "13" || r.toUpperCase() === "KITCHEN") {
    return <KitchenWorkerSideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "14" || r.toUpperCase() === "MPC") {
    return <MPCWorkerSideBar sidebarOpen={sidebarOpen} />;
  }
  if (r === "20" || r.toUpperCase() === "MIS") {
    return <MISAdminSideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  if (r === "15" || r.toUpperCase() === "FINANCE") {
    return <FinanceSideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
  }
  return <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = localStorage.getItem("userRole") || "";

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <RoleSidebar role={role} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <UserProfile />
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
