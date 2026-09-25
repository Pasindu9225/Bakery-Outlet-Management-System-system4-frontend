import React, { useEffect, useState } from "react";
import axios from "axios";
import { Check, Search, X } from "lucide-react";

const BASE_URL = process.env.REACT_APP_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isKot(product) {
  return product.isKotEnabled === true || String(product.isKotEnabled).toLowerCase() === "true";
}

export default function MpcMenuModal({ mpc, onClose }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE_URL}/api/v1/admin/product/all`, { headers: authHeaders() }),
      axios.get(`${BASE_URL}/api/v1/admin/outlet-production-center/${mpc.id}/menu`, { headers: authHeaders() }),
    ])
      .then(([productRes, menuRes]) => {
        setProducts((productRes.data || []).filter(isKot));
        setSelected(new Set((menuRes.data || []).map((m) => m.productId)));
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [mpc.id]);

  const toggle = (productId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await axios.put(
        `${BASE_URL}/api/v1/admin/outlet-production-center/${mpc.id}/menu`,
        { productIds: Array.from(selected) },
        { headers: authHeaders() }
      );
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = products.filter((p) =>
    !term || `${p.productName || ""} ${p.productCode || ""}`.toLowerCase().includes(term)
  );

  return (
    <div className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-elevated rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-line">
          <div>
            <h3 className="text-[18px] font-[600] text-fg">Menu — {mpc.name}</h3>
            <p className="text-[13px] text-fg-secondary mt-0.5">
              {mpc.location}. Pick the KOT dishes this MPC makes. POS counts them from this MPC's store.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app rounded-lg" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" />
            <input
              id="mpc-menu-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search KOT dishes"
              className="w-full pl-9 pr-3 py-2 border border-line rounded-lg text-[14px]"
            />
          </div>

          {loading ? (
            <p className="text-[14px] text-fg-secondary">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-[14px] text-fg-secondary">
              No KOT dishes found. Tick "KOT Preparation Required" on a product first.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-lg">
              {visible.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-subtle">
                    <input
                      id={`mpc-menu-${p.id}`}
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="text-[14px] text-fg">{p.productName}</span>
                    <span className="ml-auto text-[12px] text-fg-secondary">{p.productCode}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-[13px] text-error">{error}</p>}
          {saved && (
            <p className="text-[13px] text-success flex items-center gap-1">
              <Check size={14} /> Menu saved.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-line">
          <button onClick={onClose} className="px-4 py-2 border border-line rounded-lg text-fg hover:bg-subtle">
            Close
          </button>
          <button onClick={save} disabled={saving || loading}
            className="px-4 py-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover disabled:opacity-60">
            {saving ? "Saving…" : "Save menu"}
          </button>
        </div>
      </div>
    </div>
  );
}
