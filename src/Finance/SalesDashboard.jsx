import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../services/api";
import { TrendChart, BarChart } from "../component/dashboard/DashboardKit";

/*
 * Sales Dashboard (client sample "System MIS", 16 Nov). The server sends every sold line (day, time, bill, product,
 * category, channel, qty, value less returns); this page groups them:
 *  - Daily Sales: each day vs the same day a month before
 *  - Monthly Average Sales: sales per day of each month vs the month before
 *  - Weekly Sale & Time Line: every chosen weekday vs the same weekday 4 weeks before
 *  - Product / Category Wise: the chosen dates vs the same dates a month (or 4 weeks) before
 *  - PickMe / UberEats / Dine-In / TakeAway: like Total, that channel only
 * and "Sales by time of day" shows each minute of the To date between the two times.
 */

const DAY = 864e5;
const dn = (s) => Math.floor(Date.parse(s) / DAY);
const ds = (d) => new Date(d * DAY).toISOString().slice(0, 10);
const weekday = (d) => new Date(d * DAY).getUTCDay();
/** same day one month before (31 Mar -> 28/29 Feb) */
const monthBack = (d) => {
  const x = new Date(d * DAY), y = x.getUTCFullYear(), m = x.getUTCMonth();
  return Date.UTC(y, m - 1, Math.min(x.getUTCDate(), new Date(Date.UTC(y, m, 0)).getUTCDate())) / DAY;
};
const monthStart = (d) => { const x = new Date(d * DAY); return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), 1) / DAY; };
const monthEnd = (d) => { const x = new Date(d * DAY); return Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0) / DAY; };
const today = () => new Date().toLocaleDateString("en-CA");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CHANNELS = { pickme: "PickMe Sales", uber: "UberEats Sales", dine: "Dine-In Sales", take: "TakeAway Sales" };
const fmt = (n) => Math.round(n).toLocaleString("en-LK");

const inputCls = "px-2.5 py-1.5 border border-line rounded-md text-[13px] bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand-fg";

