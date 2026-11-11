import React, { useEffect, useState } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import CashFloatPopup from "./CashFloatPopup.jsx";

/**
 * The day starts with the opening cash float: if this cashier has not declared one today, ask for it.
 * Shown from the POS menu, so it opens on whichever POS page the cashier lands (it was on the POS Dashboard,
 * which is hidden since 11 Nov). After it is saved the page reloads, so the screen picks up the open shift.
 */
export default function OpeningFloatGate() {
    const [open, setOpen] = useState(false);
    const cashierInfo = {
        id: localStorage.getItem("userId") || "",
        name: [localStorage.getItem("firstName"), localStorage.getItem("lastName")].filter(Boolean).join(" ") || localStorage.getItem("userName") || "",
    };

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("authToken");
        if (!userId || !token) return;
        axios.get(`${process.env.REACT_APP_BASE_URL || ""}/api/pos/v1/cash-float/status?cashierId=${userId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => { if (res.data && res.data.opened === false && !res.data.closed) setOpen(true); })
            .catch((err) => console.error("Failed to check cash float status:", err));
    }, []);

    // on document.body: the POS menu is a moved (translate) box, which would trap a fixed popup inside it
    if (!open) return null;
    return createPortal(<CashFloatPopup isOpen={open} onConfirm={() => { setOpen(false); window.location.reload(); }} cashierInfo={cashierInfo} />, document.body);
}
