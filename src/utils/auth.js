// src/auth.js
export async function serverLogout() {
  // OPTIONAL: tell backend to invalidate refresh token/session
  const accessToken = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!accessToken && !refreshToken) return;

  try {
    await fetch(`${process.env.REACT_APP_BASE_URL}/bmsauth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // ignore errors on logout call
  }
}

export async function performLogout(navigate) {
  // 1) optional server-side revoke
  await serverLogout();

  // 2) client-side cleanup
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("productionCenterId");
  localStorage.removeItem("mpcId");
  localStorage.removeItem("outletId");
  localStorage.removeItem("userId");
  localStorage.removeItem("userPhone");
  localStorage.removeItem("userName");
  localStorage.removeItem("firstName");
  localStorage.removeItem("lastName");

  // 3) redirect to Sign In
  if (navigate) {
    navigate("/", { replace: true });
  } else {
    window.location.href = "/";
  }
}

export function getRoleName(roleId) {
  if (!roleId) return "";
  const normalizedRole = String(roleId).trim().toUpperCase();
  console.log(`[getRoleName] roleId: "${roleId}", normalized: "${normalizedRole}"`);
  const roles = {
    "1": "Administrator",
    "8": "POS Cashier",
    "9": "Storekeeper",
    "10": "Manager",
    "12": "Bakery Staff",
    "13": "Kitchen Staff",
    "14": "MPC Staff",
    "11": "Waiter",
    "15": "Finance Officer",
    "20": "MIS Admin",
    "ADMIN": "Administrator",
    "POS": "POS Cashier",
    "STOREKEEPER": "Storekeeper",
    "MANAGER": "Manager",
    "BAKERY": "Bakery Staff",
    "KITCHEN": "Kitchen Staff",
    "MPC": "MPC Staff",
    "MIS": "MIS Admin",
    "WAITER": "Waiter",
    "FINANCE": "Finance Officer"
  };
  return roles[normalizedRole] || normalizedRole;
}
