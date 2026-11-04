import React, { useState } from "react";
import axios from "axios";
import { CheckCircle, AlertTriangle } from "lucide-react";

// Staff meal / free meal details on the POS payment screens (POS Sales, Table and Waiter billing).
// Staff meal: a Staff ID of an active user (Admin > Users shows each user's), checked with the server.
// Free meal: who requested it and why.

export const EMPTY_MEAL = { staffId: "", staffName: null, requestedBy: "", reason: "" };

/** The reason saved with the sale, or "" while the details are incomplete. kind: "staff" | "free". */
export function mealReason(kind, m) {
    if (kind === "staff") {
        return m.staffName ? `Staff ID: ${m.staffId.trim().toUpperCase()} (${m.staffName})${m.reason.trim() ? ` - ${m.reason.trim()}` : ""}` : "";
    }
    if (kind === "free") {
        return m.requestedBy.trim() && m.reason.trim() ? `Requested by: ${m.requestedBy.trim()} - Reason: ${m.reason.trim()}` : "";
    }
    return "";
}

const field = "w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none";

export default function MealDetails({ kind, value, onChange }) {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState("");
    const set = (patch) => onChange({ ...value, ...patch });

    const check = async () => {
        const id = value.staffId.trim();
        if (!id) return;
        setChecking(true);
        setError("");
        try {
            const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/pos/v1/staff/${encodeURIComponent(id)}`);
            set({ staffId: res.data.staffId, staffName: res.data.name || res.data.staffId });
        } catch (e) {
            set({ staffName: null });
            setError(e.response?.data?.message || "This Staff ID could not be checked.");
        } finally {
            setChecking(false);
        }
    };

    if (kind === "staff") {
        return (
            <div className="space-y-3">
                <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">Staff ID *</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. EMP0003 (Admin > Users)"
                            value={value.staffId}
                            onChange={(e) => { setError(""); set({ staffId: e.target.value, staffName: null }); }}
                            onBlur={() => { if (value.staffId.trim() && !value.staffName) check(); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
                            className={`${field} flex-1 min-w-0 uppercase`}
                        />
                        <button
                            type="button"
                            onClick={check}
                            disabled={checking || !value.staffId.trim()}
                            className="px-4 border border-brand-fg text-brand-fg rounded-lg text-[14px] font-[500] hover:bg-brand/5 disabled:opacity-50"
                        >
                            {checking ? "Checking..." : "Check"}
                        </button>
                    </div>
                    {value.staffName && (
                        <p className="mt-2 text-[13px] text-success flex items-center gap-1"><CheckCircle size={14} /> {value.staffName}</p>
                    )}
                    {error && (
                        <p className="mt-2 text-[13px] text-error flex items-center gap-1"><AlertTriangle size={14} /> {error}</p>
                    )}
                </div>
                <div>
                    <label className="block text-[14px] font-[500] text-fg mb-2">Reason (Optional)</label>
                    <input type="text" placeholder="Optional reason" value={value.reason} onChange={(e) => set({ reason: e.target.value })} className={field} />
                </div>
                <div className="p-2 bg-subtle border border-brand-fg rounded-lg text-[13px] text-brand-fg">Staff Meal: No charge for this transaction.</div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-[14px] font-[500] text-fg mb-2">Requested by *</label>
                <textarea placeholder="Who asked for the free meal" value={value.requestedBy} onChange={(e) => set({ requestedBy: e.target.value })} className={`${field} resize-none`} rows="2" />
            </div>
            <div>
                <label className="block text-[14px] font-[500] text-fg mb-2">Reason *</label>
                <textarea placeholder="Why the meal is free" value={value.reason} onChange={(e) => set({ reason: e.target.value })} className={`${field} resize-none`} rows="3" />
            </div>
            <div className="p-2 bg-subtle border border-brand-fg rounded-lg text-[13px] text-brand-fg">Free Meal: No charge for this transaction.</div>
        </div>
    );
}
