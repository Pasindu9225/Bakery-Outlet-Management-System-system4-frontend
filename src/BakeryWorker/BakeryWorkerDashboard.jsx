import React from "react";
import { ClipboardList, Layers, ShoppingBasket } from "lucide-react";
import BakeryWorkerSideBar from "../component/BakeryWorkerSideBar";
import WorkerDashboard from "../component/dashboard/WorkerDashboard";

export default function BakeryWorkerDashboard() {
  return (
    <WorkerDashboard Sidebar={BakeryWorkerSideBar} base="bakery" title="Bakery Worker Dashboard" actions={[
      { name: "Production Requests", path: "/bakeryProductionRequests", icon: ClipboardList, description: "Tasks from the manager" },
      { name: "Get Ingredients", path: "/bakeryGetIngredients", icon: ShoppingBasket, description: "Request raw materials" },
      { name: "Partial Production", path: "/bakeryPartialProduction", icon: Layers, description: "Record finished batches" },
    ]} />
  );
}
