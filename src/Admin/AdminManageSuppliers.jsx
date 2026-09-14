import React, { useState, useEffect } from "react";
import {
  Truck,
  Mail,
  Phone,
  MapPin,
  X,
  Check,
  Trash2,
  Edit,
  Search,
  Package,
  Plus,
  Building2,
  CreditCard,
  User,
} from "lucide-react";

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import Loader from "../component/Loader.jsx";
import axiosInstance from "../services/api";


export default function AdminManageSuppliers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Manage Suppliers");
  const [showModal, setShowModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [showViewMaterialsModal, setShowViewMaterialsModal] = useState(false);
  const [viewingSupplierMaterials, setViewingSupplierMaterials] = useState([]);
  const [viewingSupplierName, setViewingSupplierName] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vatFilter, setVatFilter] = useState("All");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available raw materials
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [suppliers, setSuppliers] = useState([]);

  // Helper function to build bank details string from form fields
  const buildBankDetailsString = (
    bankName,
    accountNumber,
    accountName,
    branch
  ) => {
    if (!bankName && !accountNumber && !accountName && !branch) {
      return "";
    }

    const parts = [];
    if (accountNumber) {
      parts.push(`Account: ${accountNumber}`);
    }
    if (bankName) {
      parts.push(`Bank: ${bankName}`);
    }
    if (branch) {
      parts.push(`Branch: ${branch}`);
    }

    return parts.join(", ");
  };

  // Helper function to parse bank details string
  const parseBankDetails = (bankDetailsString) => {
    if (!bankDetailsString) {
      return { bankName: "", accountNumber: "", accountName: "", branch: "" };
    }

    let bankName = "";
    let accountNumber = "";
    let accountName = "";
    let branch = "";

    // Try different patterns
    // Pattern 1: "Account: 123456789, Bank: Commercial Bank"
    const pattern1 =
      /Account:\s*([^,]+),\s*Bank:\s*([^,]+)(?:,\s*Branch:\s*(.+))?/i;
    const match1 = bankDetailsString.match(pattern1);
    if (match1) {
      accountNumber = match1[1].trim();
      bankName = match1[2].trim();
      branch = match1[3] ? match1[3].trim() : "";
      return { bankName, accountNumber, accountName, branch };
    }

    // Pattern 2: "Bank Name - Acc No: 123456789"
    const pattern2 =
      /^([^-]+)\s*-\s*Acc\s*No:\s*([^,]+)(?:,\s*Branch:\s*(.+))?/i;
    const match2 = bankDetailsString.match(pattern2);
    if (match2) {
      bankName = match2[1].trim();
      accountNumber = match2[2].trim();
      branch = match2[3] ? match2[3].trim() : "";
      return { bankName, accountNumber, accountName, branch };
    }

    // Pattern 3: "Account: 123456789, Bank: Bank Name, Branch: Branch Name"
    const pattern3 = /Account:\s*([^,]+),\s*Bank:\s*([^,]+),\s*Branch:\s*(.+)/i;
    const match3 = bankDetailsString.match(pattern3);
    if (match3) {
      accountNumber = match3[1].trim();
      bankName = match3[2].trim();
      branch = match3[3].trim();
      return { bankName, accountNumber, accountName, branch };
    }

    // Fallback: use the whole string as bank name
    bankName = bankDetailsString;
    return { bankName, accountNumber, accountName, branch };
  };

  // Helper function to refresh suppliers list
  const refreshSuppliersList = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/ADMIN/v1/suppliers`);
      const data = response.data;

      // Transform API response to match component structure
      const transformedSuppliers = data.map((supplier) => {
        const bankDetails = parseBankDetails(supplier.bankDetails);
        const isVatRegistered =
          supplier.vatStatus !== null && supplier.vatStatus !== "";
        const vatNumber =
          isVatRegistered && supplier.vatStatus.startsWith("VAT-")
            ? supplier.vatStatus
            : "";

        return {
          id: supplier.supplierId,
          name: supplier.name,
          email: supplier.email || "",
          supplierContactNumber: supplier.contactNumber || "",
          repName: supplier.repName || "",
          repContactNumber: supplier.repContactNo || "",
          address: supplier.address || "",
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName,
          branch: bankDetails.branch,
          isVatRegistered: isVatRegistered,
          vatNumber: vatNumber,
          suppliedMaterials: (supplier.rawMaterials || []).map((material) => ({
            id: material.rawMaterialId,
            code: material.materialCode,
            name: material.materialName,
            category: material.category || "General",
            brand: material.brand || "Unbranded",
          })),
        };
      });

      setSuppliers(transformedSuppliers);
    } catch (error) {
      console.error("Failed to refresh suppliers:", error);
      setError("Failed to refresh suppliers list.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(`/ADMIN/v1/suppliers`);
        const data = response.data;
        console.log("Suppliers fetched:", data);

        // Transform API response to match component structure
        const transformedSuppliers = data.map((supplier) => {
          const bankDetails = parseBankDetails(supplier.bankDetails);
          // VAT status handling: if vatStatus starts with "VAT-", it's the VAT number
          // If it's "Registered", it means registered but no VAT number
          // If it's null or empty, not registered
          const isVatRegistered =
            supplier.vatStatus !== null && supplier.vatStatus !== "";
          const vatNumber =
            isVatRegistered && supplier.vatStatus.startsWith("VAT-")
              ? supplier.vatStatus
              : "";

          return {
            id: supplier.supplierId,
            name: supplier.name,
            email: supplier.email || "",
            supplierContactNumber: supplier.contactNumber || "",
            repName: supplier.repName || "",
            repContactNumber: supplier.repContactNo || "",
            address: supplier.address || "",
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName,
            branch: bankDetails.branch,
            isVatRegistered: isVatRegistered,
            vatNumber: vatNumber,
            suppliedMaterials: (supplier.rawMaterials || []).map(
              (material) => ({
                id: material.rawMaterialId,
                code: material.materialCode,
                name: material.materialName,
                category: material.category || "General",
                brand: material.brand || "Unbranded",
              })
            ),
          };
        });

        setSuppliers(transformedSuppliers);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        setError("Failed to load suppliers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch raw materials from API
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        setMaterialsLoading(true);

        const response = await axiosInstance.get(`/STK/v1/materials/all`);
        const data = response.data;
        console.log("Raw materials fetched:", data);

        // Transform API response to match component structure
        const transformedMaterials = data.map((material) => ({
          id: material.id,
          code: material.materialCode || material.code,
          name: material.materialName || material.name,
          category: material.category || "General",
          brand: material.brand || "Unbranded",
          genericMaterial: material.genericMaterialName || "General",
        }));

        setAvailableMaterials(transformedMaterials);
      } catch (error) {
        console.error("Failed to fetch raw materials:", error);
        // Set empty array on error to prevent breaking the UI
        setAvailableMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchRawMaterials();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    supplierContactNumber: "",
    repName: "",
    repContactNumber: "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
    isVatRegistered: false,
    vatNumber: "",
    suppliedMaterials: [],
  });

  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [tempSelectedMaterials, setTempSelectedMaterials] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear VAT number if VAT registration is unchecked
    if (name === "isVatRegistered" && !checked) {
      setFormData((prev) => ({
        ...prev,
        vatNumber: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Supplier Name is required";
    }

    if (formData.email) {
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid";
      } else {
        const isDuplicate = suppliers.some(
          (s) => s.email === formData.email && s.id !== editingSupplierId
        );
        if (isDuplicate) {
          newErrors.email = "Email address already exists";
        }
      }
    }

    if (formData.supplierContactNumber) {
      const isDuplicate = suppliers.some(
        (s) =>
          s.supplierContactNumber === formData.supplierContactNumber &&
          s.id !== editingSupplierId
      );
      if (isDuplicate) {
        newErrors.supplierContactNumber = "Supplier contact number already exists";
      }
    }

    if (formData.isVatRegistered && !formData.vatNumber.trim()) {
      newErrors.vatNumber = "VAT Number is required when registered";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      if (isEditMode) {
        // Update supplier via API
        try {
          setSubmitting(true);

          // Build bank details string
          const bankDetails = buildBankDetailsString(
            formData.bankName,
            formData.accountNumber,
            formData.accountName,
            formData.branch
          );

          // Determine VAT status
          const vatStatus =
            formData.isVatRegistered && formData.vatNumber
              ? formData.vatNumber
              : null;

          // Transform raw materials to API format
          const rawMaterials = formData.suppliedMaterials.map((material) => ({
            rawMaterialId: material.id,
            negotiatedUnitCost: null,
            leadTimeDays: null,
            isPreferred: true,
          }));

          // Build request body
          const requestBody = {
            name: formData.name,
            address: formData.address || "",
            contactNumber: formData.supplierContactNumber || "",
            email: formData.email || "",
            repName: formData.repName || "",
            repContactNo: formData.repContactNumber || "",
            bankDetails: bankDetails,
            vatStatus: vatStatus,
            rawMaterials: rawMaterials,
          };

          const response = await axiosInstance.put(
            `/ADMIN/v1/suppliers/${editingSupplierId}`,
            requestBody
          );

          // Success - refresh suppliers list
          setToastMessage("Supplier updated successfully.");
          setShowToast(true);
          setShowModal(false);
          resetForm();
          setTimeout(() => setShowToast(false), 3000);

          // Refresh suppliers list
          await refreshSuppliersList();
        } catch (error) {
          console.error("Failed to update supplier:", error);
          setToastMessage(
            error.message || "Failed to update supplier. Please try again."
          );
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } finally {
          setSubmitting(false);
        }
      } else {
        // Add new supplier via API
        try {
          setSubmitting(true);

          // Build bank details string
          const bankDetails = buildBankDetailsString(
            formData.bankName,
            formData.accountNumber,
            formData.accountName,
            formData.branch
          );

          // Determine VAT status
          const vatStatus =
            formData.isVatRegistered && formData.vatNumber
              ? formData.vatNumber
              : null;

          // Transform raw materials to API format
          const rawMaterials = formData.suppliedMaterials.map((material) => ({
            rawMaterialId: material.id,
            negotiatedUnitCost: null,
            leadTimeDays: null,
            isPreferred: true,
          }));

          // Build request body
          const requestBody = {
            name: formData.name,
            address: formData.address || "",
            contactNumber: formData.supplierContactNumber || "",
            email: formData.email || "",
            repName: formData.repName || "",
            repContactNo: formData.repContactNumber || "",
            bankDetails: bankDetails,
            vatStatus: vatStatus,
            rawMaterials: rawMaterials,
          };

          const response = await axiosInstance.post(
            `/ADMIN/v1/suppliers`,
            requestBody
          );

          // Success - refresh suppliers list
          setToastMessage("Supplier added successfully.");
          setShowToast(true);
          setShowModal(false);
          resetForm();
          setTimeout(() => setShowToast(false), 3000);

          // Refresh suppliers list
          await refreshSuppliersList();
        } catch (error) {
          console.error("Failed to add supplier:", error);
          setToastMessage(
            error.message || "Failed to add supplier. Please try again."
          );
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } finally {
          setSubmitting(false);
        }
      }
    }
  };

  const handleEdit = (supplier) => {
    setIsEditMode(true);
    setEditingSupplierId(supplier.id);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      supplierContactNumber: supplier.supplierContactNumber,
      repName: supplier.repName,
      repContactNumber: supplier.repContactNumber,
      address: supplier.address,
      bankName: supplier.bankName,
      accountNumber: supplier.accountNumber,
      accountName: supplier.accountName,
      branch: supplier.branch,
      isVatRegistered: supplier.isVatRegistered,
      vatNumber: supplier.vatNumber,
      suppliedMaterials: supplier.suppliedMaterials,
    });
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingSupplierId(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      supplierContactNumber: "",
      repName: "",
      repContactNumber: "",
      address: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      branch: "",
      isVatRegistered: false,
      vatNumber: "",
      suppliedMaterials: [],
    });
    setErrors({});
    setTempSelectedMaterials([]);
  };

  const handleCancel = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingSupplierId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        const response = await axiosInstance.delete(
          `/ADMIN/v1/suppliers/${id}`
        );

        // Success - refresh suppliers list
        setToastMessage("Supplier deleted successfully.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);

        // Refresh suppliers list
        await refreshSuppliersList();
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        setToastMessage(
          error.message || "Failed to delete supplier. Please try again."
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  const handleOpenMaterialsModal = () => {
    setTempSelectedMaterials([...formData.suppliedMaterials]);
    setMaterialSearchTerm("");
    setSelectedCategory("All");
    setShowMaterialsModal(true);
  };

  const handleMaterialToggle = (material) => {
    const isSelected = tempSelectedMaterials.some((m) => m.id === material.id);
    if (isSelected) {
      setTempSelectedMaterials(
        tempSelectedMaterials.filter((m) => m.id !== material.id)
      );
    } else {
      setTempSelectedMaterials([...tempSelectedMaterials, material]);
    }
  };

  const handleConfirmMaterials = () => {
    setFormData((prev) => ({
      ...prev,
      suppliedMaterials: tempSelectedMaterials,
    }));
    if (errors.suppliedMaterials) {
      setErrors((prev) => ({
        ...prev,
        suppliedMaterials: "",
      }));
    }
    setShowMaterialsModal(false);
  };

  const handleRemoveMaterial = (materialId) => {
    setFormData((prev) => ({
      ...prev,
      suppliedMaterials: prev.suppliedMaterials.filter(
        (m) => m.id !== materialId
      ),
    }));
  };

  const getFilteredSuppliers = () => {
    return suppliers.filter((supplier) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.supplierContactNumber && supplier.supplierContactNumber.includes(searchTerm)) ||
        (supplier.repName && supplier.repName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.suppliedMaterials && supplier.suppliedMaterials.some((mat) =>
          (mat.name && mat.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (mat.brand && mat.brand.toLowerCase().includes(searchTerm.toLowerCase()))
        ));

      // VAT filter
      const matchesVat =
        vatFilter === "All" ||
        (vatFilter === "Registered" && supplier.isVatRegistered) ||
        (vatFilter === "Not Registered" && !supplier.isVatRegistered);

      return matchesSearch && matchesVat;
    });
  };

  const handleViewMaterials = (supplier) => {
    setViewingSupplierMaterials(supplier.suppliedMaterials);
    setViewingSupplierName(supplier.name);
    setShowViewMaterialsModal(true);
  };

  const getCategories = () => {
    const categories = [
      "All",
      ...new Set(availableMaterials.map((m) => m.category)),
    ];
    return categories;
  };

  const getFilteredMaterials = () => {
    return availableMaterials.filter((material) => {
      const matchesSearch =
        (material.name &&
          material.name
            .toLowerCase()
            .includes(materialSearchTerm.toLowerCase())) ||
        (material.code &&
          material.code.toLowerCase().includes(materialSearchTerm.toLowerCase())) ||
        (material.brand &&
          material.brand.toLowerCase().includes(materialSearchTerm.toLowerCase())) ||
        (material.genericMaterial &&
          material.genericMaterial
            .toLowerCase()
            .includes(materialSearchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" || material.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredSuppliers = getFilteredSuppliers();

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
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
            <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
              Supplier Management
            </h1>
            <p className="text-[14px] leading-[20px] font-[400] text-[#667085]">
              View, add, edit, and manage supplier details
            </p>
          </div>

          {/* Supplier List Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h3 className="text-[18px] font-[600] text-[#383E49]">
                Supplier List
              </h3>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-[#0F50AA] hover:bg-[#1366D9] text-white px-4 py-2.5 rounded-md text-[14px] font-[500] transition-colors mt-2 sm:mt-0"
              >
                <Truck className="w-5 h-5" />
                Add New Supplier
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Bar */}
                <div className="relative md:col-span-2">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by supplier name, email, contact, or materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                  />
                </div>

                {/* VAT Filter Dropdown */}
                <div className="relative">
                  <select
                    value={vatFilter}
                    onChange={(e) => setVatFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white appearance-none cursor-pointer"
                  >
                    <option value="All">All VAT Status</option>
                    <option value="Registered">VAT Registered</option>
                    <option value="Not Registered">Not Registered</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[#667085]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Suppliers Table */}
            {loading ? (
              <Loader variant="section" text="Loading suppliers..." />
            ) : error ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-[#EF4444] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  Error loading suppliers
                </p>
                <p className="text-[14px] text-[#667085]">{error}</p>
              </div>
            ) : filteredSuppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E6EA]">
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Supplier Name
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Email
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Supplier Contact
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        REP Name
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        REP Contact
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Address
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Bank Details
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        VAT Status
                      </th>
                      <th className="text-left py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Supplied Materials
                      </th>
                      <th className="text-center py-4 px-2 text-[13px] font-[500] text-[#383E49] whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E6EA]">
                    {filteredSuppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-[#F8F9FA] transition-colors"
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#EBF8FF] rounded-full flex items-center justify-center flex-shrink-0">
                              <Truck className="w-4 h-4 text-[#0F50AA]" />
                            </div>
                            <p className="text-[13px] font-[600] text-[#383E49] whitespace-nowrap">
                              {supplier.name}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] text-[#48505E] whitespace-nowrap">
                            {supplier.email || "-"}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] text-[#48505E] whitespace-nowrap">
                            {supplier.supplierContactNumber || "-"}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] text-[#48505E] whitespace-nowrap">
                            {supplier.repName || "-"}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] text-[#48505E] whitespace-nowrap">
                            {supplier.repContactNumber || "-"}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[13px] text-[#48505E] min-w-[100px]">
                            {supplier.address || "-"}
                          </p>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-[13px] text-[#48505E] min-w-[180px]">
                            {supplier.bankName ? (
                              <>
                                <p className="font-[600] text-[#383E49]">
                                  {supplier.bankName}
                                </p>
                                {supplier.accountNumber && (
                                  <p className="text-[12px]">
                                    A/C: {supplier.accountNumber}
                                  </p>
                                )}
                                {supplier.accountName && (
                                  <p className="text-[12px]">
                                    {supplier.accountName}
                                  </p>
                                )}
                                {supplier.branch && (
                                  <p className="text-[12px] text-[#667085]">
                                    {supplier.branch}
                                  </p>
                                )}
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="min-w-[120px]">
                            {supplier.isVatRegistered ? (
                              <div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#DCFCE7] text-[#16A34A] mb-1">
                                  Registered
                                </span>
                                <p className="text-[12px] text-[#48505E]">
                                  {supplier.vatNumber}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#F3F4F6] text-[#6B7280]">
                                Not Registered
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-wrap gap-1 min-w-[150px]">
                            {(() => {
                              const generics = new Set();
                              supplier.suppliedMaterials.forEach(sm => {
                                const fullMat = availableMaterials.find(am => am.id === sm.id);
                                if (fullMat && fullMat.genericMaterial) {
                                  generics.add(fullMat.genericMaterial);
                                }
                              });
                              const uniqueGenerics = Array.from(generics);
                              
                              if (uniqueGenerics.length === 0) return <span className="text-gray-400">-</span>;

                              return (
                                <>
                                  {uniqueGenerics.slice(0, 2).map((gen, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#EBF8FF] text-[#0F50AA]"
                                    >
                                      {gen}
                                    </span>
                                  ))}
                                  {uniqueGenerics.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-[500] bg-[#F8F9FA] text-[#667085]">
                                      +{uniqueGenerics.length - 2} more
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="p-2 text-[#0F50AA] hover:bg-[#EBF8FF] rounded-lg transition-colors"
                              title="Edit Supplier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                              title="Delete Supplier"
                            >
                              <Trash2 size={16} />
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
                <Truck size={48} className="mx-auto text-[#667085] mb-4" />
                <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                  No suppliers found
                </p>
                <p className="text-[14px] text-[#667085]">
                  {searchTerm || vatFilter !== "All"
                    ? "Try adjusting your search or filter criteria"
                    : "Click 'Add New Supplier' to add your first supplier"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Supplier Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA] sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-[20px] leading-[30px] font-[600] text-[#383E49]">
                  {isEditMode ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <p className="text-[14px] text-[#667085] mt-1">
                  {isEditMode
                    ? "Update supplier information and materials"
                    : "Fill in the details to add a new supplier"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-[#667085] hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Supplier Name */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Supplier Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter supplier name"
                        className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.name ? "border-[#EF4444]" : "border-[#E4E6EA]"
                          }`}
                      />
                      {errors.name && (
                        <p className="text-[#EF4444] text-[12px] mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.email
                              ? "border-[#EF4444]"
                              : "border-[#E4E6EA]"
                            }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[#EF4444] text-[12px] mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Supplier Contact Number */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Supplier Contact Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                        <input
                          type="tel"
                          name="supplierContactNumber"
                          value={formData.supplierContactNumber}
                          onChange={handleChange}
                          placeholder="Enter supplier contact number"
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.supplierContactNumber ? "border-[#EF4444]" : "border-[#E4E6EA]"}`}
                        />
                      </div>
                      {errors.supplierContactNumber && (
                        <p className="text-[#EF4444] text-[12px] mt-1">
                          {errors.supplierContactNumber}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-[#667085]" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter supplier address"
                          rows="3"
                          className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* REP Information Section */}
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    REP Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* REP Name */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        REP Name
                      </label>
                      <input
                        type="text"
                        name="repName"
                        value={formData.repName}
                        onChange={handleChange}
                        placeholder="Enter rep name"
                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                      />
                    </div>

                    {/* REP Contact Number */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        REP Contact Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                        <input
                          type="tel"
                          name="repContactNumber"
                          value={formData.repContactNumber}
                          onChange={handleChange}
                          placeholder="Enter rep contact number"
                          className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Information Section */}
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Bank Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Name */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="Enter bank name"
                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Account Number
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#667085]" />
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          placeholder="Enter account number"
                          className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                        />
                      </div>
                    </div>

                    {/* Account Name */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleChange}
                        placeholder="Enter account name"
                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                      />
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        placeholder="Enter branch name"
                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA]"
                      />
                    </div>
                  </div>
                </div>

                {/* VAT Information Section */}
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49] mb-4">
                    VAT Registration
                  </h3>
                  <div className="space-y-4">
                    {/* VAT Registered Checkbox */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isVatRegistered"
                        name="isVatRegistered"
                        checked={formData.isVatRegistered}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#0F50AA] border-[#E4E6EA] rounded focus:ring-2 focus:ring-[#0F50AA]"
                      />
                      <label
                        htmlFor="isVatRegistered"
                        className="text-[14px] font-[500] text-[#383E49] cursor-pointer"
                      >
                        Is VAT Registered
                      </label>
                    </div>

                    {/* VAT Number - Only show if registered */}
                    {formData.isVatRegistered && (
                      <div>
                        <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                          VAT Number <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          name="vatNumber"
                          value={formData.vatNumber}
                          onChange={handleChange}
                          placeholder="Enter VAT number"
                          className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] ${errors.vatNumber
                              ? "border-[#EF4444]"
                              : "border-[#E4E6EA]"
                            }`}
                        />
                        {errors.vatNumber && (
                          <p className="text-[#EF4444] text-[12px] mt-1">
                            {errors.vatNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplied Materials Section */}
                <div>
                  <h3 className="text-[16px] font-[600] text-[#383E49] mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Supplied Materials
                  </h3>
                  <div>
                    <label className="block text-[14px] font-[500] text-[#383E49] mb-1">
                      Select Materials <span className="text-[#EF4444]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenMaterialsModal}
                      className={`w-full px-4 py-2.5 border rounded-md text-[14px] text-left hover:bg-[#F8F9FA] transition-colors flex items-center justify-between ${errors.suppliedMaterials
                          ? "border-[#EF4444]"
                          : "border-[#E4E6EA]"
                        }`}
                    >
                      <span className="text-[#667085]">
                        {formData.suppliedMaterials.length > 0
                          ? `${formData.suppliedMaterials.length} material(s) selected`
                          : "Select materials"}
                      </span>
                      <Package className="w-5 h-5 text-[#667085]" />
                    </button>
                    {errors.suppliedMaterials && (
                      <p className="text-[#EF4444] text-[12px] mt-1">
                        {errors.suppliedMaterials}
                      </p>
                    )}

                    {/* Selected Materials Display */}
                    {formData.suppliedMaterials.length > 0 && (
                      <div className="mt-3 p-3 bg-[#F8F9FA] rounded-md">
                        <p className="text-[12px] font-[500] text-[#667085] mb-2">
                          Selected Materials:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.suppliedMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-[#E4E6EA]"
                            >
                              <div className="flex flex-col">
                                <span className="text-[12px] font-[500] text-[#383E49]">
                                  {material.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-[#667085]">
                                    {material.code}
                                  </span>
                                  {material.brand && (
                                    <span className="text-[10px] font-[500] text-[#0F50AA] bg-[#EBF8FF] px-1 rounded">
                                      {material.brand}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMaterial(material.id)
                                }
                                className="text-[#EF4444] hover:bg-[#FEE2E2] rounded-full p-0.5"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[#E4E6EA]">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 border border-[#E4E6EA] text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>
                      {isEditMode ? "Update Supplier" : "Save Supplier"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Materials Selection Modal */}
      {showMaterialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-2 border-b border-[#E4E6EA]">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Select Supplied Materials
                </h3>
                <p className="text-[14px] text-[#667085] mt-1">
                  Choose which raw materials this supplier provides
                </p>
              </div>
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="p-2 text-[#667085] hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="px-6 py-2 border-b border-[#E4E6EA] bg-[#F8F9FA]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by material name or code..."
                    value={materialSearchTerm}
                    onChange={(e) => setMaterialSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white"
                  />
                </div>

                {/* Category Selector */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F50AA] text-[14px] bg-white appearance-none cursor-pointer"
                  >
                    {getCategories().map((category) => (
                      <option key={category} value={category}>
                        {category === "All" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-[#667085]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(
                  getFilteredMaterials().reduce((acc, curr) => {
                    const gen = curr.genericMaterial || "Uncategorized";
                    const brand = curr.brand || "Unbranded";
                    if (!acc[gen]) acc[gen] = {};
                    if (!acc[gen][brand]) acc[gen][brand] = [];
                    acc[gen][brand].push(curr);
                    return acc;
                  }, {})
                ).map(([genericName, brandsObj]) => (
                  <div key={genericName} className="border border-[#E4E6EA] rounded-lg p-4 bg-white relative">
                    <h4 className="text-[16px] font-[600] text-[#383E49] mb-3 pb-2 border-b">
                      {genericName}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(brandsObj).map(([brandName, materialsInBrand]) => {
                        const allSelected = materialsInBrand.every((m) =>
                          tempSelectedMaterials.some((sel) => sel.id === m.id)
                        );
                        
                        const handleBrandToggle = () => {
                          if (allSelected) {
                            setTempSelectedMaterials(
                              tempSelectedMaterials.filter(
                                (sel) => !materialsInBrand.some((m) => m.id === sel.id)
                              )
                            );
                          } else {
                            const toAdd = materialsInBrand.filter(
                              (m) => !tempSelectedMaterials.some((sel) => sel.id === m.id)
                            );
                            setTempSelectedMaterials([...tempSelectedMaterials, ...toAdd]);
                          }
                        };

                        return (
                          <div key={brandName} className="flex flex-col gap-2">
                            <div
                              onClick={handleBrandToggle}
                              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                allSelected
                                  ? "border-[#0F50AA] bg-[#EBF8FF]"
                                  : "border-[#E4E6EA] hover:border-[#B3A5FF] hover:bg-[#F8F9FA]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      allSelected ? "bg-[#0F50AA]" : "bg-[#F0F1F3]"
                                    }`}
                                  >
                                    <Package
                                      className={`w-5 h-5 ${
                                        allSelected ? "text-white" : "text-[#667085]"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[14px] font-[600] text-[#383E49]">{brandName}</p>
                                    <p className="text-[12px] text-[#667085]">Click to select all {materialsInBrand.length} variant(s)</p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    allSelected
                                      ? "border-[#0F50AA] bg-[#0F50AA]"
                                      : "border-[#E4E6EA]"
                                  }`}
                                >
                                  {allSelected && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Materials List inside the brand */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 mb-2">
                              {materialsInBrand.map((material) => {
                                const isSelected = tempSelectedMaterials.some((sel) => sel.id === material.id);
                                return (
                                  <div
                                    key={material.id}
                                    onClick={() => handleMaterialToggle(material)}
                                    className={`p-2 border rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                                      isSelected 
                                        ? "border-[#0F50AA] bg-[#F0F7FF]" 
                                        : "border-[#E4E6EA] hover:bg-[#F8F9FA]"
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[13px] font-[500] text-[#383E49]">{material.name}</span>
                                      <span className="text-[11px] text-[#667085]">{material.code}</span>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#0F50AA] bg-[#0F50AA]" : "border-[#E4E6EA]"}`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* No Results Message */}
                {getFilteredMaterials().length === 0 && (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-[#667085] mb-4" />
                    <p className="text-[16px] font-[500] text-[#383E49] mb-2">
                      No materials found
                    </p>
                    <p className="text-[14px] text-[#667085]">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-2 border-t border-[#E4E6EA] bg-[#F8F9FA]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] text-[#667085]">
                  <span className="font-[600] text-[#383E49]">
                    {tempSelectedMaterials.length}
                  </span>{" "}
                  material(s) selected
                </p>
                {tempSelectedMaterials.length > 0 && (
                  <button
                    onClick={() => setTempSelectedMaterials([])}
                    className="text-[14px] text-[#EF4444] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMaterialsModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#E4E6EA] bg-white text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMaterials}
                  className="flex-1 px-4 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Materials Modal */}
      {showViewMaterialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E4E6EA]">
              <div>
                <h3 className="text-[18px] font-[600] text-[#383E49]">
                  Supplied Materials
                </h3>
                <p className="text-[14px] text-[#667085] mt-1">
                  Materials supplied by {viewingSupplierName}
                </p>
              </div>
              <button
                onClick={() => setShowViewMaterialsModal(false)}
                className="p-2 text-[#667085] hover:bg-[#F8F9FA] rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Materials List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3">
                {viewingSupplierMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="p-4 border border-[#E4E6EA] rounded-lg bg-[#F8F9FA]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EBF8FF] rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#0F50AA]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-[600] text-[#383E49]">
                          {material.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-[#667085]">
                            {material.code}
                          </p>
                          {material.brand && (
                            <>
                              <span className="text-[#D1D5DB]">•</span>
                              <p className="text-[12px] font-[500] text-[#0F50AA] bg-[#EBF8FF] px-2 rounded">
                                {material.brand}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E4E6EA] bg-[#F8F9FA]">
              <button
                type="button"
                onClick={() => setShowViewMaterialsModal(false)}
                className="w-full px-4 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[10001] animate-fade-in">
          <div className="bg-white border-l-4 border-[#51CC5D] rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0 w-8 h-8 bg-[#51CC5D] bg-opacity-10 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-[#199D26]" />
            </div>
            <p className="text-[14px] text-[#383E49] font-[500]">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
