import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  X,
  History,
  Coins,
  Calendar,
  CreditCard,
  Check,
  Loader2,
  Phone,
  User
} from "lucide-react";
import axiosInstance from "../services/api";
import { extractNicDetails } from "../utils/nicParser";
import Loader from "./Loader";


import ManagerNavBar from "./ManagerNavBar.jsx";
import ManagerSidebar from "./ManagerSidebar.jsx";
import POSNavBar from "./POSNavBar.jsx";
import POSSidebar from "./POSSidebar.jsx";
import AdminNavBar from "./AdminNavBar.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

export default function CustomerManagement() {
  const path = window.location.pathname.toLowerCase();
  const isAdmin = path.includes("/admincustomers");
  const isManager = path.includes("/manager");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Customer Management");

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState(null); // 'register' or 'history'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Registration Form State
  const [regStep, setRegStep] = useState(1); // 1 = Form, 2 = OTP Verification
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regIdCard, setRegIdCard] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [formError, setFormError] = useState("");

  // Custom Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const showNotification = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/pos/v1/customers");
      setCustomers(response.data || []);
    } catch (err) {
      showNotification("Failed to fetch customers list.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!regName.trim() || !regPhone.trim()) {
      setFormError("Name and Phone Number are required.");
      return;
    }

    const phoneClean = regPhone.trim();
    if (!/^\d{10}$/.test(phoneClean)) {
      setFormError("Phone number must be exactly 10 digits (e.g. 0771234567).");
      return;
    }

    const nicClean = regIdCard.trim();
    if (nicClean) {
      const parsed = extractNicDetails(nicClean);
      if (!parsed) {
        setFormError("Invalid Sri Lankan NIC number format. Old format should have 9 numbers and letter V/X, new format should have 12 numbers.");
        return;
      }
    }

    try {
      setSendingOtp(true);
      await axiosInstance.post("/api/pos/v1/customers/send-otp", {
        phone: phoneClean,
      });
      showNotification(`OTP sent via Hutch SMS Gateway to +94 ${phoneClean}`);
      setRegStep(2);
      setOtpTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send SMS OTP.";
      setFormError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!regOtp.trim()) {
      setFormError("Please enter the 6-digit OTP code sent to your mobile phone.");
      return;
    }

    const phoneClean = regPhone.trim();
    const nicClean = regIdCard.trim();

    try {
      setSendingOtp(true);
      // 1. Verify OTP
      await axiosInstance.post("/api/pos/v1/customers/verify-otp", {
        phone: phoneClean,
        otp: regOtp.trim(),
      });

      // 2. Register Customer
      await axiosInstance.post("/api/pos/v1/customers/register", {
        name: regName.trim(),
        contactNumber: phoneClean,
        idCardNumber: nicClean || null,
      });

      showNotification("Customer verified and registered successfully!");
      setModal(null);
      setRegStep(1);
      setRegName("");
      setRegPhone("");
      setRegIdCard("");
      setRegOtp("");
      fetchCustomers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid or expired OTP code.";
      setFormError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    setModal("history");
    setLoadingHistory(true);
    try {
      const response = await axiosInstance.get(`/api/pos/v1/customers/${customer.id}/points-history`);
      setPointsHistory(response.data || []);
    } catch (err) {
      showNotification("Failed to fetch loyalty points history.", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactNumber.includes(searchTerm) ||
      (c.idCardNumber && c.idCardNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex bg-app h-screen overflow-hidden relative">
      {isAdmin ? (
        <AdminSidebar sidebarOpen={sidebarOpen} />
      ) : isManager ? (
        <ManagerSidebar sidebarOpen={sidebarOpen} />
      ) : (
        <POSSidebar sidebarOpen={sidebarOpen} />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {isAdmin ? (
          <AdminNavBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={activeSection}
          />
        ) : isManager ? (
          <ManagerNavBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={activeSection}
          />
        ) : (
          <POSNavBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={activeSection}
          />
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[20px] font-[600] text-fg flex items-center gap-2">
                <Users className="text-brand-fg" size={24} />
                Customer Management & Loyalty
              </h1>
              <p className="text-[14px] text-fg-secondary">
                Register customers, view their reward points, and track transaction history
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setModal("register");
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-on-brand rounded-lg font-[500] text-[14px] shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus size={16} />
              Register Customer
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by name, phone number, or ID Card (NIC)..."
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg text-[14px] outline-none focus:border-brand-fg transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Customer List Card */}
          <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
            {loading ? (
              <Loader variant="section" text="Loading customer directory..." />
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-fg-secondary flex flex-col items-center justify-center gap-2">
                <Users size={48} className="text-fg-muted" />
                <p className="text-[16px] font-[500] text-fg">No customers found</p>
                <p className="text-[14px]">Try adjusting your search criteria or register a new customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-subtle border-b border-line">
                    <tr>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Customer Name</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">ID Card Number</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Birthday</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Phone Number</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Loyalty Points</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary">Register Date</th>
                      <th className="px-6 py-4 text-[13px] font-[600] text-fg-secondary text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-subtle transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-hover text-brand-fg flex items-center justify-center font-[600] text-[14px]">
                              {customer.name ? customer.name[0].toUpperCase() : "C"}
                            </div>
                            <span className="text-[14px] font-[600] text-fg">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-[500] text-fg block">
                            {customer.idCardNumber || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-fg">
                          {(() => {
                            if (!customer.idCardNumber) return "N/A";
                            const nicInfo = extractNicDetails(customer.idCardNumber);
                            return nicInfo ? (
                              <span className="font-[600] text-fg-strong">
                                {nicInfo.birthdate} <span className="text-[11px] text-fg-secondary font-[400]">({nicInfo.gender})</span>
                              </span>
                            ) : (
                              <span className="text-error font-[500] text-[13px]">Invalid NIC</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-fg font-[500]">
                          {customer.contactNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Coins size={14} className="text-warning" />
                            <span className="text-[14px] font-[700] text-fg">
                              {customer.loyaltyPoints?.toFixed(3) || "0.000"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-fg-secondary">
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewHistory(customer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle hover:bg-hover text-brand-fg hover:text-brand-fg rounded-lg text-[13px] font-[500] transition-colors"
                          >
                            <History size={14} />
                            Points History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Registration Modal */}
      {modal === "register" && (
        <div className="fixed inset-0 bg-backdrop z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-line bg-subtle flex justify-between items-center">
              <h3 className="font-[600] text-[16px] text-fg flex items-center gap-2">
                <User size={18} className="text-brand-fg" />
                {regStep === 1 ? "Register New Customer" : "Verify SMS OTP"}
              </h3>
              <button
                onClick={() => {
                  setModal(null);
                  setRegStep(1);
                }}
                className="text-fg-secondary hover:bg-hover p-1.5 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {regStep === 1 ? (
              <form onSubmit={handleSendOtp}>
                <div className="p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-[13px] text-error font-[500]">
                      {formError}
                    </div>
                  )}
                  <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter customer full name"
                      className="w-full px-3 py-2 border border-line rounded-lg text-[14px] outline-none focus:border-brand-fg transition-colors"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={16} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0771234567"
                        className="w-full pl-10 pr-3 py-2 border border-line rounded-lg text-[14px] outline-none focus:border-brand-fg transition-colors"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1.5">
                      ID Card Number (NIC) (Optional)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" size={16} />
                      <input
                        type="text"
                        placeholder="Enter identity card number"
                        className="w-full pl-10 pr-3 py-2 border border-line rounded-lg text-[14px] outline-none focus:border-brand-fg transition-colors"
                        value={regIdCard}
                        onChange={(e) => setRegIdCard(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-subtle border-t border-line flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                      setRegStep(1);
                    }}
                    className="px-4 py-2 border border-line text-fg-secondary hover:bg-surface rounded-lg text-[13px] font-[500] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="px-5 py-2 bg-brand hover:bg-brand-hover text-on-brand rounded-lg text-[13px] font-[500] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {sendingOtp ? <Loader2 size={16} className="animate-spin" /> : null}
                    Send OTP (SMS)
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister}>
                <div className="p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-[13px] text-error font-[500]">
                      {formError}
                    </div>
                  )}
                  <div className="p-3 bg-brand/10 border border-brand/20 rounded-lg text-[13px] text-brand-fg">
                    A 6-digit OTP code has been sent via Hutch SMS to <span className="font-bold">+94 {regPhone}</span>.
                  </div>
                  <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1.5">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 482910"
                      className="w-full px-4 py-3 border border-brand-fg rounded-lg text-[18px] tracking-widest text-center font-[700] text-brand-fg outline-none focus:ring-2 focus:ring-brand-fg"
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[12px] pt-1">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-fg-secondary hover:underline font-[500]"
                    >
                      ← Change Phone / Details
                    </button>
                    <button
                      type="button"
                      disabled={otpTimer > 0 || sendingOtp}
                      onClick={handleSendOtp}
                      className="text-brand-fg hover:underline font-[600] disabled:opacity-40"
                    >
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-subtle border-t border-line flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(null);
                      setRegStep(1);
                    }}
                    className="px-4 py-2 border border-line text-fg-secondary hover:bg-surface rounded-lg text-[13px] font-[500] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="px-5 py-2 bg-brand hover:bg-brand-hover text-on-brand rounded-lg text-[13px] font-[500] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {sendingOtp ? <Loader2 size={16} className="animate-spin" /> : null}
                    Verify OTP & Register
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Points History Modal */}
      {modal === "history" && selectedCustomer && (
        <div className="fixed inset-0 bg-backdrop z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-line bg-subtle flex justify-between items-center">
              <div>
                <h3 className="font-[600] text-[16px] text-fg flex items-center gap-2">
                  <Coins className="text-warning" size={18} />
                  Loyalty Points History
                </h3>
                <p className="text-[12px] text-fg-secondary mt-0.5">
                  Customer: {selectedCustomer.name} ({selectedCustomer.contactNumber})
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-fg-secondary hover:bg-hover p-1.5 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 bg-subtle border border-warning/20 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="text-warning w-6 h-6" />
                  <span className="text-[14px] text-fg-secondary font-[500]">Current Balance</span>
                </div>
                <span className="text-[20px] font-[800] text-fg">
                  {selectedCustomer.loyaltyPoints?.toFixed(3) || "0.000"} Points
                </span>
              </div>

              {loadingHistory ? (
                <Loader variant="section" text="Retrieving loyalty logs..." />
              ) : pointsHistory.length === 0 ? (
                <div className="py-12 text-center text-fg-secondary italic">
                  No points activity recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((log) => {
                    const isCredit = log.pointsChanged >= 0;
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 border rounded-lg hover:border-line-strong transition-colors bg-subtle"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[14px] font-[500] text-fg leading-tight">
                              {log.description}
                            </p>
                            <p className="text-[11px] text-fg-secondary mt-1.5 flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-[14px] font-[700] whitespace-nowrap px-2.5 py-0.5 rounded-full ${
                              isCredit
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {isCredit ? `+${log.pointsChanged.toFixed(3)}` : `${log.pointsChanged.toFixed(3)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 bg-subtle border-t border-line text-right">
              <button
                onClick={() => setModal(null)}
                className="px-6 py-2 bg-brand text-on-brand hover:bg-brand-hover rounded-lg text-[13px] font-[500] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Alert */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`bg-elevated border-l-4 ${
              toastType === "success" ? "border-success" : "border-error"
            } rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 ${
                toastType === "success" ? "bg-success/10" : "bg-error/10"
              } rounded-full flex items-center justify-center`}
            >
              {toastType === "success" ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <X className="w-5 h-5 text-error" />
              )}
            </div>
            <p className="text-[14px] text-fg font-[500]">{toastMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
