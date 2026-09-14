import React, { useState } from "react";
import KitchenWorkerNavBar from "../component/KitchenWorkerNavBar.jsx";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar.jsx";
import WorkerStoreInventory from "../component/WorkerStoreInventory.jsx";

export default function KitchenStoreInventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <KitchenWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <KitchenWorkerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection="My Store Inventory"
        />
        <main className="flex-1 overflow-y-auto">
          <WorkerStoreInventory moduleTitle="Kitchen Production Center Store" />
        </main>
      </div>
    </div>
  );
}
