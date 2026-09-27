import React from "react";
import { ClipboardList, FileText, RotateCcw, ShoppingBasket } from "lucide-react";
import KitchenWorkerSideBar from "../component/KitchenWorkerSideBar";
import WorkerDashboard from "../component/dashboard/WorkerDashboard";

export default function KitchenWorkerDashboard() {
  return (
    <WorkerDashboard Sidebar={KitchenWorkerSideBar} base="kitchen" title="Kitchen Worker Dashboard" producedTo={null} actions={[
      { name: "Production Requests", path: "/kitchenProductionRequests", icon: ClipboardList, description: "Tasks from the manager" },
      { name: "Get Ingredients", path: "/kitchenGetIngredients", icon: ShoppingBasket, description: "Request raw materials" },
      { name: "Transfer Note", path: "/kitchenTransferNote", icon: FileText, description: "Send food to outlets" },
      { name: "Return to Store", path: "/kitchenReturnToStore", icon: RotateCcw, description: "Return unused materials" },
    ]} />
  );
}
