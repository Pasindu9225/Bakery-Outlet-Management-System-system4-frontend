import React from "react";
import { Plus, Trash2 } from "lucide-react";

/*
 * Pay one bill in parts, e.g. Rs. 5,000 = Rs. 2,000 cash + Rs. 3,000 card.
 * parts: [{ methodId, amount, reference }]. The parts must add up exactly to the total (the server checks it too);
 * change is only given on the cash part ("Cash given").
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n) => `Rs. ${round2(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Methods a bill can be split over: money only (no free meal, no credit). */
export const splitMethods = (methods) =>
    (methods || []).filter((m) => m.category !== "FREE_MEAL" && m.category !== "CREDIT");

const methodOf = (methods, id) => (methods || []).find((m) => m.paymentMethodId === Number(id));
const needsReference = (method) => method && (method.category === "CARD" || method.category === "BANK_TRANSFER");
const cashPart = (parts, methods) =>
    parts.filter((p) => methodOf(methods, p.methodId)?.category === "CASH").reduce((s, p) => s + round2(p.amount), 0);

/** A new split: the whole total on the first method, ready to be divided. */
export const startSplit = (methods, total) => {
    const list = splitMethods(methods);
    return list.length ? [{ methodId: list[0].paymentMethodId, amount: String(round2(total)), reference: "" }] : [];
};

/** Why the split cannot be paid yet, or null when it is fine. */
export const splitProblem = (parts, methods, total, cashGiven) => {
    if (parts.length < 2) return "Add at least two payment parts, or turn split payment off.";
    for (const p of parts) {
        const m = methodOf(methods, p.methodId);
        if (!m) return "Choose a payment method for every part.";
        if (!(round2(p.amount) > 0)) return "Every part needs an amount above zero.";
        if (needsReference(m) && !String(p.reference || "").trim()) return `Enter the reference for the ${m.name} part.`;
    }
    const paid = round2(parts.reduce((s, p) => s + round2(p.amount), 0));
    if (paid !== round2(total)) return `The parts add up to ${money(paid)} but the bill is ${money(total)}.`;
    const cash = cashPart(parts, methods);
    if (cash > 0 && cashGiven !== "" && round2(cashGiven) < cash) return "Cash given is less than the cash part.";
    return null;
};

/** The parts as the server expects them. */
export const splitPayload = (parts) =>
    parts.map((p) => ({ paymentMethodId: Number(p.methodId), amount: round2(p.amount), reference: String(p.reference || "").trim() || null }));

/** "Cash Rs. 2,000.00 + Card Rs. 3,000.00" for the bill and messages. */
export const splitText = (parts, methods) =>
    parts.map((p) => `${methodOf(methods, p.methodId)?.name || "?"} ${money(p.amount)}`).join(" + ");

export default function SplitPayment({ methods, total, parts, onChange, cashGiven, onCashGiven }) {
    const list = splitMethods(methods);
    const paid = round2(parts.reduce((s, p) => s + round2(p.amount), 0));
    const left = round2(total - paid);
    const cash = cashPart(parts, methods);
    const change = cashGiven !== "" && round2(cashGiven) >= cash ? round2(cashGiven - cash) : null;

    const update = (i, changes) => onChange(parts.map((p, j) => (j === i ? { ...p, ...changes } : p)));
    const add = () => {
        const used = new Set(parts.map((p) => Number(p.methodId)));
        const next = list.find((m) => !used.has(m.paymentMethodId)) || list[0];
        onChange([...parts, { methodId: next?.paymentMethodId, amount: left > 0 ? String(left) : "", reference: "" }]);
    };

    return (
        <div className="mb-6 space-y-3">
            {parts.map((p, i) => {
                const m = methodOf(methods, p.methodId);
                return (
                    <div key={i} className="p-3 border border-line rounded-lg space-y-2">
                        <div className="flex gap-2">
                            <select
                                aria-label={`Payment method ${i + 1}`}
                                value={p.methodId ?? ""}
                                onChange={(e) => update(i, { methodId: Number(e.target.value) })}
                                className="flex-1 px-3 py-2 border border-line rounded-lg text-[14px] bg-surface text-fg focus:border-brand-fg focus:outline-none"
                            >
                                {list.map((opt) => <option key={opt.paymentMethodId} value={opt.paymentMethodId}>{opt.name}</option>)}
                            </select>
                            <input
                                aria-label={`Amount ${i + 1}`}
                                type="number" min="0" step="0.01" placeholder="Amount"
                                value={p.amount}
                                onChange={(e) => update(i, { amount: e.target.value })}
                                className="w-32 px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                            />
                            <button type="button" aria-label="Remove this part" onClick={() => onChange(parts.filter((_, j) => j !== i))}
                                className="p-2 text-fg-secondary hover:text-error rounded-lg hover:bg-subtle" disabled={parts.length === 1}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {needsReference(m) && (
                            <input
                                type="text" placeholder={`${m.name} reference *`}
                                value={p.reference}
                                onChange={(e) => update(i, { reference: e.target.value })}
                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                            />
                        )}
                    </div>
                );
            })}

            <button type="button" onClick={add}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-line rounded-lg text-[13px] text-brand-fg hover:bg-subtle">
                <Plus size={14} /> Add another payment
            </button>

            <div className={`p-2 rounded-lg text-[13px] ${left === 0 ? "bg-hover text-success" : "bg-subtle text-warning"}`}>
                {left === 0 ? `Parts add up to the bill (${money(total)}).` : left > 0 ? `Still to pay: ${money(left)}` : `Over the bill by ${money(-left)}`}
            </div>

            {cash > 0 && (
                <div>
                    <label className="block text-[13px] font-[500] text-fg mb-1">Cash given (for change)</label>
                    <input
                        type="number" min="0" step="0.01" placeholder={`At least ${money(cash)}`}
                        value={cashGiven}
                        onChange={(e) => onCashGiven(e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none"
                    />
                    {change !== null && <p className="mt-1 text-[13px] text-success">Change: {money(change)}</p>}
                </div>
            )}
        </div>
    );
}
