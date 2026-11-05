import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Wallet } from "lucide-react";

// POS Cash Out: the cashier takes cash out of the drawer for safety (any number of times a day). The notes are counted,
// a Manager's code approves it, and day end expects that much less cash in the drawer.
const NOTES = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
const API = () => `${process.env.REACT_APP_BASE_URL}/api/pos/v1/cash-outs`;
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CashOutModal({ onClose }) {
    const [drawer, setDrawer] = useState(null);
    const [counts, setCounts] = useState({});
    const [managerCode, setManagerCode] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setDrawer((await axios.get(`${API()}/drawer`)).data);
        } catch (e) {
            toast.error(e.response?.data?.message || "Could not load the drawer.");
        }
    };
    useEffect(() => { load(); }, []);

    const total = NOTES.reduce((sum, n) => sum + n * (parseInt(counts[n], 10) || 0), 0);
    const inDrawer = Number(drawer?.drawerCash || 0);

    const save = async () => {
        if (total <= 0) return toast.error("Count the notes and coins taken out.");
        if (total > inDrawer) return toast.error(`Only ${rs(inDrawer)} should be in the drawer.`);
        if (!managerCode.trim()) return toast.error("A cash out needs the Manager's code.");
        setSaving(true);
        try {
            const denominations = Object.fromEntries(NOTES.filter((n) => parseInt(counts[n], 10) > 0).map((n) => [n, parseInt(counts[n], 10)]));
            await axios.post(API(), { denominations, managerCode: managerCode.trim(), note: note.trim() || null });
            toast.success(`Cash out of ${rs(total)} recorded`);
            setCounts({});
            setManagerCode("");
            setNote("");
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || "The cash out could not be saved.");
        } finally {
            setSaving(false);
        }
    };

    // rendered on the page body: the sidebar it opens from slides with a transform, which would trap a fixed popup
    return createPortal(
        <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-elevated rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-line">
                    <h3 className="text-[18px] font-[600] text-fg flex items-center gap-2"><Wallet size={20} className="text-brand-fg" /> Cash Out</h3>
                    <button aria-label="Close" onClick={onClose} className="p-1 text-fg-secondary hover:bg-subtle rounded"><X size={20} /></button>
                </div>
                {drawer && !drawer.floatOpen ? (
                    <p className="p-6 text-[14px] text-warning">Open the day's float first.</p>
                ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* notes counted */}
                    <div className="border border-line rounded-lg overflow-hidden">
                        <table className="w-full text-[14px]">
                            <thead className="bg-subtle text-[12px] uppercase text-fg-secondary">
                                <tr><th className="text-left px-3 py-2">Note / coin</th><th className="px-3 py-2">Count</th><th className="text-right px-3 py-2">Amount</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {NOTES.map((n) => (
                                    <tr key={n}>
                                        <td className="px-3 py-1.5 font-[500] text-fg">{n.toLocaleString()}</td>
                                        <td className="px-3 py-1.5">
                                            <input type="number" min="0" value={counts[n] ?? ""} placeholder="0"
                                                aria-label={`Count of ${n}`}
                                                onChange={(e) => setCounts({ ...counts, [n]: e.target.value.replace(/[^0-9]/g, "") })}
                                                className="w-24 px-2 py-1 border border-line rounded text-right focus:border-brand-fg focus:outline-none" />
                                        </td>
                                        <td className="px-3 py-1.5 text-right text-fg">{(n * (parseInt(counts[n], 10) || 0)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* drawer and approval */}
                    <div className="space-y-3">
                        <div className="p-3 bg-subtle rounded-lg space-y-1.5 text-[14px]">
                            <div className="flex justify-between"><span className="text-fg-secondary">Date</span><span className="text-fg">{new Date().toLocaleDateString()}</span></div>
                            <div className="flex justify-between"><span className="text-fg-secondary">Opening float</span><span className="text-fg">{rs(drawer?.openingFloat)}</span></div>
                            <div className="flex justify-between"><span className="text-fg-secondary">Cash outs today</span><span className="text-fg">{rs(drawer?.cashOutsTotal)}</span></div>
                            <div className="flex justify-between font-[600]"><span className="text-fg">Cash in drawer now</span><span className="text-brand-fg">{rs(inDrawer)}</span></div>
                        </div>
                        <div className="p-3 border border-brand-fg rounded-lg flex justify-between items-center">
                            <span className="text-[14px] font-[600] text-fg">Cash Out</span>
                            <span className={`text-[20px] font-[700] ${total > inDrawer ? "text-error" : "text-brand-fg"}`}>{rs(total)}</span>
                        </div>
                        <div>
                            <label className="block text-[13px] font-[500] text-fg mb-1">Note (optional)</label>
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255}
                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-[13px] font-[500] text-fg mb-1">Manager's code *</label>
                            <input type="password" value={managerCode} onChange={(e) => setManagerCode(e.target.value)} autoComplete="off"
                                onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                                className="w-full px-3 py-2 border border-line rounded-lg text-[14px] focus:border-brand-fg focus:outline-none" />
                        </div>
                        <button onClick={save} disabled={saving || total <= 0}
                            className="w-full py-3 bg-brand text-on-brand rounded-lg font-[600] hover:bg-brand-hover disabled:opacity-50">
                            {saving ? "Saving..." : "Confirm Cash Out"}
                        </button>
                    </div>
                    {/* today's cash outs */}
                    <div className="md:col-span-2">
                        <h4 className="text-[14px] font-[600] text-fg mb-2">Today's cash outs</h4>
                        {(drawer?.cashOuts || []).length === 0 ? (
                            <p className="text-[13px] text-fg-secondary">None yet.</p>
                        ) : (
                            <table className="w-full text-[13px]">
                                <thead className="text-fg-secondary text-left"><tr><th className="py-1">Time</th><th>Amount</th><th>Approved by</th><th>Note</th></tr></thead>
                                <tbody className="divide-y divide-line">
                                    {drawer.cashOuts.map((c) => (
                                        <tr key={c.id}>
                                            <td className="py-1">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</td>
                                            <td className="font-[600]">{rs(c.amount)}</td>
                                            <td>{c.approvedBy}</td>
                                            <td className="text-fg-secondary">{c.note || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>,
        document.body
    );
}
