import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ShoppingBasket, FileText, RotateCcw } from "lucide-react";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar";

export default function KitchenWorkerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    const baseUrl = process.env.REACT_APP_BASE_URL;
    const token = localStorage.getItem("authToken");
    fetch(`${baseUrl}/bmsauth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <KitchenWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#1F2937]">Kitchen Worker Dashboard</h1>
        <p className="mb-8 text-gray-700">
          Welcome, <strong>{me?.firstName || me?.username || "..."}</strong>. You are assigned to{" "}
          <strong>{me?.productionCenterName || "..."}</strong>{" "}
          <span className="uppercase text-xs px-2 py-0.5 ml-1 rounded bg-amber-100 text-amber-800">
            {me?.productionCenterType || ""}
          </span>
          .
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          <Link
            to="/kitchenProductionRequests"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ClipboardList size={28} className="text-orange-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Production Requests</div>
            <div className="text-sm text-gray-600">View tasks assigned by manager</div>
          </Link>
          <Link
            to="/kitchenGetIngredients"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ShoppingBasket size={28} className="text-green-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Get Ingredients</div>
            <div className="text-sm text-gray-600">Request raw materials from store</div>
          </Link>
          <Link
            to="/kitchenTransferNote"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <FileText size={28} className="text-blue-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Transfer Note</div>
            <div className="text-sm text-gray-600">Issue goods transfer notes</div>
          </Link>
          <Link
            to="/kitchenReturnToStore"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <RotateCcw size={28} className="text-purple-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Return to Store</div>
            <div className="text-sm text-gray-600">Send unused materials back to store</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
