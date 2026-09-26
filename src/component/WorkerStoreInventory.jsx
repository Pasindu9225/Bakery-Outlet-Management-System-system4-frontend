import React, { useState, useEffect } from "react";
import { onEnterClick } from "../utils/a11y";
import { friendlyError } from "../utils/friendlyError";
import { toast } from "react-hot-toast";
import {
  Store,
  Search,
  RefreshCw,
  Package,
  Boxes,
  Wheat,
  ChefHat,
  AlertTriangle,
  Layers,
  CheckCircle,
} from "lucide-react";
import Loader from "../component/Loader.jsx";
import ExpiryTag, { isExpired as isPastExpiry } from "./ExpiryTag.jsx";
import ReportWastageModal from "./ReportWastageModal.jsx";

export default function WorkerStoreInventory({ moduleTitle = "Production Center Store" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [reportItem, setReportItem] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const token = localStorage.getItem("authToken");

      const res = await fetch(`${baseUrl}/api/v1/worker/production-requests/store-inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load store inventory (Status: ${res.status})`);
      }

      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching worker store inventory:", err);
      setError(friendlyError(err, { fallback: "Failed to load store inventory." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getItemCategory = (item) => {
    if (item.rawMaterialId) return "RAW_MATERIAL";
    if (item.productId) {
      const name = (item.name || "").toLowerCase();
      const generic = (item.genericMaterialName || "").toLowerCase();
      if (
        name.includes("dough") ||
        name.includes("curry") ||
        name.includes("filling") ||
        name.includes("semi") ||
        name.includes("sauce") ||
        name.includes("paste") ||
        generic.includes("semi")
      ) {
        return "SEMI_FINISHED";
      }
      return "FINISHED_PRODUCT";
    }
    return "OTHER";
  };

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      (item.name && item.name.toLowerCase().includes(search)) ||
      (item.brandName && item.brandName.toLowerCase().includes(search)) ||
      (item.genericMaterialName && item.genericMaterialName.toLowerCase().includes(search));

    const cat = getItemCategory(item);
    const matchesCat =
      categoryFilter === "ALL" ||
      (categoryFilter === "RAW_MATERIAL" && cat === "RAW_MATERIAL") ||
      (categoryFilter === "SEMI_FINISHED" && cat === "SEMI_FINISHED") ||
      (categoryFilter === "FINISHED_PRODUCT" && cat === "FINISHED_PRODUCT");

    return matchesSearch && matchesCat;
  });

  const rawMaterialCount = items.filter((i) => getItemCategory(i) === "RAW_MATERIAL").length;
  const semiFinishedCount = items.filter((i) => getItemCategory(i) === "SEMI_FINISHED").length;
  const finishedProductCount = items.filter((i) => getItemCategory(i) === "FINISHED_PRODUCT").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-[700] text-fg flex items-center gap-2">
            <Store className="text-brand-fg" size={24} />
            {moduleTitle} Inventory
          </h1>
          <p className="text-[14px] text-fg-secondary">
            Real-time stock of Raw Materials, Semi-Finished Products, and Finished Goods in this center
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-line text-fg-secondary bg-surface text-[13px] font-[500] rounded-lg hover:bg-subtle transition-colors"
        >
          <RefreshCw size={15} />
          Refresh Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setCategoryFilter("ALL")}
          className={`p-5 rounded-xl border bg-surface shadow-sm cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === "ALL" ? "ring-2 ring-brand-fg border-brand-fg" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-[500] text-fg-secondary">Total Items</p>
              <h3 className="text-[24px] font-[700] text-fg mt-1">{items.length}</h3>
            </div>
            <div className="p-3 bg-brand/10 text-brand-fg rounded-xl">
              <Boxes size={22} />
            </div>
          </div>
        </div>

        <div
          role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setCategoryFilter("RAW_MATERIAL")}
          className={`p-5 rounded-xl border bg-surface shadow-sm cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === "RAW_MATERIAL" ? "ring-2 ring-success border-success" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-[500] text-fg-secondary">Raw Materials</p>
              <h3 className="text-[24px] font-[700] text-fg mt-1">{rawMaterialCount}</h3>
            </div>
            <div className="p-3 bg-success/10 text-success rounded-xl">
              <Wheat size={22} />
            </div>
          </div>
        </div>

        <div
          role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setCategoryFilter("SEMI_FINISHED")}
          className={`p-5 rounded-xl border bg-surface shadow-sm cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === "SEMI_FINISHED" ? "ring-2 ring-plum border-plum" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-[500] text-fg-secondary">Semi-Finished</p>
              <h3 className="text-[24px] font-[700] text-fg mt-1">{semiFinishedCount}</h3>
            </div>
            <div className="p-3 bg-plum/10 text-plum rounded-xl">
              <Layers size={22} />
            </div>
          </div>
        </div>

        <div
          role="button" tabIndex={0} onKeyDown={onEnterClick} onClick={() => setCategoryFilter("FINISHED_PRODUCT")}
          className={`p-5 rounded-xl border bg-surface shadow-sm cursor-pointer transition-all hover:shadow-md ${
            categoryFilter === "FINISHED_PRODUCT" ? "ring-2 ring-warning border-warning" : "border-line"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-[500] text-fg-secondary">Finished Products</p>
              <h3 className="text-[24px] font-[700] text-fg mt-1">{finishedProductCount}</h3>
            </div>
            <div className="p-3 bg-warning/10 text-warning rounded-xl">
              <Package size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-surface p-4 rounded-xl border border-line flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" />
          <input
            type="text"
            placeholder="Search material or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-fg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "RAW_MATERIAL", "SEMI_FINISHED", "FINISHED_PRODUCT"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-[500] transition-colors ${
                categoryFilter === cat
                  ? "bg-brand text-on-brand"
                  : "bg-app text-fg-secondary hover:bg-line"
              }`}
            >
              {cat === "ALL"
                ? "All"
                : cat === "RAW_MATERIAL"
                ? "Raw Materials"
                : cat === "SEMI_FINISHED"
                ? "Semi-Finished"
                : "Finished Goods"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
        {loading ? (
          <Loader variant="section" text="Loading store inventory..." />
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle size={36} className="mx-auto text-error mb-2" />
            <p className="text-[14px] font-[600] text-fg">{error}</p>
            <button
              onClick={fetchInventory}
              className="mt-3 px-4 py-2 bg-brand text-on-brand rounded-lg text-[12px]"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-fg-secondary">
            <Boxes size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-[14px] font-[500]">No store items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle border-b border-line text-[12px] font-[600] text-fg-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">System Qty</th>
                  <th className="py-3.5 px-4 text-center">Physical Stock</th>
                  <th className="py-3.5 px-4">Brand / Type</th>
                  <th className="py-3.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-[13px]">
                {filteredItems.map((item, idx) => {
                  const cat = getItemCategory(item);
                  const isExpired = item.isExpired || isPastExpiry(item.expiryDate);
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isExpired
                          ? "bg-hover opacity-60 hover:bg-line"
                          : "hover:bg-subtle"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-[600] text-fg">
                        <div className="flex items-center gap-2">
                          {cat === "RAW_MATERIAL" && <Wheat size={16} className="text-success" />}
                          {cat === "SEMI_FINISHED" && <Layers size={16} className="text-plum" />}
                          {cat === "FINISHED_PRODUCT" && <Package size={16} className="text-warning" />}
                          <span>{item.name}</span>
                          {item.expiryDate && !isExpired && <ExpiryTag expiryDate={item.expiryDate} warnDays={1} />}
                          {Number(item.expiredQty) > 0 && (
                            <span className="text-[12px] font-[600] text-error" title="Expired stock is hidden here and sent to the Admin for review">
                              +{Number(item.expiredQty)} expired
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2 py-0.5 rounded text-[12px] font-[700] bg-error/10 text-error border border-error/30 uppercase tracking-wider">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {cat === "RAW_MATERIAL" && (
                          <span className="px-2.5 py-1 rounded-full text-[12px] font-[600] bg-success/10 text-success border border-success/30">
                            Raw Material
                          </span>
                        )}
                        {cat === "SEMI_FINISHED" && (
                          <span className="px-2.5 py-1 rounded-full text-[12px] font-[600] bg-plum/10 text-plum border border-plum/30">
                            Semi-Finished Sub-assembly
                          </span>
                        )}
                        {cat === "FINISHED_PRODUCT" && (
                          <span className="px-2.5 py-1 rounded-full text-[12px] font-[600] bg-warning/10 text-warning border border-warning/30">
                            Finished Product
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-[500] text-fg-secondary">
                        {item.systemQty != null ? item.systemQty : "0"} {item.unitOfMeasure || item.unit || ""}
                      </td>

                      <td className={`py-3.5 px-4 text-center font-[700] ${isExpired ? "text-fg-muted line-through" : "text-success"}`}>
                        {item.physicalQty != null ? item.physicalQty : "0"} {item.unitOfMeasure || item.unit || ""}
                      </td>

                      <td className="py-3.5 px-4 text-fg-secondary">
                        {item.brandName && item.brandName !== "N/A"
                          ? item.brandName
                          : item.genericMaterialName || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.stockRef && Number(item.physicalQty) > 0 && (
                          <button
                            onClick={() => setReportItem({
                              stage: "MINI_STORE", locationType: "MINI_STORE", locationId: item.miniStoreId, locationName: moduleTitle,
                              itemType: cat === "RAW_MATERIAL" ? "RAW_MATERIAL" : cat === "FINISHED_PRODUCT" ? "FINISHED" : "SEMI_FINISHED",
                              itemId: item.rawMaterialId || item.productId, itemName: item.name,
                              uom: item.unitOfMeasure || item.unit, expiryDate: item.expiryDate || null,
                              stockRef: item.stockRef, available: item.physicalQty,
                            })}
                            className="px-3 py-1 text-[12px] font-[600] text-error border border-error/30 rounded-lg hover:bg-error/10 whitespace-nowrap"
                          >
                            Report wastage
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      {reportItem && (
        <ReportWastageModal
          item={reportItem}
          onClose={() => setReportItem(null)}
          onDone={(entry) => {
            setReportItem(null);
            toast.success(`${entry?.entryNo || "Wastage"} sent to the Admin for review.`);
          }}
        />
      )}
      </div>
    </div>
  );
}
