import React, { useState, useEffect } from "react";
import { Search, Store, Package, RefreshCw } from "lucide-react";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import ManagerTransferModal from "./ManagerTransferModal.jsx";

export default function ManagerOutletStock() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Outlet Stock");
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null);

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    let intervalId;
    if (selectedOutlet) {
      fetchOutletStock(selectedOutlet);
      intervalId = setInterval(() => {
        fetchOutletStockSilent(selectedOutlet);
      }, 5000);
    } else {
      setStockItems([]);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedOutlet]);

  const fetchOutlets = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/manager/distribution/outlets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
      }
    } catch (err) {
      console.error("Failed to fetch outlets", err);
    }
  };

  const fetchOutletStock = async (outletId) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/outlet-stock?outletId=${outletId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch outlet stock");
      const data = await response.json();
      setStockItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutletStockSilent = async (outletId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/outlet-stock?outletId=${outletId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStockItems(data);
      }
    } catch (err) {
      console.error("Silent fetch failed:", err);
    }
  };

  const filteredStock = stockItems.filter(item => 
    item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    item.currentQty > 0
  );

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-[20px] font-[600] text-[#383E49]">Live Outlet Stock</h2>
              <p className="text-[12px] text-[#667085]">Monitor current stock quantities for each outlet</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full sm:w-[200px] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-[14px]"
              >
                <option value="">Select an Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.outletId} value={outlet.outletId}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search products (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[250px] pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0F50AA]"
                />
              </div>
              <button
                onClick={() => selectedOutlet && fetchOutletStock(selectedOutlet)}
                disabled={!selectedOutlet || loading}
                className={`p-2 rounded-lg border border-[#E4E6EA] text-gray-500 hover:bg-gray-50 transition-colors ${(!selectedOutlet || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh Stock"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#F9FAFB] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                      Received Qty
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                      Current Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E6EA]">
                  {!selectedOutlet ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center">
                        <Store className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-[#667085] text-[14px]">Please select an outlet from the dropdown</p>
                      </td>
                    </tr>
                  ) : loading ? (
                    <tr>
                      <td colSpan="4" className="py-8">
                        <Loader />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-red-500 text-[14px]">
                        {error}
                      </td>
                    </tr>
                  ) : filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-[#667085] text-[14px]">
                        No stock available for this outlet.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => (
                      <tr 
                        key={item.dayProductionItemId} 
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItemForTransfer(item);
                          setIsModalOpen(true);
                        }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Package className="text-[#0F50AA]" size={16} />
                            </div>
                            <div>
                              <span className="block text-[14px] font-[500] text-[#383E49]">{item.productName}</span>
                              <span className="block text-[12px] text-gray-400">{item.productCode}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[13px] text-[#667085]">{item.categoryName}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-[14px] font-[500] text-gray-500">{item.receivedQty}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-[14px] font-[600] text-[#0F50AA]">{item.currentQty}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <ManagerTransferModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItemForTransfer(null);
        }}
        item={selectedItemForTransfer}
        sourceOutletId={selectedOutlet}
        outlets={outlets}
        onTransferSuccess={() => {
          fetchOutletStock(selectedOutlet); // refresh stock
          // Also show a toast or alert if needed
          alert('Transfer requested successfully!');
        }}
      />
    </div>
  );
}
