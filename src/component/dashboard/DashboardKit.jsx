import React, { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Inbox, RefreshCw } from "lucide-react";
import axiosInstance from "../../services/api";
import Skeleton from "../Skeleton";
import { friendlyError } from "../../utils/friendlyError";
import { pollWhileVisible } from "../../utils/poll";
import { themeColor } from "../../utils/themeColors";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

/*
 * Building blocks for the role dashboards. Everything shown comes from the dashboard APIs; while loading a skeleton is
 * shown, on failure an error with Retry, and when there is nothing to show an empty state - never sample numbers.
 */

// ------------------------------------------------------------------ formatting

/** Rs. 12,345.00 */
export const rs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** 12,345 (up to 2 decimals for quantities such as 0.5 kg) */
export const num = (n) => Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 });

export const label = (code) =>
  String(code || "").split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");

export const dateTime = (v) => (v ? new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "");
export const dateOnly = (v) => (v ? new Date(String(v).length === 10 ? `${v}T00:00` : v).toLocaleDateString([], { dateStyle: "medium" }) : "");
export const timeOnly = (v) => (v ? String(v).slice(0, 5) : "");

/** % change from previous to current; null when there is nothing to compare with. */
export const change = (current, previous) => {
  const c = Number(current || 0), p = Number(previous || 0);
  if (!p) return null;
  return ((c - p) / Math.abs(p)) * 100;
};

// ------------------------------------------------------------------ data

/**
 * Loads a dashboard API. refreshMs > 0 re-loads in the background while the tab is visible.
 * Returns { data, loading, error, reload, refreshedAt }.
 */
export function useDashboard(path, { refreshMs = 0, params } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const key = JSON.stringify(params || {});
  const latest = useRef(0);

  const load = useCallback(async (background = false) => {
    const request = ++latest.current;
    if (!path) { setLoading(false); return; }   // nothing to load yet (e.g. a custom period without dates)
    if (!background) setLoading(true);
    try {
      const res = await axiosInstance.get(path, { params: JSON.parse(key) });
      if (request !== latest.current) return;
      setData(res.data);
      setError(null);
      setRefreshedAt(new Date());
    } catch (err) {
      if (request !== latest.current) return;
      setError(friendlyError(err, { fallback: "Could not load the dashboard." }));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    load();
    if (!refreshMs) return undefined;
    return pollWhileVisible(() => load(true), refreshMs);
  }, [load, refreshMs]);

  return { data, loading: loading && !data, error: data ? null : error, reload: () => load(), refreshedAt, refreshing: loading && !!data };
}

// ------------------------------------------------------------------ layout pieces

export function DashHeader({ title, subtitle, refreshedAt, onRefresh, refreshing, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[22px] font-[700] text-fg">{title}</h1>
        {subtitle && <p className="text-[13px] text-fg-secondary mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {refreshedAt && <span className="text-[12px] text-fg-muted">Updated {refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-line rounded-lg text-[13px] text-fg-secondary bg-surface hover:bg-subtle disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        )}
      </div>
    </div>
  );
}

/** Whole-page error with Retry (the dashboard API could not be read at all). */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-10 text-center">
      <AlertCircle className="mx-auto mb-3 text-error" size={32} />
      <p className="text-[15px] font-[600] text-fg mb-1">The dashboard could not be loaded</p>
      <p className="text-[13px] text-fg-secondary mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-brand text-on-brand rounded-lg text-[13px] font-[500] hover:bg-brand-hover">Try again</button>
      )}
    </div>
  );
}

