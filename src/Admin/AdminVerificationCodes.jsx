import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Key,
  User,
  Shield,
  Check
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import adminService from "../services/adminService";

export default function AdminVerificationCodes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Verification Code");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const [verificationCode, setVerificationCode] = useState("");

  const showNotification = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getVerificationCodes();
      setUsers(data);
    } catch (err) {
      showNotification("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q);
    const matchRole = filterRole === "ALL" || u.roleId === filterRole;
    return matchSearch && matchRole;
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setVerificationCode(user.verificationCode || "");
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
    setVerificationCode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const payload = { verificationCode };
      await adminService.updateVerificationCode(selectedUser.id, payload);
      showNotification("Verification code updated successfully");
      closeModal();
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update code", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove the verification code for this user?")) return;
    try {
      await adminService.deleteVerificationCode(id);
      showNotification("Verification code removed");
      fetchUsers();
    } catch (err) {
      showNotification("Failed to remove code", "error");
    }
  };

  const roles = [...new Set(users.map((u) => u.roleId))].filter(Boolean);

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden relative font-sans">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-[700] text-[#1D2939] mb-1">
                Verification Code Management
              </h1>
              <p className="text-[14px] text-[#667085]">
                Manage unique security codes for system users
              </p>
            </div>
            <div className="mt-4 sm:mt-0 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[11px] text-blue-600 font-[700] uppercase tracking-wider">Security Status</p>
                <p className="text-[14px] font-[600] text-blue-900">Admin Only Access</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[#D0D5DD] rounded-lg text-[14px] outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-[14px] bg-white text-[#344054] outline-none focus:ring-4 focus:ring-blue-100 min-w-[160px]"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <button
                  onClick={() => { setSearchTerm(""); setFilterRole("ALL"); }}
                  className="p-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg hover:bg-gray-50 flex items-center gap-2 text-[14px] font-[500] transition-colors"
                  title="Reset filters"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] overflow-hidden">
            {loading ? (
              <Loader variant="section" text="Loading secure data..." />
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <User size={32} className="text-gray-300" />
                </div>
                <p className="text-[18px] font-[600] text-[#1D2939]">No users found</p>
                <p className="text-[14px] text-[#667085] mt-1 max-w-[300px] mx-auto">
                  We couldn't find any users matching your current search criteria.
                </p>
                <button 
                  onClick={() => { setSearchTerm(""); setFilterRole("ALL"); }}
                  className="mt-6 text-blue-600 font-[600] text-[14px] hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                    <tr>
                      <th className="px-6 py-4 text-[12px] font-[600] text-[#475467] uppercase tracking-wider">User Details</th>
                      <th className="px-6 py-4 text-[12px] font-[600] text-[#475467] uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-[12px] font-[600] text-[#475467] uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-[12px] font-[600] text-[#475467] uppercase tracking-wider">Verification Code</th>
                      <th className="px-6 py-4 text-[12px] font-[600] text-[#475467] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECF0]">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-700 font-[700] text-[13px] border border-blue-200">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[14px] font-[600] text-[#1D2939]">{user.firstName} {user.lastName}</p>
                              <p className="text-[12px] text-[#667085]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-[#475467] font-[500]">{user.username}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-[500] border ${
                            user.roleId === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            user.roleId === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                          }`}>
                            <Shield size={10} />
                            {user.roleId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.verificationCode ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-amber-50 text-amber-700 px-3 py-1 rounded-md border border-amber-200 text-[14px] font-[700] tracking-widest shadow-sm">
                                {user.verificationCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[13px] text-[#98A2B3] italic flex items-center gap-1">
                              <Key size={12} /> Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button 
                              onClick={() => handleEdit(user)} 
                              className="p-2 text-[#475467] hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all" 
                              title="Set/Update Verification Code"
                            >
                              <Edit size={18} />
                            </button>
                            {user.verificationCode && (
                              <button 
                                onClick={() => handleDelete(user.id)} 
                                className="p-2 text-[#475467] hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" 
                                title="Clear Verification Code"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
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

      {modal === "edit" && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/40 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-[#F9FAFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="font-[700] text-[18px] text-[#1D2939]">Update Security Code</h3>
                  <p className="text-[12px] text-[#667085]">Assign a special code to {selectedUser.firstName}</p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[14px] font-[600] text-[#344054] mb-2">Verification Code</label>
                  <div className="relative">
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder="e.g. 1234-ABCD"
                      className="w-full px-4 py-3 bg-gray-50 border border-[#D0D5DD] rounded-xl text-[16px] font-[700] tracking-widest outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-center placeholder:text-gray-300 placeholder:font-[400] placeholder:tracking-normal"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>
                  <p className="mt-3 text-[12px] text-[#667085] bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    Tip: Use a unique, memorable code. This code will be required for special authorization tasks.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t bg-[#F9FAFB] flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-white border border-[#D0D5DD] text-[#344054] rounded-xl text-[14px] font-[600] hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-[600] hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {submitting ? <Loader variant="inline" /> : "Update Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[10000000] animate-in fade-in slide-in-from-right-8 duration-300">
          <div className={`bg-white border-l-4 ${toastType === 'success' ? 'border-green-500' : 'border-red-500'} rounded-xl shadow-2xl p-4 flex items-center gap-4 min-w-[320px] ring-1 ring-black/5`}>
            <div className={`flex-shrink-0 w-10 h-10 ${toastType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} rounded-full flex items-center justify-center`}>
              {toastType === 'success' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-[14px] text-[#1D2939] font-[700] uppercase tracking-wider">{toastType === 'success' ? 'Success' : 'Error'}</p>
              <p className="text-[13px] text-[#475467] font-[500]">{toastMsg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
