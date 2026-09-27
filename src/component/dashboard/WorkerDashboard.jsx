import React, { useState } from "react";
import { Boxes, ClipboardList, Factory, ShoppingBasket } from "lucide-react";
import {
  DashHeader, ErrorState, KpiCard, KpiGrid, Panel, QuickActions, Rows, Stats,
  dateOnly, dateTime, label, num, useDashboard,
} from "./DashboardKit";

/**
 * Dashboard of a bakery or kitchen worker: only their own production centre (taken from the login).
 * `Sidebar` is the module's menu, `base` the page prefix ("bakery" or "kitchen"), `actions` the module's link cards,
 * `producedTo` the page behind "Produced today" (null when the module has no partial-production page).
 */
export default function WorkerDashboard({ Sidebar, base, title, actions, producedTo = `/${base}PartialProduction` }) {
  const [sidebarOpen] = useState(false);
  const { data: d, loading, error, reload, refreshedAt, refreshing } = useDashboard("/api/dashboard/worker/summary", { refreshMs: 60000 });
  const req = d?.requests || {};
  const ing = d?.ingredients || {};
  const made = d?.producedToday || {};
  const store = d?.store;

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar sidebarOpen={sidebarOpen} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <DashHeader title={title} subtitle={d ? `${d.centre.name} · ${label(d.centre.type)}` : ""} refreshedAt={refreshedAt} onRefresh={reload} refreshing={refreshing} />

        {error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <KpiGrid loading={loading}>
              <KpiCard title="Production requests" icon={ClipboardList} tone="warning" to={`/${base}ProductionRequests`}
                value={`${num(req.pending)} waiting`} sub={`${num(req.inProgress)} in progress · ${num(req.doneToday)} done today`} />
              <KpiCard title="Ingredient requests" icon={ShoppingBasket} tone="success" to={`/${base}GetIngredients`}
                value={`${num(ing.toReceive)} to receive`} sub={`${num(ing.pending)} waiting for the store · ${num(ing.receivedToday)} received today`} />
              <KpiCard title="Produced today" icon={Factory} tone="brand" to={producedTo}
                value={num(made.units)} sub={`${num(made.batches)} batches recorded`} />
              <KpiCard title="My store" icon={Boxes} tone="plum" to={`/${base}StoreInventory`}
                value={store ? `${num(store.items)} items` : "No store"} sub={store ? `${num(store.outOfStock)} empty · ${num(store.nearExpiry)} expiring within 2 days` : "No mini store linked to this centre"} />
            </KpiGrid>

            <QuickActions actions={actions} />

            {!loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Today's work" subtitle="Plans from yesterday to tomorrow for this centre" viewAll={`/${base}ProductionRequests`}
                  empty={!req.today?.length} emptyText="No production requests for today">
                  <Rows rows={req.today.map((p) => ({
                    key: p.planId, main: p.name || `Plan #${p.planId}`, sub: `${dateOnly(p.date)} · ${label(p.status)} · ${num(p.produced)} of ${num(p.planned)} made`,
                    right: p.progress === null || p.progress === undefined ? "–" : `${p.progress}%`,
                    rightClass: Number(p.progress) >= 100 ? "text-success" : "text-fg",
                  }))} />
                </Panel>
                <Panel title="Ingredients to receive" subtitle="Issued by the store, waiting for your confirmation" viewAll={`/${base}GetIngredients`}
                  empty={!ing.toReceiveItems?.length} emptyText="Nothing waiting to be received">
                  <Rows rows={ing.toReceiveItems.map((r) => ({ key: r.id, main: r.ref, sub: `Issued ${dateTime(r.issuedAt)}`, right: "Receive", rightClass: "text-brand-fg" }))} />
                </Panel>
                {d.kitchen && (
                  <Panel title="Kitchen flow">
                    <Stats items={[
                      { label: "Transfer notes today", value: num(d.kitchen.transferNotesToday), to: "/kitchenTransferNote" },
                      { label: "Returns waiting", value: num(d.kitchen.returnsPending), to: "/kitchenReturnToStore" },
                    ]} />
                  </Panel>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
