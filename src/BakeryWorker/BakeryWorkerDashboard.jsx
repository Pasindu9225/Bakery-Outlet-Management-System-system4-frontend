import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ShoppingBasket, Layers } from "lucide-react";
import BakeryWorkerSideBar from "../component/BakeryWorkerSideBar";

export default function BakeryWorkerDashboard() {
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
      <BakeryWorkerSideBar sidebarOpen={sidebarOpen} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#1F2937]">Bakery Worker Dashboard</h1>
        <p className="mb-8 text-gray-700">
          Welcome, <strong>{me?.firstName || me?.username || "..."}</strong>. You are assigned to{" "}
          <strong>{me?.productionCenterName || "..."}</strong>{" "}
          <span className="uppercase text-xs px-2 py-0.5 ml-1 rounded bg-amber-100 text-amber-800">
            {me?.productionCenterType || ""}
          </span>
          .
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
          <Link
            to="/bakeryProductionRequests"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ClipboardList size={28} className="text-orange-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Production Requests</div>
            <div className="text-sm text-gray-600">View tasks assigned by manager</div>
          </Link>
          <Link
            to="/bakeryGetIngredients"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <ShoppingBasket size={28} className="text-green-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Get Ingredients</div>
            <div className="text-sm text-gray-600">Request raw materials from store</div>
          </Link>
          <Link
            to="/bakeryPartialProduction"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-100"
          >
            <Layers size={28} className="text-purple-600 mb-3" />
            <div className="font-semibold text-[#1F2937] mb-1">Partial Production</div>
            <div className="text-sm text-gray-600">Record batches as you complete them</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
