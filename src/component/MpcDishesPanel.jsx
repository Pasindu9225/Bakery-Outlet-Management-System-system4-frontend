import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * An MPC store's dishes for the storekeeper: finished and semi-finished menu items are not kept in stock, they are
 * made from the store's raw materials when ordered. Plates = how many the current stock can make (the same figure
 * the MPC worker sees in their Store tab).
 */
export default function MpcDishesPanel({ mpcId }) {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/STK/v1/stores/mpc-dishes?id=${mpcId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (!res.ok) throw new Error(`Could not load the dishes (${res.status})`);
      setDishes(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mpcId]);

  const semi = dishes.filter((d) => d.productType === "SEMI_FINISHED");
  const finished = dishes.filter((d) => d.productType !== "SEMI_FINISHED");
  const group = (title, rows, badge) => rows.length > 0 && (
    <div className="mb-5">
      <h4 className="text-[14px] font-[600] text-fg mb-2">{title} ({rows.length})</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((d) => (
          <div key={d.productId} className="border border-line rounded-lg p-4 bg-subtle">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[14px] font-[600] text-fg">{d.productName}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-[600] ${badge}`}>
                {d.productType === "SEMI_FINISHED" ? "Semi-finished" : "Finished"}
              </span>
            </div>
            <p className={`text-[20px] font-[700] ${Number(d.plates) > 0 ? "text-success" : "text-fg-muted"}`}>
              {d.plates ?? 0} <span className="text-[13px] font-[400] text-fg-secondary">can be made</span>
            </p>
            {d.problem && <p className="text-[12px] text-warning mt-1">{d.problem}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-line p-6 mt-6">
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <h3 className="text-[18px] font-[600] text-fg">Dishes made here</h3>
          <p className="text-[13px] text-fg-secondary mb-4">
            Semi-finished and finished items on this MPC's menu are not kept in stock: they are made from the raw
            materials above when ordered. The number is how many the current stock can make. Semi-finished items are also in the list above: report wastage or adjust them there and their raw materials change by the recipe.
          </p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-line text-fg-secondary text-[13px] rounded-lg hover:bg-subtle shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      {error ? (
        <p className="text-[13px] text-error">{error}</p>
      ) : !loading && dishes.length === 0 ? (
        <p className="text-[13px] text-fg-secondary">No dishes on this MPC's menu.</p>
      ) : (
        <>
          {group("Semi-finished", semi, "bg-plum/10 text-plum")}
          {group("Finished", finished, "bg-brand/10 text-brand-fg")}
        </>
      )}
    </div>
  );
}
