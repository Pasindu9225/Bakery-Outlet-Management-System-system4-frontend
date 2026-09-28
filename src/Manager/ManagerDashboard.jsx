import React, { useState } from "react";
import { CalendarPlus, ClipboardCheck, DollarSign, Factory, PackageCheck, Receipt, Trash2, Truck } from "lucide-react";
import ManagerNavBar from "../component/ManagerNavBar.jsx";
import ManagerSidebar from "../component/ManagerSidebar.jsx";
import {
  BarChart, DashHeader, ErrorState, KpiCard, KpiGrid, Panel, PeriodSwitch, QuickActions, Rows, Stats, TrendChart,
  dateOnly, label, num, rs, useDashboard,
} from "../component/dashboard/DashboardKit";

const COMPARE = { today: "vs yesterday", week: "vs last week", month: "vs last month", custom: "vs the days before" };

/** Manager dashboard: all outlets of this system (or one), for today / this week / this month / a custom range. */
export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("today");
  const [range, setRange] = useState({ from: "", to: "" });
  const [outletId, setOutletId] = useState("");

  const custom = period === "custom";
  const ready = !custom || (range.from && range.to);
  const params = { period, outletId: outletId || undefined, ...(custom ? range : {}) };
  const summary = useDashboard(ready ? "/api/dashboard/manager/summary" : null, { refreshMs: 60000, params });
  const trendParams = { period: period === "today" ? "month" : period, outletId: outletId || undefined, ...(custom ? range : {}) };
  const trend = useDashboard(ready ? "/api/dashboard/manager/sales-trend" : null, { params: trendParams });

  const d = summary.data;
  const sales = d?.sales || {};
  const compare = COMPARE[period];
  const waiting = d?.waitingForMe || {};
  const points = trend.data?.points || [];
  const outlets = d?.salesByOutlet || [];

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <ManagerSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ManagerNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Manager Dashboard" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <DashHeader title="Dashboard" subtitle={d ? `${dateOnly(d.period.from)} – ${dateOnly(d.period.to)}${period === "today" ? " (each outlet from its opening float)" : ""}` : ""}
            refreshedAt={summary.refreshedAt} onRefresh={() => { summary.reload(); trend.reload(); }} refreshing={summary.refreshing}>
            <PeriodSwitch value={period} onChange={setPeriod} from={range.from} to={range.to} onRange={(from, to) => setRange({ from, to })} />
            {(d?.outlets || []).length > 1 ? (
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} aria-label="Outlet"
                className="px-2 py-2 border border-line rounded-lg text-[12px] bg-surface text-fg">
                <option value="">All outlets</option>
                {d.outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            ) : null}
          </DashHeader>

          {!ready ? <Panel title="Custom period" empty emptyText="Choose a start and end date" /> : summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : (
            <>
              <KpiGrid loading={summary.loading}>
                <KpiCard title="Sales" icon={DollarSign} value={rs(sales.net)} compare={[sales.net, sales.previousNet, compare]}
                  sub={Number(sales.credit) || Number(sales.freeMeals) ? `Credit ${rs(sales.credit)} · Free meals ${rs(sales.freeMeals)}` : null} />
                <KpiCard title="Bills" icon={Receipt} tone="warning" value={num(sales.bills)} compare={[sales.bills, sales.previousBills, compare]} sub={`Average ${rs(sales.avgBill)}`} />
                <KpiCard title="Production plans" icon={Factory} tone="plum" to="/managerProductionPlanning"
                  value={`${num(d?.production?.inProgress)} in progress`} sub={`${num(d?.production?.approved)} approved · ${num(d?.production?.completed)} completed`} />
                <KpiCard title="Wastage" icon={Trash2} tone="error" value={rs(d?.wastage?.value)} lowerIsBetter
                  compare={[d?.wastage?.value, d?.wastage?.previousValue, compare]} sub="Confirmed wastage" />
              </KpiGrid>

              <QuickActions actions={[
                { name: "New Plan", path: "/managerProductionPlanning", icon: CalendarPlus, description: "Plan production" },
                { name: "Outlet Distribution", path: "/managerOutletDistribution", icon: Truck, description: "Send stock to outlets" },
                { name: "Actual Production", path: "/managerActualProduction", icon: PackageCheck, description: "Record what was made" },
                { name: "Credit Orders", path: "/managerCreditOrders", icon: ClipboardCheck, description: "Special orders" },
              ]} />

              {!summary.loading && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                    <Panel title="Sales trend" subtitle={period === "today" ? "This month, day by day, against last month" : "Day by day, against the previous period"}
                      className="xl:col-span-2" empty={!points.some((p) => Number(p.net) || Number(p.previousNet))} emptyText="No sales in this period">
                      <TrendChart labels={points.map((p) => dateOnly(p.date))} current={points.map((p) => Number(p.net))} previous={points.map((p) => (p.previousNet === null ? null : Number(p.previousNet)))} />
                    </Panel>
                    <Panel title="Sales by outlet" empty={!outlets.length || !!outletId} emptyText={outletId ? "Showing one outlet" : "No sales in this period"}>
                      <BarChart labels={outlets.map((o) => o.name || `Outlet ${o.outletId}`)} values={outlets.map((o) => Number(o.paid))} height={220} />
                    </Panel>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Panel title="Waiting for you">
                      <Stats items={[
                        { label: "Credit orders to approve", value: num(waiting.creditOrders), to: "/managerCreditOrders", className: waiting.creditOrders ? "text-warning" : "text-fg" },
                        { label: "Cash advances (IOU)", value: num(waiting.iouApprovals), to: "/managerIouApprovals", className: waiting.iouApprovals ? "text-warning" : "text-fg" },
                        { label: "Stock adjustments", value: num(waiting.stockAdjustments), to: "/managerStockAdjustments" },
                        { label: "Plans not approved", value: num(waiting.plansNotApproved), to: "/managerProductionPlanning" },
                      ]} />
                    </Panel>
                    <Panel title="Best sellers" subtitle="By quantity" empty={!d.topProducts.length} emptyText="No sales in this period">
                      <Rows rows={d.topProducts.map((p) => ({ key: p.productId, main: p.name, sub: `${num(p.qty)} sold`, right: rs(p.amount) }))} />
                    </Panel>
                    <Panel title="Slowest sellers" subtitle="Sold least (of the items sold)" empty={!d.slowProducts.length} emptyText="No sales in this period">
                      <Rows rows={d.slowProducts.map((p) => ({ key: p.productId, main: p.name, sub: `${num(p.qty)} sold`, right: rs(p.amount) }))} />
                    </Panel>
                    <Panel title="Upcoming production" viewAll="/managerProductionPlanning" empty={!d.production.upcoming.length} emptyText="No plans from today on">
                      <Rows rows={d.production.upcoming.map((p) => ({ key: p.id, main: p.name || `Plan #${p.id}`, sub: dateOnly(p.date), right: label(p.status) }))} />
                    </Panel>
                    <Panel title="Low stock – store" subtitle="Raw materials under their minimum" viewAll="/managerInformationBase" empty={!d.lowStock.materials.length} emptyText="All materials are above their minimum">
                      <Rows rows={d.lowStock.materials.map((m, i) => ({ key: i, main: m.name, sub: `${[m.code, m.pack && m.pack !== m.name ? m.pack : null].filter(Boolean).map((t) => `${t} · `).join("")}Minimum ${num(m.minimum)} ${m.unit || ""}`, right: `${num(m.stock)} ${m.unit || ""}`, rightClass: "text-error" }))} />
                    </Panel>
                    <Panel title="Low stock – outlets" subtitle="Today's outlet stock under the product minimum" viewAll="/managerOutletStock" empty={!d.lowStock.products.length} emptyText="All outlet stock is above its minimum">
                      <Rows rows={d.lowStock.products.map((p, i) => ({ key: i, main: p.name, sub: `${p.outlet || ""} · minimum ${num(p.minimum)}`, right: `${num(p.qty)} left`, rightClass: "text-error" }))} />
                    </Panel>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
