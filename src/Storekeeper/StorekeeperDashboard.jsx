import React, { useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardList, PackageX, Receipt, ShoppingCart, SlidersHorizontal } from "lucide-react";
import StorekeeperNavBar from "../component/StorekeeperNavBar.jsx";
import StorekeeperSidebar from "../component/StorekeeperSidebar.jsx";
import {
  DashHeader, ErrorState, KpiCard, KpiGrid, Panel, QuickActions, Rows,
  dateOnly, dateTime, label, num, rs, useDashboard,
} from "../component/dashboard/DashboardKit";


/** Storekeeper dashboard: the main store - low stock, what must be issued, stock in / out today, expiry, open POs. */
export default function StorekeeperDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: d, loading, error, reload, refreshedAt, refreshing } = useDashboard("/api/dashboard/storekeeper/summary", { refreshMs: 60000 });
  const stock = d?.stock || {};
  const toIssue = d?.toIssue || {};
  const today = d?.today || {};
  const issueCount = Number(toIssue.productionPlans || 0) + Number(toIssue.ingredientRequests || 0) + Number(toIssue.mpcRequests || 0);
  const expiredOrSoon = (e) => (new Date(`${String(e.expires).slice(0, 10)}T23:59`) < new Date() ? "Expired" : `Expires ${dateOnly(e.expires)}`);

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <StorekeeperSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StorekeeperNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Storekeeper Dashboard" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <DashHeader title="Dashboard" subtitle="Main store" refreshedAt={refreshedAt} onRefresh={reload} refreshing={refreshing} />

          {error ? <ErrorState message={error} onRetry={reload} /> : (
            <>
              <KpiGrid loading={loading}>
                <KpiCard title="Low / out of stock" icon={PackageX} tone="error" to="/storekeeperViewStore" value={`${num(stock.low)} / ${num(stock.outOfStock)}`}
                  sub="Under minimum / none left" />
                <KpiCard title="To issue" icon={ClipboardList} tone="warning" to="/storekeeperManagerRequests" value={num(issueCount)}
                  sub={`${num(toIssue.productionPlans)} plans · ${num(toIssue.ingredientRequests)} worker requests`} />
                <KpiCard title="Stock in today" icon={ArrowDownToLine} tone="success" to="/storekeeperGRN" value={rs(today.grnValue)} sub={`${num(today.grnCount)} GRNs received`} />
                <KpiCard title="Stock out today" icon={ArrowUpFromLine} tone="plum" value={num(today.issuedCount)} sub="Requests issued" />
              </KpiGrid>

              <QuickActions actions={[
                { name: "Manager Requests", path: "/storekeeperManagerRequests", icon: ClipboardList, description: "Issue plan materials" },
                { name: "Create Purchase Order", path: "/storekeeperCreatePO", icon: ShoppingCart, description: "Order from suppliers" },
                { name: "Goods Received Note", path: "/storekeeperGRN", icon: Receipt, description: "Receive deliveries" },
                { name: "Stock Adjustments", path: "/storekeeperStockAdjustments", icon: SlidersHorizontal, description: "Correct stock levels" },
                { name: "Ingredient Requests", path: "/storekeeperIngredientRequests", icon: ClipboardList, description: "Issue to bakery / kitchen" },
              ]} />

              {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Panel title="Waiting to be issued" subtitle="Oldest first" viewAll="/storekeeperManagerRequests" empty={!toIssue.items?.length} emptyText="Nothing waiting to be issued">
                    <Rows rows={toIssue.items.map((i) => ({ key: `${i.type}-${i.ref}`, main: `${i.ref} · ${i.forWhom || ""}`, sub: `${label(i.type)} request · since ${dateTime(i.since)}`, right: "Issue", rightClass: "text-brand-fg" }))} />
                  </Panel>
                  <Panel title="Low stock" subtitle="Under the material's minimum level" viewAll="/storekeeperCreatePO" empty={!stock.lowItems?.length} emptyText="All materials are above their minimum">
                    <Rows rows={stock.lowItems.map((m, i) => ({ key: i, main: m.name, sub: `${[m.code, m.pack && m.pack !== m.name ? m.pack : null].filter(Boolean).map((t) => `${t} · `).join("")}Minimum ${num(m.minimum)} ${m.unit || ""}`, right: `${num(m.stock)} ${m.unit || ""}`, rightClass: "text-error" }))} />
                  </Panel>
                  <Panel title="Expiring soon" subtitle="Batches with stock expiring within 2 days" viewAll="/storekeeperViewStore" empty={!d.nearExpiry.length} emptyText="No batches expiring soon">
                    <Rows rows={d.nearExpiry.map((e) => ({ key: e.materialId, main: e.name, sub: `${[e.code, e.pack && e.pack !== e.name ? e.pack : null].filter(Boolean).map((t) => `${t} · `).join("")}Batch ${e.batch || "-"} · ${num(e.qty)} ${e.unit || ""}`, right: expiredOrSoon(e), rightClass: "text-warning" }))} />
                  </Panel>
                  <Panel title="Open purchase orders" subtitle="Not fully received" viewAll="/storekeeperGRN" empty={!d.openPurchaseOrders.length} emptyText="No open purchase orders">
                    <Rows rows={d.openPurchaseOrders.map((p) => ({ key: p.poId, main: `${p.ref} · ${p.supplier || ""}`, sub: `Expected ${dateOnly(p.expected)} · ${label(p.status)}`, right: rs(p.value) }))} />
                  </Panel>
                  <Panel title="Recent store activity" empty={!d.recent.length} emptyText="No store activity yet" className="lg:col-span-2 xl:col-span-2">
                    <Rows rows={d.recent.map((r) => ({ key: `${r.type}-${r.ref}`, main: `${r.ref} · ${label(r.type)}`, sub: dateTime(r.at), right: r.amount === null || r.amount === undefined ? "" : rs(r.amount) }))} />
                  </Panel>
                  {(stock.low > 0 || stock.outOfStock > 0) && (
                    <Panel title="Reorder">
                      <div className="flex items-start gap-3 text-[13px] text-fg-secondary">
                        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                        <p>{num(stock.low)} materials are under their minimum level. Create a purchase order to refill them.</p>
                      </div>
                    </Panel>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
