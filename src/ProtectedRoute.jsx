import React from "react";
import { Navigate } from "react-router-dom";

// exclusive: only allowedRoles may open the route; Admin does not get its usual automatic access.
export default function ProtectedRoute({ children, allowedRoles, exclusive = false }) {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");

  if (!token) {
    console.warn("[ProtectedRoute] No token found, redirecting to login.");
    return <Navigate to="/" replace />;
  }

  // Admin (Role ID 1) always has access
  const isAdmin = role === "1" || (role && role.toUpperCase() === "ADMIN");
  
  if (isAdmin && !exclusive) {
    return children;
  }

  // Support both ID (e.g., "10") and Name (e.g., "Manager")
  const isAllowed = !allowedRoles || allowedRoles.some(allowed => {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    const normalizedAllowed = allowed.toUpperCase();
    
    return normalizedAllowed === normalizedRole || 
           (allowed === "10" && normalizedRole === "MANAGER") ||
           (allowed === "8" && normalizedRole === "POS") ||
           (allowed === "1" && normalizedRole === "ADMIN") ||
           (allowed === "9" && normalizedRole === "STOREKEEPER") ||
           (allowed === "12" && (normalizedRole === "BAKERY" || normalizedRole === "WORKER")) ||
           (allowed === "13" && normalizedRole === "KITCHEN") ||
           (allowed === "14" && (normalizedRole === "14" || normalizedRole === "MPC" || normalizedRole === "MPC WORKER")) ||
           (allowed === "20" && normalizedRole === "MIS");
  });

  if (!isAllowed) {
    console.warn(`[ProtectedRoute] Role ${role} not allowed for ${window.location.pathname}. Required one of: ${JSON.stringify(allowedRoles)}. Redirecting to login.`);
    return <Navigate to="/" replace />;
  }

  return children;
}

