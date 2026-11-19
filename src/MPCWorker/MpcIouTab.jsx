import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Wallet, CheckCircle2, PackageCheck } from "lucide-react";
import toast from "react-hot-toast";
import ProductPicker from "../component/ProductPicker.jsx";
import { friendlyError } from "../utils/friendlyError";
import { getApiBaseUrl } from "../utils/config";

// MPC IOU (owner 19 Nov): mode "create" = set an IOU (no approval); mode "grn" = GRN an open IOU into the MPC store.
const BASE_URL = getApiBaseUrl();
const money = (n) => `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const emptyLine = () => ({ material: null, qty: "", price: "" });

export default function MpcIouTab({ mode, onReceived }) {
  const token = localStorage.getItem("authToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const [ious, setIous] = useState([]);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [lines, setLines] = useState([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [grn, setGrn] = useState({});   // iouId -> { supplierName, invoiceNumber, items: { itemId: {qty, price, expiryDate} } }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-ious`, { headers });
      setIous(res.ok ? await res.json() : []);
    } catch {
      setIous([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (mode !== "create") return;
    fetch(`${BASE_URL}/api/v1/worker/mpc-material-requests/raw-materials`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setMaterials((Array.isArray(list) ? list : []).map((m) => ({
        ...m, id: m.rawMaterialId, productName: m.rawMaterialName, productCode: m.unitOfMeasure || "",
      }))))
      .catch(() => setMaterials([]));
  }, [mode, token]);

  const setLine = (i, patch) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const estimate = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  const saveIou = async () => {
    const filled = lines.filter((l) => l.material);
    if (filled.length === 0) return toast.error("Choose at least one material.");
    const bad = filled.find((l) => !(Number(l.qty) > 0));
    if (bad) return toast.error(`Enter the qty of ${bad.material.productName}.`);
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-ious`, {
        method: "POST", headers,
        body: JSON.stringify({ notes, items: filled.map((l) => ({ rawMaterialId: l.material.id, qty: Number(l.qty), price: Number(l.price) || 0 })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(friendlyError(data, { fallback: "Could not save the IOU." }));
      toast.success(`${data.iouCode} saved. GRN it in IOU GRN when the goods come.`);
      setLines([emptyLine()]);
      setNotes("");
      load();
    } catch (err) {
      toast.error(friendlyError(err, "Could not save the IOU."));
    } finally {
      setSaving(false);
    }
  };

  const grnOf = (iou) => grn[iou.id] || {
    supplierName: "", invoiceNumber: "",
    items: Object.fromEntries(iou.items.map((it) => [it.id, { qty: it.estimatedQty ?? "", price: it.estimatedPrice ?? "", expiryDate: "" }])),
  };
  const setGrnField = (iou, patch) => setGrn((prev) => ({ ...prev, [iou.id]: { ...grnOf(iou), ...patch } }));
  const setGrnItem = (iou, itemId, patch) => {
    const g = grnOf(iou);
    setGrnField(iou, { items: { ...g.items, [itemId]: { ...g.items[itemId], ...patch } } });
  };

  const receive = async (iou) => {
    const g = grnOf(iou);
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/worker/mpc-ious/${iou.id}/receive`, {
        method: "PUT", headers,
        body: JSON.stringify({
          supplierName: g.supplierName, invoiceNumber: g.invoiceNumber,
          items: iou.items.map((it) => ({
            itemId: it.id, qty: Number(g.items[it.id].qty) || 0, price: Number(g.items[it.id].price) || 0,
            expiryDate: g.items[it.id].expiryDate || null,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(friendlyError(data, { fallback: "Could not GRN the IOU." }));
      toast.success(`${data.iouCode} received into the MPC store.`);
      load();
      onReceived?.();
    } catch (err) {
      toast.error(friendlyError(err, "Could not GRN the IOU."));
    } finally {
      setSaving(false);
    }
  };

  const open = ious.filter((i) => i.status === "OPEN");
  const shown = mode === "grn" ? open : ious;

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
          <h3 className="text-[18px] font-[600] text-fg mb-1">Set an IOU</h3>
          <p className="text-[13px] text-fg-secondary mb-4">Materials to buy with cash. No approval needed. GRN them in IOU GRN when they come.</p>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_40px] gap-2 items-start">
                <ProductPicker products={materials} selected={l.material} onPick={(m) => setLine(i, { material: m })}
                  placeholder="Search raw material" />
                <input type="number" min="0" step="any" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })}
                  placeholder={l.material?.unitOfMeasure ? `Qty (${l.material.unitOfMeasure})` : "Qty"} aria-label="Qty"
                  className="px-3 py-2 border border-line rounded-lg" />
                <input type="number" min="0" step="any" value={l.price} onChange={(e) => setLine(i, { price: e.target.value })}
                  placeholder="Price / unit (Rs.)" aria-label="Estimated price per unit"
                  className="px-3 py-2 border border-line rounded-lg" />
                <button type="button" onClick={() => setLines((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : [emptyLine()]))}
                  aria-label="Remove line" className="h-10 flex items-center justify-center rounded-lg text-fg-secondary hover:bg-hover">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((p) => [...p, emptyLine()])}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-[600] text-brand-fg">
            <Plus size={15} /> Add material
          </button>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (optional)"
            className="mt-4 w-full px-3 py-2 border border-line rounded-lg" />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[14px] text-fg-secondary">Estimated: <strong className="text-fg">{money(estimate)}</strong></span>
            <button type="button" onClick={saveIou} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-[600] disabled:opacity-50">
              <Wallet size={16} /> Save IOU
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-[600] text-fg">{mode === "grn" ? "IOUs waiting for GRN" : "My IOUs"}</h3>
          <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 border border-line text-fg-secondary text-[13px] rounded-lg hover:bg-subtle">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        {shown.length === 0 ? (
          <p className="text-center py-10 text-[14px] text-fg-secondary">{mode === "grn" ? "No IOU is waiting for GRN." : "No IOUs yet."}</p>
        ) : (
          <div className="space-y-4">
            {shown.map((iou) => {
              const g = grnOf(iou);
              const grnTotal = iou.items.reduce((s, it) => s + (Number(g.items[it.id]?.qty) || 0) * (Number(g.items[it.id]?.price) || 0), 0);
              return (
                <div key={iou.id} className="border border-line rounded-lg p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-[16px] font-[600] text-fg">{iou.iouCode}</h4>
                      <p className="text-[12px] text-fg-secondary mt-0.5">
                        {iou.createdAt ? new Date(iou.createdAt).toLocaleString() : ""} · {iou.createdByName}{iou.notes ? ` · ${iou.notes}` : ""}
                      </p>
                    </div>
                    {iou.status === "OPEN" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning">Waiting for GRN</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Received {iou.receivedAt ? new Date(iou.receivedAt).toLocaleDateString() : ""}
                      </span>
                    )}
                  </div>

                  {mode === "grn" ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] min-w-[620px]">
                          <thead>
                            <tr className="border-b border-line text-left text-fg-secondary">
                              <th className="py-2">Material</th>
                              <th className="py-2">IOU qty</th>
                              <th className="py-2">Received qty</th>
                              <th className="py-2">Price / unit (Rs.)</th>
                              <th className="py-2">Expiry</th>
                            </tr>
                          </thead>
                          <tbody>
                            {iou.items.map((it) => (
                              <tr key={it.id} className="border-b border-line last:border-0">
                                <td className="py-2 font-[500] text-fg">{it.rawMaterialName}</td>
                                <td className="py-2 text-fg-secondary">{it.estimatedQty} {it.unitOfMeasure}</td>
                                <td className="py-2 pr-2">
                                  <input type="number" min="0" step="any" value={g.items[it.id].qty} aria-label={`Received qty of ${it.rawMaterialName}`}
                                    onChange={(e) => setGrnItem(iou, it.id, { qty: e.target.value })} className="w-24 px-2 py-1.5 border border-line rounded-lg" />
                                </td>
                                <td className="py-2 pr-2">
                                  <input type="number" min="0" step="any" value={g.items[it.id].price} aria-label={`Price of ${it.rawMaterialName}`}
                                    onChange={(e) => setGrnItem(iou, it.id, { price: e.target.value })} className="w-28 px-2 py-1.5 border border-line rounded-lg" />
                                </td>
                                <td className="py-2">
                                  <input type="date" value={g.items[it.id].expiryDate} aria-label={`Expiry of ${it.rawMaterialName}`}
                                    onChange={(e) => setGrnItem(iou, it.id, { expiryDate: e.target.value })} className="px-2 py-1.5 border border-line rounded-lg" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[12px] text-fg-secondary mt-2">Not bought? Enter 0 as the received qty.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <input value={g.supplierName} onChange={(e) => setGrnField(iou, { supplierName: e.target.value })}
                          placeholder="Bought from (optional)" className="px-3 py-2 border border-line rounded-lg" />
                        <input value={g.invoiceNumber} onChange={(e) => setGrnField(iou, { invoiceNumber: e.target.value })}
                          placeholder="Bill / invoice no. (optional)" className="px-3 py-2 border border-line rounded-lg" />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[14px] text-fg-secondary">Total: <strong className="text-fg">{money(grnTotal)}</strong></span>
                        <button type="button" onClick={() => receive(iou)} disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-[600] disabled:opacity-50">
                          <PackageCheck size={16} /> GRN into MPC store
                        </button>
                      </div>
                    </>
                  ) : (
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-line text-left text-fg-secondary">
                          <th className="py-2">Material</th>
                          <th className="py-2 text-right">IOU qty</th>
                          <th className="py-2 text-right">Received</th>
                          <th className="py-2 text-right">Price (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iou.items.map((it) => (
                          <tr key={it.id} className="border-b border-line last:border-0">
                            <td className="py-2 font-[500] text-fg">{it.rawMaterialName}</td>
                            <td className="py-2 text-right">{it.estimatedQty} {it.unitOfMeasure}</td>
                            <td className="py-2 text-right">{it.actualQty != null ? `${it.actualQty} ${it.unitOfMeasure || ""}` : "—"}</td>
                            <td className="py-2 text-right">{it.actualPrice ?? it.estimatedPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="pt-2 text-right text-fg-secondary">
                            Estimated {money(iou.totalEstimated)}{iou.totalActual != null ? ` · Spent ${money(iou.totalActual)}` : ""}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
