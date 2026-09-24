import React from "react";

// Goods are usable up to and including their expiry date (same rule as the backend ExpiryRules).
export const daysUntil = (expiryDate) => {
  if (!expiryDate) return null;
  const [y, m, d] = String(expiryDate).slice(0, 10).split("-").map(Number);
  const expiry = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / 86400000);
};

export const expiryStatus = (expiryDate, warnDays = 3) => {
  const left = daysUntil(expiryDate);
  if (left === null) return "NO_DATE";
  if (left < 0) return "EXPIRED";
  if (left <= warnDays) return "EXPIRING";
  return "OK";
};

export const isExpired = (expiryDate) => expiryStatus(expiryDate) === "EXPIRED";

const STYLES = {
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
  EXPIRING: "bg-amber-50 text-amber-700 border-amber-200",
  OK: "bg-green-50 text-green-700 border-green-200",
  NO_DATE: "bg-gray-50 text-gray-500 border-gray-200",
};

const label = (left) => {
  if (left === null) return "No expiry date";
  if (left < -1) return `Expired ${-left} days ago`;
  if (left === -1) return "Expired yesterday";
  if (left === 0) return "Expires today";
  if (left === 1) return "1 day left";
  return `${left} days left`;
};

/** Red / amber / green tag showing how long until a stock item expires. */
export default function ExpiryTag({ expiryDate, warnDays = 3, showDate = false, className = "" }) {
  const left = daysUntil(expiryDate);
  const status = expiryStatus(expiryDate, warnDays);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-[600] whitespace-nowrap ${STYLES[status]} ${className}`}
      title={expiryDate ? `Expiry date ${String(expiryDate).slice(0, 10)}` : "No expiry date recorded"}
    >
      {status === "EXPIRED" && <span aria-hidden="true">●</span>}
      {label(left)}
      {showDate && expiryDate ? ` · ${String(expiryDate).slice(0, 10)}` : ""}
    </span>
  );
}
