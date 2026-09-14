import React, { useState, useEffect } from "react";
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "./component/Loader";


const moduleConfig = {
  POS: {
    name: "POS",
    title: "POS Portal",
    allowedRoles: ["8", "POS"],
    dashboardPath: "/posDashboard"
  },
  ADMIN: {
    name: "Admin",
    title: "Admin Portal",
    allowedRoles: ["1", "ADMIN"],
    dashboardPath: "/adminDashboard"
  }
};

const SignIn = ({ targetModule }) => {
  const navigate = useNavigate();
  const activeModule = targetModule ? targetModule.toUpperCase() : null;
  const moduleInfo = activeModule ? moduleConfig[activeModule] : null;

  const [formData, setFormData] = useState({
    email: "",
    hashedPassword: "",
  });
  const [showhashedPassword, setShowhashedPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      const normalizedRole = role.toString().toUpperCase();
      console.log(`[SignIn] Existing session found. Redirecting role: ${normalizedRole}`);

      if (moduleInfo) {
        if (moduleInfo.allowedRoles.includes(normalizedRole)) {
          navigate(moduleInfo.dashboardPath, { replace: true });
          return;
        } else {
          // Current session does not belong to this portal, clear stored credentials
          localStorage.clear();
          return;
        }
      }

      if (normalizedRole === "10" || normalizedRole === "MANAGER") {
        navigate("/managerDashboard", { replace: true });
      } else if (normalizedRole === "8" || normalizedRole === "POS") {
        navigate("/posDashboard", { replace: true });
      } else if (normalizedRole === "9" || normalizedRole === "STOREKEEPER") {
        navigate("/storekeeperDashboard", { replace: true });
      } else if (normalizedRole === "1" || normalizedRole === "ADMIN") {
        navigate("/adminDashboard", { replace: true });
      } else if (normalizedRole === "12" || normalizedRole === "BAKERY") {
        navigate("/bakeryWorkerDashboard", { replace: true });
      } else if (normalizedRole === "13" || normalizedRole === "KITCHEN") {
        navigate("/kitchenWorkerDashboard", { replace: true });
      } else if (normalizedRole === "14" || normalizedRole === "MPC") {
        navigate("/mpcWorkerDashboard", { replace: true });
      } else if (normalizedRole === "15" || normalizedRole === "FINANCE") {
        navigate("/financeIouApprovals", { replace: true });
      } else if (normalizedRole === "20" || normalizedRole === "MIS") {
        navigate("/misWastageDashboard", { replace: true });
      } else {
        navigate("/mainDashboard", { replace: true });
      }
    }
  }, [navigate, moduleInfo]);

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Username is required");
      return false;
    }
    if (!formData.hashedPassword.trim()) {
      setError("Password is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/bmsauth/emailPasswordAuth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid username or password");
        } else if (response.status === 403) {
          setError("Account is inactive. Please contact your administrator.");
        } else if (response.status === 404) {
          setError("Username does not exist");
        } else {
          setError("Login failed. Please try again.");
        }
        return;
      }

      const data = await response.json();
      console.log("Login response:", data);

      const normalizedRole = data.role ? data.role.toString().toUpperCase() : "UNDEFINED";

      // Strict role check for portal-specific login routes
      if (moduleInfo) {
        if (!moduleInfo.allowedRoles.includes(normalizedRole)) {
          setError(`Access Denied: This login portal is restricted to ${moduleInfo.name} users only.`);
          setIsLoading(false);
          return;
        }
      }

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      // ✅ Save token & role in localStorage
      if (data.accessToken) {
        localStorage.setItem("authToken", data.accessToken);
      }
      if (data.role) {
        localStorage.setItem("userRole", data.role);
      }
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
      }
      if (data.phone) {
        localStorage.setItem("userPhone", data.phone);
      }
      if (data.username) {
        localStorage.setItem("userName", data.username);
      }
      if (data.firstName && data.firstName !== "null") {
        localStorage.setItem("firstName", data.firstName);
      } else {
        localStorage.removeItem("firstName");
      }
      if (data.lastName && data.lastName !== "null") {
        localStorage.setItem("lastName", data.lastName);
      } else {
        localStorage.removeItem("lastName");
      }

      // ✅ Persist outletId from login response
      if (data.outletId !== undefined && data.outletId !== null) {
        localStorage.setItem("outletId", String(data.outletId));
      } else {
        localStorage.removeItem("outletId");
      }

      if (data.productionCenterId !== undefined && data.productionCenterId !== null) {
        localStorage.setItem("productionCenterId", String(data.productionCenterId));
      } else {
        localStorage.removeItem("productionCenterId");
      }
      if (data.mpcId !== undefined && data.mpcId !== null) {
        localStorage.setItem("mpcId", String(data.mpcId));
      } else {
        localStorage.removeItem("mpcId");
      }

      // ✅ Redirect based on target module or role
      if (moduleInfo) {
        navigate(moduleInfo.dashboardPath, { replace: true });
        return;
      }

      if (normalizedRole === "10" || normalizedRole === "MANAGER") {
        navigate("/managerDashboard", { replace: true });
      } else if (normalizedRole === "8" || normalizedRole === "POS") {
        navigate("/posDashboard", { replace: true });
      } else if (normalizedRole === "9" || normalizedRole === "STOREKEEPER") {
        navigate("/storekeeperDashboard", { replace: true });
      } else if (normalizedRole === "1" || normalizedRole === "ADMIN") {
        navigate("/adminDashboard", { replace: true });
      } else if (normalizedRole === "12" || normalizedRole === "BAKERY") {
        navigate("/bakeryWorkerDashboard", { replace: true });
      } else if (normalizedRole === "13" || normalizedRole === "KITCHEN") {
        navigate("/kitchenWorkerDashboard", { replace: true });
      } else if (normalizedRole === "14" || normalizedRole === "MPC") {
        navigate("/mpcWorkerDashboard", { replace: true });
      } else if (normalizedRole === "15" || normalizedRole === "FINANCE") {
        navigate("/financeIouApprovals", { replace: true });
      } else if (normalizedRole === "20" || normalizedRole === "MIS") {
        navigate("/misWastageDashboard", { replace: true });
      } else {
        console.warn(`[SignIn] Unknown role: ${normalizedRole}, falling back to Main Dashboard`);
        navigate("/mainDashboard", { replace: true });
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {isLoading && <Loader variant="fullScreen" text="Verifying credentials..." />}
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Bakery & Outlet Management System
          </h1>
          <p className="text-gray-600 text-sm">
            {moduleInfo ? `Welcome back! Please sign in to the ${moduleInfo.title}` : "Welcome back! Please sign in to your account"}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="hashedPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="hashedPassword"
                  name="hashedPassword"
                  type={showhashedPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.hashedPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowhashedPassword(!showhashedPassword)}
                  disabled={isLoading}
                >
                  {showhashedPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 Bakery & Outlet Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
