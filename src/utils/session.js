// The browser keeps the login in localStorage; a login is only usable until its token expires (8 hours on the server).

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
