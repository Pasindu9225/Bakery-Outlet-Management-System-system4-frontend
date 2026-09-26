import React from "react";
import { AlertCircle } from "lucide-react";

// The problem with one form field, shown right under it (instead of a toast at the top).
export default function FieldError({ msg, className = "" }) {
  if (!msg) return null;
  return (
    <p role="alert" className={`mt-1.5 flex items-start gap-1.5 text-[13px] text-error ${className}`}>
      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{msg}</span>
    </p>
  );
}
