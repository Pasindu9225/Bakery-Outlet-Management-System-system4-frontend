import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Factory,
  Layers,
  Hash,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { getRoleName, performLogout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import RoleAvatar from "./RoleAvatar";

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/bmsauth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      // Fallback to localStorage data
      setProfile({
        firstName: localStorage.getItem("firstName") || "",
        lastName: localStorage.getItem("lastName") || "",
        username: localStorage.getItem("userName") || "",
        role: localStorage.getItem("userRole") || "",
        phone: localStorage.getItem("userPhone") || "",
        outletId: localStorage.getItem("outletId") || null,
        productionCenterId: localStorage.getItem("productionCenterId") || null,
        mpcId: localStorage.getItem("mpcId") || null,
      });
      setError("Could not load full profile from server. Showing cached data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onLogout = async () => {
    await performLogout(navigate);
  };

  const fullName =
    profile
      ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
        profile.username ||
        "User"
      : "User";

  const roleName = profile ? getRoleName(profile.role) || profile.role : "";

  const InfoRow = ({ icon: Icon, label, value, color = "text-[#0F50AA]" }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-3 py-3 border-b border-[#F0F1F3] last:border-0">
        <div
          className={`mt-0.5 p-2 rounded-lg bg-[#F0F1F3] ${color} flex-shrink-0`}
        >
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-[500] text-[#667085] uppercase tracking-wide mb-0.5">
            {label}
          </p>
          <p className="text-[14px] font-[500] text-[#383E49] break-words">
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-[700] text-[#383E49]">My Profile</h1>
          <p className="text-[13px] text-[#667085] mt-0.5">
            Your account information
          </p>
        </div>
        <button
          onClick={fetchProfile}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#667085] hover:text-[#0F50AA] hover:bg-[#F0F1F3] rounded-lg transition-colors disabled:opacity-50"
          title="Refresh profile"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-[13px] text-yellow-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-[#0F50AA]" />
          <p className="text-[14px] text-[#667085]">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Avatar Card */}
          <div className="bg-gradient-to-br from-[#0F50AA] to-[#1E40AF] rounded-xl p-6 mb-4 flex items-center gap-5 shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <RoleAvatar
                roleId={profile?.role}
                size="lg"
                className="!w-14 !h-14 !rounded-xl"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] font-[700] text-white truncate">
                {fullName}
              </h2>
              <p className="text-[13px] text-blue-200 mt-0.5">{roleName}</p>
              {profile?.username && (
                <p className="text-[12px] text-blue-300 mt-1">
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-5 mb-4">
            <h3 className="text-[13px] font-[600] text-[#383E49] uppercase tracking-wide mb-1">
              Account Details
            </h3>
            <div className="mt-2">
              <InfoRow
                icon={User}
                label="Full Name"
                value={fullName}
                color="text-[#0F50AA]"
              />
              <InfoRow
                icon={Hash}
                label="Username"
                value={profile?.username}
                color="text-purple-600"
              />
              <InfoRow
                icon={Shield}
                label="Role"
                value={roleName}
                color="text-green-600"
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={profile?.email}
                color="text-orange-600"
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={profile?.phone}
                color="text-teal-600"
              />
            </div>
          </div>

          {/* Assignment Card — only shown if at least one field exists */}
          {(profile?.outletName ||
            profile?.productionCenterName ||
            profile?.mpcName ||
            profile?.outletId ||
            profile?.productionCenterId ||
            profile?.mpcId) && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E4E6EA] p-5 mb-4">
              <h3 className="text-[13px] font-[600] text-[#383E49] uppercase tracking-wide mb-1">
                Assignments
              </h3>
              <div className="mt-2">
                <InfoRow
                  icon={Building2}
                  label="Outlet"
                  value={profile?.outletName || (profile?.outletId ? `Outlet #${profile.outletId}` : null)}
                  color="text-indigo-600"
                />
                <InfoRow
                  icon={Factory}
                  label="Production Center"
                  value={
                    profile?.productionCenterName
                      ? `${profile.productionCenterName}${profile.productionCenterType ? ` (${profile.productionCenterType})` : ""}`
                      : profile?.productionCenterId
                      ? `Center #${profile.productionCenterId}`
                      : null
                  }
                  color="text-pink-600"
                />
                <InfoRow
                  icon={Layers}
                  label="MPC / Sub-center"
                  value={profile?.mpcName || (profile?.mpcId ? `MPC #${profile.mpcId}` : null)}
                  color="text-cyan-600"
                />
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-[14px] font-[500]"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
