import React, { useState } from "react";
import { AlertTriangle, CheckSquare, DollarSign, FileText, Package, TrendingUp, UserPlus, Users } from "lucide-react";
import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import {
  BarChart, DashHeader, ErrorState, KpiCard, KpiGrid, Panel, QuickActions, Rows, Stats, TrendChart,
  dateOnly, dateTime, label, num, rs, useDashboard,
} from "../component/dashboard/DashboardKit";

/** Admin dashboard: the whole system - sales across outlets, users, catalogue, approvals waiting and alerts. */
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const summary = useDashboard("/api/dashboard/admin/summary");
  const trend = useDashboard("/api/dashboard/manager/sales-trend", { params: { period: "month" } });
  const audit = useDashboard("/api/v1/audit/logs", { params: { page: 0, size: 8 } });
  // the Finance rollup is slow, so it loads on its own and never holds up the rest of the page
  const overdue = useDashboard("/api/v1/finance/outstanding-summary", { params: { overdueOnly: true } });

  const d = summary.data;
  const sales = d?.sales || {};
  const users = d?.users || {};
  const cat = d?.catalogue || {};
  const ap = d?.approvals || {};
  const alerts = d?.alerts || {};
  const waitingTotal = ["purchaseOrders", "materialReturns", "stockAdjustments", "outletReturns", "mpcRequests"].reduce((n, k) => n + Number(ap[k] || 0), 0);
  const points = trend.data?.points || [];
  const overdueList = overdue.data || [];
  const overdueAmount = overdueList.reduce((n, o) => n + Number(o.overdueAmount || 0), 0);
  const reload = () => { summary.reload(); trend.reload(); audit.reload(); overdue.reload(); };

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <AdminSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="Admin Dashboard" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <DashHeader title="Dashboard" subtitle="The whole system, all outlets" refreshedAt={summary.refreshedAt} onRefresh={reload} refreshing={summary.refreshing} />

          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : (
            <>
              <KpiGrid loading={summary.loading}>
                <KpiCard title="Sales today" icon={DollarSign} value={rs(sales.today)} compare={[sales.today, sales.yesterday, "vs yesterday"]} sub="Paid minus refunds" />
                <KpiCard title="Sales this month" icon={TrendingUp} tone="success" value={rs(sales.month)} compare={[sales.month, sales.lastMonth, "vs same days last month"]} />
                <KpiCard title="Active users" icon={Users} tone="plum" to="/adminCreateUser" value={num(users.active)}
                  sub={`${num(users.newThisMonth)} new this month · ${num(users.inactive)} inactive`} />
                <KpiCard title="Waiting for approval" icon={CheckSquare} tone="warning" to="/adminApprovalRequests" value={num(waitingTotal)}
                  sub={`+ ${num(ap.wastageToReview)} wastage entries to review`} />
              </KpiGrid>

              <QuickActions actions={[
                { name: "Create User", path: "/adminCreateUser", icon: UserPlus, description: "Add a staff account" },
                { name: "Admin Approval", path: "/adminApprovalRequests", icon: CheckSquare, description: "Approve requests" },
                { name: "Generate Reports", path: "/adminGenerateReports", icon: FileText, description: "PDF, Excel, CSV" },
                { name: "Wastage", path: "/adminWastage", icon: AlertTriangle, description: "Review wastage" },
                { name: "Direct Stock Entry", path: "/adminStockEntry", icon: Package, description: "Add items directly to POS" },
              ]} />

              {!summary.loading && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                    <Panel title="Sales trend" subtitle="This month, day by day, against last month" className="xl:col-span-2"
                      empty={!points.some((p) => Number(p.net) || Number(p.previousNet))} emptyText={trend.error || "No sales this month"}>
                      <TrendChart labels={points.map((p) => dateOnly(p.date))} current={points.map((p) => Number(p.net))} previous={points.map((p) => (p.previousNet === null ? null : Number(p.previousNet)))}
                        currentLabel="This month" previousLabel="Last month" />
                    </Panel>
                    <Panel title="Sales by outlet" subtitle="This month" empty={!sales.byOutlet?.length} emptyText="No sales this month">
                      <BarChart labels={sales.byOutlet.map((o) => o.name || (o.outletId == null ? "No outlet recorded" : `Outlet ${o.outletId}`))} values={sales.byOutlet.map((o) => Number(o.paid))} height={220} />
                    </Panel>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Panel title="Waiting in Admin Approval" viewAll="/adminApprovalRequests">
                      <Stats items={[
                        { label: "Purchase orders", value: num(ap.purchaseOrders) },
                        { label: "Material returns", value: num(ap.materialReturns) },
                        { label: "Stock adjustments", value: num(ap.stockAdjustments) },
                        { label: "Outlet returns", value: num(ap.outletReturns) },
                        { label: "MPC requests", value: num(ap.mpcRequests) },
                        { label: "Wastage to review", value: num(ap.wastageToReview), to: "/adminWastage" },
                      ]} />
                    </Panel>
                    <Panel title="Alerts">
                      <Rows rows={[
                        { key: "low", main: "Raw materials under minimum", right: num(alerts.lowStockMaterials), rightClass: alerts.lowStockMaterials ? "text-error" : "text-fg" },
                        { key: "exp", main: "Store batches expiring within 2 days", right: num(alerts.nearExpiryBatches), rightClass: alerts.nearExpiryBatches ? "text-warning" : "text-fg" },
                        { key: "due", main: "Suppliers with overdue invoices", sub: overdue.error || (overdueList.length ? `Overdue ${rs(overdueAmount)}` : null),
                          right: overdue.loading ? "…" : overdue.error ? "–" : num(overdueList.length), rightClass: overdueList.length ? "text-error" : "text-fg" },
                        { key: "day", main: "Outlets with an earlier day not closed", sub: (alerts.outletsWithUnclosedDay || []).join(", ") || null,
                          right: num((alerts.outletsWithUnclosedDay || []).length), rightClass: (alerts.outletsWithUnclosedDay || []).length ? "text-warning" : "text-fg" },
                      ]} />
                    </Panel>
                    <Panel title="Catalogue">
                      <Stats items={[
                        { label: "Products", value: num(cat.products), to: "/adminManageProducts" },
                        { label: "Raw materials", value: num(cat.rawMaterials), to: "/adminRawMaterials" },
                        { label: "Suppliers", value: num(cat.suppliers), to: "/adminManageSuppliers" },
                        { label: "Outlets", value: num(cat.outlets), to: "/adminOutletManagement" },
                        { label: "Production centres", value: num(cat.productionCentres), to: "/adminProductionCenter" },
                        { label: "MPCs", value: num(cat.mpcs) },
                      ]} />
                    </Panel>
                    <Panel title="Active users by role" viewAll="/adminCreateUser" empty={!users.byRole?.length} emptyText="No active users">
                      <Rows rows={(users.byRole || []).map((r) => ({ key: r.roleId, main: r.role, right: num(r.active) }))} />
                    </Panel>
                    <Panel title="Recent activity" viewAll="/adminAuditLog" className="lg:col-span-2" empty={!audit.data?.content?.length} emptyText={audit.error || "No activity recorded yet"}>
                      <Rows rows={(audit.data?.content || []).map((a) => ({
                        key: a.id, main: a.summary || `${label(a.action)} ${a.entityType || ""}`, sub: `${a.userFullName || a.username || "System"} · ${label(a.module)}`, right: dateTime(a.occurredAt), rightClass: "text-fg-secondary font-[400]",
                      }))} />
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
