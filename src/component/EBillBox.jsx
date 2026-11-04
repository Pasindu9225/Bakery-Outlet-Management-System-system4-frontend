import React, { useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare } from "lucide-react";
import { isMobile, sendEBill } from "../utils/eBill";

/** Phone number + "Send E-Bill": sends a finished bill to the customer as an SMS (instead of printing it). */
export default function EBillBox({ bill, defaultPhone = "", onSent }) {
    const [phone, setPhone] = useState(defaultPhone || "");
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (!isMobile(phone)) {
            toast.error("Enter a mobile number like 0771234567.");
            return;
        }
        setSending(true);
        try {
            toast.success(await sendEBill(phone, bill));
            onSent && onSent();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-3 border border-dashed border-line rounded-lg mb-4">
            <label className="block text-[13px] font-[500] text-fg mb-2">E-Bill (send the bill as an SMS)</label>
            <div className="flex gap-2">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
                    placeholder="Customer mobile, e.g. 0771234567"
                    className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                />
                <button
                    type="button"
                    onClick={send}
                    disabled={sending}
                    className="px-4 py-2 bg-plum-solid text-on-brand rounded-lg text-[14px] font-[500] flex items-center gap-2 disabled:opacity-50"
                >
                    <MessageSquare size={16} />
                    {sending ? "Sending..." : "Send E-Bill"}
                </button>
            </div>
        </div>
    );
}
