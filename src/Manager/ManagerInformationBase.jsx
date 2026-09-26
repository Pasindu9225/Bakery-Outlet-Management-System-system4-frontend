import React, { useState, useEffect } from "react";
import { friendlyError } from "../utils/friendlyError";
import toast from "react-hot-toast";
import { confirmDialog } from "../component/ConfirmDialog";
import {
    Package,
    ArrowLeftRight,
    TrendingUp,
    FileText,
    Search,
    RefreshCw,
    AlertCircle
} from "lucide-react";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import Loader from "../component/Loader.jsx";

export default function ManagerInformationBase() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection] = useState('Store Information Base');
    const [activeTab, setActiveTab] = useState("purchases"); // purchases, grns, returns, stock

    // Data States
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [grns, setGrns] = useState([]);
    const [returns, setReturns] = useState([]);
    const [stock, setStock] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch all storekeeper data on mount
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || "";
            
            // 1. Fetch Purchase Orders
            const poResponse = await fetch(`${baseUrl}/STK/v1/purchase-orders`);
            if (poResponse.ok) {
                const poData = await poResponse.json();
                setPurchaseOrders(poData.purchaseOrders || []);
            }

            // 2. Fetch GRNs
            const grnResponse = await fetch(`${baseUrl}/STK/v1/grns`);
            if (grnResponse.ok) {
                const grnData = await grnResponse.json();
                setGrns(grnData.grns || []);
            }

            // 3. Fetch Returns
            const returnResponse = await fetch(`${baseUrl}/STK/v1/returns`);
            if (returnResponse.ok) {
                const returnData = await returnResponse.json();
                setReturns(returnData.returns || []);
            }

            // 4. Fetch Stock
            const stockResponse = await fetch(`${baseUrl}/STK/v1/materials/aggregated-stock`);
            if (stockResponse.ok) {
                const stockData = await stockResponse.json();
                setStock(stockData || []);
            }

        } catch (err) {
            console.error("Error fetching information base data:", err);
            setError(friendlyError(err, "Failed to load storekeeper information."));
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = (data, searchKeys) => {
        if (!searchQuery) return data;
        const lowerQuery = searchQuery.toLowerCase();
        return data.filter(item => 
            searchKeys.some(key => {
                const val = item[key];
                return val && String(val).toLowerCase().includes(lowerQuery);
            })
        );
    };

    const handleApprovePO = async (poId) => {
        if (!await confirmDialog(`Are you sure you want to approve Purchase Order PO-${poId}? This will automatically generate a Goods Received Note for the Storekeeper.`, { confirmText: "Approve" })) {
            return;
        }
        
        try {
            const baseUrl = process.env.REACT_APP_BASE_URL || "";
            const response = await fetch(`${baseUrl}/api/manager/purchase-orders/${poId}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                toast.success(`Purchase Order PO-${poId} has been successfully approved!`);
                fetchAllData(); // Refresh to show it as APPROVED and populate the GRNs tab
            } else {
                const errorData = await response.json();
                toast.error(friendlyError({ message: errorData.message, response: { status: response.status, data: errorData } }, "Couldn't approve the purchase order"));
            }
        } catch (err) {
            console.error("Failed to approve PO:", err);
            toast.error(friendlyError(err, "Couldn't approve the purchase order"));
        }
    };

    const renderTabs = () => (
        <div className="flex border-b border-line mb-6 overflow-x-auto hide-scrollbar">
            {[
                { id: "purchases", label: "Purchases (POs)", icon: <FileText size={18} /> },
                { id: "grns", label: "Goods Received (GRNs)", icon: <Package size={18} /> },
                { id: "returns", label: "Returns", icon: <ArrowLeftRight size={18} /> },
                { id: "stock", label: "Stock Levels", icon: <TrendingUp size={18} /> }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                            ? "border-brand-fg text-brand-fg font-semibold"
                            : "border-transparent text-fg-secondary hover:text-fg"
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const renderTable = () => {
        if (loading) {
            return (
                <Loader variant="section" text="Loading Store Information..." />
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center p-8 bg-error/10 text-error rounded-lg">
                    <AlertCircle className="mr-2" />
                    <span>{error}</span>
                </div>
            );
        }

        switch (activeTab) {
            case "purchases":
                const filteredPOs = getFilteredData(purchaseOrders, ["poId", "supplierName", "status"]);
                return (
                    <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
                        <table className="w-full text-left text-[14px]">
                            <thead className="bg-subtle text-fg-secondary font-[500] border-b border-line">
                                <tr>
                                    <th className="p-4">PO ID</th>
                                    <th className="p-4">Delivery Date</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Items count</th>
                                    <th className="p-4">Total Cost</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredPOs.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-fg-secondary">No purchase orders found.</td></tr>
                                ) : (
                                    filteredPOs.map((po, index) => (
                                        <tr key={index} className="hover:bg-subtle">
                                            <td className="p-4 font-semibold text-fg">PO-{po.poId}</td>
                                            <td className="p-4 text-fg-secondary">{po.estimatedDeliveryDate}</td>
                                            <td className="p-4 text-fg">{po.supplierName}</td>
                                            <td className="p-4 text-fg-secondary">{po.numberOfItems}</td>
                                            <td className="p-4 text-fg">Rs. {po.totalCost?.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${
                                                    po.status?.toUpperCase() === 'APPROVED' ? 'bg-success/10 text-success' :
                                                    po.status?.toUpperCase().includes('PENDING') ? 'bg-warning/10 text-warning' :
                                                    'bg-hover text-fg'
                                                }`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {po.status?.toUpperCase().includes('PENDING') && (
                                                    <button
                                                        onClick={() => handleApprovePO(po.poId)}
                                                        className="px-3 py-1 bg-brand text-on-brand text-[13px] font-medium rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case "grns":
                const filteredGRNs = getFilteredData(grns, ["grnId", "supplierName", "poReference", "grnStatus"]);
                return (
                    <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
                        <table className="w-full text-left text-[14px]">
                            <thead className="bg-subtle text-fg-secondary font-[500] border-b border-line">
                                <tr>
                                    <th className="p-4">GRN ID</th>
                                    <th className="p-4">Received Date</th>
                                    <th className="p-4">PO Ref</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredGRNs.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-fg-secondary">No GRNs found.</td></tr>
                                ) : (
                                    filteredGRNs.map((grn, index) => (
                                        <tr key={index} className="hover:bg-subtle">
                                            <td className="p-4 font-semibold text-fg">GRN-{grn.grnId}</td>
                                            <td className="p-4 text-fg-secondary">{new Date(grn.receivedDate).toLocaleDateString()}</td>
                                            <td className="p-4 text-brand-fg">PO-{grn.poId}</td>
                                            <td className="p-4 text-fg">{grn.supplierName}</td>
                                            <td className="p-4 text-fg">Rs. {grn.total?.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${
                                                    grn.grnStatus === 'COMPLETED' ? 'bg-brand/10 text-brand-fg' :
                                                    'bg-hover text-fg'
                                                }`}>
                                                    {grn.grnStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case "returns":
                const filteredReturns = getFilteredData(returns, ["returnId", "supplierName", "status"]);
                return (
                    <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
                        <table className="w-full text-left text-[14px]">
                            <thead className="bg-subtle text-fg-secondary font-[500] border-b border-line">
                                <tr>
                                    <th className="p-4">Return ID</th>
                                    <th className="p-4">Return Date</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Total Value</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredReturns.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-fg-secondary">No returns found.</td></tr>
                                ) : (
                                    filteredReturns.map((rtn, index) => (
                                        <tr key={index} className="hover:bg-subtle">
                                            <td className="p-4 font-semibold text-fg">RET-{rtn.returnId}</td>
                                            <td className="p-4 text-fg-secondary">{new Date(rtn.returnDate).toLocaleDateString()}</td>
                                            <td className="p-4 text-fg">{rtn.supplierName}</td>
                                            <td className="p-4 text-fg">Rs. {rtn.totalCost?.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[12px] font-medium bg-hover text-fg`}>
                                                    {rtn.status || "COMPLETED"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case "stock":
                const filteredStock = getFilteredData(stock, ["name", "category"]);
                return (
                    <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
                        <table className="w-full text-left text-[14px]">
                            <thead className="bg-subtle text-fg-secondary font-[500] border-b border-line">
                                <tr>
                                    <th className="p-4">Material Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Unit of Measure</th>
                                    <th className="p-4 text-right">Total Current Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredStock.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-fg-secondary">No stock information found.</td></tr>
                                ) : (
                                    filteredStock.map((item, index) => (
                                        <tr key={index} className="hover:bg-subtle">
                                            <td className="p-4 font-semibold text-fg">{item.name || item.genericMaterialName}</td>
                                            <td className="p-4 text-fg-secondary capitalize">{item.category}</td>
                                            <td className="p-4 text-fg-secondary">{item.unitOfMeasure}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-semibold ${item.totalStock <= 0 ? 'text-error' : 'text-fg'}`}>
                                                    {item.totalStock !== undefined && item.totalStock !== null ? item.totalStock : '0'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex bg-app h-screen overflow-hidden">
            <ManagerSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <ManagerNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-fg">Store Information Base</h1>
                                <p className="text-fg-secondary mt-1">Oversight and tracking of all storekeeper activities</p>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={18} />
                                    <input
                                        type="text"
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-fg focus:border-transparent"
                                    />
                                </div>
                                <button 
                                    onClick={fetchAllData}
                                    className="p-2 bg-surface border border-line rounded-lg shadow-sm hover:bg-subtle text-fg-secondary transition-colors"
                                    title="Refresh Data"
                                >
                                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>

                        {renderTabs()}
                        {renderTable()}

                    </div>
                </main>
            </div>
            
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
