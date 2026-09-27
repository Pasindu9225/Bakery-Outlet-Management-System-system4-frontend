import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

/**
 * Landing page for an account whose role has no module dashboard (it used to show a demo chart with made-up numbers).
 */
export default function MainDashboard() {
  const name = [localStorage.getItem("firstName"), localStorage.getItem("lastName")].filter(Boolean).join(" ") || localStorage.getItem("userName") || "";
  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <div className="bg-surface border border-line rounded-xl shadow-sm p-8 max-w-md text-center">
        <LayoutDashboard className="mx-auto mb-3 text-fg-muted" size={36} />
        <h1 className="text-[18px] font-[600] text-fg mb-1">No dashboard for this account</h1>
        <p className="text-[14px] text-fg-secondary mb-5">
          {name ? `${name}, your` : "Your"} account's role does not have a module in this system. Please contact the administrator.
        </p>
        <NavLink to="/profile" className="inline-block px-4 py-2 bg-brand text-on-brand rounded-lg text-[13px] font-[500] hover:bg-brand-hover">My profile</NavLink>
      </div>
    </div>
  );
}
