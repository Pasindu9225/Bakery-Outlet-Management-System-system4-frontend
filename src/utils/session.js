// The browser keeps the login in localStorage; a login is only usable until its token expires. Admin, Manager, Finance and
// Storekeeper logins last an hour and are renewed while the user is active (keepLoginWhileActive); others do not expire.

const SESSION_KEYS = [
  "authToken", "refreshToken", "userRole", "userId", "userName", "username", "userPhone", "firstName", "lastName",
  "outletId", "productionCenterId", "mpcId",
];

/** True while a token is stored and has not passed its expiry time. */
export function hasLiveSession() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Forget the login in this browser (theme and other settings stay). */
export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

/** The login has ended (expired, revoked or deactivated): forget it and go to the sign-in page. */
export function endSession() {
  clearSession();
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

const IDLE_LOGOUT_ROLES = ["1", "10", "15", "9", "ADMIN", "MANAGER", "FINANCE", "STOREKEEPER"];
const IDLE_MS = 60 * 60 * 1000;      // logged out after an hour without activity
const RENEW_AFTER_MS = 10 * 60 * 1000;   // an active user's login is renewed at most every 10 minutes

/**
 * Admin, Manager, Finance and Storekeeper: renews the login while they click / type, and logs them out after an hour
 * without activity (the server's token also runs out an hour after the last renewal). Call once at start-up.
 */
export function keepLoginWhileActive() {
  let lastActivity = Date.now();
  let lastRenewal = Date.now();
  const mark = () => { lastActivity = Date.now(); };
  ["mousedown", "keydown", "touchstart", "wheel"].forEach((e) => window.addEventListener(e, mark, { passive: true, capture: true }));

  setInterval(async () => {
    const role = String(localStorage.getItem("userRole") || "").toUpperCase();
    if (!localStorage.getItem("authToken") || !IDLE_LOGOUT_ROLES.includes(role)) return;
    const now = Date.now();
    if (now - lastActivity >= IDLE_MS) {
      try {
        await fetch(`${process.env.REACT_APP_BASE_URL}/bmsauth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
          body: JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") }),
        });
      } catch { /* the token runs out on the server anyway */ }
      endSession();
      return;
    }
    if (lastActivity > lastRenewal && now - lastRenewal >= RENEW_AFTER_MS) {
      try {
        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/bmsauth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("authToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          lastRenewal = now;
        }
      } catch { /* try again next minute */ }
    }
  }, 60 * 1000);
}
