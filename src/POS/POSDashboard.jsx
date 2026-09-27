import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, ClipboardList, Clock, DollarSign, Package, Receipt, RotateCcw, ShoppingCart, User } from "lucide-react";
import POSNavBar from "../component/POSNavBar.jsx";
import POSSidebar from "../component/POSSidebar.jsx";
import CashFloatPopup from "./CashFloatPopup.jsx";
import {
  BarChart, DashHeader, ErrorState, KpiCard, KpiGrid, MixChart, Panel, QuickActions, Rows,
  dateOnly, label, num, rs, timeOnly, useDashboard,
} from "../component/dashboard/DashboardKit";

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

/** POS dashboard: this outlet's business day (float opening → day end) and the cashier's own shift. */
export default function POSDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCashFloatOpen, setIsCashFloatOpen] = useState(false);
  const { data, loading, error, reload, refreshedAt, refreshing } = useDashboard("/api/dashboard/pos/summary", { refreshMs: 60000 });

  const cashierInfo = {
    id: localStorage.getItem("userId") || "",
    name: [localStorage.getItem("firstName"), localStorage.getItem("lastName")].filter(Boolean).join(" ") || localStorage.getItem("userName") || "",
  };

  // The day starts with the opening cash float: ask for it if this cashier has not declared one today.
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) return;
    axios.get(`${process.env.REACT_APP_BASE_URL || ""}/api/pos/v1/cash-float/status?cashierId=${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.data && res.data.opened === false) setIsCashFloatOpen(true); })
      .catch((err) => console.error("Failed to check cash float status:", err));
  }, []);

  const day = data?.businessDay;
  const sales = data?.sales || {};
  const shift = data?.myShift;
  const subtitle = !data ? "" : day
    ? `${data.outlet?.name} · business day ${dateOnly(day.date)} · opened ${new Date(day.opened).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${day.closed ? " · closed" : ""}`
    : `${data.outlet?.name} · the day has not started (no opening cash float yet)`;

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <POSSidebar sidebarOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <POSNavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeSection="POS Dashboard" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          <CashFloatPopup isOpen={isCashFloatOpen} onConfirm={() => { setIsCashFloatOpen(false); reload(); }} cashierInfo={cashierInfo} />
          <DashHeader title="Dashboard" subtitle={subtitle} refreshedAt={refreshedAt} onRefresh={reload} refreshing={refreshing} />

          {error ? <ErrorState message={error} onRetry={reload} /> : (
            <>
              <KpiGrid loading={loading}>
                <KpiCard title="Sales this business day" icon={DollarSign} value={rs(sales.net)}
                  compare={[sales.net, sales.sameDayLastWeek, "vs same day last week"]}
                  sub={Number(sales.credit) || Number(sales.freeMeals) ? `Credit ${rs(sales.credit)} · Free meals ${rs(sales.freeMeals)}` : null} />
                <KpiCard title="Bills" icon={Receipt} tone="warning" value={num(sales.bills)} sub={`Average bill ${rs(sales.avgBill)}`} />
                <KpiCard title="My shift" icon={User} tone="success" value={shift ? rs(shift.net) : "Not started"}
                  sub={shift ? `${num(shift.bills)} bills since ${new Date(shift.opened).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Open your cash float to start"} />
                <KpiCard title="Refunds" icon={RotateCcw} tone="error" value={rs(data?.returns?.value)} sub={`${num(data?.returns?.count)} returns`} to="/posReturns" />
              </KpiGrid>

              <QuickActions actions={[
                { name: "New Sale", path: "/posSales", icon: ShoppingCart, description: "Bill a customer" },
                { name: "Table Management", path: "/posTableBilling", icon: ClipboardList, description: "Dine-in tables" },
                { name: "Goods Entry", path: "/posGoodsEntry", icon: Package, description: "Record stock received" },
                { name: "Day End", path: "/posDayEnd", icon: Clock, description: "Close the shift and day" },
              ]} />

              {!loading && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
                    <Panel title="Sales by hour" subtitle="Paid bills, this business day" className="xl:col-span-2"
                      empty={!data.hourly.length} emptyText="No sales yet today">
                      <BarChart labels={data.hourly.map((h) => hourLabel(h.hour))} values={data.hourly.map((h) => Number(h.amount))} />
                    </Panel>
                    <Panel title="Payment types" subtitle="All bills, including credit and free meals" empty={!data.paymentMix.length} emptyText="No bills yet today">
                      <MixChart labels={data.paymentMix.map((p) => label(p.category))} values={data.paymentMix.map((p) => Number(p.amount))} />
                    </Panel>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Panel title="Recent bills" empty={!data.recentBills.length} emptyText="No bills yet today">
                      <Rows rows={data.recentBills.map((b) => ({ key: b.saleId, main: b.billNumber, sub: `${timeOnly(b.time)} · ${label(b.payment)}`, right: rs(b.amount) }))} />
                    </Panel>
                    <Panel title="Top items" subtitle="By quantity sold" empty={!data.topItems.length} emptyText="No items sold yet today">
                      <Rows rows={data.topItems.map((t) => ({ key: t.productId, main: t.name, sub: `${num(t.qty)} sold`, right: rs(t.amount) }))} />
                    </Panel>
                    <Panel title="Open table and waiter orders" viewAll="/posTableBilling" empty={!data.openOrders.length} emptyText="No unpaid orders">
                      <Rows rows={data.openOrders.map((o, i) => ({ key: i, main: o.name, sub: `${label(o.type)} · ${num(o.items)} items`, right: rs(o.amount) }))} />
                    </Panel>
                    <Panel title="Special orders due" subtitle="Today and tomorrow" viewAll="/posSpecialOrders" empty={!data.specialOrdersDue.length} emptyText="No special orders due">
                      <Rows rows={data.specialOrdersDue.map((o) => ({ key: o.id, main: `#${o.id} · ${o.customer || "Customer"}`, sub: `${dateOnly(o.due)} · ${label(o.status)}`, right: `Balance ${rs(o.balance)}` }))} />
                    </Panel>
                    <Panel title="Low stock" subtitle="Under the product's minimum level" viewAll="/posGoodsEntry" empty={!data.lowStock.length} emptyText="All stock is above its minimum">
                      <Rows rows={data.lowStock.map((p) => ({ key: p.productId, main: p.name, sub: `Minimum ${num(p.minimum)}`, right: `${num(p.qty)} left`, rightClass: "text-error" }))} />
                    </Panel>
                    {day && !day.closed && (
                      <Panel title="Day end" subtitle="Close the cash and stock at the end of the day">
                        <div className="flex items-start gap-3 text-[13px] text-fg-secondary">
                          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                          <p>The business day is still open. Use <b className="text-fg">Day End &amp; Finish Shift</b> when the shop closes; the figures then stay on the closed day until the next opening float.</p>
                        </div>
                      </Panel>
                    )}
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
