import { useEffect, useState } from "react";

const KEY = "receiptOutlet";

const cachedFor = (userId) => {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || "null");
    return cached && cached.userId === userId ? cached : null;
  } catch {
    return null;
  }
};

/** The signed-in user's outlet name and address, for printing on bills (asked once, cached per user). */
export default function useOutletInfo() {
  const userId = localStorage.getItem("userId");
  const [outlet, setOutlet] = useState(() => cachedFor(userId) || {});

  useEffect(() => {
    if (cachedFor(userId)) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    fetch(`${process.env.REACT_APP_BASE_URL}/bmsauth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me) return;
        const info = { userId, name: me.outletName || "", address: me.outletAddress || "" };
        localStorage.setItem(KEY, JSON.stringify(info));
        setOutlet(info);
      })
      .catch(() => {}); // the bill still prints, just without the outlet lines
  }, [userId]);

  return outlet;
}
