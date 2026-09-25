import React, { useState } from "react";
import BakeryWorkerNavBar from "../component/BakeryWorkerNavBar.jsx";
import BakeryWorkerSideBar from "../component/BakeryWorkerSideBar.jsx";
import WorkerStoreInventory from "../component/WorkerStoreInventory.jsx";

export default function BakeryStoreInventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <BakeryWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <BakeryWorkerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection="My Store Inventory"
        />
        <main className="flex-1 overflow-y-auto">
          <WorkerStoreInventory moduleTitle="Bakery Production Center Store" />
        </main>
      </div>
    </div>
  );
}