export function KpiGrid({ loading, count = 4, children }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${count >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-4 mb-6`}>
      {loading ? [...Array(count)].map((_, i) => <Skeleton key={i} height="118px" />) : children}
    </div>
  );
}

/**
 * Big number with its label; `compare` = [current, previous, "vs yesterday"] shows the % change.
 * `lowerIsBetter` flips the colours (e.g. wastage).
 */
export function KpiCard({ title, value, sub, icon: Icon, tone = "brand", compare, lowerIsBetter = false, to }) {
  const pct = compare ? change(compare[0], compare[1]) : null;
  const up = pct !== null && pct >= 0;
  const good = pct === null ? null : (up !== lowerIsBetter);
  const tones = { brand: "text-brand-fg", success: "text-success", warning: "text-warning", error: "text-error", plum: "text-plum" };
  const body = (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-5 h-full hover:border-line-strong transition-colors">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[13px] font-[500] text-fg-secondary">{title}</p>
        {Icon && <div className="p-2 bg-hover rounded-lg"><Icon className={`w-5 h-5 ${tones[tone] || tones.brand}`} /></div>}
      </div>
      <p className="text-[24px] leading-tight font-[700] text-fg break-words">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        {pct !== null && (
          <span className={`inline-flex items-center font-[600] ${good ? "text-success" : "text-error"}`}>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(pct).toFixed(1)}%
            <span className="font-[400] text-fg-secondary ml-1">{compare[2]}</span>
          </span>
        )}
        {pct === null && compare && <span className="text-fg-muted">No figure {compare[2]}</span>}
        {sub && <span className="text-fg-secondary">{sub}</span>}
      </div>
    </div>
  );
  return to ? <NavLink to={to} className="block">{body}</NavLink> : body;
}

/** A titled card; shows its empty state when `empty` is true. */
export function Panel({ title, subtitle, viewAll, empty, emptyText = "Nothing to show", className = "", children }) {
  return (
    <section className={`bg-surface rounded-xl shadow-sm border border-line flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3 border-b border-line">
        <div>
          <h2 className="text-[15px] font-[600] text-fg">{title}</h2>
          {subtitle && <p className="text-[12px] text-fg-secondary mt-0.5">{subtitle}</p>}
        </div>
        {viewAll && (
          <NavLink to={viewAll} className="text-[12px] font-[500] text-brand-fg hover:underline whitespace-nowrap">View all</NavLink>
        )}
      </div>
      <div className="p-5 flex-1">
        {empty ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center text-fg-secondary">
            <Inbox size={28} className="mb-2 text-fg-muted" />
            <p className="text-[13px]">{emptyText}</p>
          </div>
        ) : children}
      </div>
    </section>
  );
}

/** Rows of: main text, small text under it, and a value on the right. */
export function Rows({ rows }) {
  return (
    <ul className="divide-y divide-line -my-2">
      {rows.map((r, i) => (
        <li key={r.key ?? i} className="py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-[500] text-fg truncate">{r.main}</p>
            {r.sub && <p className="text-[12px] text-fg-secondary truncate">{r.sub}</p>}
          </div>
          {r.right !== undefined && <div className={`text-[13px] font-[600] whitespace-nowrap ${r.rightClass || "text-fg"}`}>{r.right}</div>}
        </li>
      ))}
    </ul>
  );
}

/** Small labelled counts (e.g. Pending 2 · In progress 1 · Done 3). */
export function Stats({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((s) => {
        const body = (
          <div className="rounded-lg bg-subtle px-3 py-2.5 h-full">
            <p className="text-[12px] text-fg-secondary">{s.label}</p>
            <p className={`text-[20px] font-[700] ${s.className || "text-fg"}`}>{s.value}</p>
          </div>
        );
        return s.to ? <NavLink key={s.label} to={s.to}>{body}</NavLink> : <div key={s.label}>{body}</div>;
      })}
    </div>
  );
}

