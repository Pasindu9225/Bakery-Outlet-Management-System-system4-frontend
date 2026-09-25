import React from "react";
import { quickCashAmounts } from "../utils/quickCash";

// One-tap cash amounts under a "cash received" box: Exact, then the next round notes.
// Typing in the box still works; a tap just fills it.
export default function CashQuickButtons({ total, onPick, selected }) {
  const amounts = quickCashAmounts(Number(total));
  if (amounts.length === 0) return null;
  return (
    <div className="grid grid-cols-4 gap-2 mb-2">
      {amounts.map((amount, i) => {
        const active = selected !== "" && selected != null && Number(selected) === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onPick(String(amount))}
            className={`min-h-[44px] px-2 rounded-lg border text-[14px] font-[600] transition-colors ${active
              ? "border-brand-fg bg-brand/10 text-brand-fg"
              : "border-line bg-surface text-fg hover:bg-hover"}`}
          >
            {i === 0 ? "Exact" : `Rs. ${amount.toLocaleString()}`}
          </button>
        );
      })}
    </div>
  );
}
