import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Search,
  Store,
  ChefHat,
  Boxes,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AdminNavBar from "../component/AdminNavBar";
import AdminSidebar from "../component/AdminSidebar";
import Loader from "../component/Loader";

export default function AdminStockEntry() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection] = useState("Stock & Item Entry");

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    productId: "",
    productName: "",
    productCode: "",
    quantity: "",
    source: "Store",
    unit: "pieces",
    remarks: "",
  });

  const [recentEntries, setRecentEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const sources = [
    { value: "Store", icon: <Store size={16} />, color: "bg-blue-100 text-blue-800" },
    { value: "Bakery", icon: <ChefHat size={16} />, color: "bg-green-100 text-green-800" },
    { value: "Production", icon: <Package size={16} />, color: "bg-purple-100 text-purple-800" },
    { value: "Kitchen", icon: <ChefHat size={16} />, color: "bg-orange-100 text-orange-800" },
  ];

  const units = ["pieces", "kg", "liters", "boxes", "packets"];

  // Fetch available products from backend
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Fallback to manager product endpoint if /api/products is not public
        const altResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/api/manager/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (altResponse.ok) {
          const altData = await altResponse.json();
          setProducts(Array.isArray(altData) ? altData : altData.content || []);
          return;
        }
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductSelect = (productId) => {
    const selected = products.find((p) => String(p.id) === String(productId));
    if (selected) {
      setForm((prev) => ({
        ...prev,
        productId: selected.id,
        productName: selected.productName || selected.name || "",
        productCode: selected.productCode || `PRD-${selected.id}`,
        unit: selected.unit || "pieces",
      }));
    } else {
      setForm((prev) => ({ ...prev, productId: "", productName: "", productCode: "" }));
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.productId || !form.quantity || parseFloat(form.quantity) <= 0) {
      toast.error("Please select a product and enter a valid quantity greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = localStorage.getItem("userId") || "35000000-0000-0000-0000-000000000000";
      const outletId = localStorage.getItem("outletId");

      const payload = {
        productId: parseInt(form.productId),
        quantity: parseFloat(form.quantity),
        unit: (form.unit || "pieces").toUpperCase(),
        remarks: form.remarks || "Direct Stock Entry by Admin",
        source: (form.source || "Store").toUpperCase(),
        userId: userId,
        outletId: outletId ? parseInt(outletId) : 1,
      };

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/manual-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create stock entry");
      }

      const resData = await response.json();
      toast.success(`Stock added successfully! GTN ID: ${resData.gtnId}`);

      // Add to local recent list
      const newRecord = {
        id: resData.gtnId || Date.now(),
        productName: form.productName,
        productCode: form.productCode,
        quantity: form.quantity,
        unit: form.unit,
        source: form.source,
        remarks: form.remarks,
        timestamp: new Date().toLocaleTimeString(),
      };
      setRecentEntries((prev) => [newRecord, ...prev]);

      // Reset Form
      setForm({
        productId: "",
        productName: "",
        productCode: "",
        quantity: "",
        source: "Store",
        unit: "pieces",
        remarks: "",
      });
    } catch (err) {
      console.error("Stock entry error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecent = recentEntries.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <AdminSidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[24px] font-[600] text-[#383E49]">
              Direct Stock & Item Entry
            </h1>
            <p className="text-[14px] text-[#667085] mt-1">
              Add products directly into POS stock without requiring storekeeper or production plan approval.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#E4E6EA]">
                <Package size={20} className="text-[#0F50AA]" />
                <h2 className="text-[18px] font-[600] text-[#383E49]">
                  New Stock Entry Form
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Select Product */}
                <div>
                  <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                    Select Product *
                  </label>
                  {loadingProducts ? (
                    <Loader variant="section" text="Loading product list..." />
                  ) : (
                    <select
                      value={form.productId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] focus:border-[#0F50AA] text-[14px]"
                    >
                      <option value="">-- Choose a Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName || p.name} ({p.productCode || `ID:${p.id}`})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Manual Product Details preview if selected */}
                {form.productId && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between text-[13px]">
                    <div>
                      <span className="font-[500] text-[#0F50AA]">Selected: </span>
                      <span className="text-gray-800">{form.productName}</span>
                    </div>
                    <div className="text-gray-500 font-mono">{form.productCode}</div>
                  </div>
                )}

                {/* Quantity & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.quantity}
                      onChange={(e) => handleFormChange("quantity", e.target.value)}
                      placeholder="Enter quantity"
                      required
                      className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                      Unit *
                    </label>
                    <select
                      value={form.unit}
                      onChange={(e) => handleFormChange("unit", e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Source Selection */}
                <div>
                  <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                    Source / Origin *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sources.map((s) => (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => handleFormChange("source", s.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-[13px] font-[500] transition-colors ${
                          form.source === s.value
                            ? "border-[#0F50AA] bg-blue-50 text-[#0F50AA]"
                            : "border-[#E4E6EA] bg-white text-[#667085] hover:bg-gray-50"
                        }`}
                      >
                        {s.icon}
                        <span>{s.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[13px] font-[500] text-[#383E49] mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => handleFormChange("remarks", e.target.value)}
                    placeholder="Add optional notes (e.g. Direct dispatch for morning shift)..."
                    className="w-full px-3 py-2.5 border border-[#E4E6EA] rounded-lg focus:ring-2 focus:ring-[#0F50AA] text-[14px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E4E6EA]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0F50AA] text-white font-[500] text-[14px] rounded-lg hover:bg-[#0D4494] transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {isSubmitting ? "Adding Stock..." : "Dispatch Stock to POS"}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Submissions Column */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-6 flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E6EA]">
                <h3 className="text-[16px] font-[600] text-[#383E49]">
                  Recent Entries
                </h3>
                <span className="text-[12px] bg-blue-100 text-[#0F50AA] px-2 py-0.5 rounded-full font-[500]">
                  This Session
                </span>
              </div>

              {recentEntries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Boxes size={40} className="mb-2 opacity-50" />
                  <p className="text-[14px]">No stock entries made yet in this session.</p>
                  <p className="text-[12px] text-gray-400 mt-1">Submitted items will appear here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {recentEntries.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E4E6EA] flex items-center justify-between"
                    >
                      <div>
                        <p className="font-[500] text-[14px] text-[#383E49]">
                          {item.productName}
                        </p>
                        <p className="text-[12px] text-[#667085] mt-0.5">
                          {item.quantity} {item.unit} &bull; {item.source}
                        </p>
                        <span className="text-[11px] text-gray-400">{item.timestamp}</span>
                      </div>
                      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
