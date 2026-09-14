import React, { useState, useEffect } from "react";
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
      alert("IOU request approved successfully!");
      fetchIouRequests();
      setIsViewModalOpen(false);
    } catch (err) {
      console.error("Failed to approve IOU request:", err);
      alert("Failed to approve IOU request");
    }
  };

  const handleApproveSettlement = async (id) => {
    try {
      const managerId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/api/storekeeper/iou-requests/${id}/final-approve/${managerId}`
      );
      alert("IOU settlement approved successfully!");
      fetchIouRequests();
      setIsViewModalOpen(false);
    } catch (err) {
      console.error("Failed to approve IOU settlement:", err);
      alert("Failed to approve IOU settlement");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock size={12} /> Pending Request
          </span>
        );
      case "APPROVED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case "SETTLEMENT_PENDING":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Clock size={12} /> Settlement Pending
          </span>
        );
      case "SETTLED":
      case "CLOSED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 size={12} /> Settled / Closed
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
        <div className="text-center py-12 bg-white rounded-lg border border-[#E4E6EA]">
          <FileText className="mx-auto h-12 w-12 text-[#98A2B3]" />
          <h3 className="mt-2 text-sm font-medium text-[#383E49]">
            No IOU Requests found
          </h3>
          <p className="mt-1 text-sm text-[#667085]">
            There are no IOU requests matching the current status filter.
          </p>
        </div>
      );
    }

    const isPendingTab = activeTab === "pending-requests";

    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#667085] text-[13px] border-b border-[#E4E6EA]">
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
                    className="border-b border-[#E4E6EA] hover:bg-[#F8F9FA]"
                  >
                    <td className="p-4 font-[500] text-[#383E49]">
                      IOU-{request.id}
                    </td>
                    <td className="p-4 text-[#383E49]">{request.requestDate}</td>
                    <td className="p-4 text-[#383E49]">{request.addedByName || "Storekeeper"}</td>
                    <td className="p-4 text-[#383E49]">{request.receiverName}</td>
                    <td className="p-4 text-[#383E49]">
                      LKR {request.totalEstimatedAmount?.toFixed(2)}
                    </td>
                    <td className="p-4 font-[600] text-[#0F50AA]">
                      LKR {issuedVal?.toFixed(2)}
                    </td>
                    {!isPendingTab && (
                      <td className="p-4 text-[#383E49]">
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
                                ? "text-red-600 font-[600]"
                                : "text-green-600 font-[600]"
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
                          className="p-1.5 text-[#0F50AA] hover:bg-blue-50 rounded flex items-center gap-1 font-[500] text-xs"
                          title="View Details"
                        >
                          <Eye size={16} /> View
                        </button>
                        {request.status === "PENDING" && (
                          <button
                            onClick={() => openViewModal(request)}
                            className="px-2.5 py-1 text-xs font-[500] text-white bg-green-600 hover:bg-green-700 rounded flex items-center gap-1"
                            title="Approve Request & Issue Cash"
                          >
                            <Check size={14} /> Approve & Issue
                          </button>
                        )}
                        {request.status === "SETTLEMENT_PENDING" && (
                          <button
                            onClick={() => openViewModal(request)}
                            className="px-2.5 py-1 text-xs font-[500] text-white bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-1"
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
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
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
            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
              IOU Approvals
            </h1>
            <p className="text-[14px] text-[#667085]">
              Review and approve storekeeper IOU requests and settlements
            </p>
          </div>

          <div className="flex border-b border-[#E4E6EA] mb-6 bg-white rounded-t-lg px-4 pt-3">
            <button
              onClick={() => setActiveTab("pending-requests")}
              className={`pb-3 px-4 font-[500] text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "pending-requests"
                  ? "border-[#0F50AA] text-[#0F50AA]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
              }`}
            >
              Pending Requests
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                {iouRequests.filter((r) => r.status === "PENDING").length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("pending-settlements")}
              className={`pb-3 px-4 font-[500] text-[14px] border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "pending-settlements"
                  ? "border-[#0F50AA] text-[#0F50AA]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
              }`}
            >
              Pending Settlements
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
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
                  ? "border-[#0F50AA] text-[#0F50AA]"
                  : "border-transparent text-[#667085] hover:text-[#383E49]"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#E4E6EA]">
              <div>
                <h2 className="text-[18px] font-[600] text-[#383E49]">
                  IOU Request #{selectedIOU.id}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedIOU.status)}
                  <span className="text-[13px] text-[#667085]">
                    Date: {selectedIOU.requestDate}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-[#F8F9FA] rounded text-[#667085]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E4E6EA]">
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">Requested By</p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedIOU.addedByName || "Storekeeper"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#667085] mb-1">Receiver Name</p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedIOU.receiverName}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] text-[#667085] mb-1">Justification</p>
                  <p className="text-[14px] font-[500] text-[#383E49]">
                    {selectedIOU.justification}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-blue-50/60 rounded-lg border border-blue-100">
                <div>
                  <p className="text-[12px] text-[#667085] mb-1 font-[500]">
                    Total Estimated Amount
                  </p>
                  <p className="text-[18px] font-[700] text-[#383E49]">
                    LKR {selectedIOU.totalEstimatedAmount?.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-[#667085] mb-1 font-[500]">
                    Cash Amount Issued by Manager
                  </p>
                  {selectedIOU.status === "PENDING" ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] font-[600] text-[#0F50AA]">LKR</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={issuedAmountInput}
                        onChange={(e) => setIssuedAmountInput(e.target.value)}
                        className="w-36 px-2 py-1 bg-white border border-[#0F50AA] rounded text-[16px] font-[700] text-[#0F50AA] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-[18px] font-[700] text-[#0F50AA]">
                      LKR {(selectedIOU.issuedAmount || selectedIOU.totalEstimatedAmount)?.toFixed(2)}
                    </p>
                  )}
                </div>

                {(selectedIOU.status === "SETTLEMENT_PENDING" ||
                  selectedIOU.status === "SETTLED" ||
                  selectedIOU.status === "CLOSED") && (
                  <div>
                    <p className="text-[12px] text-[#667085] mb-1 font-[500]">
                      Actual Total Spent & Balance
                    </p>
                    <p className="text-[16px] font-[700] text-[#383E49]">
                      Spent: LKR {selectedIOU.totalActualAmount?.toFixed(2)}
                    </p>
                    <p
                      className={`text-[13px] font-[600] mt-0.5 ${
                        (selectedIOU.differenceAmount || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(selectedIOU.differenceAmount || 0) >= 0
                        ? `Refund to Company: LKR ${(selectedIOU.differenceAmount || 0).toFixed(2)}`
                        : `Reimburse Storekeeper: LKR ${Math.abs(selectedIOU.differenceAmount || 0).toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>

              <h3 className="text-[16px] font-[600] text-[#383E49] mb-4">
                Items
              </h3>
              <div className="overflow-x-auto border border-[#E4E6EA] rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-[#F8F9FA] text-[13px] text-[#667085]">
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
                        className="border-t border-[#E4E6EA] hover:bg-[#F8F9FA]"
                      >
                        <td className="p-3 text-[#383E49]">
                          {item.supplierName}
                        </td>
                        <td className="p-3 text-[#383E49]">
                          {item.itemName ||
                            item.actualItemName ||
                            item.rawMaterialName ||
                            item.productName ||
                            `Item #${item.id}`}
                        </td>
                        <td className="p-3 text-[#383E49]">
                          {item.invoiceNumber || "-"}
                        </td>
                        <td className="p-3 font-[500] text-[#383E49] text-right">
                          {item.actualQuantity != null
                            ? item.actualQuantity
                            : item.estimatedQuantity}
                        </td>
                        <td className="p-3 text-[#667085] text-right">
                          LKR {item.estimatedPrice?.toFixed(2)}
                        </td>
                        <td className="p-3 font-[500] text-[#383E49] text-right">
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
                            <td className="p-3 text-[#667085] text-right">
                              LKR {item.actualPrice?.toFixed(2) || "0.00"}
                            </td>
                            <td className="p-3 font-[500] text-[#0F50AA] text-right">
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
                  <tfoot className="bg-[#F8F9FA] font-[600] text-[#383E49] border-t border-[#E4E6EA]">
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
                          <td className="p-3 text-right text-[#0F50AA]">
                            LKR {selectedIOU.totalActualAmount?.toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-[#E4E6EA] bg-[#F8F9FA] flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-[14px] font-[500] text-[#667085] bg-white border border-[#E4E6EA] rounded hover:bg-[#F0F1F3]"
              >
                Close
              </button>

              {selectedIOU.status === "PENDING" && (
                <button
                  onClick={() => handleApproveRequest(selectedIOU.id)}
                  className="px-4 py-2 text-[14px] font-[500] text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={16} /> Approve Request
                </button>
              )}

              {selectedIOU.status === "SETTLEMENT_PENDING" && (
                <button
                  onClick={() => handleApproveSettlement(selectedIOU.id)}
                  className="px-4 py-2 text-[14px] font-[500] text-white bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-2"
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
