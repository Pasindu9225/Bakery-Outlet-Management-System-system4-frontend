import React from "react";

// Uber / PickMe marks for payment buttons and day-end totals.
// ponytail: drawn as brand-coloured name badges; swap in the official logo images when the client supplies them
const APPS = {
    UBER: { label: "Uber", background: "#000000", color: "#ffffff" },
    PICKME: { label: "PickMe", background: "#ffcb05", color: "#1a1a1a" },
};

/** "UBER" / "PICKME" for a payment method name such as "Uber Eats" or "Pick Me", else null. */
export function deliveryAppOf(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("uber")) return "UBER";
    if (n.includes("pickme") || n.includes("pick me") || n.includes("picme")) return "PICKME";
    return null;
}

export function DeliveryAppLogo({ app, size = 16 }) {
    const a = APPS[app];
    if (!a) return null;
    return (
        <span
            aria-hidden="true"
            style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                height: Math.round(size * 1.25), padding: `0 ${Math.round(size * 0.35)}px`,
                borderRadius: Math.round(size * 0.3), background: a.background, color: a.color,
                fontSize: Math.round(size * 0.7), fontWeight: 700, lineHeight: 1, letterSpacing: 0.2,
                fontFamily: "Arial, Helvetica, sans-serif", flexShrink: 0,
            }}
        >
            {a.label}
        </span>
    );
}
