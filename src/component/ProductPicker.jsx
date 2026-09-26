import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { filterProducts } from "../utils/productSearch";

// Type part of a product name or code, then tap it. Replaces typing the ID, name and code by hand.
export default function ProductPicker({ products, selected, onPick, disabled, placeholder = "Search product by name or code" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = filterProducts(products, query);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 border border-brand-fg/40 bg-brand/5 rounded-lg">
        <span className="min-w-0 text-[14px] text-fg">
          <span className="font-[600]">{selected.productName}</span>
          <span className="text-fg-secondary"> · {selected.productCode}</span>
        </span>
        {!disabled && (
          <button type="button" onClick={() => { onPick(null); setQuery(""); }}
            aria-label="Choose a different product"
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md text-fg-secondary hover:bg-hover">
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  const pick = (p) => { onPick(p); setOpen(false); setQuery(""); };
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) { e.preventDefault(); pick(matches[0]); } }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand-fg focus:border-brand-fg"
      />
      {open && !disabled && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-elevated border border-line rounded-lg shadow-elevated">
          {matches.length === 0 ? (
            <li className="px-3 py-3 text-[13px] text-fg-secondary">No product matches "{query}".</li>
          ) : matches.map((p) => (
            <li key={p.id} role="option" aria-selected="false">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-hover">
                <span className="block text-[14px] font-[500] text-fg">{p.productName}</span>
                <span className="block text-[12px] text-fg-secondary">{p.productCode}{p.categoryName ? ` · ${p.categoryName}` : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
