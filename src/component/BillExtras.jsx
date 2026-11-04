import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Users, Coins, CheckCircle } from "lucide-react";

// Direct discount (needs a Manager's code) and customer loyalty for Table and Waiter billing,
// the same rules as the POS Sales payment popup.

const API = () => process.env.REACT_APP_BASE_URL;
const field = "w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none";

export const EMPTY_DIRECT = { type: "PERCENTAGE", value: "", managerCode: "" };

/** Rupees taken off `base` by the direct discount (a % or a fixed amount, never more than the bill). */
export function directAmount(base, d) {
    const n = Math.max(0, parseFloat(d.value) || 0);
    const off = d.type === "PERCENTAGE" ? (base * Math.min(100, n)) / 100 : n;
    return Math.round(Math.min(Math.max(0, base), off) * 100) / 100;
}

export function DirectDiscountBox({ base, value, onChange }) {
    const set = (patch) => onChange({ ...value, ...patch });
    const amount = directAmount(base, value);
    return (
        <div>
            <label className="block text-[14px] font-[500] text-fg mb-2">Direct discount</label>
            <div className="flex gap-2">
                <div className="flex p-1 bg-subtle rounded-md border border-line">
                    {[["PERCENTAGE", "%"], ["FIXED", "Rs."]].map(([t, label]) => (
                        <button key={t} type="button" onClick={() => set({ type: t })}
                            className={`px-3 py-1 rounded-md text-[13px] font-[500] ${value.type === t ? "bg-surface text-brand-fg shadow-sm" : "text-fg-secondary hover:text-fg"}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <input type="number" min="0" max={value.type === "PERCENTAGE" ? 100 : undefined} value={value.value}
                    onChange={(e) => set({ value: e.target.value })}
                    placeholder={value.type === "PERCENTAGE" ? "e.g. 10 (%)" : "e.g. 100 (Rs.)"} className={`${field} flex-1 min-w-0`} />
            </div>
            {amount > 0 && (
                <>
                    <p className="mt-1 text-[12px] text-success">Rs. {amount.toLocaleString()} off the bill</p>
                    <input type="password" value={value.managerCode} onChange={(e) => set({ managerCode: e.target.value })}
                        placeholder="Manager's code (needed for a discount)" className={`${field} mt-2`} autoComplete="off" />
                </>
            )}
        </div>
    );
}

export const EMPTY_LOYALTY = { customer: null, redeem: false, otp: "", otpVerified: false };

/** Rupees the customer's 1000 points take off (only once the OTP is verified). */
export const loyaltyRedemption = (payable, l) =>
    l.customer && l.redeem && l.otpVerified ? Math.min(1000, Math.max(0, payable)) : 0;

/** The loyalty fields of the billing request. */
export const loyaltyRequest = (l) => ({
    customerPhoneNumber: l.customer ? l.customer.contactNumber : null,
    redeemPoints: !!(l.customer && l.redeem && l.otpVerified),
    otp: l.otpVerified ? l.otp : null,
});

export function LoyaltyBox({ payable, value, onChange }) {
    const [phone, setPhone] = useState("");
    const [busy, setBusy] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const set = (patch) => onChange({ ...value, ...patch });

    const lookup = async () => {
        if (!phone.trim()) return;
        setBusy(true);
        try {
            const res = await axios.get(`${API()}/api/pos/v1/customers/lookup?phone=${encodeURIComponent(phone.trim())}`);
            onChange({ ...EMPTY_LOYALTY, customer: res.data });
            setOtpSent(false);
        } catch (e) {
            onChange(EMPTY_LOYALTY);
            toast.error(e.response?.status === 404 ? "No registered customer with this number. Register them at POS Sales." : "Customer lookup failed.");
        } finally {
            setBusy(false);
        }
    };
    const sendOtp = async () => {
        try {
            await axios.post(`${API()}/api/pos/v1/customers/send-otp`, { phone: value.customer.contactNumber });
            setOtpSent(true);
            toast.success("OTP sent to the customer's mobile.");
        } catch (e) {
            toast.error("Failed to send OTP.");
        }
    };
    const verifyOtp = async () => {
        try {
            const res = await axios.post(`${API()}/api/pos/v1/customers/verify-otp`, { phone: value.customer.contactNumber, otp: value.otp.trim() });
            if (res.data?.success) { set({ otpVerified: true }); toast.success("OTP verified."); }
            else toast.error("Invalid OTP code.");
        } catch (e) {
            toast.error("Invalid or expired OTP.");
        }
    };

    return (
        <div className="p-3 border border-dashed border-line rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-[14px] font-[500] text-fg"><Users size={16} /> Customer Loyalty</div>
            {!value.customer ? (
                <div className="flex gap-2">
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookup(); } }}
                        placeholder="Enter phone number..." className={`${field} flex-1 min-w-0`} />
                    <button type="button" onClick={lookup} disabled={busy || !phone.trim()}
                        className="px-4 bg-hover text-fg rounded-lg text-[14px] font-[500] disabled:opacity-50">{busy ? "..." : "Verify"}</button>
                </div>
            ) : (
                <div className="space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                        <span className="font-[600] text-fg">{value.customer.name}</span>
                        <span className="flex items-center gap-1 text-warning"><Coins size={12} /> {Number(value.customer.loyaltyPoints || 0).toFixed(3)}</span>
                    </div>
                    {Number(value.customer.loyaltyPoints || 0) >= 1000 ? (
                        <>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={value.redeem} onChange={(e) => set({ redeem: e.target.checked, otpVerified: false, otp: "" })} />
                                Redeem 1000 points (Rs. 1,000 off)
                            </label>
                            {value.redeem && !value.otpVerified && (
                                <div className="flex gap-2">
                                    {!otpSent ? (
                                        <button type="button" onClick={sendOtp} className="px-3 py-2 bg-brand text-on-brand rounded-lg">Send OTP</button>
                                    ) : (
                                        <>
                                            <input value={value.otp} onChange={(e) => set({ otp: e.target.value })} placeholder="OTP" className={`${field} flex-1 min-w-0`} />
                                            <button type="button" onClick={verifyOtp} className="px-3 py-2 bg-brand text-on-brand rounded-lg">Check</button>
                                        </>
                                    )}
                                </div>
                            )}
                            {value.otpVerified && <p className="text-success flex items-center gap-1"><CheckCircle size={14} /> Rs. {loyaltyRedemption(payable, value).toLocaleString()} off with points</p>}
                        </>
                    ) : (
                        <p className="text-fg-secondary">* Needs at least 1000 points to redeem.</p>
                    )}
                    <p className="text-fg-secondary">Points to earn from this bill: +{(Math.max(0, payable - loyaltyRedemption(payable, value)) / 1000).toFixed(3)}</p>
                    <button type="button" onClick={() => onChange(EMPTY_LOYALTY)} className="text-error hover:underline">Remove customer</button>
                </div>
            )}
        </div>
    );
}
