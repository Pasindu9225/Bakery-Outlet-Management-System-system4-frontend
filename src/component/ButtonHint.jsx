import React from "react";
import { Info } from "lucide-react";

// One short line under a greyed-out button saying what to do so it can be used.
export default function ButtonHint({ show, children, className = "" }) {
  if (!show) return null;
  return (
    <p className={`mt-1.5 flex items-start gap-1.5 text-[12px] text-fg-secondary ${className}`} role="note">
      <Info size={13} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
