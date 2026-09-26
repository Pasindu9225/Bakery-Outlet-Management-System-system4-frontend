import React, { useState, useEffect } from "react";
import { friendlyError } from "../utils/friendlyError";
import {
  Package,
  Search,
  Send,
  X,
  History,
  TrendingUp,
  TrendingDown,
  LayoutDashboard
} from "lucide-react";
import { NavLink } from "react-router-dom";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";
import ExpiryTag from "../component/ExpiryTag.jsx";
import ReportWastageModal from "../component/ReportWastageModal.jsx";

export default function ManagerActualProduction() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Actual Production");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pool"); // pool, production_history, distribution_history

  const [productionHistory, setProductionHistory] = useState([]);
  const [distributionHistory, setDistributionHistory] = useState([]);

  const [outlets, setOutlets] = useState([]);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [distributeQty, setDistributeQty] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [reportItem, setReportItem] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

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

  const fetchHistories = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      const prodRes = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/history/production`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prodRes.ok) setProductionHistory(await prodRes.json());
      
      const distRes = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/history/distribution`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (distRes.ok) setDistributionHistory(await distRes.json());
    } catch (err) {
      console.error("Failed to fetch histories", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchOutlets();
    fetchHistories();
  }, []);

  const openDistributeModal = (item) => {
    setSelectedProduct(item);
    setDistributeQty("");
    setSelectedOutlet("");
    setShowDistributeModal(true);
  };

  const handleDistribute = async () => {
    if (!selectedOutlet || !distributeQty || parseInt(distributeQty) <= 0) {
      setNotification({ type: 'error', message: "Please select a valid outlet and enter a valid quantity." });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (parseInt(distributeQty) > selectedProduct.availableQuantity) {
      setNotification({ type: 'error', message: "Quantity cannot exceed available inventory." });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("authToken");
      const requestBody = {
        productId: selectedProduct.productId,
        outletId: parseInt(selectedOutlet),
        quantity: parseInt(distributeQty),
        distributionDate: new Date().toISOString().split("T")[0]
      };

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/distribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error("Failed to distribute to store");
      
      setNotification({ type: 'success', message: 'Successfully sent to store.' });
      setTimeout(() => setNotification(null), 3000);
      setShowDistributeModal(false);
      fetchInventory(); // Refresh inventory
      fetchHistories(); // Refresh history
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: err.message });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    item.availableQuantity > 0
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-success-solid' : 'bg-error-solid'
        } text-on-brand transition-opacity duration-300`}>
          {notification.message}
        </div>
      )}

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
              <h2 className="text-[20px] font-[600] text-fg">Actual Production Pool</h2>
              <p className="text-[12px] text-fg-secondary">Manage produced items ready to be sent to stores</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-line mb-6">
            <button
              className={`pb-3 text-[14px] font-[500] border-b-2 transition-colors ${
                activeTab === "pool"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
              onClick={() => setActiveTab("pool")}
            >
              Actual Production Pool
            </button>
            <button
              className={`pb-3 text-[14px] font-[500] border-b-2 transition-colors ${
                activeTab === "production_history"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
              onClick={() => setActiveTab("production_history")}
            >
              Production History
            </button>
            <button
              className={`pb-3 text-[14px] font-[500] border-b-2 transition-colors ${
                activeTab === "distribution_history"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
              onClick={() => setActiveTab("distribution_history")}
            >
              Distribution History
            </button>
          </div>

          {activeTab === "pool" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
              {loading ? (
                <div className="p-8"><Loader text="Loading actual production pool..." /></div>
              ) : error ? (
                <div className="p-8 text-center text-error">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-subtle border-b border-line">
                      <tr>
                        <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Product</th>
                        <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-center">Available Quantity</th>
                        <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Lots &amp; Expiry</th>
                        <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-center">Last Updated</th>
                        <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-fg-secondary text-[14px]">
                            No items in actual production pool.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-subtle/50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                  <Package className="text-brand-fg" size={16} />
                                </div>
                                <span className="text-[14px] font-[500] text-fg">{item.productName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-[14px] font-[600] text-fg">{item.availableQuantity}</span>
                            </td>
                            <td className="py-4 px-4">
                              {item.lots && item.lots.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {item.lots.slice(0, 3).map((lot) => (
                                    <div key={lot.id} className="flex items-center gap-2 text-[12px] text-fg">
                                      <span className="font-[600] w-8 text-right">{lot.availableQty}</span>
                                      <ExpiryTag expiryDate={lot.expiryDate} warnDays={1} />
                                      <button
                                        onClick={() => setReportItem({
                                          stage: "ACTUAL_PRODUCTION", locationType: "PRODUCTION_CENTER", locationName: "Actual Production",
                                          itemType: "FINISHED", itemId: item.productId, itemName: item.productName,
                                          batchRef: `Lot ${lot.id}`, expiryDate: lot.expiryDate,
                                          stockRef: `actual_production_lot:${lot.id}`, available: lot.availableQty,
                                        })}
                                        className="text-[12px] font-[600] text-error hover:underline"
                                      >
                                        Report
                                      </button>
                                    </div>
                                  ))}
                                  {item.lots.length > 3 && <span className="text-[12px] text-fg-muted">+{item.lots.length - 3} more lots</span>}
                                  {item.expiredQuantity > 0 && (
                                    <span className="text-[12px] font-[600] text-error">{item.expiredQuantity} expired - cannot be sent to stores</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[12px] text-fg-muted">No dated lots</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-[13px] text-fg-secondary">
                                {new Date(item.lastUpdated).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => openDistributeModal(item)}
                                disabled={item.availableQuantity <= 0}
                                className="px-3 py-1.5 bg-brand text-on-brand text-[13px] font-[500] rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 inline-flex"
                              >
                                <Send size={14} /> Send to Store
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "production_history" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-subtle border-b border-line">
                    <tr>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Date</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Product</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-center">Quantity</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Source Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {productionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-fg-secondary text-[14px]">
                          No production history found.
                        </td>
                      </tr>
                    ) : (
                      productionHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-subtle/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-[13px] text-fg-secondary">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                <TrendingUp className="text-success" size={16} />
                              </div>
                              <span className="text-[14px] font-[500] text-fg">{item.productName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-[14px] font-[600] text-success">+{item.quantity}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[13px] text-fg-secondary">{item.referenceName}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "distribution_history" && (
            <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-subtle border-b border-line">
                    <tr>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Date</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Product</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase text-center">Quantity</th>
                      <th className="py-3 px-4 text-[12px] font-[600] text-fg-secondary uppercase">Destination Outlet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {distributionHistory.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-fg-secondary text-[14px]">
                          No distribution history found.
                        </td>
                      </tr>
                    ) : (
                      distributionHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-subtle/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-[13px] text-fg-secondary">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                                <TrendingDown className="text-error" size={16} />
                              </div>
                              <span className="text-[14px] font-[500] text-fg">{item.productName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-[14px] font-[600] text-error">-{item.quantity}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[13px] text-fg-secondary">{item.referenceName}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {showDistributeModal && (
        <div className="fixed inset-0 bg-backdrop z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <h3 className="text-[16px] font-[600] text-fg">Send to Store</h3>
              <button aria-label="Close" 
                onClick={() => setShowDistributeModal(false)}
                className="text-fg-secondary hover:text-fg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[13px] font-[500] text-fg mb-1">Product</p>
                <p className="text-[14px] text-fg-secondary bg-subtle px-3 py-2 rounded border border-line">{selectedProduct?.productName}</p>
              </div>
              <div>
                <p className="text-[13px] font-[500] text-fg mb-1">Available Quantity</p>
                <p className="text-[14px] text-fg-secondary bg-subtle px-3 py-2 rounded border border-line">{selectedProduct?.availableQuantity}</p>
              </div>
              <div>
                <label className="text-[13px] font-[500] text-fg mb-1 block">Outlet / Store</label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full border border-line rounded px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                >
                  <option value="">Select Outlet</option>
                  {outlets.map(o => (
                    <option key={o.outletId} value={o.outletId}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-[500] text-fg mb-1 block">Quantity to Send</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.availableQuantity || 1}
                  value={distributeQty}
                  onChange={(e) => setDistributeQty(e.target.value)}
                  className="w-full border border-line rounded px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-4 border-t border-line">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 border border-line rounded-lg text-[13px] font-[500] text-fg hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand text-on-brand rounded-lg text-[13px] font-[500] hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send to Store"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {reportItem && (
        <ReportWastageModal
          item={reportItem}
          onClose={() => setReportItem(null)}
          onDone={(entry) => {
            setReportItem(null);
            setNotification({ type: "success", message: `${entry?.entryNo || "Wastage"} sent to the Admin for review.` });
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-backdrop z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
