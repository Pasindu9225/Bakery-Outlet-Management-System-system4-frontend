import React, { useState, useEffect } from "react";
import { onEnterClick } from "../utils/a11y";
import { friendlyError } from "../utils/friendlyError";
import { confirmDialog } from "../component/ConfirmDialog";
import {
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  X,
  Check,
  Trash2,
  Edit,
  Search,
  Loader2,
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";

export default function AdminCreateUser() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Create Users");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // Track which user is being deleted

  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [bakeryCenters, setBakeryCenters] = useState([]);
  const [kitchenCenters, setKitchenCenters] = useState([]);
  const [outletMpcs, setOutletMpcs] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    contactNumber: "",
    password: "",
    role: "",
    status: "Active",
    waiterId: "",
    outletId: "",
    productionCenterId: "",
    mpcId: "",
  });

  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // "success" | "error"
  const [roleSearchInput, setRoleSearchInput] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Store Keeper, Manager, Bakery Worker and Kitchen Worker are not part of this
  // deployment's scope (no production plans, process-item flows, or store section) —
  // removed from the assignable list so new accounts can't be created with them.
  // Existing accounts with those roles, if any, are unaffected.
  const roles = [
    "POS Cashier",
    "MPC Worker",
    "Admin",
    "MIS Admin",
    "Finance",
    "Waiter",
  ];

  // Role ID to Role Name mapping
  const roleIdToRoleName = (roleId) => {
    // Convert roleId to number for consistent mapping
    const roleIdNum =
      typeof roleId === "string" ? parseInt(roleId, 10) : roleId;
    const roleMap = {
      1: "Admin",
      8: "POS Cashier",
      9: "Store Keeper",
      10: "Manager",
      11: "Waiter",
      12: "Bakery Worker",
      13: "Kitchen Worker",
      14: "MPC Worker",
      20: "MIS Admin",
    };
    return roleMap[roleIdNum] || `Role ${roleId}`;
  };

  // Role Name to Role ID mapping (reverse mapping)
  const roleNameToRoleId = (roleName) => {
    const roleMap = {
      Admin: 1,
      "POS Cashier": 8,
      "Store Keeper": 9,
      Manager: 10,
      Waiter: 11,
      "Bakery Worker": 12,
      "Kitchen Worker": 13,
      "MPC Worker": 14,
      Finance: 15,
      "MIS Admin": 20,
    };
    return roleMap[roleName] || null;
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError("");

      const authToken = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/ADMIN/v1/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();

      // Map backend response to frontend format
      const mappedUsers = data.map((user) => ({
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        username: user.username,
        email: user.email,
        contactNumber: user.phone || "",
        role: roleIdToRoleName(user.roleId),
        status: user.isActive ? "Active" : "Inactive",
        waiterId: user.waiterId || "",
        outletId: user.outletId,
        productionCenterId: user.productionCenterId ?? null,
        mpcId: user.mpcId ?? null,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setFetchError(friendlyError(error, { fallback: "Failed to fetch users. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/admin/outlet/all`);
        if (res.ok) {
          const data = await res.json();
          setOutlets(data);
        }
      } catch (e) {
        console.error("Failed to load outlets", e);
      }
    })();
  }, []);

  // Fetch bakery and kitchen production centers on mount
  useEffect(() => {
    const baseUrl = process.env.REACT_APP_BASE_URL;
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${baseUrl}/api/v1/admin/production-center/by-type/BAKERY`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setBakeryCenters(data || []))
      .catch(() => setBakeryCenters([]));
    fetch(`${baseUrl}/api/v1/admin/production-center/by-type/KITCHEN`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setKitchenCenters(data || []))
      .catch(() => setKitchenCenters([]));
  }, []);

  // Fetch MPCs whenever role is MPC Worker AND outletId is set
  useEffect(() => {
    if (formData.role !== 'MPC Worker' || !formData.outletId) {
      setOutletMpcs([]);
      return;
    }
    const baseUrl = process.env.REACT_APP_BASE_URL;
    const token = localStorage.getItem('authToken');
    fetch(`${baseUrl}/api/v1/admin/outlet/${formData.outletId}/production-centers`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOutletMpcs((data || []).filter(m => m.isActive !== false)))
      .catch(() => setOutletMpcs([]));
  }, [formData.role, formData.outletId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'role') {
        // Reset role-bound fields when role changes
        return {
          ...prev,
          role: value,
          outletId: "",
          productionCenterId: "",
          mpcId: "",
        };
      }
      if (name === 'outletId') {
        // Clear MPC if outlet changes
        return { ...prev, outletId: value, mpcId: "" };
      }
      return { ...prev, [name]: value };
    });

    // Clear errors that no longer apply
    if (name === 'role') {
      setErrors((prev) => ({
        ...prev,
        role: "",
        outletId: "",
        productionCenterId: "",
        mpcId: "",
      }));
    } else if (name === 'outletId') {
      setErrors((prev) => ({ ...prev, outletId: "", mpcId: "" }));
    } else if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (formData.role !== "Waiter") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else {
        const usernameExists = users.some(
          (u) => u.username === formData.username && u.id !== editingUserId
        );
        if (usernameExists) {
          newErrors.username = "Username already exists";
        }
      }
    }

    if (formData.role === "Waiter" && !formData.waiterId.trim()) {
      newErrors.waiterId = "Waiter ID is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    } else {
      // Check if email exists (excluding current user in edit mode)
      const emailExists = users.some(
        (u) => u.email === formData.email && u.id !== editingUserId
      );
      if (emailExists) {
        newErrors.email = "Email already exists";
      }
    }

    // Password is only required when creating new user (except for Waiter)
    if (!isEditMode && formData.role !== "Waiter") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    } else if (isEditMode) {
      // In edit mode, only validate if password is provided
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if ((formData.role === "POS Cashier" || formData.role === "Waiter") && !formData.outletId) {
      newErrors.outletId = "Outlet is required for this role";
    }

    if (formData.role === "Bakery Worker" && !formData.productionCenterId) {
      newErrors.productionCenterId = "Production center is required for Bakery Worker";
    }
    if (formData.role === "Kitchen Worker" && !formData.productionCenterId) {
      newErrors.productionCenterId = "Production center is required for Kitchen Worker";
    }
    if (formData.role === "MPC Worker") {
      if (!formData.outletId) newErrors.outletId = "Outlet is required for MPC Worker";
      if (!formData.mpcId) newErrors.mpcId = "MPC is required for MPC Worker";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      if (isEditMode) {
        // Update existing user - PUT request to backend
        try {
          setSubmitLoading(true);

          if (!editingUserId) {
            setToastMessage("User ID is missing. Please try again.");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setSubmitLoading(false);
            return;
          }

          // Split fullName into firstName and lastName
          const nameParts = formData.fullName.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Convert status to isActive (1 for Active, 0 for Inactive)
          const isActive = formData.status === "Active" ? 1 : 0;

          // Map role name to roleId
          const roleId = roleNameToRoleId(formData.role);
          if (!roleId) {
            setToastMessage("Invalid role selected.");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setSubmitLoading(false);
            return;
          }

          // Prepare request body
          const requestBody = {
            firstName: firstName,
            lastName: lastName,
            email: formData.email.trim(),
            phone: formData.contactNumber.trim() || "",
            roleId: roleId,
            isActive: isActive,
            waiterId: formData.role === "Waiter" ? (formData.waiterId?.trim() || null) : null,
            outletId: formData.outletId ? Number(formData.outletId) : null,
            productionCenterId: formData.productionCenterId ? Number(formData.productionCenterId) : null,
            mpcId: formData.mpcId ? Number(formData.mpcId) : null,
          };

          // Only include password if it's provided (not empty)
          if (formData.password && formData.password.trim()) {
            requestBody.password = formData.password;
          }

          const authToken = localStorage.getItem("authToken");
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/ADMIN/v1/users/${editingUserId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            let errorMessage = "Failed to update user";
            try {
              const errorData = await response.json();
              errorMessage =
                errorData.message || errorData.error || errorMessage;
            } catch (e) {
              errorMessage = `Failed to update user: ${response.status}`;
            }
            throw new Error(errorMessage);
          }

          // Success - refresh user list and show success message
          setToastMessage("User updated successfully.");
          setToastType("success");
          setShowToast(true);
          setShowModal(false);
          resetForm();
          setTimeout(() => setShowToast(false), 3000);

          // Refresh users list from backend
          await fetchUsers();
        } catch (error) {
          console.error("Error updating user:", error);
          setToastMessage(
            error.message || "Failed to update user. Please try again."
          );
          setToastType("error");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } finally {
          setSubmitLoading(false);
        }
      } else {
        // Create new user - POST request to backend
        try {
          setSubmitLoading(true);

          // Split fullName into firstName and lastName
          const nameParts = formData.fullName.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Convert status to isActive (1 for Active, 0 for Inactive)
          const isActive = formData.status === "Active" ? 1 : 0;

          // Map role name to roleId
          const roleId = roleNameToRoleId(formData.role);
          if (!roleId) {
            setToastMessage("Invalid role selected.");
            setToastType("error");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setSubmitLoading(false);
            return;
          }

          // Prepare request body
          const requestBody = {
            username: formData.role === "Waiter" ? null : (formData.username?.trim() || null),
            email: formData.email.trim(),
            firstName: firstName,
            lastName: lastName,
            password: formData.password,
            phone: formData.contactNumber.trim() || "",
            roleId: roleId,
            isActive: isActive,
            waiterId: formData.role === "Waiter" ? (formData.waiterId?.trim() || null) : null,
            outletId: formData.outletId ? Number(formData.outletId) : null,
            productionCenterId: formData.productionCenterId ? Number(formData.productionCenterId) : null,
            mpcId: formData.mpcId ? Number(formData.mpcId) : null,
          };

          const authToken = localStorage.getItem("authToken");
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/ADMIN/v1/users`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            let errorMessage = "Failed to create user";
            try {
              const errorData = await response.json();
              errorMessage =
                errorData.message || errorData.error || errorMessage;
            } catch (e) {
              errorMessage = `Failed to create user: ${response.status}`;
            }
            throw new Error(errorMessage);
          }

          // Success - refresh user list and show success message
          setToastMessage("User created successfully.");
          setToastType("success");
          setShowToast(true);
          setShowModal(false);
          resetForm();
          setTimeout(() => setShowToast(false), 3000);

          // Refresh users list from backend
          await fetchUsers();
        } catch (error) {
          console.error("Error creating user:", error);
          setToastMessage(
            error.message || "Failed to create user. Please try again."
          );
          setToastType("error");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } finally {
          setSubmitLoading(false);
        }
      }
    }
  };

  const handleEdit = (user) => {
    setIsEditMode(true);
    setEditingUserId(user.id);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      contactNumber: user.contactNumber,
      password: "",
      role: user.role,
      status: user.status,
      waiterId: user.waiterId || "",
      outletId: user.outletId ?? "",
      productionCenterId: user.productionCenterId ?? "",
      mpcId: user.mpcId ?? "",
    });
    setRoleSearchInput(user.role);
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      username: "",
      email: "",
      contactNumber: "",
      password: "",
      role: "",
      status: "Active",
      waiterId: "",
      outletId: "",
      productionCenterId: "",
      mpcId: "",
    });
    setErrors({});
    setShowPassword(false);
    setRoleSearchInput("");
    setRoleDropdownOpen(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingUserId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this user?", { confirmText: "Delete", danger: true })) {
      try {
        setDeleteLoading(id);

        const authToken = localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/ADMIN/v1/users/${id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
          }
        );

        if (!response.ok) {
          let errorMessage = "Failed to delete user";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Failed to delete user: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        // Success - refresh user list and show success message
        setToastMessage("User deleted successfully.");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Refresh users list from backend
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setToastMessage(
          error.message || "Failed to delete user. Please try again."
        );
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  // Filter users based on search and filters
  const getFilteredUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "All") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const standardRoles = [
    "Admin",
    "MIS Admin",
    "POS Cashier",
    "Store Keeper",
    "Manager",
    "Bakery Worker",
    "Kitchen Worker",
    "MPC Worker",
    "Finance",
    "Waiter"
  ];
  const uniqueRoles = [...new Set([...standardRoles, ...users.map((user) => user.role)])].sort();

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <AdminNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[20px] font-[600] text-fg mb-1">
              User Management
            </h1>
            <p className="text-[14px] leading-[20px] font-[400] text-fg-secondary">
              Create new users and assign roles
            </p>
          </div>

          {/* User List Table */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-fg">
                User List
              </h3>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
              >
                <UserPlus className="w-5 h-5" />
                Create New User
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-secondary"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px]"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                >
                  <option value="All">All Roles</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand-fg text-[14px] bg-surface"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2
                  className="mx-auto text-brand-fg mb-4 animate-spin"
                  size={48}
                />
                <p className="text-[16px] font-[500] text-fg">
                  Loading users...
                </p>
              </div>
            ) : fetchError ? (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-error mb-4" />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  Error loading users
                </p>
                <p className="text-[14px] text-fg-secondary mb-4">{fetchError}</p>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand rounded-md text-[14px] font-[500] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Full Name
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Username
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Email
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Contact
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Role
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Status
                      </th>
                      <th className="text-left py-4 text-[14px] font-[500] text-fg">
                        Waiter ID
                      </th>
                      <th className="text-center py-4 text-[14px] font-[500] text-fg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-subtle transition-colors"
                      >
                        <td className="py-4">
                          <p className="text-[14px] font-[600] text-fg">
                            {user.fullName}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] text-fg">
                            {user.username}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] text-fg">
                            {user.email}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] text-fg">
                            {user.contactNumber || "-"}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] font-[500] text-fg">
                            {user.role}
                          </p>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${
                              user.status === "Active"
                                ? "bg-hover text-success"
                                : "bg-hover text-error"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <p className="text-[14px] text-fg">
                            {user.waiterId || "-"}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              disabled={deleteLoading === user.id}
                              className="p-2 text-brand-fg hover:bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit User"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deleteLoading === user.id}
                              className="p-2 text-error hover:bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete User"
                            >
                              {deleteLoading === user.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <User size={48} className="mx-auto text-fg-secondary mb-4" />
                <p className="text-[16px] font-[500] text-fg mb-2">
                  No users found
                </p>
                <p className="text-[14px] text-fg-secondary">
                  {searchTerm || roleFilter !== "All" || statusFilter !== "All"
                    ? "Try adjusting your search criteria"
                    : "Click 'Create New User' to add your first user"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div>
                <h2 className="text-[20px] leading-[30px] font-[600] text-fg">
                  {isEditMode ? "Edit User" : "Create New User"}
                </h2>
                <p className="text-[14px] text-fg-secondary mt-1">
                  {isEditMode
                    ? "Update user information and permissions"
                    : "Fill in the details to create a new user account"}
                </p>
              </div>
              <button aria-label="Close"
                onClick={handleCancel}
                className="p-2 text-fg-secondary hover:bg-subtle rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.fullName
                          ? "border-error"
                          : "border-line"
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Username - Hidden for Waiters */}
                {formData.role !== "Waiter" && (
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Username <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.username
                          ? "border-error"
                          : "border-line"
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Email Address <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      autoComplete="off"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.email ? "border-error" : "border-line"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                    />
                  </div>
                </div>

                {/* Password - Hidden for Waiters */}
                {formData.role !== "Waiter" && (
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Password{" "}
                    {!isEditMode && <span className="text-error">*</span>}
                    {isEditMode && (
                      <span className="text-fg-secondary text-[12px] font-[400]">
                        {" "}
                        (Leave blank to keep current)
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder={
                        isEditMode
                          ? "Enter new password (optional)"
                          : "Enter password"
                      }
                      className={`w-full pl-10 pr-12 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.password
                          ? "border-error"
                          : "border-line"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-secondary hover:text-fg"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                )}

                {/* Waiter ID - Only for Waiters */}
                {formData.role === "Waiter" && (
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Waiter ID <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-secondary" />
                    <input
                      type="text"
                      name="waiterId"
                      value={formData.waiterId}
                      onChange={handleChange}
                      placeholder="Enter waiter ID (e.g. W001)"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.waiterId
                          ? "border-error"
                          : "border-line"
                      }`}
                    />
                  </div>
                  {errors.waiterId && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.waiterId}
                    </p>
                  )}
                </div>
                )}

                {/* Role */}
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Role <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search role..."
                      value={roleSearchInput}
                      onFocus={() => setRoleDropdownOpen(true)}
                      onBlur={() => {
                        // Allow option click to register before closing
                        setTimeout(() => setRoleDropdownOpen(false), 200);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoleSearchInput(val);
                        setRoleDropdownOpen(true);
                        // If they cleared it, reset the form role
                        if (!val) {
                          setFormData(prev => ({
                            ...prev,
                            role: "",
                            outletId: "",
                            productionCenterId: "",
                            mpcId: ""
                          }));
                        } else {
                          // Check if typed value matches exactly one of the roles
                          const match = roles.find(r => r.toLowerCase() === val.toLowerCase());
                          if (match) {
                            setFormData(prev => ({
                              ...prev,
                              role: match
                            }));
                          }
                        }
                      }}
                      className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg ${
                        errors.role ? "border-error" : "border-line"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none text-fg-secondary">
                      <Search size={16} />
                    </div>

                    {/* Dropdown Options */}
                    {roleDropdownOpen && (
                      <div className="absolute z-[10000] w-full mt-1 bg-elevated border border-line rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {roles.filter(role => 
                          role.toLowerCase().includes(roleSearchInput.toLowerCase())
                        ).length > 0 ? (
                          roles.filter(role => 
                            role.toLowerCase().includes(roleSearchInput.toLowerCase())
                          ).map((role) => (
                            <div
                              key={role}
                              role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  role: role,
                                  outletId: "",
                                  productionCenterId: "",
                                  mpcId: "",
                                }));
                                setRoleSearchInput(role);
                                setRoleDropdownOpen(false);
                                setErrors((prev) => ({
                                  ...prev,
                                  role: "",
                                  outletId: "",
                                  productionCenterId: "",
                                  mpcId: "",
                                }));
                              }}
                              className={`px-4 py-2.5 text-[14px] text-fg hover:bg-app cursor-pointer flex items-center justify-between ${
                                formData.role === role ? "bg-hover font-[500]" : ""
                              }`}
                            >
                              <span>{role}</span>
                              {formData.role === role && <Check size={16} className="text-brand-fg" />}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2.5 text-[14px] text-fg-secondary italic">
                            No matching roles found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.role && (
                    <p className="text-error text-[12px] mt-1">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Outlet — for POS Cashier, MPC Worker, and Waiter */}
                {(formData.role === "POS Cashier" || formData.role === "MPC Worker" || formData.role === "Waiter") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-fg mb-1">
                      Outlet <span className="text-error">*</span>
                    </label>
                    <select
                      name="outletId"
                      value={formData.outletId || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-line-strong rounded-md"
                    >
                      <option value="">Select an outlet…</option>
                      {outlets.map(o => (
                        <option key={o.outletId} value={o.outletId}>
                          {o.name || o.address} {o.location ? `· ${o.location}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.outletId && <p className="text-error text-sm mt-1">{errors.outletId}</p>}
                  </div>
                )}

                {/* Production Center (Bakery) */}
                {formData.role === 'Bakery Worker' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-fg mb-1">
                      Production Center (Bakery) <span className="text-error">*</span>
                    </label>
                    <select
                      name="productionCenterId"
                      value={formData.productionCenterId || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-line-strong rounded-md"
                    >
                      <option value="">Select a bakery center…</option>
                      {bakeryCenters.map(pc => (
                        <option key={pc.id} value={pc.id}>{pc.centerName}</option>
                      ))}
                    </select>
                    {errors.productionCenterId && <p className="text-error text-sm mt-1">{errors.productionCenterId}</p>}
                  </div>
                )}

                {/* Production Center (Kitchen) */}
                {formData.role === 'Kitchen Worker' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-fg mb-1">
                      Production Center (Kitchen) <span className="text-error">*</span>
                    </label>
                    <select
                      name="productionCenterId"
                      value={formData.productionCenterId || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-line-strong rounded-md"
                    >
                      <option value="">Select a kitchen center…</option>
                      {kitchenCenters.map(pc => (
                        <option key={pc.id} value={pc.id}>{pc.centerName}</option>
                      ))}
                    </select>
                    {errors.productionCenterId && <p className="text-error text-sm mt-1">{errors.productionCenterId}</p>}
                  </div>
                )}

                {/* Mini Production Center (MPC) */}
                {formData.role === 'MPC Worker' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-fg mb-1">
                      Mini Production Center <span className="text-error">*</span>
                    </label>
                    <select
                      name="mpcId"
                      value={formData.mpcId || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-line-strong rounded-md"
                      disabled={!formData.outletId}
                    >
                      <option value="">{formData.outletId ? 'Select an MPC…' : 'Pick an outlet first'}</option>
                      {outletMpcs.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {errors.mpcId && <p className="text-error text-sm mt-1">{errors.mpcId}</p>}
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-[14px] font-[500] text-fg mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-line rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-line">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 border border-line text-fg rounded-md text-[14px] font-[500] hover:bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover text-on-brand rounded-md text-[14px] font-[500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Saving..."}
                    </>
                  ) : isEditMode ? (
                    "Update User"
                  ) : (
                    "Save User"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10000] animate-fade-in">
          {toastType === "error" ? (
            <div className="bg-surface border-l-4 border-error rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
              <div className="flex-shrink-0 w-8 h-8 bg-error/10 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-error" />
              </div>
              <p className="text-[14px] text-fg font-[500]">
                {toastMessage}
              </p>
            </div>
          ) : (
            <div className="bg-surface border-l-4 border-success rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
              <div className="flex-shrink-0 w-8 h-8 bg-success-solid bg-opacity-10 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <p className="text-[14px] text-fg font-[500]">
                {toastMessage}
              </p>
            </div>
          )}
        </div>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