function Field({ label, children }) {
  return <label className="flex flex-col gap-1 text-[12px] text-fg-secondary">{label}{children}</label>;
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map(([text, v]) => <option key={v} value={v}>{text}</option>)}
    </select>
  );
}
function Seg({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden">
      {options.map(([text, v]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-[13px] ${value === v ? "bg-brand text-on-brand" : "bg-surface text-fg hover:bg-subtle"}`}>{text}</button>
      ))}
    </div>
  );
}
function Card({ title, children, className = "" }) {
  return (
    <section className={`bg-surface border border-line rounded-lg p-4 min-w-0 ${className}`}>
      {title && <h3 className="text-[15px] font-[600] text-fg mb-3">{title}</h3>}
      {children}
    </section>
  );
}
const Up = ({ d }) => (d === 0 ? null : <span className={d > 0 ? "text-success" : "text-error"}>{d > 0 ? "▲" : "▼"}</span>);

export default function SalesDashboard() {
  const [f, setF] = useState(() => {
    const to = today();
    return { m: "daily", wd: String(new Date().getDay()), g: "total", from: ds(dn(to) - 30), to, t0: "09:00", t1: "10:00", u: "val", vt: "amount", outlet: "", section: "" };
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const [outlets, setOutlets] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/v1/admin/outlet/all").then((r) => setOutlets(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // enough days before From for every comparison (a month before, 4 weeks before, the month before From's month)
  const fetchFrom = useMemo(() => {
    const d0 = dn(f.from);
    return isNaN(d0) ? null : ds(Math.min(monthStart(monthBack(d0)), d0 - 28));
  }, [f.from]);

  useEffect(() => {
    if (!fetchFrom || !f.to) return;
    let gone = false;
    setLoading(true); setError("");
    axiosInstance.get("/api/v1/finance/reports/sales-dashboard", { params: { from: fetchFrom, to: f.to, outlet: f.outlet || undefined, section: f.section || undefined } })
      .then((r) => { if (!gone) setLines((r.data || []).map((l) => ({ ...l, day: dn(String(l.d).slice(0, 10)), q: Number(l.q) || 0, v: Number(l.v) || 0 }))); })
      .catch((e) => { if (!gone) setError(e.response?.data?.message || "Could not load the sales."); })
      .finally(() => { if (!gone) setLoading(false); });
    return () => { gone = true; };
  }, [fetchFrom, f.to, f.outlet, f.section]);

  const byDay = useMemo(() => {
    const m = new Map();
    lines.forEach((l) => { if (!m.has(l.day)) m.set(l.day, []); m.get(l.day).push(l); });
    return m;
  }, [lines]);

  const q = f.u === "qty", pct = f.vt === "percentage";
  const d0 = dn(f.from), d1 = Math.max(dn(f.to), d0);
  const valid = !isNaN(d0) && !isNaN(d1);

  const rows = useMemo(() => {
    if (!valid) return [];
    const channel = CHANNELS[f.g] ? f.g : null;
    const val = (l) => (q ? l.q : l.v);
    const key = f.g === "product" ? (l) => l.p : f.g === "category" ? (l) => l.c : () => "";
    /** totals per key over days a..b (weekly: only the chosen weekday); average per day for Monthly Average */
    const sum = (a, b) => {
      const out = new Map(); let n = 0;
      for (let d = a; d <= b; d++) {
        if (f.m === "weekly" && weekday(d) !== +f.wd) continue;
        n++;
        (byDay.get(d) || []).forEach((l) => { if (!channel || l.ch === channel) out.set(key(l), (out.get(key(l)) || 0) + val(l)); });
      }
      if (f.m === "avg") out.forEach((v, k) => out.set(k, n ? v / n : 0));
      return out;
    };
    const shift = (d) => (f.m === "weekly" ? d - 28 : monthBack(d));
    const one = (a, b) => sum(a, b).get("") || 0;
    const out = [];
    if (f.g === "product" || f.g === "category") {
      const cur = sum(d0, d1), prev = sum(shift(d0), shift(d1));
      new Set([...cur.keys(), ...prev.keys()]).forEach((k) => out.push({ l: k, cur: cur.get(k) || 0, prev: prev.get(k) || 0 }));
      out.sort((a, b) => b.cur - a.cur || b.prev - a.prev);
    } else if (f.m === "avg") {
      for (let c = d0; c <= d1 && out.length < 60; c = monthEnd(c) + 1) {
        const a = monthStart(c), b = monthEnd(c), pa = monthStart(a - 1);
        out.push({ l: ds(a).slice(0, 7), cur: one(Math.max(a, d0), Math.min(b, d1)), prev: one(pa, a - 1) });
      }
    } else {
      for (let d = d0; d <= d1 && out.length < 400; d++) {
        if (f.m === "weekly" && weekday(d) !== +f.wd) continue;
        out.push({ l: ds(d), cur: one(d, d), prev: one(shift(d), shift(d)) });
      }
    }
    return out;
  }, [byDay, f.g, f.m, f.wd, q, d0, d1, valid]);

  // sales by time of day: each minute of the To date between the two times (at most 6 hours)
  const time = useMemo(() => {
    if (!valid) return null;
    const toMin = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + m; };
    const a = toMin(f.t0), b = Math.min(Math.max(toMin(f.t1), a + 1), a + 360);
    const channel = CHANNELS[f.g] ? f.g : null;
    const R = [];
    for (let t = a; t < b; t++) R.push({ l: `${String((t / 60) | 0).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, bills: new Set(), q: 0, v: 0 });
    (byDay.get(dn(f.to)) || []).forEach((l) => {
      if (channel && l.ch !== channel) return;
      const r = R[toMin(l.t) - a];
      if (r) { r.bills.add(l.b); r.q += l.q; r.v += l.v; }
    });
    const list = R.map((r) => ({ ...r, bills: r.bills.size }));
    const total = (k) => list.reduce((x, r) => x + r[k], 0);
    const peak = list.reduce((x, r) => (r.bills > x.bills ? r : x), list[0] || { bills: 0, l: "—" });
    return { list, bills: total("bills"), q: total("q"), v: total("v"), peak, busy: list.filter((r) => r.bills >= 3).length };
  }, [byDay, f.to, f.t0, f.t1, f.g, valid]);

  const nf = (v) => (q ? fmt(v) : `Rs. ${fmt(v)}`);
  const vn = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${nf(Math.abs(v))}`;
  const first = f.g === "product" ? "Product" : f.g === "category" ? "Category" : f.m === "avg" ? "Month" : "Date";
  const title = { daily: "Daily sales", avg: "Monthly average sales (per day)", weekly: `Weekly sales – every ${DAYS[+f.wd]}` }[f.m]
    + (CHANNELS[f.g] ? ` · ${CHANNELS[f.g]}` : "");
  const prevLabel = f.m === "weekly" && f.g !== "product" && f.g !== "category" ? "4 weeks before" : "Previous Month";
  const groupRows = f.g === "product" || f.g === "category";
  const chartRows = groupRows ? rows.slice(0, 24) : rows;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-lg p-3 flex flex-wrap items-end gap-x-4 gap-y-3">
        <Field label="Primary metric">
          <Select value={f.m} onChange={set("m")} options={[["Daily Sales", "daily"], ["Monthly Average Sales", "avg"], ["Weekly Sale & Time Line", "weekly"]]} />
        </Field>
        {f.m === "weekly" && <Field label="Day of week"><Select value={f.wd} onChange={set("wd")} options={DAYS.map((d, i) => [d, String(i)])} /></Field>}
        <Field label="Grouping">
          <Select value={f.g} onChange={set("g")} options={[["Total Sale Wise", "total"], ["Product Wise", "product"], ["Category Wise", "category"],
            ...Object.entries(CHANNELS).map(([k, v]) => [v, k])]} />
        </Field>
        {outlets.length > 1 && (
          <Field label="Outlet">
            <Select value={f.outlet} onChange={set("outlet")} options={[["All outlets", ""], ...outlets.map((o) => [o.name, String(o.outletId ?? o.id)])]} />
          </Field>
        )}
        {/* Club / Outlet of the bills (owner 18 Nov) */}
        <Field label="Club / Outlet">
          <Select value={f.section || ""} onChange={set("section")} options={[["Club and Outlet", ""], ["Club", "CLUB"], ["Outlet", "OUTLET"]]} />
        </Field>
        <Field label="From"><input type="date" value={f.from} max={f.to} onChange={(e) => set("from")(e.target.value)} className={inputCls} /></Field>
        <Field label="To"><input type="date" value={f.to} onChange={(e) => set("to")(e.target.value)} className={inputCls} /></Field>
        <Field label="Time from"><input type="time" value={f.t0} onChange={(e) => set("t0")(e.target.value)} className={inputCls} /></Field>
        <Field label="Time to"><input type="time" value={f.t1} onChange={(e) => set("t1")(e.target.value)} className={inputCls} /></Field>
        <Field label="Show"><Seg value={f.u} onChange={set("u")} options={[["Quantity", "qty"], ["Value", "val"]]} /></Field>
        <Field label="Value type"><Seg value={f.vt} onChange={set("vt")} options={[["Percentage", "percentage"], ["Amount", "amount"]]} /></Field>
        {loading && <span className="text-[12px] text-fg-muted pb-2">Loading…</span>}
      </div>

      {error && <div className="p-3 rounded-lg border border-error/40 bg-error/10 text-error text-[13px]">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[5fr_6fr] gap-4 items-start">
        <Card title={title}>
          <div className="overflow-auto max-h-[440px]">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-fg-secondary text-[12px] border-b border-line">
                  <th className="text-left font-[600] py-2 px-2">No.</th>
                  <th className="text-left font-[600] py-2 px-2">{first}</th>
                  <th className="text-right font-[600] py-2 px-2">{q ? "Quantity" : "Sales"}</th>
                  <th className="text-right font-[600] py-2 px-2">{prevLabel}</th>
                  <th className="text-right font-[600] py-2 px-2">Variance</th>
                  {pct && <th className="text-right font-[600] py-2 px-2">Percentage Variance</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const d = r.cur - r.prev;
                  return (
                    <tr key={r.l + i} className="border-b border-line text-fg">
                      <td className="py-1.5 px-2">{i + 1}</td>
                      <td className="py-1.5 px-2 whitespace-nowrap">{r.l}</td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">{nf(r.cur)}</td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">{nf(r.prev)}</td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">{vn(d)}</td>
                      {pct && <td className="py-1.5 px-2 text-right whitespace-nowrap"><Up d={d} /> {r.prev ? `${Math.abs(d / r.prev * 100).toFixed(1)}%` : "–"}</td>}
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={6} className="py-8 text-center text-fg-muted">{loading ? "Loading…" : "No sales match this selection."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={`${valid ? `${ds(d0)} to ${ds(d1)}` : ""} vs ${prevLabel.toLowerCase()}`}>
          <TrendChart height={320} money={!q} bar={f.m === "avg" || groupRows}
            labels={chartRows.map((r) => (r.l.length === 10 ? r.l.slice(5) : r.l))}
            current={chartRows.map((r) => Math.round(r.cur))} previous={chartRows.map((r) => Math.round(r.prev))}
            currentLabel="Selected dates" previousLabel={prevLabel} />
          {groupRows && rows.length > 24 && <p className="text-[12px] text-fg-muted mt-2">Top 24 of {rows.length} shown in the chart; the table has them all.</p>}
        </Card>
      </div>

      {time && (
        <Card title="Sales by time of day">
          <p className="text-[13px] text-fg-secondary mb-3">Showing {f.to} from {f.t0} to {f.t1}{CHANNELS[f.g] ? ` (${CHANNELS[f.g]})` : ""}. Change the To date or the times above.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[["Bills in range", fmt(time.bills)], ["Quantity", fmt(time.q)], ["Value", `Rs. ${fmt(time.v)}`],
              ["Busiest minute", time.peak.bills ? `${time.peak.l} (${time.peak.bills} bills)` : "—"], ["Minutes with 3+ bills", `${time.busy} of ${time.list.length}`]]
              .map(([k, v]) => (
                <div key={k} className="rounded-lg bg-subtle px-3 py-2.5">
                  <p className="text-[12px] text-fg-secondary">{k}</p>
                  <p className="text-[18px] font-[700] text-fg">{v}</p>
                </div>
              ))}
          </div>
          <BarChart money={false} height={220} labels={time.list.map((r) => r.l)} values={time.list.map((r) => r.bills)} />
          <div className="overflow-auto max-h-[300px] mt-3">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-fg-secondary text-[12px] border-b border-line">
                  <th className="text-left font-[600] py-2 px-2">Time</th><th className="text-right font-[600] py-2 px-2">Bills</th>
                  <th className="text-right font-[600] py-2 px-2">Quantity</th><th className="text-right font-[600] py-2 px-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {time.list.map((r) => (
                  <tr key={r.l} className="border-b border-line text-fg">
                    <td className="py-1.5 px-2">{r.l}</td><td className="py-1.5 px-2 text-right">{r.bills}</td>
                    <td className="py-1.5 px-2 text-right">{fmt(r.q)}</td><td className="py-1.5 px-2 text-right">Rs. {fmt(r.v)}</td>
                  </tr>
                ))}
                              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
