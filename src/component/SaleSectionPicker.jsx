/** Club or Outlet: every bill is for one of them (owner 17 Nov). Two tick boxes; ticking one clears the other. */
export const sectionLabel = (v) => (v === "CLUB" ? "Club" : v === "OUTLET" ? "Outlet" : "");

export default function SaleSectionPicker({ value, onChange, className = "" }) {
  return (
    <div className={`flex items-center flex-wrap gap-x-4 gap-y-1 ${className}`} role="group" aria-label="Bill for">
      <span className="text-[13px] font-[600] text-fg-secondary">Bill for:</span>
      {[["CLUB", "Club"], ["OUTLET", "Outlet"]].map(([v, label]) => (
        <label key={v} className="flex items-center gap-1.5 text-[14px] font-[500] text-fg cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={value === v}
            onChange={(e) => onChange(e.target.checked ? v : "")} />
          {label}
        </label>
      ))}
      {!value && <span className="text-[12px] text-warning">Tick one</span>}
    </div>
  );
}