export function QuickActions({ actions }) {
  return (
    <div className="mb-6">
      <h2 className="text-[15px] font-[600] text-fg mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((a) => (
          <NavLink key={a.path} to={a.path}
            className="flex items-center gap-3 p-4 bg-surface border border-line rounded-xl hover:bg-subtle hover:border-line-strong transition-colors">
            {a.icon && <div className="p-2 rounded-lg bg-brand/10 text-brand-fg"><a.icon size={18} /></div>}
            <div className="min-w-0">
              <p className="text-[13px] font-[600] text-fg truncate">{a.name}</p>
              {a.description && <p className="text-[12px] text-fg-secondary truncate">{a.description}</p>}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function PeriodSwitch({ value, onChange, from, to, onRange }) {
  const options = [["today", "Today"], ["week", "This week"], ["month", "This month"], ["custom", "Custom"]];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
        {options.map(([v, text]) => (
          <button key={v} onClick={() => onChange(v)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-[500] ${value === v ? "bg-brand text-on-brand" : "text-fg-secondary hover:bg-subtle"}`}>
            {text}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="flex items-center gap-1.5">
          <input type="date" value={from || ""} onChange={(e) => onRange(e.target.value, to)} aria-label="From"
            className="px-2 py-1.5 border border-line rounded-lg text-[12px] bg-surface text-fg" />
          <span className="text-fg-secondary text-[12px]">to</span>
          <input type="date" value={to || ""} onChange={(e) => onRange(from, e.target.value)} aria-label="To"
            className="px-2 py-1.5 border border-line rounded-lg text-[12px] bg-surface text-fg" />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ charts (colours follow the light / dark theme)

const axes = () => ({
  y: { beginAtZero: true, ticks: { color: themeColor("fg-secondary") }, grid: { color: themeColor("border") } },
  x: { ticks: { color: themeColor("fg-secondary") }, grid: { display: false } },
});
const tooltip = (money) => ({
  backgroundColor: themeColor("elevated"), titleColor: themeColor("fg"), bodyColor: themeColor("fg-secondary"),
  borderColor: themeColor("border"), borderWidth: 1,
  callbacks: { label: (ctx) => `${ctx.dataset.label ? `${ctx.dataset.label}: ` : ""}${money ? rs(ctx.raw) : num(ctx.raw)}` },
});

export function BarChart({ labels, values, money = true, height = 240 }) {
  const { theme } = useTheme();
  return (
    <div style={{ height }}>
      <Bar key={theme} data={{ labels, datasets: [{ data: values, backgroundColor: themeColor("brand-fg"), borderRadius: 4, maxBarThickness: 36 }] }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltip(money) }, scales: axes() }} />
    </div>
  );
}

export function TrendChart({ labels, current, previous, currentLabel = "This period", previousLabel = "Previous period", height = 260 }) {
  const { theme } = useTheme();
  return (
    <div style={{ height }}>
      <Line key={theme}
        data={{
          labels,
          datasets: [
            { label: currentLabel, data: current, borderColor: themeColor("brand-fg"), backgroundColor: themeColor("brand-fg"), tension: 0.3, pointRadius: 2 },
            { label: previousLabel, data: previous, borderColor: themeColor("fg-muted"), backgroundColor: themeColor("fg-muted"), borderDash: [5, 4], tension: 0.3, pointRadius: 0 },
          ],
        }}
        options={{
          responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { color: themeColor("fg-secondary"), boxWidth: 12 } }, tooltip: tooltip(true) }, scales: axes(),
        }} />
    </div>
  );
}

const PIE = ["brand-fg", "success", "warning", "violet", "error", "info", "chart-orange", "chart-cyan", "chart-pink"];

export function MixChart({ labels, values, money = true, height = 220 }) {
  const { theme } = useTheme();
  return (
    <div style={{ height }}>
      <Doughnut key={theme}
        data={{ labels, datasets: [{ data: values, backgroundColor: labels.map((_, i) => themeColor(PIE[i % PIE.length])), borderColor: themeColor("surface"), borderWidth: 2 }] }}
        options={{
          responsive: true, maintainAspectRatio: false, cutout: "62%",
          plugins: { legend: { position: "right", labels: { color: themeColor("fg-secondary"), boxWidth: 12 } }, tooltip: tooltip(money) },
        }} />
    </div>
  );
}
