import React, { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isSidebarCollapsed, toggleSidebar } from "../utils/sidebarPref";

// Collapse / expand the side menu (tablet and desktop; phones use the slide-in menu).
export default function SidebarCollapseButton() {
  const [collapsed, setCollapsed] = useState(isSidebarCollapsed());
  return (
    <div className="sb-pad px-4 pt-3 border-t border-line">
      <button
        type="button"
        onClick={() => setCollapsed(toggleSidebar())}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        title={collapsed ? "Expand menu" : "Collapse menu"}
        className="sb-center hidden md:flex w-full items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-fg-secondary hover:bg-hover hover:text-fg"
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        <span className="sb-hide">Collapse menu</span>
      </button>
    </div>
  );
}
