import React, { useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, X } from "lucide-react";
import { isMobile } from "../utils/eBill";

/**
 * "Pay & Send E-Bill" on a payment screen: asks for the customer's mobile number, then pays like
 * "Pay without Receipt" and the bill goes to that number as an SMS (onPay(phone) does both).
 */
export default function EBillPayButton({ onPay, disabled = false, defaultPhone = "", label = "Pay & Send E-Bill" }) {
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState(defaultPhone || "");

    const send = () => {
        if (!isMobile(phone)) {
            toast.error("Enter the customer's mobile number, e.g. 0771234567.");
            return;
        }
        onPay(phone.trim());
    };

    if (!open) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(true)}
                title="Pay, and send the bill to the customer's phone as an SMS instead of printing it"
                className="w-full py-3 border border-plum text-plum rounded-lg hover:bg-plum/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[500] flex items-center justify-center gap-2"
            >
                <MessageSquare size={16} />
                {label}
            </button>
        );
    }
    return (
        <div className="flex gap-2 w-full">
            <input
                type="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); send(); }
                    if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Customer mobile, e.g. 0771234567"
                className="flex-1 min-w-0 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
            />
            <button
                type="button"
                onClick={send}
                disabled={disabled}
                className="px-4 bg-plum-solid text-on-brand rounded-lg text-[14px] font-[500] flex items-center gap-2 disabled:opacity-50"
            >
                <MessageSquare size={16} />
                Pay &amp; Send
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cancel e-bill" className="px-3 border border-line rounded-lg text-fg-secondary hover:bg-subtle">
                <X size={16} />
            </button>
        </div>
    );
}
