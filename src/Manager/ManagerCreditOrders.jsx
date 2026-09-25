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
    <div className="flex bg-app h-screen overflow-hidden">
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
                <h2 className="text-[20px] font-[600] text-fg">
                  Credit Orders Management
                </h2>
                <p className="text-[12px] text-fg-secondary">
                  View, monitor, and manage special credit orders for your outlet
                </p>
              </div>

              <button
                onClick={fetchCreditOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-lg text-[13px] font-[500] text-fg hover:bg-subtle transition-colors shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-brand-fg" : ""} />
                Refresh
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-4 rounded-xl shadow-sm border border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-fg-secondary">Total Credit Orders</span>
                  <div className="p-2 bg-brand/10 text-brand-fg rounded-lg">
                    <FileText size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-fg">{totalOrdersCount}</p>
                <p className="text-[11px] text-fg-secondary mt-1">Active special/credit orders</p>
              </div>

              <div className="bg-surface p-4 rounded-xl shadow-sm border border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-fg-secondary">Total Advance Collected</span>
                  <div className="p-2 bg-success/10 text-success rounded-lg">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-success">
                  Rs. {totalAdvanceAmount.toFixed(2)}
                </p>
                <p className="text-[11px] text-fg-secondary mt-1">Deposits received upfront</p>
              </div>

              <div className="bg-surface p-4 rounded-xl shadow-sm border border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-fg-secondary">Outstanding Balance</span>
                  <div className="p-2 bg-warning/10 text-warning rounded-lg">
                    <Clock size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-warning">
                  Rs. {totalRemainingBalance.toFixed(2)}
                </p>
                <p className="text-[11px] text-fg-secondary mt-1">Remaining payment due</p>
              </div>

              <div className="bg-surface p-4 rounded-xl shadow-sm border border-line">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-[500] text-fg-secondary">Pending Action</span>
                  <div className="p-2 bg-plum/10 text-plum rounded-lg">
                    <Shield size={18} />
                  </div>
                </div>
                <p className="text-[22px] font-[700] text-plum">{pendingApprovalsCount}</p>
                <p className="text-[11px] text-fg-secondary mt-1">Requires fulfillment / approval</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-surface rounded-xl shadow-sm border border-line p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search by customer, contact or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <span className="text-[12px] font-[500] text-fg-secondary whitespace-nowrap">Status:</span>
                {["ALL", "ADVANCE_PAID", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-[500] transition-colors whitespace-nowrap ${
                      statusFilter === status
                        ? "bg-brand text-on-brand"
                        : "bg-subtle text-fg-secondary hover:bg-hover"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Orders Table */}
            <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-subtle border-b border-line">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Order ID & Date
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Advance Paid
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Balance Due
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Delivery Schedule
                      </th>
                      <th className="px-6 py-3 text-center text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-[11px] font-[600] text-fg-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-fg-secondary">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="animate-spin text-brand-fg" size={20} />
                            <span>Loading Credit Orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-error text-[14px]">
                          {error}
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-fg-secondary">
                          <FileText size={36} className="mx-auto mb-2 text-fg-muted" />
                          <p className="text-[14px] font-[500]">No credit orders found</p>
                          <p className="text-[12px] text-fg-muted">
                            Credit orders created at the POS terminal will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-subtle/60 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-[600] text-brand-fg">
                              #{order.id}
                            </span>
                            <span className="block text-[12px] text-fg-secondary">
                              {order.orderDate || order.createdAt || "N/A"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[14px] font-[500] text-fg block">
                              {order.customerName || "Walk-in Customer"}
                            </span>
                            <span className="text-[12px] text-fg-secondary">
                              {order.contactNumber || "No Phone"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-fg">
                              Rs. {(order.totalAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-success">
                              Rs. {(order.advanceAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="text-[14px] font-[600] text-warning">
                              Rs. {(order.balanceAmount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[13px] text-fg">
                              <Calendar size={14} className="text-fg-secondary" />
                              <span>{order.deliveryDate || "N/A"}</span>
                            </div>
                            {order.deliveryTime && (
                              <span className="text-[11px] text-fg-secondary ml-5 block">
                                {order.deliveryTime}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-[600] inline-block ${
                                order.status === "COMPLETED"
                                  ? "bg-success/10 text-success"
                                  : order.status === "CANCELLED"
                                  ? "bg-error/10 text-error"
                                  : order.status === "ADVANCE_PAID"
                                  ? "bg-brand/10 text-brand-fg"
                                  : "bg-warning/10 text-warning"
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
                              className="px-3 py-1.5 bg-brand/10 text-brand-fg hover:bg-brand/20 rounded-lg text-[12px] font-[500] transition-colors inline-flex items-center gap-1"
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
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-line flex justify-between items-center bg-subtle rounded-t-xl">
              <div>
                <h3 className="text-[18px] font-[600] text-fg">
                  Credit Order Details #{selectedOrder.id}
                </h3>
                <p className="text-[12px] text-fg-secondary">
                  Status:{" "}
                  <span className="font-[600] text-brand-fg">
                    {(selectedOrder.status || "PENDING").replace("_", " ")}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-fg-secondary hover:text-fg p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-subtle p-4 rounded-xl border border-line space-y-2">
                <h4 className="text-[13px] font-[600] text-fg flex items-center gap-2">
                  <User size={16} className="text-brand-fg" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <span className="text-fg-secondary">Name:</span>{" "}
                    <span className="font-[500] text-fg">
                      {selectedOrder.customerName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-secondary">Contact:</span>{" "}
                    <span className="font-[500] text-fg">
                      {selectedOrder.contactNumber || "N/A"}
                    </span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div>
                      <span className="text-fg-secondary">Email:</span>{" "}
                      <span className="font-[500] text-fg">
                        {selectedOrder.customerEmail}
                      </span>
                    </div>
                  )}
                  {selectedOrder.deliveryDate && (
                    <div>
                      <span className="text-fg-secondary">Delivery Date:</span>{" "}
                      <span className="font-[500] text-fg">
                        {selectedOrder.deliveryDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-[13px] font-[600] text-fg mb-3 flex items-center gap-2">
                  <Package size={16} className="text-brand-fg" />
                  Order Items
                </h4>
                <div className="border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-subtle border-b border-line text-fg-secondary">
                      <tr>
                        <th className="p-3 font-[600]">Product</th>
                        <th className="p-3 font-[600] text-center">Qty</th>
                        <th className="p-3 font-[600] text-right">Unit Price</th>
                        <th className="p-3 font-[600] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-[500] text-fg">
                              {item.name || item.productName || `Item #${item.productId}`}
                            </td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">
                              Rs. {(item.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-[600] text-brand-fg">
                              Rs. {((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-4 text-center text-fg-secondary">
                            No detailed item breakdown recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-brand/10 p-4 rounded-xl border border-brand/20 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-fg-secondary">Total Order Amount:</span>
                  <span className="font-[600] text-fg">
                    Rs. {(selectedOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-secondary">Advance Deposit Paid:</span>
                  <span className="font-[600] text-success">
                    Rs. {(selectedOrder.advanceAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-brand/20 pt-2 font-[600] text-[14px]">
                  <span className="text-fg">Remaining Balance Due:</span>
                  <span className="text-warning">
                    Rs. {(selectedOrder.balanceAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-line bg-subtle flex justify-between items-center rounded-b-xl gap-3">
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isSubmitting || selectedOrder.status === "CANCELLED"}
                className="px-4 py-2 border border-error/30 text-error hover:bg-error/10 rounded-lg text-[13px] font-[500] transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-line text-fg-secondary hover:bg-hover rounded-lg text-[13px] font-[500] transition-colors"
                >
                  Close
                </button>
                {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleApproveOrder(selectedOrder.id)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-brand text-on-brand hover:bg-brand-hover rounded-lg text-[13px] font-[500] transition-colors flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-backdrop bg-opacity-60 z-[10000] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-[600] text-fg flex items-center gap-2">
              <XCircle className="text-error" size={20} />
              Cancel Order #{selectedOrder.id}
            </h3>
            <p className="text-[13px] text-fg-secondary">
              Please state the reason for cancelling this credit order:
            </p>
            <textarea
              rows="3"
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border border-line rounded-lg text-[13px] focus:outline-none focus:border-error"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-line text-fg-secondary rounded-lg text-[13px] font-[500]"
              >
                Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isSubmitting || !cancelReason.trim()}
                className="px-4 py-2 bg-error-solid text-on-brand rounded-lg text-[13px] font-[500] hover:bg-error-solid disabled:opacity-50"
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
