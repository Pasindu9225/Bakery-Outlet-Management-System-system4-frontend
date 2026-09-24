import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import axiosInstance from "../services/api";
import ExpiryTag, { isExpired } from "./ExpiryTag.jsx";

const FALLBACK_REASONS = [
  { code: "EXPIRED", label: "Expired" },
  { code: "DAMAGED", label: "Damaged" },
  { code: "BURNT", label: "Burnt / overbaked" },
  { code: "QUALITY_REJECT", label: "Quality reject" },
  { code: "SPILLAGE", label: "Spillage" },
  { code: "OTHER", label: "Other" },
];

/**
 * Report wastage for one stock row. The report waits for Admin review; stock only changes when
 * the Admin confirms it.
 *
 * item: { stage, locationType, locationId, locationName, itemType, itemId, itemName, uom,
 *         batchRef, expiryDate, stockRef, available }
 */
export default function ReportWastageModal({ item, onClose, onDone }) {
  const [reasons, setReasons] = useState(FALLBACK_REASONS);
  const [qty, setQty] = useState("");
  const [reasonCode, setReasonCode] = useState(isExpired(item.expiryDate) ? "EXPIRED" : "DAMAGED");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/api/v1/wastage/reasons")
      // Customer returns and day-end write-offs are recorded by their own screens.
      .then((res) => setReasons((res.data || []).filter((r) => !["CUSTOMER_RETURN", "UNSOLD"].includes(r.code))))
      .catch(() => setReasons(FALLBACK_REASONS));
  }, []);

  const qtyNum = Number(qty);
  const available = item.available !== undefined && item.available !== null ? Number(item.available) : null;
  let problem = null;
  if (!(qtyNum > 0)) problem = "Enter the quantity wasted.";
  else if (available !== null && qtyNum > available) problem = `Only ${available} ${item.uom || ""} is in stock here.`;
  else if (reasonCode === "OTHER" && !notes.trim()) problem = "Describe what happened.";

  const submit = async () => {
    if (problem) return;
    setSaving(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/api/v1/wastage/report", {
        stage: item.stage,
        locationType: item.locationType,
        locationId: item.locationId ?? null,
        locationName: item.locationName ?? null,
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        uom: item.uom ?? null,
        batchRef: item.batchRef ?? null,
        expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : null,
        stockRef: item.stockRef ?? null,
        qty: qtyNum,
        reasonCode,
        notes: notes.trim() || null,
      });
      onDone?.(res.data);
    } catch (err) {
      setError(err.message || "Could not report wastage");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-[#E4E6EA]">
          <div>
            <h3 className="text-[18px] font-[700] text-[#1D2939] flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" /> Report wastage
            </h3>
            <p className="text-[13px] text-[#667085]">
              {item.itemName}
              {item.batchRef ? ` · ${item.batchRef}` : ""}
              {item.locationName ? ` · ${item.locationName}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#98A2B3] hover:text-[#344054]"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-[13px] bg-[#F9FAFB] border border-[#E4E6EA] rounded-lg p-3">
            <span className="text-[#667085]">
              In stock: <span className="font-[600] text-[#1D2939]">{available !== null ? `${available} ${item.uom || ""}` : "—"}</span>
            </span>
            {item.expiryDate !== undefined && <ExpiryTag expiryDate={item.expiryDate} showDate />}
          </div>

          <label className="block">
            <span className="block text-[12px] font-[600] text-[#344054] mb-1">Quantity wasted{item.uom ? ` (${item.uom})` : ""}</span>
            <input type="number" min="0" step="any" value={qty} autoFocus
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
          </label>
          <label className="block">
            <span className="block text-[12px] font-[600] text-[#344054] mb-1">Reason</span>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px] bg-white">
              {reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] font-[600] text-[#344054] mb-1">Notes{reasonCode === "OTHER" ? " (required)" : " (optional)"}</span>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-[14px]" />
          </label>

          <p className="text-[12px] text-[#667085]">The Admin reviews this report. Stock is removed only when it is confirmed.</p>
          {(error || (qty !== "" && problem)) && <p className="text-[12px] text-red-600">{error || problem}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg text-[14px] font-[600]">Cancel</button>
            <button onClick={submit} disabled={!!problem || saving}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[14px] font-[600] disabled:opacity-50">
              {saving ? "Sending..." : "Report wastage"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
