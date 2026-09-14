import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Clock,
  User,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  X
} from "lucide-react";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import posService from "../services/posService";
import toast from "react-hot-toast";

export default function ManagerCreditOrders() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Credit Orders");
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Detail & Action Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCreditOrders();
  }, []);

  const fetchCreditOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await posService.getPendingSpecialOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch credit orders:", err);
      setError(err.response?.data?.message || "Failed to load credit orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      setIsSubmitting(true);
      const managerId = localStorage.getItem("userId") || "1";
      await posService.approveAndCloseOrder(orderId, managerId);
      toast.success(`Order #${orderId} approved and completed successfully!`);
      setShowDetailModal(false);
      fetchCreditOrders();
    } catch (err) {
      console.error("Approval error:", err);
      toast.error(err.response?.data?.message || "Failed to approve order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason for cancellation.");
      return;
    }
    try {
      setIsSubmitting(true);
      await posService.cancelOrder(selectedOrder.id, cancelReason);
      toast.success(`Order #${selectedOrder.id} cancelled.`);
      setShowCancelModal(false);
      setShowDetailModal(false);
      setCancelReason("");
      fetchCreditOrders();
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (order.id && String(order.id).toLowerCase().includes(query)) ||
      (order.customerName && order.customerName.toLowerCase().includes(query)) ||
      (order.contactNumber && order.contactNumber.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "ALL" ||
      (order.status && order.status.toUpperCase() === statusFilter.toUpperCase());

    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const totalAdvanceAmount = orders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  const totalRemainingBalance = orders.reduce((sum, o) => sum + (o.balanceAmount || 0), 0);
  const pendingApprovalsCount = orders.filter(
    (o) => o.status === "PENDING_APPROVAL" || o.status === "ADVANCE_PAID"
  ).length;

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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-[20px] font-[600] text-[#383E49]">
                  Credit Orders Management
                </h2>
                <p className="text-[12px] text-[#667085]">
                  View, monitor, and manage special credit orders for your outlet
                </p>
              </div>

              <button
                onClick={fetchCreditOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E6EA] rounded-lg text-[13px] font-[500] text-[#383E49] hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-[#0F50AA]" : ""} />
                Refresh
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E4E6EA]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-[#667085]">Total Credit Orders</span>
                  <div className="p-2 bg-blue-50 text-[#0F50AA] rounded-lg">
                    <FileText size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-[#383E49]">{totalOrdersCount}</p>
                <p className="text-[11px] text-[#667085] mt-1">Active special/credit orders</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E4E6EA]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-[#667085]">Total Advance Collected</span>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-green-600">
                  Rs. {totalAdvanceAmount.toFixed(2)}
                </p>
                <p className="text-[11px] text-[#667085] mt-1">Deposits received upfront</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E4E6EA]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-[#667085]">Outstanding Balance</span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Clock size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-amber-600">
                  Rs. {totalRemainingBalance.toFixed(2)}
                </p>
                <p className="text-[11px] text-[#667085] mt-1">Remaining payment due</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E4E6EA]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-[#667085]">Pending Action</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Shield size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-purple-600">{pendingApprovalsCount}</p>
                <p className="text-[11px] text-[#667085] mt-1">Requires fulfillment / approval</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by customer, contact or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0F50AA]"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <span className="text-[12px] font-[500] text-[#667085] whitespace-nowrap">Status:</span>
                {["ALL", "ADVANCE_PAID", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-[500] transition-colors whitespace-nowrap ${
                      statusFilter === status
                        ? "bg-[#0F50AA] text-white"
                        : "bg-[#F8F9FA] text-[#667085] hover:bg-gray-100"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#F9FAFB] border-b border-[#E4E6EA]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Order ID & Date
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Advance Paid
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Balance Due
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Delivery Schedule
                      </th>
                      <th className="px-6 py-3 text-center text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-[11px] font-[600] text-[#667085] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E6EA]">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-[#667085]">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="animate-spin text-[#0F50AA]" size={20} />
                            <span>Loading Credit Orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-red-500 text-[14px]">
                          {error}
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-[#667085]">
                          <FileText size={36} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-[14px] font-[500]">No credit orders found</p>
                          <p className="text-[12px] text-gray-400">
                            Credit orders created at the POS terminal will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-[600] text-[#0F50AA]">
                              #{order.id}
                            </span>
                            <span className="block text-[12px] text-[#667085]">
                              {order.orderDate || order.createdAt || "N/A"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[14px] font-[500] text-[#383E49] block">
                              {order.customerName || "Walk-in Customer"}
                            </span>
                            <span className="text-[12px] text-[#667085]">
                              {order.contactNumber || "No Phone"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-[#383E49]">
                              Rs. {(order.totalAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-green-600">
                              Rs. {(order.advanceAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-amber-600">
                              Rs. {(order.balanceAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[13px] text-[#383E49]">
                              <Calendar size={14} className="text-[#667085]" />
                              <span>{order.deliveryDate || "N/A"}</span>
                            </div>
                            {order.deliveryTime && (
                              <span className="text-[11px] text-[#667085] ml-5 block">
                                {order.deliveryTime}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-[600] inline-block ${
                                order.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : order.status === "ADVANCE_PAID"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {(order.status || "PENDING").replace("_", " ")}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#0F50AA]/10 text-[#0F50AA] hover:bg-[#0F50AA]/20 rounded-lg text-[12px] font-[500] transition-colors inline-flex items-center gap-1"
                            >
                              <Eye size={14} />
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Order Detail & Action Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E4E6EA] flex justify-between items-center bg-[#F8F9FA] rounded-t-xl">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Credit Order Details #{selectedOrder.id}
                </h3>
                <p className="text-[12px] text-[#667085]">
                  Status:{" "}
                  <span className="font-[600] text-[#0F50AA]">
                    {(selectedOrder.status || "PENDING").replace("_", " ")}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#667085] hover:text-[#383E49] p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E4E6EA] space-y-2">
                <h4 className="text-[13px] font-[600] text-[#383E49] flex items-center gap-2">
                  <User size={16} className="text-[#0F50AA]" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-[#667085]">Name:</span>{" "}
                    <span className="font-[500] text-[#383E49]">
                      {selectedOrder.customerName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#667085]">Contact:</span>{" "}
                    <span className="font-[500] text-[#383E49]">
                      {selectedOrder.contactNumber || "N/A"}
                    </span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div>
                      <span className="text-[#667085]">Email:</span>{" "}
                      <span className="font-[500] text-[#383E49]">
                        {selectedOrder.customerEmail}
                      </span>
                    </div>
                  )}
                  {selectedOrder.deliveryDate && (
                    <div>
                      <span className="text-[#667085]">Delivery Date:</span>{" "}
                      <span className="font-[500] text-[#383E49]">
                        {selectedOrder.deliveryDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-[13px] font-[600] text-[#383E49] mb-3 flex items-center gap-2">
                  <Package size={16} className="text-[#0F50AA]" />
                  Order Items
                </h4>
                <div className="border border-[#E4E6EA] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#F9FAFB] border-b border-[#E4E6EA] text-[#667085]">
                      <tr>
                        <th className="p-3 font-[600]">Product</th>
                        <th className="p-3 font-[600] text-center">Qty</th>
                        <th className="p-3 font-[600] text-right">Unit Price</th>
                        <th className="p-3 font-[600] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-[500] text-[#383E49]">
                              {item.name || item.productName || `Item #${item.productId}`}
                            </td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">
                              Rs. {(item.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-[600] text-[#0F50AA]">
                              Rs. {((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-[#667085]">
                            No detailed item breakdown recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Total Order Amount:</span>
                  <span className="font-[600] text-[#383E49]">
                    Rs. {(selectedOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Advance Deposit Paid:</span>
                  <span className="font-[600] text-green-600">
                    Rs. {(selectedOrder.advanceAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 font-[600] text-[14px]">
                  <span className="text-[#383E49]">Remaining Balance Due:</span>
                  <span className="text-amber-600">
                    Rs. {(selectedOrder.balanceAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-[#E4E6EA] bg-[#F8F9FA] flex justify-between items-center rounded-b-xl gap-3">
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isSubmitting || selectedOrder.status === "CANCELLED"}
                className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-[13px] font-[500] transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-[#E4E6EA] text-[#667085] hover:bg-gray-100 rounded-lg text-[13px] font-[500] transition-colors"
                >
                  Close
                </button>
                {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleApproveOrder(selectedOrder.id)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#0F50AA] text-white hover:bg-[#0D4494] rounded-lg text-[13px] font-[500] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {isSubmitting ? "Processing..." : "Approve & Fulfill"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-[600] text-[#383E49] flex items-center gap-2">
              <XCircle className="text-red-500" size={20} />
              Cancel Order #{selectedOrder.id}
            </h3>
            <p className="text-[13px] text-[#667085]">
              Please state the reason for cancelling this credit order:
            </p>
            <textarea
              rows="3"
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border border-[#E4E6EA] rounded-lg text-[13px] focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-[#E4E6EA] text-[#667085] rounded-lg text-[13px] font-[500]"
              >
                Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isSubmitting || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-[500] hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
