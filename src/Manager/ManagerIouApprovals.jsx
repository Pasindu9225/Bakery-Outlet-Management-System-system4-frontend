import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Eye,
  Check,
  X,
} from "lucide-react";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import FinanceSideBar from "../component/FinanceSideBar.jsx";
import Loader from "../component/Loader.jsx";
import axios from "axios";

export default function ManagerIouApprovals() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("IOU Approvals");
  const userRole = localStorage.getItem("userRole");
  const isFinanceUser = String(userRole) === "15" || String(userRole).toUpperCase() === "FINANCE";
  const [activeTab, setActiveTab] = useState("pending-requests"); // 'pending-requests', 'pending-settlements', 'history'

  const [iouRequests, setIouRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIOU, setSelectedIOU] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [issuedAmountInput, setIssuedAmountInput] = useState("");

  const openViewModal = (iou) => {
    setSelectedIOU(iou);
    setIssuedAmountInput(iou.issuedAmount || iou.totalEstimatedAmount || 0);
    setIsViewModalOpen(true);
  };

  // Fetch IOU requests
  const fetchIouRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests`
      );
      setIouRequests(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch IOU requests:", err);
      setError("Failed to fetch IOU requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIouRequests();
  }, []);

  const handleApproveRequest = async (id) => {
    try {
      const managerId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
      const val = parseFloat(issuedAmountInput) || (selectedIOU ? selectedIOU.totalEstimatedAmount : 0);
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests/${id}/approve/${managerId}`,
        { issuedAmount: val }
      );
      toast.success("IOU request approved successfully!");
      fetchIouRequests();
      setIsViewModalOpen(false);
    } catch (err) {
      console.error("Failed to approve IOU request:", err);
      toast.error("Failed to approve IOU request");
    }
  };

  const handleApproveSettlement = async (id) => {
    try {
      const managerId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests/${id}/final-approve/${managerId}`
      );
      toast.success("IOU settlement approved successfully!");
      fetchIouRequests();
      setIsViewModalOpen(false);
    } catch (err) {
      console.error("Failed to approve IOU settlement:", err);
      toast.error("Failed to approve IOU settlement");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Clock size={12} /> Pending Request
          </span>
        );
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-fg">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case "SETTLEMENT_PENDING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-plum/10 text-plum">
            <Clock size={12} /> Settlement Pending
          </span>
        );
      case "SETTLED":
      case "CLOSED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle2 size={12} /> Settled / Closed
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-hover text-fg">
            {status}
          </span>
        );
    }
  };

  const renderTable = (statusFilter) => {
    const filteredRequests = iouRequests.filter((req) =>
      statusFilter.includes(req.status)
    );

    if (loading) {
      return (
        <Loader variant="section" text="Loading IOU requests..." />
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="text-center py-12 bg-surface rounded-lg border border-line">
          <FileText className="mx-auto h-12 w-12 text-fg-muted" />
          <h3 className="mt-2 text-sm font-medium text-fg">
            No IOU Requests found
          </h3>
          <p className="mt-1 text-sm text-fg-secondary">
            There are no IOU requests matching the current status filter.
          </p>
        </div>
      );
    }

    const isPendingTab = activeTab === "pending-requests";

    return (
      <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle text-fg-secondary text-[13px] border-b border-line">
                <th className="p-4 font-[500]">ID</th>
                <th className="p-4 font-[500]">Date</th>
                <th className="p-4 font-[500]">Storekeeper</th>
                <th className="p-4 font-[500]">Receiver</th>
                <th className="p-4 font-[500]">Estimated Amount</th>
                <th className="p-4 font-[500]">Issued Money (Manager)</th>
                {!isPendingTab && <th className="p-4 font-[500]">Actual Spent</th>}
                {!isPendingTab && <th className="p-4 font-[500]">Balance / Difference</th>}
                <th className="p-4 font-[500]">Status</th>
                <th className="p-4 font-[500] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {filteredRequests.map((request) => {
                const issuedVal = request.issuedAmount != null ? request.issuedAmount : request.totalEstimatedAmount;
                const diffVal = request.differenceAmount;
                return (
                  <tr
                    key={request.id}
                    className="border-b border-line hover:bg-subtle"
                  >
                    <td className="p-4 font-[500] text-fg">
                      IOU-{request.id}
                    </td>
                    <td className="p-4 text-fg">{request.requestDate}</td>
                    <td className="p-4 text-fg">{request.addedByName || "Storekeeper"}</td>
                    <td className="p-4 text-fg">{request.receiverName}</td>
                    <td className="p-4 text-fg">
                      LKR {request.totalEstimatedAmount?.toFixed(2)}
                    </td>
                    <td className="p-4 font-[600] text-brand-fg">
                      LKR {issuedVal?.toFixed(2)}
                    </td>
                    {!isPendingTab && (
                      <td className="p-4 text-fg">
                        {request.totalActualAmount != null
                          ? `LKR ${request.totalActualAmount.toFixed(2)}`
                          : "N/A"}
                      </td>
                    )}
                    {!isPendingTab && (
                      <td className="p-4 font-[500]">
                        {diffVal != null ? (
                          <span
                            className={
                              diffVal < 0
                                ? "text-error font-[600]"
                                : "text-success font-[600]"
                            }
                          >
                            {diffVal >= 0 ? `+LKR ${diffVal.toFixed(2)} (Refund)` : `-LKR ${Math.abs(diffVal).toFixed(2)} (Reimburse)`}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    )}
                    <td className="p-4">{getStatusBadge(request.status)}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openViewModal(request)}
                          className="p-1.5 text-brand-fg hover:bg-brand/10 rounded flex items-center gap-1 font-[500] text-xs"
                          title="View Details"
                        >
                          <Eye size={16} /> View
                        </button>
                        {request.status === "PENDING" && (
                          <button
                            onClick={() => openViewModal(request)}
                            className="px-2.5 py-1 text-xs font-[500] text-on-brand bg-success-solid hover:bg-success-solid rounded flex items-center gap-1"
                            title="Approve Request & Issue Cash"
                          >
                            <Check size={14} /> Approve & Issue
                          </button>
                        )}
                        {request.status === "SETTLEMENT_PENDING" && (
                          <button
                            onClick={() => openViewModal(request)}
                            className="px-2.5 py-1 text-xs font-[500] text-on-brand bg-plum-solid hover:bg-plum-solid rounded flex items-center gap-1"
                            title="Approve Final Settlement"
                          >
                            <Check size={14} /> Approve Settlement
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "pending-requests") return renderTable(["PENDING"]);
    if (activeTab === "pending-settlements") return renderTable(["SETTLEMENT_PENDING"]);
    if (activeTab === "history") return renderTable(["APPROVED", "SETTLED", "CLOSED", "REJECTED"]);
    return null;
  };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      {isFinanceUser ? (
        <FinanceSideBar sidebarOpen={sidebarOpen} />
      ) : (
        <ManagerSidebar sidebarOpen={sidebarOpen} />
      )}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              IOU Approvals
            </h1>
            <p className="text-[14px] text-fg-secondary">
              Review and approve storekeeper IOU requests and settlements
            </p>
          </div>

          <div className="flex border-b border-line mb-6 bg-surface rounded-t-lg px-4 pt-3">
            <button
              onClick={() => setActiveTab("pending-requests")}
              className={`pb-3 px-4 font-[500] text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "pending-requests"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
            >
              Pending Requests
              <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full">
                {iouRequests.filter((r) => r.status === "PENDING").length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("pending-settlements")}
              className={`pb-3 px-4 font-[500] text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "pending-settlements"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
            >
              Pending Settlements
              <span className="bg-plum/10 text-plum text-xs px-2 py-0.5 rounded-full">
                {
                  iouRequests.filter((r) => r.status === "SETTLEMENT_PENDING")
                    .length
                }
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 px-4 font-[500] text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "history"
                  ? "border-brand-fg text-brand-fg"
                  : "border-transparent text-fg-secondary hover:text-fg"
              }`}
            >
              History
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {isViewModalOpen && selectedIOU && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-line">
              <div>
                <h2 className="text-[18px] font-[600] text-fg">
                  IOU Request #{selectedIOU.id}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedIOU.status)}
                  <span className="text-[13px] text-fg-secondary">
                    Date: {selectedIOU.requestDate}
                  </span>
                </div>
              </div>
              <button aria-label="Close"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-subtle rounded text-fg-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-subtle rounded-lg border border-line">
                <div>
                  <p className="text-[12px] text-fg-secondary mb-1">Requested By</p>
                  <p className="text-[14px] font-[500] text-fg">
                    {selectedIOU.addedByName || "Storekeeper"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-fg-secondary mb-1">Receiver Name</p>
                  <p className="text-[14px] font-[500] text-fg">
                    {selectedIOU.receiverName}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] text-fg-secondary mb-1">Justification</p>
                  <p className="text-[14px] font-[500] text-fg">
                    {selectedIOU.justification}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-brand/10 rounded-lg border border-brand/20">
                <div>
                  <p className="text-[12px] text-fg-secondary mb-1 font-[500]">
                    Total Estimated Amount
                  </p>
                  <p className="text-[18px] font-[700] text-fg">
                    LKR {selectedIOU.totalEstimatedAmount?.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-fg-secondary mb-1 font-[500]">
                    Cash Amount Issued by Manager
                  </p>
                  {selectedIOU.status === "PENDING" ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] font-[600] text-brand-fg">LKR</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={issuedAmountInput}
                        onChange={(e) => setIssuedAmountInput(e.target.value)}
                        className="w-36 px-2 py-1 bg-surface border border-brand-fg rounded text-[16px] font-[700] text-brand-fg focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-[18px] font-[700] text-brand-fg">
                      LKR {(selectedIOU.issuedAmount || selectedIOU.totalEstimatedAmount)?.toFixed(2)}
                    </p>
                  )}
                </div>

                {(selectedIOU.status === "SETTLEMENT_PENDING" ||
                  selectedIOU.status === "SETTLED" ||
                  selectedIOU.status === "CLOSED") && (
                  <div>
                    <p className="text-[12px] text-fg-secondary mb-1 font-[500]">
                      Actual Total Spent & Balance
                    </p>
                    <p className="text-[16px] font-[700] text-fg">
                      Spent: LKR {selectedIOU.totalActualAmount?.toFixed(2)}
                    </p>
                    <p
                      className={`text-[13px] font-[600] mt-0.5 ${
                        (selectedIOU.differenceAmount || 0) >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {(selectedIOU.differenceAmount || 0) >= 0
                        ? `Refund to Company: LKR ${(selectedIOU.differenceAmount || 0).toFixed(2)}`
                        : `Reimburse Storekeeper: LKR ${Math.abs(selectedIOU.differenceAmount || 0).toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>

              <h3 className="text-[16px] font-[600] text-fg mb-4">
                Items
              </h3>
              <div className="overflow-x-auto border border-line rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-subtle text-[13px] text-fg-secondary">
                    <tr>
                      <th className="p-3 font-[500]">Supplier</th>
                      <th className="p-3 font-[500]">Item Name</th>
                      <th className="p-3 font-[500]">Invoice No.</th>
                      <th className="p-3 font-[500] text-right">Qty</th>
                      <th className="p-3 font-[500] text-right">Est. Price</th>
                      <th className="p-3 font-[500] text-right">Est. Total</th>
                      {(selectedIOU.status === "SETTLEMENT_PENDING" ||
                        selectedIOU.status === "SETTLED" ||
                        selectedIOU.status === "CLOSED") && (
                        <>
                          <th className="p-3 font-[500] text-right">
                            Act. Price
                          </th>
                          <th className="p-3 font-[500] text-right">
                            Act. Total
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-[14px]">
                    {selectedIOU.items?.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-line hover:bg-subtle"
                      >
                        <td className="p-3 text-fg">
                          {item.supplierName}
                        </td>
                        <td className="p-3 text-fg">
                          {item.itemName ||
                            item.actualItemName ||
                            item.rawMaterialName ||
                            item.productName ||
                            `Item #${item.id}`}
                        </td>
                        <td className="p-3 text-fg">
                          {item.invoiceNumber || "-"}
                        </td>
                        <td className="p-3 font-[500] text-fg text-right">
                          {item.actualQuantity != null
                            ? item.actualQuantity
                            : item.estimatedQuantity}
                        </td>
                        <td className="p-3 text-fg-secondary text-right">
                          LKR {item.estimatedPrice?.toFixed(2)}
                        </td>
                        <td className="p-3 font-[500] text-fg text-right">
                          LKR{" "}
                          {(
                            ((item.actualQuantity != null
                              ? item.actualQuantity
                              : item.estimatedQuantity) || 0) *
                            (item.estimatedPrice || 0)
                          ).toFixed(2)}
                        </td>

                        {(selectedIOU.status === "SETTLEMENT_PENDING" ||
                          selectedIOU.status === "SETTLED" ||
                          selectedIOU.status === "CLOSED") && (
                          <>
                            <td className="p-3 text-fg-secondary text-right">
                              LKR {item.actualPrice?.toFixed(2) || "0.00"}
                            </td>
                            <td className="p-3 font-[500] text-brand-fg text-right">
                              LKR{" "}
                              {(
                                (item.actualQuantity || 0) *
                                (item.actualPrice || 0)
                              ).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-subtle font-[600] text-fg border-t border-line">
                    <tr>
                      <td className="p-3 text-right" colSpan={5}>
                        Total Estimated:
                      </td>
                      <td className="p-3 text-right">
                        LKR {selectedIOU.totalEstimatedAmount?.toFixed(2)}
                      </td>
                      {(selectedIOU.status === "SETTLEMENT_PENDING" ||
                        selectedIOU.status === "SETTLED" ||
                        selectedIOU.status === "CLOSED") && (
                        <>
                          <td className="p-3 text-right">Total Actual:</td>
                          <td className="p-3 text-right text-brand-fg">
                            LKR {selectedIOU.totalActualAmount?.toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-line bg-subtle flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-[14px] font-[500] text-fg-secondary bg-surface border border-line rounded hover:bg-app"
              >
                Close
              </button>

              {selectedIOU.status === "PENDING" && (
                <button
                  onClick={() => handleApproveRequest(selectedIOU.id)}
                  className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-success-solid rounded hover:bg-success-solid flex items-center gap-2"
                >
                  <Check size={16} /> Approve Request
                </button>
              )}

              {selectedIOU.status === "SETTLEMENT_PENDING" && (
                <button
                  onClick={() => handleApproveSettlement(selectedIOU.id)}
                  className="px-4 py-2 text-[14px] font-[500] text-on-brand bg-plum-solid rounded hover:bg-plum-solid flex items-center gap-2"
                >
                  <Check size={16} /> Approve Settlement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
